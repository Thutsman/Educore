import { supabase } from '@/lib/supabase'
import type { AcademicClass, Subject, Exam, Grade, AcademicYear, Term, EnrolledStudent } from '../types'

// Bypass generic Database placeholder for write operations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

function getLetterGrade(pct: number): string {
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export async function getClasses(): Promise<AcademicClass[]> {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      id, name, grade_level, stream, academic_year_id, class_teacher_id,
      academic_year:academic_years(label),
      class_teacher:teachers(id, profile:profiles(full_name))
    `)
    .is('deleted_at', null)
    .order('name')
  if (error || !data) return []
  type Raw = {
    id: string
    name: string
    grade_level: number | null
    stream: string | null
    academic_year_id: string | null
    class_teacher_id: string | null
    academic_year: { label: string } | null
    class_teacher: { id: string; profile: { full_name: string } | null } | null
  }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id, name: r.name, level: r.grade_level, stream: r.stream,
    academic_year_id: r.academic_year_id,
    academic_year_name: r.academic_year?.label ?? null,
    class_teacher_id: r.class_teacher_id,
    class_teacher_name: r.class_teacher?.profile?.full_name ?? null,
  }))
}

export async function createClass(d: { name: string; level: number; stream?: string; academic_year_id: string; class_teacher_id?: string }): Promise<boolean> {
  const { error } = await db.from('classes').insert({
    name: d.name,
    grade_level: d.level,
    stream: d.stream || null,
    academic_year_id: d.academic_year_id,
    class_teacher_id: d.class_teacher_id || null,
  })
  return !error
}

export async function updateClass(
  id: string,
  d: Partial<{ name: string; level: number; stream: string; academic_year_id: string; class_teacher_id: string | null }>
): Promise<boolean> {
  const payload: Record<string, unknown> = {}
  if (d.name !== undefined) payload.name = d.name
  if (d.level !== undefined) payload.grade_level = d.level
  if (d.stream !== undefined) payload.stream = d.stream || null
  if (d.academic_year_id !== undefined) payload.academic_year_id = d.academic_year_id
  if (d.class_teacher_id !== undefined) payload.class_teacher_id = d.class_teacher_id

  const { error } = await db.from('classes').update(payload).eq('id', id)
  return !error
}

export async function deleteClass(id: string): Promise<boolean> {
  const { error } = await db.from('classes').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  return !error
}

// ─── Subjects ────────────────────────────────────────────────────────────────

export async function getSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, code, description, department_id')
    .is('deleted_at', null)
    .order('name')
  if (error || !data) return []
  type Raw = { id: string; name: string; code: string; description: string | null; department_id: string | null }
  return (data as unknown as Raw[]).map(r => ({ ...r }))
}

export async function createSubject(d: { name: string; code: string; description?: string }): Promise<boolean> {
  const { error } = await db.from('subjects').insert({ name: d.name, code: d.code, description: d.description || null })
  return !error
}

export async function updateSubject(id: string, d: Partial<{ name: string; code: string; description: string }>): Promise<boolean> {
  const { error } = await db.from('subjects').update(d).eq('id', id)
  return !error
}

export async function deleteSubject(id: string): Promise<boolean> {
  const { error } = await db.from('subjects').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  return !error
}

// ─── Academic Years & Terms ───────────────────────────────────────────────────

export async function getAcademicYears(): Promise<AcademicYear[]> {
  const { data, error } = await supabase.from('academic_years').select('id, label, start_date, end_date, is_current').order('start_date', { ascending: false })
  if (error || !data) return []
  type Raw = { id: string; label: string; start_date: string; end_date: string; is_current: boolean }
  return (data as unknown as Raw[]).map(r => ({ id: r.id, name: r.label, start_date: r.start_date, end_date: r.end_date, is_current: r.is_current }))
}

export async function getTerms(academicYearId?: string): Promise<Term[]> {
  let q = supabase.from('terms').select('id, name, academic_year_id, start_date, end_date, is_current').order('start_date')
  if (academicYearId) q = q.eq('academic_year_id', academicYearId)
  const { data, error } = await q
  if (error || !data) return []
  type Raw = { id: string; name: string; academic_year_id: string; start_date: string; end_date: string; is_current: boolean }
  return (data as unknown as Raw[]).map(r => ({ ...r }))
}

// ─── Exams ───────────────────────────────────────────────────────────────────

export async function getExams(filters?: { classId?: string; subjectId?: string; termId?: string }): Promise<Exam[]> {
  let q = supabase
    .from('exams')
    .select('id, name, subject_id, class_id, term_id, exam_date, total_marks, description, subject:subjects(name), class:classes(name), term:terms(name)')
    .order('exam_date', { ascending: false })

  if (filters?.classId) q = q.eq('class_id', filters.classId)
  if (filters?.subjectId) q = q.eq('subject_id', filters.subjectId)
  if (filters?.termId) q = q.eq('term_id', filters.termId)

  const { data, error } = await q
  if (error || !data) return []

  type Raw = {
    id: string; name: string; subject_id: string; class_id: string; term_id: string | null
    exam_date: string | null; total_marks: number; description: string | null
    subject: { name: string } | null; class: { name: string } | null; term: { name: string } | null
  }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id, name: r.name,
    subject_id: r.subject_id, subject_name: r.subject?.name ?? '—',
    class_id: r.class_id, class_name: r.class?.name ?? '—',
    term_id: r.term_id, term_name: r.term?.name ?? null,
    exam_date: r.exam_date, total_marks: r.total_marks,
    description: r.description,
  }))
}

export async function createExam(d: { name: string; subject_id: string; class_id: string; term_id?: string; exam_date?: string; total_marks: number; description?: string }): Promise<boolean> {
  const { error } = await db.from('exams').insert({
    name: d.name, subject_id: d.subject_id, class_id: d.class_id,
    term_id: d.term_id || null, exam_date: d.exam_date || null,
    total_marks: d.total_marks, description: d.description || null,
  })
  return !error
}

export async function updateExam(id: string, d: Partial<{ name: string; subject_id: string; class_id: string; term_id: string; exam_date: string; total_marks: number; description: string }>): Promise<boolean> {
  const { error } = await db.from('exams').update(d).eq('id', id)
  return !error
}

export async function deleteExam(id: string): Promise<boolean> {
  const { error } = await db.from('exams').delete().eq('id', id)
  return !error
}

// ─── Grades ──────────────────────────────────────────────────────────────────

export async function getExamGrades(examId: string): Promise<Grade[]> {
  // Get exam total_marks first
  const { data: examData } = await supabase.from('exams').select('total_marks').eq('id', examId).single()
  type RawExam = { total_marks: number }
  const totalMarks = examData ? (examData as unknown as RawExam).total_marks : 100

  const { data, error } = await supabase
    .from('grades')
    .select('id, exam_id, student_id, marks_obtained, remarks, student:students(full_name, admission_no)')
    .eq('exam_id', examId)

  if (error || !data) return []

  type RawGrade = { id: string; exam_id: string; student_id: string; marks_obtained: number | null; remarks: string | null; student: { full_name: string; admission_no: string } | null }
  return (data as unknown as RawGrade[]).map(r => {
    const pct = r.marks_obtained != null ? (r.marks_obtained / totalMarks) * 100 : null
    return {
      id: r.id,
      exam_id: r.exam_id,
      student_id: r.student_id,
      student_name: r.student?.full_name ?? '—',
      admission_number: r.student?.admission_no ?? '—',
      marks_obtained: r.marks_obtained,
      remarks: r.remarks,
      percentage: pct != null ? Math.round(pct * 10) / 10 : null,
      letter_grade: pct != null ? getLetterGrade(pct) : null,
    }
  })
}

export async function upsertGrade(examId: string, studentId: string, marksObtained: number | null, remarks?: string): Promise<boolean> {
  const { error } = await db.from('grades').upsert(
    { exam_id: examId, student_id: studentId, marks_obtained: marksObtained, remarks: remarks || null },
    { onConflict: 'exam_id,student_id' }
  )
  return !error
}

export async function getEnrolledStudents(classId: string): Promise<EnrolledStudent[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, admission_no')
    .eq('class_id', classId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('full_name')

  if (error || !data) return []
  type Raw = { id: string; full_name: string; admission_no: string }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id,
    full_name: r.full_name,
    admission_number: r.admission_no,
  }))
}
