import { supabase } from '@/lib/supabase'
import type { TermReport } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function getTermReports(filters?: { termId?: string; classId?: string }): Promise<TermReport[]> {
  let q = supabase
    .from('term_reports')
    .select(`
      id, student_id, class_id, term_id, academic_year_id,
      average_mark, attendance_percentage, homework_completion_rate,
      teacher_comment, rank, generated_at, created_at,
      student:students(full_name, admission_no),
      class:classes(name),
      term:terms(name)
    `)
    .order('class_id')
    .order('rank', { ascending: true })

  if (filters?.termId) q = q.eq('term_id', filters.termId)
  if (filters?.classId) q = q.eq('class_id', filters.classId)

  const { data, error } = await q
  if (error || !data) return []

  type Row = Omit<TermReport, 'student_name' | 'admission_no' | 'class_name' | 'term_name'> & {
    student: { full_name: string; admission_no: string } | null
    class: { name: string } | null
    term: { name: string } | null
  }
  return (data as unknown as Row[]).map((r) => {
    const { student: s, class: c, term: t, ...rest } = r
    return {
      ...rest,
      student_name: s?.full_name ?? '—',
      admission_no: s?.admission_no ?? '—',
      class_name: c?.name ?? '—',
      term_name: t?.name ?? '—',
    }
  })
}

export async function updateTermReportComment(id: string, teacher_comment: string | null): Promise<boolean> {
  const { error } = await db.from('term_reports').update({ teacher_comment }).eq('id', id)
  return !error
}

function performanceLevel(average: number): string {
  if (average >= 80) return 'excellent'
  if (average >= 70) return 'good'
  if (average >= 50) return 'satisfactory'
  return 'needs improvement'
}

function recommendation(average: number): string {
  if (average >= 80) return 'maintain the current effort'
  if (average >= 70) return 'aim for even higher marks'
  if (average >= 50) return 'work on weaker subjects'
  return 'seek extra support and revise consistently'
}

export async function generateTermReports(termId: string, classId?: string): Promise<{ count: number }> {
  const { data: term, error: termErr } = await supabase
    .from('terms')
    .select('id, start_date, end_date, academic_year_id')
    .eq('id', termId)
    .single()
  if (termErr || !term) return { count: 0 }

  const startDate = (term as { start_date: string }).start_date
  const endDate = (term as { end_date: string }).end_date
  const academicYearId = (term as { academic_year_id: string }).academic_year_id

  let studentsQ = supabase
    .from('students')
    .select('id, full_name, class_id')
    .eq('status', 'active')
    .is('deleted_at', null)
  if (classId) studentsQ = studentsQ.eq('class_id', classId)
  const { data: students, error: studentsErr } = await studentsQ
  if (studentsErr || !students || students.length === 0) return { count: 0 }

  let count = 0
  for (const student of students as { id: string; full_name: string; class_id: string }[]) {
    const studentId = student.id
    const cid = student.class_id

    const [attendanceRes, assessmentMarksRes, gradesRes, assignmentsRes] = await Promise.all([
      supabase
        .from('attendance_records')
        .select('status')
        .eq('student_id', studentId)
        .eq('class_id', cid)
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('assessment_marks')
        .select('marks_obtained, assessment:assessments(date)')
        .eq('student_id', studentId),
      supabase
        .from('grades')
        .select('marks_obtained, exam:exams(term_id)')
        .eq('student_id', studentId),
      supabase
        .from('assignments')
        .select('id')
        .eq('class_id', cid)
        .gte('due_date', startDate)
        .lte('due_date', endDate),
    ])

    const attendanceRecords = (attendanceRes.data ?? []) as { status: string }[]
    const totalDays = attendanceRecords.length
    const presentDays = attendanceRecords.filter((r) => r.status === 'present' || r.status === 'late').length
    const attendance_percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : null

    const am = (assessmentMarksRes.data ?? []) as { marks_obtained: number | null; assessment: { date: string } | null }[]
    const assessmentMarksInTerm = am
      .filter((x) => x.assessment && x.assessment.date >= startDate && x.assessment.date <= endDate)
      .map((x) => x.marks_obtained)
      .filter((x): x is number => x != null)

    const gr = (gradesRes.data ?? []) as { marks_obtained: number | null; exam: { term_id: string } | null }[]
    const gradesInTerm = gr
      .filter((x) => x.exam && x.exam.term_id === termId)
      .map((x) => x.marks_obtained)
      .filter((x): x is number => x != null)

    const allMarks = [...assessmentMarksInTerm, ...gradesInTerm]
    const average_mark = allMarks.length > 0
      ? Math.round((allMarks.reduce((a, b) => a + b, 0) / allMarks.length) * 100) / 100
      : null

    const assignmentsInTerm = (assignmentsRes.data ?? []) as { id: string }[]
    let homework_completion_rate: number | null = null
    if (assignmentsInTerm.length > 0) {
      const { data: subs } = await supabase
        .from('assignment_submissions')
        .select('id')
        .eq('student_id', studentId)
        .in('assignment_id', assignmentsInTerm.map((a) => a.id))
        .not('submitted_at', 'is', null)
      const submitted = (subs ?? []).length
      homework_completion_rate = Math.round((submitted / assignmentsInTerm.length) * 1000) / 10
    }

    const comment = average_mark != null
      ? `${student.full_name} has shown ${performanceLevel(average_mark)} performance this term and should continue to ${recommendation(average_mark)}.`
      : null

    const { error: upsertErr } = await db.from('term_reports').upsert(
      {
        student_id: studentId,
        class_id: cid,
        term_id: termId,
        academic_year_id: academicYearId,
        average_mark,
        attendance_percentage,
        homework_completion_rate,
        teacher_comment: comment,
        rank: null,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,term_id' }
    )
    if (!upsertErr) count++
  }

  const studentsInClass = students as { id: string; class_id: string }[]
  const byClass = new Map<string, { student_id: string; average_mark: number | null }[]>()
  for (const s of studentsInClass) {
    const rep = await supabase.from('term_reports').select('average_mark').eq('student_id', s.id).eq('term_id', termId).single()
    const avg = (rep.data as { average_mark: number | null } | null)?.average_mark ?? null
    if (!byClass.has(s.class_id)) byClass.set(s.class_id, [])
    byClass.get(s.class_id)!.push({ student_id: s.id, average_mark: avg })
  }
  for (const [, list] of byClass) {
    const withAvg = list.filter((x) => x.average_mark != null) as { student_id: string; average_mark: number }[]
    withAvg.sort((a, b) => b.average_mark - a.average_mark)
    let rank = 1
    for (const item of withAvg) {
      await db.from('term_reports').update({ rank }).eq('student_id', item.student_id).eq('term_id', termId)
      rank++
    }
  }

  return { count }
}
