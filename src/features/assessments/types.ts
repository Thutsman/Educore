export type AssessmentType = 'test' | 'assignment' | 'project'

export interface Assessment {
  id: string
  teacher_id: string
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
  title: string
  assessment_type: AssessmentType
  date: string
  total_marks: number
  created_at: string
}

export interface AssessmentMark {
  id: string
  assessment_id: string
  student_id: string
  student_name: string
  admission_no: string
  marks_obtained: number | null
  teacher_comment: string | null
  created_at: string
  updated_at: string
}
