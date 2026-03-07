import { useState } from 'react'
import { Play, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useTerms, useClasses } from '@/features/academics/hooks/useAcademics'
import { useTermReports, useUpdateTermReportComment, useGenerateTermReports } from '../hooks/useReports'
import type { TermReport } from '../types'

export function TermReportsPage() {
  const [termFilter, setTermFilter] = useState<string>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [generateTermId, setGenerateTermId] = useState<string | null>(null)
  const [generateClassId, setGenerateClassId] = useState<string>('')
  const [editingReport, setEditingReport] = useState<TermReport | null>(null)
  const [editComment, setEditComment] = useState('')

  const filters = {
    termId: termFilter !== 'all' ? termFilter : undefined,
    classId: classFilter !== 'all' ? classFilter : undefined,
  }
  const { data: reports = [], isLoading } = useTermReports(filters)
  const updateComment = useUpdateTermReportComment()
  const generate = useGenerateTermReports()

  const { data: terms = [] } = useTerms()
  const { data: classes = [] } = useClasses()

  const handleGenerate = async () => {
    if (!generateTermId) return
    await generate.mutateAsync({ termId: generateTermId, classId: generateClassId || undefined })
    setGenerateTermId(null)
  }

  const handleSaveComment = async () => {
    if (!editingReport) return
    await updateComment.mutateAsync({ id: editingReport.id, teacher_comment: editComment || null })
    setEditingReport(null)
  }

  const columns: Column<TermReport>[] = [
    { key: 'rank', header: 'Rank', className: 'w-16 tabular-nums', cell: (r) => r.rank ?? '—' },
    { key: 'student_name', header: 'Student', cell: (r) => <span className="font-medium">{r.student_name}</span> },
    { key: 'admission_no', header: 'Admission No' },
    { key: 'class_name', header: 'Class' },
    { key: 'term_name', header: 'Term' },
    { key: 'average_mark', header: 'Average', className: 'tabular-nums', cell: (r) => (r.average_mark != null ? r.average_mark.toFixed(1) : '—') },
    { key: 'attendance_percentage', header: 'Attendance %', className: 'tabular-nums', cell: (r) => (r.attendance_percentage != null ? `${r.attendance_percentage}%` : '—') },
    { key: 'homework_completion_rate', header: 'Homework %', className: 'tabular-nums', cell: (r) => (r.homework_completion_rate != null ? `${r.homework_completion_rate}%` : '—') },
    {
      key: 'teacher_comment',
      header: 'Comment',
      cell: (r) => (
        <span className="line-clamp-2 text-muted-foreground text-sm">{r.teacher_comment || '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (r) => (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => { setEditingReport(r); setEditComment(r.teacher_comment ?? '') }}
          title="Edit comment"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Term Reports"
        subtitle="Generate and edit end-of-term reports"
        actions={
          <Button onClick={() => setGenerateTermId(terms[0]?.id ?? '')}>
            <Play className="mr-2 h-4 w-4" /> Generate term reports
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select value={termFilter} onValueChange={setTermFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All terms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All terms</SelectItem>
            {terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable<TermReport>
        columns={columns}
        data={reports}
        keyExtractor={(r) => r.id}
        loading={isLoading}
        emptyState={
          <div className="py-16 text-center text-sm text-muted-foreground">
            No term reports yet. Click &quot;Generate term reports&quot; to create them.
          </div>
        }
      />

      <Dialog open={!!generateTermId} onOpenChange={() => setGenerateTermId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Generate term reports</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will compute averages, attendance, homework completion and rankings for the selected term.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Term</label>
            <Select value={generateTermId ?? ''} onValueChange={setGenerateTermId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Class (optional)</label>
            <Select value={generateClassId} onValueChange={setGenerateClassId}>
              <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All classes</SelectItem>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateTermId(null)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generate.isPending}>
              {generate.isPending ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingReport} onOpenChange={() => setEditingReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit teacher comment</DialogTitle>
          </DialogHeader>
          {editingReport && (
            <>
              <p className="text-sm text-muted-foreground">{editingReport.student_name}</p>
              <Textarea
                rows={4}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Teacher comment..."
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingReport(null)}>Cancel</Button>
                <Button onClick={handleSaveComment} disabled={updateComment.isPending}>
                  {updateComment.isPending ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
