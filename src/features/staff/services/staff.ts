import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Teacher, StaffMember, TeacherFormData, ProfileOption, DepartmentOption, CreateUserAccountData, TeacherSelectOption, TeacherAllocation, SubjectOption, ClassOption } from '../types'

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

export async function getTeachers(schoolId: string): Promise<Teacher[]> {
  const [teachersRes, classesRes] = await Promise.all([
    supabase
      .from('teachers')
      .select(`
        id, profile_id, employee_no, status, qualification, specialization,
        employment_type, join_date, department_id,
        profile:profiles(full_name, phone),
        department:departments!teachers_department_id_fkey(name)
      `)
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('employee_no'),
    supabase
      .from('classes')
      .select('class_teacher_id, name')
      .eq('school_id', schoolId)
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

/** Profiles not yet linked to any active teacher record in this school — for the Add Teacher dropdown. */
export async function getProfilesForTeacher(schoolId: string): Promise<ProfileOption[]> {
  // Step 1: get all user_ids with any role in this school
  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('school_id', schoolId)

  if (!roleRows || roleRows.length === 0) return []

  const userIds = [...new Set((roleRows as { user_id: string }[]).map(r => r.user_id))]

  // Step 2: fetch profiles for those users + already-linked teachers in parallel
  const [profilesRes, linkedRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)
      .order('full_name'),
    supabase
      .from('teachers')
      .select('profile_id')
      .eq('school_id', schoolId)
      .is('deleted_at', null),
  ])

  if (!profilesRes.data) return []

  const linked = new Set(
    ((linkedRes.data ?? []) as { profile_id: string }[]).map(r => r.profile_id)
  )

  type RawProfile = { id: string; full_name: string }
  return (profilesRes.data as unknown as RawProfile[])
    .filter(p => !linked.has(p.id))
    .map(p => ({ id: p.id, full_name: p.full_name, email: null }))
}

/** Returns the next available TCH-NNN employee number for this school. */
export async function getNextTeacherEmployeeNo(schoolId: string): Promise<string> {
  const { data } = await supabase.from('teachers').select('employee_no').eq('school_id', schoolId)
  const nums = ((data ?? []) as { employee_no: string }[])
    .map(r => /^TCH-(\d+)$/i.exec(r.employee_no)?.[1])
    .filter((n): n is string => !!n)
    .map(n => parseInt(n, 10))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `TCH-${String(next).padStart(3, '0')}`
}

/** Returns true if the given employee number is already used by another active teacher in the same school. */
export async function isEmployeeNoTaken(employeeNo: string, schoolId: string, excludeId?: string): Promise<boolean> {
  const { data } = await supabase
    .from('teachers')
    .select('id')
    .eq('employee_no', employeeNo)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
  if (!data || data.length === 0) return false
  if (excludeId) return (data as { id: string }[]).some(r => r.id !== excludeId)
  return true
}

/** All departments for the department dropdown. */
export async function getDepartmentsForSelect(schoolId: string): Promise<DepartmentOption[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('name')
  if (error || !data) return []
  return (data as unknown as DepartmentOption[])
}

export async function getTeachersForSelect(schoolId: string): Promise<TeacherSelectOption[]> {
  const [teachersRes, classesRes] = await Promise.all([
    supabase
      .from('teachers')
      .select('id, profile:profiles(full_name)')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('employee_no'),
    supabase
      .from('classes')
      .select('class_teacher_id, name')
      .eq('school_id', schoolId)
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

/** Fetch role names assigned to a user (from user_roles + roles). */
export async function getRolesForUser(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId)
  if (error || !data) return []
  return (data as unknown as { roles: { name: string } | null }[])
    .map(r => r.roles?.name)
    .filter((name): name is string => !!name)
}

/** Replace all roles for a user (within a school) with the given role names. */
export async function setUserRoles(userId: string, roleNames: string[], schoolId: string): Promise<boolean> {
  const { data: roleRows } = await supabase
    .from('roles')
    .select('id, name')
    .in('name', roleNames.length ? roleNames : [])
  const roleIds = (roleRows as { id: string; name: string }[] | null) ?? []
  const roleIdByName = new Map(roleIds.map(r => [r.name, r.id]))

  const { error: delError } = await db.from('user_roles').delete().eq('user_id', userId).eq('school_id', schoolId)
  if (delError) return false

  if (roleNames.length === 0) return true
  const toInsert = roleNames
    .map(name => roleIdByName.get(name))
    .filter((id): id is string => !!id)
  if (toInsert.length === 0) return true
  const { error: insError } = await db
    .from('user_roles')
    .insert(toInsert.map(role_id => ({ user_id: userId, role_id, school_id: schoolId })))
  return !insError
}

export async function createUserAccount(data: CreateUserAccountData, schoolId: string): Promise<{ id: string } | null> {
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

  if (data.roles.length === 0) return null
  const { data: roleRows } = await supabase
    .from('roles')
    .select('id, name')
    .in('name', data.roles)
  const roleIds = (roleRows as { id: string; name: string }[] | null) ?? []
  const roleIdByName = new Map(roleIds.map(r => [r.name, r.id]))
  for (const roleName of data.roles) {
    const roleId = roleIdByName.get(roleName)
    if (!roleId) continue
    const { error: roleError } = await db
      .from('user_roles')
      .insert({ user_id: userId, role_id: roleId, school_id: schoolId })
    if (roleError) return null
  }

  // Always sync full_name (and phone if provided) — the auth trigger may not pick up metadata immediately
  await db.from('profiles').update({
    full_name: data.full_name,
    ...(data.phone ? { phone: data.phone } : {}),
  }).eq('id', userId)

  return { id: userId }
}

export async function createTeacher(schoolId: string, data: TeacherFormData): Promise<{ id: string } | null> {
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
      school_id:        schoolId,
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

export async function getCurrentAcademicYear(): Promise<{ id: string; label: string } | null> {
  const { data } = await supabase
    .from('academic_years')
    .select('id, label')
    .eq('is_current', true)
    .maybeSingle()
  return (data as { id: string; label: string } | null) ?? null
}

export async function getSubjectsForSelect(schoolId: string): Promise<SubjectOption[]> {
  const { data } = await supabase
    .from('subjects')
    .select('id, name, code')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('name')
  if (!data) return []
  return data as unknown as SubjectOption[]
}

export async function getClassesForSelect(schoolId: string): Promise<ClassOption[]> {
  const { data } = await supabase
    .from('classes')
    .select('id, name, grade_level')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('name')
  if (!data) return []
  return data as unknown as ClassOption[]
}

export async function getTeacherAllocations(teacherId: string): Promise<TeacherAllocation[]> {
  const { data, error } = await supabase
    .from('teacher_subjects')
    .select(`
      id, teacher_id, subject_id, class_id, academic_year_id,
      subject:subjects(name),
      class:classes(name, grade_level),
      academic_year:academic_years(label)
    `)
    .eq('teacher_id', teacherId)
    .order('created_at')
  if (error || !data) return []

  type Raw = {
    id: string; teacher_id: string; subject_id: string; class_id: string; academic_year_id: string
    subject: { name: string } | null
    class: { name: string; grade_level: number } | null
    academic_year: { label: string } | null
  }
  return (data as unknown as Raw[]).map(r => ({
    id:                   r.id,
    teacher_id:           r.teacher_id,
    subject_id:           r.subject_id,
    subject_name:         r.subject?.name ?? '—',
    class_id:             r.class_id,
    class_name:           r.class?.name ?? '—',
    grade_level:          r.class?.grade_level ?? 0,
    academic_year_id:     r.academic_year_id,
    academic_year_label:  r.academic_year?.label ?? '—',
  }))
}

export async function addTeacherAllocation(
  teacherId: string,
  subjectId: string,
  classId: string
): Promise<boolean> {
  const year = await getCurrentAcademicYear()
  if (!year) return false

  const { error } = await db
    .from('teacher_subjects')
    .insert({ teacher_id: teacherId, subject_id: subjectId, class_id: classId, academic_year_id: year.id })
  return !error
}

export async function removeTeacherAllocation(allocationId: string): Promise<boolean> {
  const { error } = await db.from('teacher_subjects').delete().eq('id', allocationId)
  return !error
}

export async function getStaffMembers(schoolId: string): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('id, profile_id, employee_no, status, profile:profiles(full_name, phone), role:roles(name)')
    .eq('school_id', schoolId)
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
