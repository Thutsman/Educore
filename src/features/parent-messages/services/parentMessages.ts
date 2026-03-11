import { supabase } from '@/lib/supabase'
import type { ParentMessage } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function getParentMessagesSentByTeacher(schoolId: string): Promise<ParentMessage[]> {
  const { data, error } = await supabase
    .from('parent_messages')
    .select(`
      id, teacher_id, parent_id, student_id, subject, message, created_at, read_status,
      parent:guardians(full_name),
      student:students(full_name)
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  type Row = Omit<ParentMessage, 'parent_name' | 'student_name'> & {
    parent: { full_name: string } | null
    student: { full_name: string } | null
  }
  return (data as unknown as Row[]).map((r) => {
    const { parent: p, student: s, ...rest } = r
    return { ...rest, parent_name: p?.full_name ?? '—', student_name: s?.full_name ?? '—' }
  })
}

export async function getMessagesToParent(schoolId: string, parentId: string): Promise<ParentMessage[]> {
  const { data, error } = await supabase
    .from('parent_messages')
    .select(`
      id, teacher_id, parent_id, student_id, subject, message, created_at, read_status,
      parent:guardians(full_name),
      student:students(full_name)
    `)
    .eq('school_id', schoolId)
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  type Row = Omit<ParentMessage, 'parent_name' | 'student_name'> & {
    parent: { full_name: string } | null
    student: { full_name: string } | null
  }
  return (data as unknown as Row[]).map((r) => {
    const { parent: p, student: s, ...rest } = r
    return { ...rest, parent_name: p?.full_name ?? '—', student_name: s?.full_name ?? '—' }
  })
}

export interface GuardianWithStudents {
  id: string
  full_name: string
  students: { id: string; full_name: string }[]
}

export async function getGuardiansWithStudentsForTeacher(schoolId: string): Promise<GuardianWithStudents[]> {
  const { data: students, error: se } = await supabase
    .from('students')
    .select('id, full_name, guardian_id, guardian2_id, class_id')
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .is('deleted_at', null)
  if (se || !students) return []

  const guardianIds = new Set<string>()
  const studentByGuardian = new Map<string, { id: string; full_name: string }[]>()
  for (const s of students as { id: string; full_name: string; guardian_id: string | null; guardian2_id: string | null }[]) {
    for (const gid of [s.guardian_id, s.guardian2_id].filter(Boolean) as string[]) {
      guardianIds.add(gid)
      if (!studentByGuardian.has(gid)) studentByGuardian.set(gid, [])
      studentByGuardian.get(gid)!.push({ id: s.id, full_name: s.full_name })
    }
  }
  if (guardianIds.size === 0) return []

  const { data: guardians, error: ge } = await supabase
    .from('guardians')
    .select('id, full_name')
    .in('id', Array.from(guardianIds))
  if (ge || !guardians) return []

  return (guardians as { id: string; full_name: string }[]).map((g) => ({
    id: g.id,
    full_name: g.full_name,
    students: studentByGuardian.get(g.id) ?? [],
  }))
}

export async function createParentMessage(
  schoolId: string,
  teacherId: string,
  parentId: string,
  studentId: string,
  subject: string,
  message: string
): Promise<boolean> {
  const { error } = await db.from('parent_messages').insert({
    school_id: schoolId,
    teacher_id: teacherId,
    parent_id: parentId,
    student_id: studentId,
    subject,
    message,
  })
  return !error
}

export async function markParentMessageRead(id: string): Promise<boolean> {
  const { error } = await db.from('parent_messages').update({ read_status: true }).eq('id', id)
  return !error
}
