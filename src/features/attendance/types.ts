export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  admission_number: string
  class_id: string
  date: string
  status: AttendanceStatus
  remarks: string | null
}

export interface AttendanceSummary {
  studentId: string
  studentName: string
  admissionNumber: string
  present: number
  absent: number
  late: number
  excused: number
  total: number
  attendanceRate: number
}

export interface AttendanceMarkRow {
  studentId: string
  studentName: string
  admissionNumber: string
  status: AttendanceStatus
  remarks: string
  existingId?: string
}
