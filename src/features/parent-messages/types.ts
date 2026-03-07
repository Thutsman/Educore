export interface ParentMessage {
  id: string
  teacher_id: string
  parent_id: string
  parent_name: string
  student_id: string
  student_name: string
  subject: string
  message: string
  created_at: string
  read_status: boolean
}
