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
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export type SchemeBookStatus = 'planned' | 'completed'
