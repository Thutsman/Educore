import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ExternalLink, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import {
  useAssignmentsForClass,
  useCurrentStudentRow,
  useMyAssignmentSubmissions,
  useSaveSubmissionUrl,
} from '../hooks/useAssignments'
import type { Assignment } from '../types'

type RowStatus = 'submitted' | 'overdue' | 'pending'

function rowStatus(dueDate: string, submittedAt: string | null | undefined): RowStatus {
  const today = format(new Date(), 'yyyy-MM-dd')
  if (submittedAt) return 'submitted'
  if (dueDate < today) return 'overdue'
  return 'pending'
}

function StatusBadge({ status }: { status: RowStatus }) {
  const styles: Record<RowStatus, string> = {
    submitted: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    overdue: 'bg-red-500/10 text-red-700 dark:text-red-400',
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  }
  const labels: Record<RowStatus, string> = {
    submitted: 'Submitted',
    overdue: 'Overdue',
    pending: 'Pending',
  }
  return <Badge variant="secondary" className={styles[status]}>{labels[status]}</Badge>
}

export function StudentAssignmentsPage() {
  const { user } = useAuth()
  const { data: studentRow, isLoading: studentLoading } = useCurrentStudentRow(user?.id)
  const classId = studentRow?.class_id ?? undefined
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignmentsForClass(classId)
  const { data: mySubs = [], isLoading: subsLoading } = useMyAssignmentSubmissions(studentRow?.id)
  const saveUrl = useSaveSubmissionUrl()

  const [submitFor, setSubmitFor] = useState<Assignment | null>(null)
  const [urlInput, setUrlInput] = useState('')

  const subByAssignment = useMemo(() => {
    const m = new Map<string, { submitted_at: string | null; submission_url: string | null; grade: number | null }>()
    mySubs.forEach((s) => {
      m.set(s.assignment_id, {
        submitted_at: s.submitted_at ?? null,
        submission_url: s.submission_url ?? null,
        grade: s.grade ?? null,
      })
    })
    return m
  }, [mySubs])

  const handleOpenSubmit = (a: Assignment) => {
    const existing = subByAssignment.get(a.id)
    setSubmitFor(a)
    setUrlInput(existing?.submission_url ?? '')
  }

  const handleSubmitUrl = async () => {
    if (!submitFor || !studentRow?.id) return
    const trimmed = urlInput.trim()
    if (!trimmed) {
      toast.error('Enter a link to your work')
      return
    }
    const ok = await saveUrl.mutateAsync({
      assignmentId: submitFor.id,
      studentId: studentRow.id,
      submissionUrl: trimmed,
    })
    if (ok) {
      toast.success('Submission saved')
      setSubmitFor(null)
      setUrlInput('')
    } else {
      toast.error('Could not save submission')
    }
  }

  const loading = studentLoading || (classId ? assignmentsLoading || subsLoading : false)

  if (!studentLoading && !studentRow) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Assignments" subtitle="Work set for your class" />
        <EmptyState
          title="Student record not found"
          description="Your account is not linked to a student profile. Contact your school administrator."
        />
      </div>
    )
  }

  if (!studentLoading && studentRow && !classId) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Assignments" subtitle="Work set for your class" />
        <EmptyState
          title="No class assigned"
          description="Once you are placed in a class, assignments for that class will appear here."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Assignments" subtitle="View and submit work for your class" />

      {loading ? (
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      ) : assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Your teachers have not posted any assignments for your class."
        />
      ) : (
        <div className="overflow-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assignment</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.map((a) => {
                const sub = subByAssignment.get(a.id)
                const status = rowStatus(a.due_date, sub?.submitted_at)
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3">{a.subject_name}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{a.title}</p>
                      {a.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {format(parseISO(a.due_date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={status} />
                      {sub?.grade != null && (
                        <p className="mt-1 text-xs text-muted-foreground">Grade: {sub.grade}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {a.attachment_url && (
                          <a
                            href={a.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary text-xs font-medium"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Materials
                          </a>
                        )}
                        <Button type="button" variant="outline" size="sm" onClick={() => handleOpenSubmit(a)}>
                          <Upload className="mr-1 h-3.5 w-3.5" />
                          {sub?.submitted_at ? 'Update' : 'Submit'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!submitFor} onOpenChange={(open) => { if (!open) { setSubmitFor(null); setUrlInput('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit work{submitFor ? `: ${submitFor.title}` : ''}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Paste a link to your completed work (e.g. Google Drive, OneDrive, or a document URL).
          </p>
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setSubmitFor(null); setUrlInput('') }}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSubmitUrl()} disabled={saveUrl.isPending}>
              {saveUrl.isPending ? 'Saving…' : 'Save submission'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
