import { useState } from 'react'
import { Play, Pencil, BarChart3, FileDown, Files } from 'lucide-react'
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
import {
  useTermReports,
  useUpdateTermReportComment,
  useGenerateTermReports,
  useTermReportSubjectBreakdown,
} from '../hooks/useReports'
import { getTermReportSubjectBreakdown } from '../services/reports'
import type { TermReport } from '../types'
import { useSchool } from '@/context/SchoolContext'

export function TermReportsPage() {
  const [termFilter, setTermFilter] = useState<string>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [generateTermId, setGenerateTermId] = useState<string | null>(null)
  const [generateClassId, setGenerateClassId] = useState<string>('all')
  const [editingReport, setEditingReport] = useState<TermReport | null>(null)
  const [breakdownReport, setBreakdownReport] = useState<TermReport | null>(null)
  const [editComment, setEditComment] = useState('')
  const { currentSchool } = useSchool()

  const filters = {
    termId: termFilter !== 'all' ? termFilter : undefined,
    classId: classFilter !== 'all' ? classFilter : undefined,
  }
  const { data: reports = [], isLoading } = useTermReports(filters)
  const updateComment = useUpdateTermReportComment()
  const generate = useGenerateTermReports()
  const { data: subjectBreakdown = [], isLoading: breakdownLoading } = useTermReportSubjectBreakdown(
    breakdownReport?.student_id ?? null,
    breakdownReport?.term_id ?? null,
  )

  const { data: terms = [] } = useTerms()
  const { data: classes = [] } = useClasses()

  const exportReportPdf = async (report: TermReport) => {
    const breakdown = await getTermReportSubjectBreakdown(report.student_id, report.term_id)
    const rows = breakdown.map((s) =>
      `<tr><td style="padding:6px;border:1px solid #ddd">${s.subject_name}</td><td style="padding:6px;border:1px solid #ddd;text-align:right">${s.average_percentage}%</td><td style="padding:6px;border:1px solid #ddd;text-align:right">${s.assessments_count}</td></tr>`
    ).join('')
    const attendance = report.attendance_days_present != null && report.attendance_days_total != null
      ? `${report.attendance_days_present}/${report.attendance_days_total}${report.attendance_percentage != null ? ` (${report.attendance_percentage}%)` : ''}`
      : '—'

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(`
      <html>
        <head><title>Term Report - ${report.student_name}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px; color: #111;">
          <h2 style="margin:0 0 6px 0;">${currentSchool?.name ?? 'School'} - Term Report</h2>
          <p style="margin:0 0 14px 0;">Student: <strong>${report.student_name}</strong> (${report.admission_no})</p>
          <p style="margin:0 0 14px 0;">Class: ${report.class_name} | Term: ${report.term_name}</p>
          <table style="border-collapse:collapse; width:100%; margin-bottom:16px;">
            <tr><td style="padding:6px;border:1px solid #ddd;">Average</td><td style="padding:6px;border:1px solid #ddd;">${report.average_mark != null ? report.average_mark.toFixed(1) : '—'}</td></tr>
            <tr><td style="padding:6px;border:1px solid #ddd;">Attendance</td><td style="padding:6px;border:1px solid #ddd;">${attendance}</td></tr>
            <tr><td style="padding:6px;border:1px solid #ddd;">Homework</td><td style="padding:6px;border:1px solid #ddd;">${report.homework_completion_rate != null ? `${report.homework_completion_rate}%` : '—'}</td></tr>
          </table>
          <h3 style="margin:0 0 8px 0;">Subject Breakdown</h3>
          <table style="border-collapse:collapse; width:100%;">
            <thead>
              <tr>
                <th style="padding:6px;border:1px solid #ddd;text-align:left;">Subject</th>
                <th style="padding:6px;border:1px solid #ddd;text-align:right;">Average %</th>
                <th style="padding:6px;border:1px solid #ddd;text-align:right;">Assessments</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="3" style="padding:6px;border:1px solid #ddd;">No subject marks found for this term.</td></tr>'}</tbody>
          </table>
          <p style="margin-top:16px;">Comment: ${report.teacher_comment ?? '—'}</p>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  const exportAllReportsPdf = async () => {
    if (!reports.length) return

    const breakdownEntries = await Promise.all(
      reports.map(async (r) => {
        const b = await getTermReportSubjectBreakdown(r.student_id, r.term_id)
        return [r.id, b] as const
      })
    )
    const breakdownMap = new Map(breakdownEntries)

    const sections = reports.map((report) => {
      const breakdown = breakdownMap.get(report.id) ?? []
      const rows = breakdown.map((s) =>
        `<tr><td style="padding:6px;border:1px solid #ddd">${s.subject_name}</td><td style="padding:6px;border:1px solid #ddd;text-align:right">${s.average_percentage}%</td><td style="padding:6px;border:1px solid #ddd;text-align:right">${s.assessments_count}</td></tr>`
      ).join('')
      const attendance = report.attendance_days_present != null && report.attendance_days_total != null
        ? `${report.attendance_days_present}/${report.attendance_days_total}${report.attendance_percentage != null ? ` (${report.attendance_percentage}%)` : ''}`
        : '—'

      return `
        <section style="page-break-after: always; margin-bottom: 24px;">
          <h2 style="margin:0 0 6px 0;">${currentSchool?.name ?? 'School'} - Term Report</h2>
          <p style="margin:0 0 14px 0;">Student: <strong>${report.student_name}</strong> (${report.admission_no})</p>
          <p style="margin:0 0 14px 0;">Class: ${report.class_name} | Term: ${report.term_name}</p>
          <table style="border-collapse:collapse; width:100%; margin-bottom:16px;">
            <tr><td style="padding:6px;border:1px solid #ddd;">Average</td><td style="padding:6px;border:1px solid #ddd;">${report.average_mark != null ? report.average_mark.toFixed(1) : '—'}</td></tr>
            <tr><td style="padding:6px;border:1px solid #ddd;">Attendance</td><td style="padding:6px;border:1px solid #ddd;">${attendance}</td></tr>
            <tr><td style="padding:6px;border:1px solid #ddd;">Homework</td><td style="padding:6px;border:1px solid #ddd;">${report.homework_completion_rate != null ? `${report.homework_completion_rate}%` : '—'}</td></tr>
          </table>
          <h3 style="margin:0 0 8px 0;">Subject Breakdown</h3>
          <table style="border-collapse:collapse; width:100%;">
            <thead>
              <tr>
                <th style="padding:6px;border:1px solid #ddd;text-align:left;">Subject</th>
                <th style="padding:6px;border:1px solid #ddd;text-align:right;">Average %</th>
                <th style="padding:6px;border:1px solid #ddd;text-align:right;">Assessments</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="3" style="padding:6px;border:1px solid #ddd;">No subject marks found for this term.</td></tr>'}</tbody>
          </table>
          <p style="margin-top:16px;">Comment: ${report.teacher_comment ?? '—'}</p>
        </section>
      `
    }).join('')

    const win = window.open('', '_blank', 'width=1000,height=800')
    if (!win) return
    win.document.write(`
      <html>
        <head><title>Term Reports - ${currentSchool?.name ?? 'School'}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px; color: #111;">
          ${sections}
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  const handleGenerate = async () => {
    if (!generateTermId) return
    await generate.mutateAsync({
      termId: generateTermId,
      classId: generateClassId !== 'all' ? generateClassId : undefined,
    })
    setGenerateTermId(null)
    setGenerateClassId('all')
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
    {
      key: 'attendance_percentage',
      header: 'Attendance',
      className: 'tabular-nums',
      cell: (r) => {
        if (r.attendance_days_present == null || r.attendance_days_total == null) return '—'
        const pct = r.attendance_percentage != null ? ` (${r.attendance_percentage}%)` : ''
        return `${r.attendance_days_present}/${r.attendance_days_total}${pct}`
      },
    },
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
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setBreakdownReport(r)} title="View subject breakdown">
            <BarChart3 className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => void exportReportPdf(r)} title="Export PDF">
            <FileDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => { setEditingReport(r); setEditComment(r.teacher_comment ?? '') }}
            title="Edit comment"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Term Reports"
        subtitle="1. Choose term and class · 2. Generate reports · 3. Edit teacher comments"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void exportAllReportsPdf()} disabled={!reports.length}>
              <Files className="mr-2 h-4 w-4" /> Export all PDFs
            </Button>
            <Button onClick={() => setGenerateTermId(terms[0]?.id ?? '')}>
              <Play className="mr-2 h-4 w-4" /> Generate term reports
            </Button>
          </div>
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

      <Dialog
        open={!!generateTermId}
        onOpenChange={() => {
          setGenerateTermId(null)
          setGenerateClassId('all')
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Generate term reports</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will compute averages, attendance, homework completion and rankings for the selected term.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Term</label>
            <Select value={generateTermId ?? undefined} onValueChange={setGenerateTermId}>
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
                <SelectItem value="all">All classes</SelectItem>
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

      <Dialog open={!!breakdownReport} onOpenChange={() => setBreakdownReport(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Subject Breakdown - {breakdownReport?.student_name}</DialogTitle>
          </DialogHeader>
          {breakdownLoading ? (
            <p className="text-sm text-muted-foreground">Loading subject performance...</p>
          ) : subjectBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subject marks found for this term.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2">Subject</th>
                    <th className="py-2 text-right">Average %</th>
                    <th className="py-2 text-right">Assessments</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectBreakdown.map((s) => (
                    <tr key={s.subject_id} className="border-b border-border last:border-0">
                      <td className="py-2">{s.subject_name}</td>
                      <td className="py-2 text-right tabular-nums">{s.average_percentage}%</td>
                      <td className="py-2 text-right tabular-nums">{s.assessments_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
