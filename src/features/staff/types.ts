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
