export interface Teacher {
  id: string
  profile_id: string
  full_name: string
  email: string | null
  phone: string | null
  employee_no: string
  status: 'active' | 'inactive' | 'on_leave'
  department_name: string | null
  department_id: string | null
  qualification: string | null
  specialization: string | null
  employment_type: 'permanent' | 'contract' | 'part_time'
  join_date: string | null
  subjects_taught: string[]
  homeroom_class_name: string | null
}

export interface TeacherSelectOption {
  id: string
  full_name: string
  homeroom_class_name: string | null
}

export interface TeacherFormData {
  profile_id: string
  employee_no: string
  department_id?: string
  employment_type: 'permanent' | 'contract' | 'part_time'
  join_date?: string
  qualification?: string
  specialization?: string
  status: 'active' | 'inactive' | 'on_leave'
}

export interface ProfileOption {
  id: string
  full_name: string
  email: string | null
}

export interface DepartmentOption {
  id: string
  name: string
}

export interface StaffMember {
  id: string
  profile_id: string
  full_name: string
  email: string | null
  phone: string | null
  employee_no: string
  role_name: string
  status: 'active' | 'inactive' | 'on_leave'
}

export type StaffRole =
  | 'headmaster'
  | 'deputy_headmaster'
  | 'bursar'
  | 'hod'
  | 'teacher'
  | 'class_teacher'
  | 'non_teaching_staff'

export interface TeacherAllocation {
  id: string
  teacher_id: string
  subject_id: string
  subject_name: string
  class_id: string
  class_name: string
  grade_level: number
  academic_year_id: string
  academic_year_label: string
}

export interface SubjectOption {
  id: string
  name: string
  code: string
}

export interface ClassOption {
  id: string
  name: string
  grade_level: number
}

export interface CreateUserAccountData {
  full_name: string
  email: string
  password: string
  phone?: string
  /** One or more roles (e.g. teacher + class_teacher for dual role). */
  roles: StaffRole[]
}
