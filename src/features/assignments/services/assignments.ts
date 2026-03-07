import { supabase } from '@/lib/supabase'
import type { Assignment, AssignmentSubmission } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const BUCKET = 'academic-files'

export interface AssignmentFilters {
  classId?: string
  subjectId?: string
}

export async function getAssignments(filters?: AssignmentFilters): Promise<Assignment[]> {
  let q = supabase
    .from('assignments')
    .select(`
      id, teacher_id, class_id, subject_id, title, description, attachment_url, due_date, created_at, updated_at,
      class:classes(name),
      subject:subjects(name)
    `)
    .order('due_date', { ascending: false })

  if (filters?.classId) q = q.eq('class_id', filters.classId)
  if (filters?.subjectId) q = q.eq('subject_id', filters.subjectId)

  const { data, error } = await q
  if (error || !data) return []

  type Row = Omit<Assignment, 'class_name' | 'subject_name'> & {
    class: { name: string } | null
    subject: { name: string } | null
  }
  return (data as unknown as Row[]).map((r) => {
    const { class: c, subject: s, ...rest } = r
    return { ...rest, class_name: c?.name ?? '—', subject_name: s?.name ?? '—' }
  })
}

export async function getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select(`
      id, assignment_id, student_id, submission_url, submitted_at, grade, teacher_comment, created_at, updated_at,
      student:students(full_name, admission_no)
    `)
    .eq('assignment_id', assignmentId)

  if (error || !data) return []

  type Row = Omit<AssignmentSubmission, 'student_name' | 'admission_no'> & {
    student: { full_name: string; admission_no: string } | null
  }
  return (data as unknown as Row[]).map((r) => ({
    ...r,
    student_name: r.student?.full_name ?? '—',
    admission_no: r.student?.admission_no ?? '—',
  }))
}

export async function getEnrolledStudentsForAssignment(classId: string): Promise<{ id: string; full_name: string; admission_no: string }[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, admission_no')
    .eq('class_id', classId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('full_name')
  if (error || !data) return []
  return data as unknown as { id: string; full_name: string; admission_no: string }[]
}

export interface CreateAssignmentInput {
  class_id: string
  subject_id: string
  title: string
  description?: string
  attachment_url?: string
  due_date: string
}

export async function createAssignment(input: CreateAssignmentInput, teacherId: string): Promise<boolean> {
  const { error } = await db.from('assignments').insert({
    teacher_id: teacherId,
    class_id: input.class_id,
    subject_id: input.subject_id,
    title: input.title,
    description: input.description || null,
    attachment_url: input.attachment_url || null,
    due_date: input.due_date,
  })
  return !error
}

export async function updateAssignment(id: string, data: Partial<CreateAssignmentInput>): Promise<boolean> {
  const { error } = await db.from('assignments').update(data).eq('id', id)
  return !error
}

export async function deleteAssignment(id: string): Promise<boolean> {
  const { error } = await db.from('assignments').delete().eq('id', id)
  return !error
}

export async function upsertSubmissionGrade(
  assignmentId: string,
  studentId: string,
  grade: number | null,
  teacher_comment?: string
): Promise<boolean> {
  const { error } = await db.from('assignment_submissions').upsert(
    {
      assignment_id: assignmentId,
      student_id: studentId,
      grade,
      teacher_comment: teacher_comment ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'assignment_id,student_id' }
  )
  return !error
}

export async function uploadSubmissionFile(
  assignmentId: string,
  studentId: string,
  file: File
): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'bin'
  const path = `submissions/${assignmentId}/${studentId}/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) return null
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return urlData.publicUrl
}

export async function saveSubmissionUrl(
  assignmentId: string,
  studentId: string,
  submissionUrl: string
): Promise<boolean> {
  const { error } = await db.from('assignment_submissions').upsert(
    {
      assignment_id: assignmentId,
      student_id: studentId,
      submission_url: submissionUrl,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'assignment_id,student_id' }
  )
  return !error
}

export async function uploadAssignmentAttachment(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'bin'
  const path = `assignments/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) return null
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return urlData.publicUrl
}
