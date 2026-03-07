export interface Assignment {
  id: string
  teacher_id: string
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
  title: string
  description: string | null
  attachment_url: string | null
  due_date: string
  created_at: string
  updated_at: string
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  student_name: string
  admission_no: string
  submission_url: string | null
  submitted_at: string | null
  grade: number | null
  teacher_comment: string | null
  created_at: string
  updated_at: string
}
