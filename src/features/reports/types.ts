export interface TermReport {
  id: string
  student_id: string
  student_name: string
  admission_no: string
  class_id: string
  class_name: string
  term_id: string
  term_name: string
  academic_year_id: string
  average_mark: number | null
  attendance_days_present: number | null
  attendance_days_total: number | null
  attendance_percentage: number | null
  homework_completion_rate: number | null
  teacher_comment: string | null
  rank: number | null
  generated_at: string
  created_at: string
}
