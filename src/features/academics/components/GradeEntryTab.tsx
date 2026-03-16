import { useState, useEffect } from 'react'
import { CheckCircle2, ClipboardEdit } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/utils/cn'
import { useExams, useExamGrades, useEnrolledStudents, useUpsertGrade } from '../hooks/useAcademics'

const GRADE_COLORS: Record<string, string> = {
  A: 'text-emerald-600', B: 'text-blue-600',
  C: 'text-amber-600',  D: 'text-orange-600', F: 'text-red-600',
}

interface GradeRow {
  studentId: string
  studentName: string
  admissionNumber: string
  marks: string
  remarks: string
  existingId?: string
  percentage: number | null
  letterGrade: string | null
  saving: boolean
  saved: boolean
}

function computeGrade(marks: string, total: number): { percentage: number | null; letterGrade: string | null } {
  const n = parseFloat(marks)
  if (isNaN(n)) return { percentage: null, letterGrade: null }
  const pct = (n / total) * 100
  let g = 'F'
  if (pct >= 80) g = 'A'
  else if (pct >= 70) g = 'B'
  else if (pct >= 60) g = 'C'
  else if (pct >= 50) g = 'D'
  return { percentage: Math.round(pct * 10) / 10, letterGrade: g }
}

export function GradeEntryTab() {
  const [examId, setExamId] = useState<string>('')
  const [rows, setRows] = useState<GradeRow[]>([])

  const { data: exams = [] } = useExams()
  const selectedExam = exams.find(e => e.id === examId) ?? null

  const { data: existingGrades = [] } = useExamGrades(examId || null)
  const { data: enrolled = [] } = useEnrolledStudents(selectedExam?.class_id ?? null)
  const upsert = useUpsertGrade(examId)

  // Build rows when exam or enrolled students change
  useEffect(() => {
    if (!selectedExam || !enrolled.length) { setRows([]); return }
    const gradeMap = new Map(existingGrades.map(g => [g.student_id, g]))
    setRows(enrolled.map(s => {
      const g = gradeMap.get(s.id)
      const marks = g?.marks_obtained != null ? String(g.marks_obtained) : ''
      const { percentage, letterGrade } = computeGrade(marks, selectedExam.total_marks)
      return {
        studentId: s.id,
        studentName: s.full_name,
        admissionNumber: s.admission_number,
        marks,
        remarks: g?.remarks ?? '',
        existingId: g?.id,
        percentage, letterGrade,
        saving: false, saved: false,
      }
    }))
  }, [examId, enrolled.length, existingGrades.length, selectedExam])

  const updateRow = (idx: number, patch: Partial<GradeRow>) => {
    setRows(prev => {
      const next = [...prev]
      const row = { ...next[idx], ...patch }
      if ('marks' in patch) {
        const { percentage, letterGrade } = computeGrade(patch.marks!, selectedExam?.total_marks ?? 100)
        row.percentage = percentage
        row.letterGrade = letterGrade
        row.saved = false
      }
      next[idx] = row
      return next
    })
  }

  const saveRow = async (idx: number) => {
    const row = rows[idx]
    if (!examId) return
    updateRow(idx, { saving: true })
    const marks = row.marks === '' ? null : parseFloat(row.marks)
    await upsert.mutateAsync({ studentId: row.studentId, marks, remarks: row.remarks })
    updateRow(idx, { saving: false, saved: true })
  }

  const saveAll = async () => {
    for (let i = 0; i < rows.length; i++) {
      await saveRow(i)
    }
  }

  return (
    <div className="space-y-6">
      {/* Exam selector */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
        <div className="space-y-1.5">
          <Label>Select Exam</Label>
          <Select value={examId} onValueChange={v => { setExamId(v); setRows([]) }}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Choose an exam to enter grades..." />
            </SelectTrigger>
            <SelectContent>
              {exams.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} — {e.class_name} / {e.subject_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {rows.length > 0 && (
          <Button onClick={saveAll} disabled={upsert.isPending} className="shrink-0">
            Save All Grades
          </Button>
        )}
      </div>

      {!examId && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <ClipboardEdit className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Select an exam above to begin entering grades</p>
          <p className="text-xs text-muted-foreground">Grades entered here feed into Term Reports.</p>
        </div>
      )}

      {examId && selectedExam && rows.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm text-muted-foreground">No students enrolled in <strong>{selectedExam.class_name}</strong></p>
        </div>
      )}

      {rows.length > 0 && selectedExam && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <p className="mb-2 text-xs text-muted-foreground">Grades entered here feed into Term Reports.</p>
          {/* Header info */}
          <div className="flex flex-wrap items-center gap-6 border-b border-border bg-muted/40 px-4 py-3 text-sm">
            <span><span className="text-muted-foreground">Exam:</span> <strong>{selectedExam.name}</strong></span>
            <span><span className="text-muted-foreground">Class:</span> {selectedExam.class_name}</span>
            <span><span className="text-muted-foreground">Subject:</span> {selectedExam.subject_name}</span>
            <span><span className="text-muted-foreground">Total Marks:</span> {selectedExam.total_marks}</span>
          </div>

          {/* Grade table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Adm. No.</th>
                  <th className="px-4 py-3 text-left w-32">Marks <span className="normal-case font-normal">/ {selectedExam.total_marks}</span></th>
                  <th className="px-4 py-3 text-left">%</th>
                  <th className="px-4 py-3 text-left">Grade</th>
                  <th className="px-4 py-3 text-left">Remarks</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.studentId} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-4 py-2 font-medium">{row.studentName}</td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{row.admissionNumber}</td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={selectedExam.total_marks}
                        value={row.marks}
                        onChange={e => updateRow(i, { marks: e.target.value })}
                        className="h-8 w-24 tabular-nums"
                        placeholder="—"
                      />
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {row.percentage != null ? `${row.percentage}%` : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <span className={cn('font-bold', row.letterGrade ? GRADE_COLORS[row.letterGrade] : 'text-muted-foreground')}>
                        {row.letterGrade ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={row.remarks}
                        onChange={e => updateRow(i, { remarks: e.target.value, saved: false })}
                        className="h-8"
                        placeholder="Optional..."
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {row.saved ? (
                        <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={row.saving} onClick={() => saveRow(i)}>
                          {row.saving ? '...' : 'Save'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
