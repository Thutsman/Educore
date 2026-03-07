export interface LessonPlan {
  id: string
  teacher_id: string
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
  date: string
  scheme_book_id: string | null
  lesson_objectives: string | null
  introduction: string | null
  lesson_development: string | null
  conclusion: string | null
  homework: string | null
  created_at: string
  updated_at: string
}
