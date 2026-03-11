import { supabase } from '@/lib/supabase'
import type { LessonPlan } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export interface LessonPlanFilters {
  classId?: string
  subjectId?: string
  startDate?: string
  endDate?: string
}

export async function getLessonPlans(schoolId: string, filters?: LessonPlanFilters): Promise<LessonPlan[]> {
  let q = supabase
    .from('lesson_plans')
    .select(`
      id, teacher_id, class_id, subject_id, date, scheme_book_id,
      lesson_objectives, introduction, lesson_development, conclusion, homework,
      created_at, updated_at,
      class:classes(name),
      subject:subjects(name)
    `)
    .eq('school_id', schoolId)
    .order('date', { ascending: false })

  if (filters?.classId) q = q.eq('class_id', filters.classId)
  if (filters?.subjectId) q = q.eq('subject_id', filters.subjectId)
  if (filters?.startDate) q = q.gte('date', filters.startDate)
  if (filters?.endDate) q = q.lte('date', filters.endDate)

  const { data, error } = await q
  if (error || !data) return []

  type Row = Omit<LessonPlan, 'class_name' | 'subject_name'> & {
    class: { name: string } | null
    subject: { name: string } | null
  }
  return (data as unknown as Row[]).map((r) => {
    const { class: c, subject: s, ...rest } = r
    return { ...rest, class_name: c?.name ?? '—', subject_name: s?.name ?? '—' }
  })
}

export interface CreateLessonPlanInput {
  class_id: string
  subject_id: string
  date: string
  scheme_book_id?: string
  lesson_objectives?: string
  introduction?: string
  lesson_development?: string
  conclusion?: string
  homework?: string
}

export async function createLessonPlan(input: CreateLessonPlanInput, teacherId: string, schoolId: string): Promise<boolean> {
  const { error } = await db.from('lesson_plans').insert({
    school_id: schoolId,
    teacher_id: teacherId,
    class_id: input.class_id,
    subject_id: input.subject_id,
    date: input.date,
    scheme_book_id: input.scheme_book_id || null,
    lesson_objectives: input.lesson_objectives || null,
    introduction: input.introduction || null,
    lesson_development: input.lesson_development || null,
    conclusion: input.conclusion || null,
    homework: input.homework || null,
  })
  return !error
}

export async function updateLessonPlan(id: string, data: Partial<CreateLessonPlanInput>): Promise<boolean> {
  const { error } = await db.from('lesson_plans').update(data).eq('id', id)
  return !error
}

export async function deleteLessonPlan(id: string): Promise<boolean> {
  const { error } = await db.from('lesson_plans').delete().eq('id', id)
  return !error
}

export async function duplicateLessonPlan(id: string, newDate: string, teacherId: string, schoolId: string): Promise<boolean> {
  const { data: existing, error: fetchError } = await supabase
    .from('lesson_plans')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchError || !existing) return false
  const row = existing as { class_id: string; subject_id: string; scheme_book_id: string | null; lesson_objectives: string | null; introduction: string | null; lesson_development: string | null; conclusion: string | null; homework: string | null }
  const { error } = await db.from('lesson_plans').insert({
    school_id: schoolId,
    teacher_id: teacherId,
    class_id: row.class_id,
    subject_id: row.subject_id,
    date: newDate,
    scheme_book_id: row.scheme_book_id,
    lesson_objectives: row.lesson_objectives,
    introduction: row.introduction,
    lesson_development: row.lesson_development,
    conclusion: row.conclusion,
    homework: row.homework,
  })
  return !error
}
