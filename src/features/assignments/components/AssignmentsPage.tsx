import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, FileText, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useTeacherRecord } from '@/features/dashboard/hooks/useTeacherDashboard'
import { useAuth } from '@/hooks/useAuth'
import { useClasses, useSubjects } from '@/features/academics/hooks/useAcademics'
import {
  useAssignments,
  useAssignmentSubmissions,
  useEnrolledStudentsForAssignment,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  useUpsertSubmissionGrade,
  useUploadAssignmentAttachment,
} from '../hooks/useAssignments'
import type { Assignment } from '../types'
import type { CreateAssignmentInput } from '../services/assignments'

const schema = z.object({
  class_id: z.string().min(1, 'Required'),
  subject_id: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Required'),
})
type FormValues = z.infer<typeof schema>

function AssignmentFormModal({
  open,
  onOpenChange,
  assignment,
  teacherId,
  onFileUpload,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  assignment?: Assignment | null
  teacherId: string | undefined
  onFileUpload: (file: File) => Promise<string | null>
}) {
  const isEdit = !!assignment
  const create = useCreateAssignment(teacherId)
  const update = useUpdateAssignment()
  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(assignment?.attachment_url ?? null)
  const [fileUploading, setFileUploading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      class_id: '',
      subject_id: '',
      title: '',
      description: '',
      due_date: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        class_id: assignment?.class_id ?? '',
        subject_id: assignment?.subject_id ?? '',
        title: assignment?.title ?? '',
        description: assignment?.description ?? '',
        due_date: assignment?.due_date ?? format(new Date(), 'yyyy-MM-dd'),
      })
      setAttachmentUrl(assignment?.attachment_url ?? null)
    }
  }, [open, assignment, form])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileUploading(true)
    const url = await onFileUpload(file)
    setFileUploading(false)
    if (url) setAttachmentUrl(url)
  }

  const onSubmit = async (v: FormValues) => {
    const payload: CreateAssignmentInput = {
      class_id: v.class_id,
      subject_id: v.subject_id,
      title: v.title,
      description: v.description || undefined,
      attachment_url: attachmentUrl || undefined,
      due_date: v.due_date,
    }
    const ok = isEdit && assignment
      ? await update.mutateAsync({ id: assignment.id, data: payload })
      : await create.mutateAsync(payload)
    if (ok) {
      form.reset()
      setAttachmentUrl(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit assignment' : 'Add assignment'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="class_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Class *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger></FormControl>
                    <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="subject_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger></FormControl>
                    <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl><Input placeholder="Assignment title" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="due_date" render={({ field }) => (
              <FormItem>
                <FormLabel>Due date *</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormItem>
              <FormLabel>Attachment</FormLabel>
              <Input type="file" onChange={handleFileChange} disabled={fileUploading} />
              {attachmentUrl && (
                <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm flex items-center gap-1 mt-1">
                  <ExternalLink className="h-3 w-3" /> View file
                </a>
              )}
            </FormItem>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {create.isPending || update.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function AssignmentsPage() {
  const { user } = useAuth()
  const { data: teacher, isLoading: teacherLoading } = useTeacherRecord(user?.id)
  const [classFilter, setClassFilter] = useState<string>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)

  const filters = {
    classId: classFilter !== 'all' ? classFilter : undefined,
    subjectId: subjectFilter !== 'all' ? subjectFilter : undefined,
  }
  const { data: assignments = [], isLoading } = useAssignments(filters)
  const { data: submissions = [] } = useAssignmentSubmissions(selectedAssignment?.id ?? null)
  const { data: enrolled = [] } = useEnrolledStudentsForAssignment(selectedAssignment?.class_id ?? null)
  const deleteAssignment = useDeleteAssignment()
  const upsertGrade = useUpsertSubmissionGrade()
  const uploadAttachment = useUploadAssignmentAttachment()

  const submittedCount = submissions.filter((s) => s.submitted_at).length
  const progress = enrolled.length > 0 ? Math.round((submittedCount / enrolled.length) * 100) : 0

  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()

  const columns: Column<Assignment>[] = [
    { key: 'title', header: 'Title', sortable: true, cell: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'class_name', header: 'Class' },
    { key: 'subject_name', header: 'Subject' },
    { key: 'due_date', header: 'Due date', cell: (r) => format(new Date(r.due_date), 'dd MMM yyyy') },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedAssignment(r)} title="View submissions">
            <FileText className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditAssignment(r); setShowForm(true) }} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteAssignment.mutate(r.id)} title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const handleUploadAttachment = async (file: File): Promise<string | null> => {
    const url = await uploadAttachment.mutateAsync(file)
    return url ?? null
  }

  if (!teacherLoading && !teacher) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Assignments"
          subtitle="Create and manage homework assignments"
        />
        <EmptyState
          title="Teacher profile required"
          description="Your account must be linked to a teacher (staff) record to post assignments. Ask your school administrator to link your profile."
        />
      </div>
    )
  }

  const submissionByStudent = new Map(submissions.map((s) => [s.student_id, s]))
  const rows = enrolled.map((stu) => {
    const sub = submissionByStudent.get(stu.id)
    return { student: stu, submission: sub }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        subtitle="Create and manage homework assignments"
        actions={
          <Button onClick={() => { setEditAssignment(null); setShowForm(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Add assignment
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All subjects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable<Assignment>
        columns={columns}
        data={assignments}
        keyExtractor={(r) => r.id}
        loading={isLoading}
        emptyState={<div className="py-16 text-center text-sm text-muted-foreground">No assignments. Add one to get started.</div>}
      />

      <AssignmentFormModal
        open={showForm}
        onOpenChange={(v) => { setShowForm(v); if (!v) setEditAssignment(null) }}
        assignment={editAssignment}
        teacherId={teacher?.id}
        onFileUpload={handleUploadAttachment}
      />

      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAssignment?.title} — Submissions</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium">Submission progress</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-sm tabular-nums">{submittedCount} / {enrolled.length} submitted</span>
                </div>
              </div>
              <div className="space-y-2">
                {rows.map(({ student, submission }) => (
                  <div key={student.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-muted-foreground text-sm">{student.admission_no}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {submission?.submitted_at ? format(new Date(submission.submitted_at), 'dd MMM') : 'Not submitted'}
                    </div>
                    {submission?.submission_url && (
                      <a href={submission.submission_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> File
                      </a>
                    )}
                    <Input
                      type="number"
                      placeholder="Grade"
                      className="w-20"
                      value={submission?.grade ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value)
                        upsertGrade.mutate({
                          assignmentId: selectedAssignment.id,
                          studentId: student.id,
                          grade: val,
                        })
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
