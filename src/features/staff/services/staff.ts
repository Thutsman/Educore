import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Teacher, StaffMember, TeacherFormData, ProfileOption, DepartmentOption, CreateUserAccountData, TeacherSelectOption } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

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

export async function getTeachers(): Promise<Teacher[]> {
  const [teachersRes, classesRes] = await Promise.all([
    supabase
      .from('teachers')
      .select(`
        id, profile_id, employee_no, status, qualification, specialization,
        employment_type, join_date, department_id,
        profile:profiles(full_name, phone),
        department:departments!teachers_department_id_fkey(name)
      `)
      .is('deleted_at', null)
      .order('employee_no'),
    supabase
      .from('classes')
      .select('class_teacher_id, name')
      .not('class_teacher_id', 'is', null)
      .is('deleted_at', null),
  ])

  if (teachersRes.error || !teachersRes.data) {
    console.error('[getTeachers] query error:', teachersRes.error)
    return []
  }

  type Raw = {
    id: string; profile_id: string; employee_no: string; status: string
    qualification: string | null; specialization: string | null
    employment_type: string; join_date: string | null; department_id: string | null
    profile: { full_name: string; phone: string | null } | null
    department: { name: string } | null
  }
  type RawClass = { class_teacher_id: string; name: string }

  const homeroomMap = new Map<string, string>()
  ;((classesRes.data ?? []) as unknown as RawClass[]).forEach(c => {
    if (c.class_teacher_id) homeroomMap.set(c.class_teacher_id, c.name)
  })

  return (teachersRes.data as unknown as Raw[]).map(r => ({
    id: r.id,
    profile_id: r.profile_id,
    full_name: r.profile?.full_name ?? '—',
    email: null,
    phone: r.profile?.phone ?? null,
    employee_no: r.employee_no,
    status: r.status as Teacher['status'],
    department_name: r.department?.name ?? null,
    department_id: r.department_id,
    qualification: r.qualification,
    specialization: r.specialization,
    employment_type: r.employment_type as Teacher['employment_type'],
    join_date: r.join_date,
    subjects_taught: [],
    homeroom_class_name: homeroomMap.get(r.id) ?? null,
  }))
}

/** Profiles not yet linked to any active teacher record — for the Add Teacher dropdown. */
export async function getProfilesForTeacher(): Promise<ProfileOption[]> {
  const [profilesRes, linkedRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name').order('full_name'),
    supabase.from('teachers').select('profile_id').is('deleted_at', null),
  ])

  if (profilesRes.error || !profilesRes.data) return []

  const linked = new Set(
    ((linkedRes.data ?? []) as { profile_id: string }[]).map(r => r.profile_id)
  )

  type RawProfile = { id: string; full_name: string }
  return (profilesRes.data as unknown as RawProfile[])
    .filter(p => !linked.has(p.id))
    .map(p => ({ id: p.id, full_name: p.full_name, email: null }))
}

/** All departments for the department dropdown. */
export async function getDepartmentsForSelect(): Promise<DepartmentOption[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name')
    .is('deleted_at', null)
    .order('name')
  if (error || !data) return []
  return (data as unknown as DepartmentOption[])
}

export async function getTeachersForSelect(): Promise<TeacherSelectOption[]> {
  const [teachersRes, classesRes] = await Promise.all([
    supabase
      .from('teachers')
      .select('id, profile:profiles(full_name)')
      .is('deleted_at', null)
      .order('employee_no'),
    supabase
      .from('classes')
      .select('class_teacher_id, name')
      .not('class_teacher_id', 'is', null)
      .is('deleted_at', null),
  ])

  if (teachersRes.error || !teachersRes.data) return []

  type Raw = { id: string; profile: { full_name: string } | null }
  type RawClass = { class_teacher_id: string; name: string }

  const homeroomMap = new Map<string, string>()
  ;((classesRes.data ?? []) as unknown as RawClass[]).forEach(c => {
    if (c.class_teacher_id) homeroomMap.set(c.class_teacher_id, c.name)
  })

  return (teachersRes.data as unknown as Raw[])
    .map(r => ({
      id: r.id,
      full_name: r.profile?.full_name ?? '—',
      homeroom_class_name: homeroomMap.get(r.id) ?? null,
    }))
    .filter(r => r.full_name !== '—')
}

export async function createUserAccount(data: CreateUserAccountData): Promise<{ id: string } | null> {
  const onboardingClient = createOnboardingClient()
  const { data: signUpData, error: signUpError } = await onboardingClient.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { full_name: data.full_name },
    },
  })
  if (signUpError || !signUpData.user) return null

  const userId = signUpData.user.id

  const { data: roleData } = await supabase
    .from('roles')
    .select('id')
    .eq('name', data.role)
    .maybeSingle()
  const roleId = (roleData as { id: string } | null)?.id
  if (!roleId) return null

  const { error: roleError } = await db
    .from('user_roles')
    .insert({ user_id: userId, role_id: roleId })
  if (roleError) return null

  if (data.phone) {
    await db.from('profiles').update({ phone: data.phone, full_name: data.full_name }).eq('id', userId)
  }

  return { id: userId }
}

export async function createTeacher(data: TeacherFormData): Promise<{ id: string } | null> {
  const { data: result, error } = await db
    .from('teachers')
    .insert({
      profile_id:       data.profile_id,
      employee_no:      data.employee_no,
      department_id:    data.department_id || null,
      employment_type:  data.employment_type,
      join_date:        data.join_date || null,
      qualification:    data.qualification || null,
      specialization:   data.specialization || null,
      status:           data.status,
    })
    .select('id')
    .single()

  if (error || !result) return null
  return { id: (result as unknown as { id: string }).id }
}

export async function updateTeacher(id: string, data: Partial<TeacherFormData>): Promise<boolean> {
  const { error } = await db
    .from('teachers')
    .update({
      ...(data.employee_no   !== undefined && { employee_no:     data.employee_no }),
      ...(data.department_id !== undefined && { department_id:   data.department_id || null }),
      ...(data.employment_type !== undefined && { employment_type: data.employment_type }),
      ...(data.join_date     !== undefined && { join_date:       data.join_date || null }),
      ...(data.qualification !== undefined && { qualification:   data.qualification || null }),
      ...(data.specialization !== undefined && { specialization: data.specialization || null }),
      ...(data.status        !== undefined && { status:          data.status }),
    })
    .eq('id', id)

  return !error
}

export async function getStaffMembers(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('id, profile_id, employee_no, status, profile:profiles(full_name, phone), role:roles(name)')
    .order('employee_no')
  if (error || !data) return []

  type Raw = { id: string; profile_id: string; employee_no: string; status: string; profile: { full_name: string; phone: string | null } | null; role: { name: string } | null }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id,
    profile_id: r.profile_id,
    full_name: r.profile?.full_name ?? '—',
    email: null,
    phone: r.profile?.phone ?? null,
    employee_no: r.employee_no,
    role_name: r.role?.name ?? '—',
    status: r.status as StaffMember['status'],
  }))
}
