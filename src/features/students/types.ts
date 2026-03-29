export interface Student {
  id: string
  admission_no: string
  full_name: string
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | null
  address: string | null
  phone: string | null
  email: string | null
  status: 'active' | 'inactive' | 'graduated' | 'expelled' | 'transferred'
  admission_date: string | null
  class_id: string | null
  class_name: string | null
}

export interface Guardian {
  id: string
  student_id: string
  full_name: string
  relationship: string
  phone: string | null
  email: string | null
  address: string | null
  is_primary: boolean
  has_portal_access: boolean
  profile_id: string | null
}

export interface StudentFeeSummary {
  totalInvoiced: number
  totalPaid: number
  balance: number
  invoiceCount: number
}

export interface StudentFilters {
  search: string
  classId: string
  status: string
}

export interface StudentFormData {
  admission_no: string
  full_name: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  status: 'active' | 'inactive' | 'graduated' | 'expelled' | 'transferred'
  admission_date?: string
  class_id?: string
  // Optional guardian details captured at creation time
  guardian_full_name?: string
  guardian_relationship?: 'father' | 'mother' | 'guardian' | 'other'
  guardian_phone?: string
  guardian_email?: string
  guardian_address?: string
}
