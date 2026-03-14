export interface SchemeBook {
  id: string
  teacher_id: string
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
  term_id: string
  term_name: string
  week: number
  topic: string
  objectives: string | null
  teaching_methods: string | null
  teaching_aids: string | null
  references: string | null
  evaluation: string | null
  status: 'planned' | 'completed'
  hod_approved_by: string | null
  hod_approved_at: string | null
  approved_by: string | null
  approved_at: string | null
  teacher_name: string
  created_at: string
  updated_at: string
}

export type SchemeBookStatus = 'planned' | 'completed'

export interface SchemeBookAttachment {
  id: string
  scheme_book_id: string
  school_id: string
  teacher_id: string
  file_path: string
  file_name: string
  file_type: string
  file_size: number | null
  uploaded_at: string
}
