export type ResourceFileType = 'pdf' | 'video' | 'ppt' | 'doc'

export interface LearningResource {
  id: string
  teacher_id: string
  subject_id: string
  subject_name: string
  class_id: string | null
  class_name: string | null
  title: string
  description: string | null
  file_url: string
  file_type: ResourceFileType
  topic: string | null
  created_at: string
}
