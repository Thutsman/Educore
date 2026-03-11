import { supabase } from '@/lib/supabase'
import type { Assessment, AssessmentMark, AssessmentType } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export interface AssessmentFilters {
  classId?: string
  subjectId?: string
}

export async function getAssessments(schoolId: string, filters?: AssessmentFilters): Promise<Assessment[]> {
  let q = supabase
    .from('assessments')
    .select(`
      id, teacher_id, class_id, subject_id, title, assessment_type, date, total_marks, created_at,
      class:classes(name),
      subject:subjects(name)
    `)
    .eq('school_id', schoolId)
    .order('date', { ascending: false })

  if (filters?.classId) q = q.eq('class_id', filters.classId)
  if (filters?.subjectId) q = q.eq('subject_id', filters.subjectId)

  const { data, error } = await q
  if (error || !data) return []

  type Row = Omit<Assessment, 'class_name' | 'subject_name'> & {
    class: { name: string } | null
    subject: { name: string } | null
  }
  return (data as unknown as Row[]).map((r) => {
    const { class: c, subject: s, ...rest } = r
    return { ...rest, class_name: c?.name ?? '—', subject_name: s?.name ?? '—' }
  })
}

export async function getAssessmentMarks(assessmentId: string): Promise<AssessmentMark[]> {
  const { data, error } = await supabase
    .from('assessment_marks')
    .select(`
      id, assessment_id, student_id, marks_obtained, teacher_comment, created_at, updated_at,
      student:students(full_name, admission_no)
    `)
    .eq('assessment_id', assessmentId)

  if (error || !data) return []

  type Row = Omit<AssessmentMark, 'student_name' | 'admission_no'> & {
    student: { full_name: string; admission_no: string } | null
  }
  return (data as unknown as Row[]).map((r) => ({
    ...r,
    student_name: r.student?.full_name ?? '—',
    admission_no: r.student?.admission_no ?? '—',
  }))
}

export async function getEnrolledStudents(schoolId: string, classId: string): Promise<{ id: string; full_name: string; admission_no: string }[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, admission_no')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('full_name')
  if (error || !data) return []
  return data as unknown as { id: string; full_name: string; admission_no: string }[]
}

export interface CreateAssessmentInput {
  class_id: string
  subject_id: string
  title: string
  assessment_type: AssessmentType
  date: string
  total_marks: number
}

export async function createAssessment(input: CreateAssessmentInput, teacherId: string, schoolId: string): Promise<boolean> {
  const { error } = await db.from('assessments').insert({
    school_id: schoolId,
    teacher_id: teacherId,
    class_id: input.class_id,
    subject_id: input.subject_id,
    title: input.title,
    assessment_type: input.assessment_type,
    date: input.date,
    total_marks: input.total_marks,
  })
  return !error
}

export async function updateAssessment(id: string, data: Partial<CreateAssessmentInput>): Promise<boolean> {
  const { error } = await db.from('assessments').update(data).eq('id', id)
  return !error
}

export async function deleteAssessment(id: string): Promise<boolean> {
  const { error } = await db.from('assessments').delete().eq('id', id)
  return !error
}

export async function upsertAssessmentMark(
  assessmentId: string,
  studentId: string,
  marks_obtained: number | null,
  teacher_comment?: string
): Promise<boolean> {
  const { error } = await db.from('assessment_marks').upsert(
    {
      assessment_id: assessmentId,
      student_id: studentId,
      marks_obtained,
      teacher_comment: teacher_comment ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'assessment_id,student_id' }
  )
  return !error
}

export async function getClassAssessmentAverages(schoolId: string, classId: string): Promise<{ assessment_id: string; title: string; date: string; average: number; count: number }[]> {
  const { data: assessments, error: e1 } = await supabase
    .from('assessments')
    .select('id, title, date, total_marks')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .order('date', { ascending: false })
    .limit(15)
  if (e1 || !assessments) return []

  const results: { assessment_id: string; title: string; date: string; average: number; count: number }[] = []
  for (const a of assessments as { id: string; title: string; date: string; total_marks: number }[]) {
    const { data: marks } = await supabase
      .from('assessment_marks')
      .select('marks_obtained')
      .eq('assessment_id', a.id)
    const values = (marks ?? []).map((m: { marks_obtained: number | null }) => m.marks_obtained).filter((x): x is number => x != null)
    results.push({
      assessment_id: a.id,
      title: a.title,
      date: a.date,
      average: values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0,
      count: values.length,
    })
  }
  return results
}
