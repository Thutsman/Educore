import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Student, Guardian, StudentFeeSummary, StudentFilters, StudentFormData } from '../types'
import { setUserRoles } from '@/features/staff/services/staff'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const n = (v: unknown): number => Number(v) || 0

function createOnboardingClient() {
  return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'educore-onboarding-auth',
    },
  })
}

// ─── Students ────────────────────────────────────────────────────────────────

export async function getStudents(schoolId: string, filters?: Partial<StudentFilters>): Promise<Student[]> {
  let query = supabase
    .from('students')
    .select('id, admission_no, full_name, date_of_birth, gender, status, admission_date, class_id, class:classes(name)')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('full_name')

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,admission_no.ilike.%${filters.search}%`)
  }
  if (filters?.classId && filters.classId !== 'all') {
    query = query.eq('class_id', filters.classId)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error || !data) return []

  type RawStudent = {
    id: string; admission_no: string; full_name: string
    date_of_birth: string | null; gender: string | null; status: string
    admission_date: string | null; class_id: string | null
    class: { name: string } | null
  }
  return (data as unknown as RawStudent[]).map(r => ({
    id:             r.id,
    admission_no:   r.admission_no,
    full_name:      r.full_name,
    date_of_birth:  r.date_of_birth,
    gender:         r.gender as Student['gender'],
    address:        null,
    phone:          null,
    email:          null,
    status:         r.status as Student['status'],
    admission_date: r.admission_date,
    class_id:       r.class_id,
    class_name:     r.class?.name ?? null,
  }))
}

export async function getStudentById(id: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('id, admission_no, full_name, date_of_birth, gender, address, status, admission_date, class_id, class:classes(name)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !data) return null
  type RawStudent = {
    id: string; admission_no: string; full_name: string
    date_of_birth: string | null; gender: string | null; address: string | null; status: string
    admission_date: string | null; class_id: string | null
    class: { name: string } | null
  }
  const r = data as unknown as RawStudent
  return {
    id:             r.id,
    admission_no:   r.admission_no,
    full_name:      r.full_name,
    date_of_birth:  r.date_of_birth,
    gender:         r.gender as Student['gender'],
    address:        r.address,
    phone:          null,
    email:          null,
    status:         r.status as Student['status'],
    admission_date: r.admission_date,
    class_id:       r.class_id,
    class_name:     (r.class as { name: string } | null)?.name ?? null,
  }
}

export async function getStudentGuardians(studentId: string): Promise<Guardian[]> {
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('guardian_id, guardian2_id')
    .eq('id', studentId)
    .maybeSingle()

  if (studentError || !studentData) return []

  const primaryId   = (studentData as { guardian_id: string | null }).guardian_id
  const secondaryId = (studentData as { guardian2_id: string | null }).guardian2_id
  const guardianIds = [primaryId, secondaryId].filter((id): id is string => !!id)

  if (guardianIds.length === 0) return []

  const { data, error } = await supabase
    .from('guardians')
    .select('id, full_name, relationship, phone, email, address, profile_id')
    .in('id', guardianIds)
    .is('deleted_at', null)

  if (error || !data) return []

  type RawGuardian = {
    id: string; full_name: string; relationship: string
    phone: string | null; email: string | null; address: string | null; profile_id: string | null
  }

  const guardians = (data as unknown as RawGuardian[]).map(r => ({
    id:           r.id,
    student_id:   studentId,
    full_name:    r.full_name,
    relationship: r.relationship,
    phone:        r.phone,
    email:        r.email,
    address:      r.address,
    is_primary:   r.id === primaryId,
    has_portal_access: !!r.profile_id,
  }))

  guardians.sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
  return guardians
}

export async function getStudentFeeSummary(studentId: string): Promise<StudentFeeSummary> {
  const { data, error } = await supabase
    .from('invoices')
    .select('amount, amount_paid, balance, status')
    .eq('student_id', studentId)
    .neq('status', 'void')

  if (error || !data) return { totalInvoiced: 0, totalPaid: 0, balance: 0, invoiceCount: 0 }
  type RawInvoice = { amount: unknown; amount_paid: unknown; balance: unknown }
  const rows = data as unknown as RawInvoice[]
  return {
    totalInvoiced: rows.reduce((s, r) => s + n(r.amount), 0),
    totalPaid:     rows.reduce((s, r) => s + n(r.amount_paid), 0),
    balance:       rows.reduce((s, r) => s + n(r.balance), 0),
    invoiceCount:  rows.length,
  }
}

export async function updateGuardian(id: string, data: Partial<Pick<Guardian, 'full_name' | 'relationship' | 'phone' | 'email' | 'address'>>): Promise<boolean> {
  const { error } = await db
    .from('guardians')
    .update({
      ...(data.full_name     !== undefined && { full_name: data.full_name }),
      ...(data.relationship  !== undefined && { relationship: data.relationship }),
      ...(data.phone         !== undefined && { phone: data.phone || null }),
      ...(data.email         !== undefined && { email: data.email || null }),
      ...(data.address       !== undefined && { address: data.address || null }),
    })
    .eq('id', id)

  return !error
}

// ─── Classes (dropdown data) ─────────────────────────────────────────────────

export async function getClassesForSelect(schoolId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('name')

  if (error || !data) return []
  type RawClass = { id: string; name: string }
  return (data as unknown as RawClass[]).map(r => ({ id: r.id, name: r.name }))
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createStudent(schoolId: string, data: StudentFormData): Promise<{ id: string } | null> {
  let guardianId: string | null = null

  if (data.guardian_full_name && data.guardian_relationship) {
    const { data: guardianResult, error: guardianError } = await db
      .from('guardians')
      .insert({
        full_name:    data.guardian_full_name,
        relationship: data.guardian_relationship,
        phone:        data.guardian_phone || null,
        email:        data.guardian_email || null,
        address:      data.guardian_address || null,
        school_id:    schoolId,
      })
      .select('id')
      .single()

    if (!guardianError && guardianResult) {
      guardianId = (guardianResult as unknown as { id: string }).id
    }
  }

  const { data: result, error } = await db
    .from('students')
    .insert({
      admission_no:   data.admission_no,
      full_name:      data.full_name,
      date_of_birth:  data.date_of_birth  || null,
      gender:         data.gender         || null,
      address:        data.address        || null,
      status:         data.status,
      admission_date: data.admission_date || null,
      class_id:       data.class_id       || null,
      guardian_id:    guardianId,
      school_id:      schoolId,
    })
    .select('id')
    .single()

  if (error) {
    const msg = String((error as { message?: unknown }).message ?? '')
    const code = String((error as { code?: unknown }).code ?? '')

    // Postgres unique violation (commonly surfaces as 409 in Supabase REST)
    if (code === '23505' || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
      if (msg.toLowerCase().includes('admission') || msg.toLowerCase().includes('admission_no')) {
        throw new Error('Admission number already in use')
      }
      throw new Error('A record with the same unique value already exists')
    }

    throw new Error(msg || 'Failed to add student')
  }

  if (!result) throw new Error('Failed to add student')
  return { id: (result as unknown as { id: string }).id }
}

export async function updateStudent(id: string, data: Partial<StudentFormData>): Promise<boolean> {
  const { error } = await db
    .from('students')
    .update({
      ...(data.admission_no   !== undefined && { admission_no:   data.admission_no }),
      ...(data.full_name      !== undefined && { full_name:      data.full_name }),
      ...(data.date_of_birth  !== undefined && { date_of_birth:  data.date_of_birth  || null }),
      ...(data.gender         !== undefined && { gender:         data.gender         || null }),
      ...(data.address        !== undefined && { address:        data.address        || null }),
      ...(data.status         !== undefined && { status:         data.status }),
      ...(data.admission_date !== undefined && { admission_date: data.admission_date || null }),
      ...(data.class_id       !== undefined && { class_id:       data.class_id       || null }),
    })
    .eq('id', id)

  return !error
}

export async function deleteStudent(id: string): Promise<boolean> {
  const { error } = await db
    .from('students')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}

export async function inviteGuardianAsParent(guardianId: string, schoolId: string): Promise<'created' | 'already_linked' | 'missing_email' | 'error'> {
  const { data, error } = await supabase
    .from('guardians')
    .select('id, full_name, email, profile_id')
    .eq('id', guardianId)
    .eq('school_id', schoolId)
    .maybeSingle()

  if (error || !data) return 'error'

  const guardian = data as { id: string; full_name: string; email: string | null; profile_id: string | null }

  if (!guardian.email) return 'missing_email'
  if (guardian.profile_id) return 'already_linked'

  const onboardingClient = createOnboardingClient()
  const tempPassword = crypto.randomUUID()

  const { data: signUpData, error: signUpError } = await onboardingClient.auth.signUp({
    email: guardian.email,
    password: tempPassword,
    options: {
      data: { full_name: guardian.full_name },
    },
  })

  if (signUpError || !signUpData.user) {
    // If the user already exists or another error occurred, surface a generic error for now
    // to avoid making assumptions about the existing account.
    return 'error'
  }

  const userId = signUpData.user.id

  const rolesOk = await setUserRoles(userId, ['parent'], schoolId)
  if (!rolesOk) return 'error'

  const { error: linkError } = await db
    .from('guardians')
    .update({ profile_id: userId })
    .eq('id', guardianId)

  if (linkError) return 'error'

  return 'created'
}
