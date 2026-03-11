import { supabase } from '@/lib/supabase'
import type { SchemeBook } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export interface SchemeBookFilters {
  classId?: string
  subjectId?: string
  termId?: string
  teacherId?: string
}

export async function getSchemeBooks(schoolId: string, filters?: SchemeBookFilters): Promise<SchemeBook[]> {
  let q = supabase
    .from('scheme_books')
    .select(`
      id, teacher_id, class_id, subject_id, term_id, week, topic,
      objectives, teaching_methods, teaching_aids, references, evaluation,
      status, hod_approved_by, hod_approved_at, approved_by, approved_at,
      created_at, updated_at,
      class:classes(name),
      subject:subjects(name),
      term:terms(name),
      teacher:teachers(profile:profiles(full_name))
    `)
    .eq('school_id', schoolId)
    .order('term_id')
    .order('week')

  if (filters?.classId) q = q.eq('class_id', filters.classId)
  if (filters?.subjectId) q = q.eq('subject_id', filters.subjectId)
  if (filters?.termId) q = q.eq('term_id', filters.termId)
  if (filters?.teacherId) q = q.eq('teacher_id', filters.teacherId)

  const { data, error } = await q
  if (error || !data) return []

  type Row = Omit<SchemeBook, 'class_name' | 'subject_name' | 'term_name' | 'teacher_name'> & {
    class: { name: string } | null
    subject: { name: string } | null
    term: { name: string } | null
    teacher: { profile: { full_name: string } | null } | null
  }
  return (data as unknown as Row[]).map((r) => {
    const { class: c, subject: s, term: t, teacher: th, ...rest } = r
    return {
      ...rest,
      class_name: c?.name ?? '—',
      subject_name: s?.name ?? '—',
      term_name: t?.name ?? '—',
      teacher_name: th?.profile?.full_name ?? '—',
    }
  })
}

export interface CreateSchemeBookInput {
  class_id: string
  subject_id: string
  term_id: string
  week: number
  topic: string
  objectives?: string
  teaching_methods?: string
  teaching_aids?: string
  references?: string
  evaluation?: string
  status?: 'planned' | 'completed'
}

export async function createSchemeBook(
  input: CreateSchemeBookInput,
  teacherId: string,
  schoolId: string
): Promise<boolean> {
  const { error } = await db.from('scheme_books').insert({
    school_id: schoolId,
    teacher_id: teacherId,
    class_id: input.class_id,
    subject_id: input.subject_id,
    term_id: input.term_id,
    week: input.week,
    topic: input.topic,
    objectives: input.objectives || null,
    teaching_methods: input.teaching_methods || null,
    teaching_aids: input.teaching_aids || null,
    references: input.references || null,
    evaluation: input.evaluation || null,
    status: input.status ?? 'planned',
  })
  return !error
}

export async function updateSchemeBook(
  id: string,
  data: Partial<CreateSchemeBookInput>
): Promise<boolean> {
  const { error } = await db.from('scheme_books').update(data).eq('id', id)
  return !error
}

/** HOD first-stage approval. */
export async function hodApproveSchemeBook(id: string, profileId: string): Promise<boolean> {
  const { error } = await db
    .from('scheme_books')
    .update({ hod_approved_by: profileId, hod_approved_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}

/** Final approval by headmaster or deputy headmaster (requires HOD approval first). */
export async function approveSchemeBook(id: string, profileId: string): Promise<boolean> {
  const { error } = await db
    .from('scheme_books')
    .update({ approved_by: profileId, approved_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}

export async function getSchemeBookProgressByTerm(schoolId: string, termId: string): Promise<{ total: number; completed: number }> {
  const { data, error } = await supabase
    .from('scheme_books')
    .select('id, status')
    .eq('school_id', schoolId)
    .eq('term_id', termId)
  if (error || !data) return { total: 0, completed: 0 }
  const completed = data.filter((r: { status: string }) => r.status === 'completed').length
  return { total: data.length, completed }
}
