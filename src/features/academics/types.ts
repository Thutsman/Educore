export interface Department {
  id: string
  name: string
  code: string | null
  description: string | null
}

export interface AcademicClass {
  id: string
  name: string
  level: number | null
  stream: string | null
  academic_year_id: string | null
  academic_year_name: string | null
  class_teacher_id: string | null
  class_teacher_name: string | null
  room: string | null
}

export interface Subject {
  id: string
  name: string
  code: string
  description: string | null
  department_id: string | null
}

export interface Exam {
  id: string
  name: string
  subject_id: string
  subject_name: string
  class_id: string
  class_name: string
  term_id: string | null
  term_name: string | null
  exam_date: string | null
  total_marks: number
  description: string | null
}

export interface Grade {
  id: string
  exam_id: string
  student_id: string
  student_name: string
  admission_number: string
  marks_obtained: number | null
  remarks: string | null
  percentage: number | null
  letter_grade: string | null
}

export interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
}

export interface Term {
  id: string
  name: string
  academic_year_id: string
  start_date: string
  end_date: string
  is_current: boolean
}

export interface EnrolledStudent {
  id: string
  full_name: string
  admission_number: string
}
