import { supabase } from '@/lib/supabase'
import type { LearningResource, ResourceFileType } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const BUCKET = 'academic-files'

export interface ResourceFilters {
  subjectId?: string
  classId?: string
  topic?: string
}

export async function getLearningResources(schoolId: string, filters?: ResourceFilters): Promise<LearningResource[]> {
  let q = supabase
    .from('learning_resources')
    .select(`
      id, teacher_id, subject_id, class_id, title, description, file_url, file_type, topic, created_at,
      subject:subjects(name),
      class:classes(name)
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (filters?.subjectId) q = q.eq('subject_id', filters.subjectId)
  if (filters?.classId) q = q.eq('class_id', filters.classId)
  if (filters?.topic) q = q.ilike('topic', `%${filters.topic}%`)

  const { data, error } = await q
  if (error || !data) return []

  type Row = Omit<LearningResource, 'subject_name' | 'class_name'> & {
    subject: { name: string } | null
    class: { name: string } | null
  }
  return (data as unknown as Row[]).map((r) => {
    const { subject: s, class: c, ...rest } = r
    return { ...rest, subject_name: s?.name ?? '—', class_name: c?.name ?? null }
  })
}

export interface CreateResourceInput {
  subject_id: string
  class_id?: string
  title: string
  description?: string
  file_url: string
  file_type: ResourceFileType
  topic?: string
}

export async function createResource(input: CreateResourceInput, teacherId: string, schoolId: string): Promise<boolean> {
  const { error } = await db.from('learning_resources').insert({
    school_id: schoolId,
    teacher_id: teacherId,
    subject_id: input.subject_id,
    class_id: input.class_id || null,
    title: input.title,
    description: input.description || null,
    file_url: input.file_url,
    file_type: input.file_type,
    topic: input.topic || null,
  })
  return !error
}

export async function updateResource(id: string, data: Partial<CreateResourceInput>): Promise<boolean> {
  const { error } = await db.from('learning_resources').update(data).eq('id', id)
  return !error
}

export async function deleteResource(id: string): Promise<boolean> {
  const { error } = await db.from('learning_resources').delete().eq('id', id)
  return !error
}

export async function uploadResourceFile(file: File): Promise<string | null> {
  const path = `resources/${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) return null
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return urlData.publicUrl
}
