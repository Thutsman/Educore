import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

const db = supabase as any

// Types
export interface SchoolRecord {
  id: string
  name: string
  slug: string | null
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  created_at: string
  headmaster_count: number
}

export interface SchoolFormData {
  name: string
  slug: string
  address: string
  phone: string
  email: string
}

export interface BootstrapHeadmasterData {
  full_name: string
  email: string
  password: string
  phone?: string
}

// Fetch all schools with school_admin count
export async function getAllSchools(): Promise<SchoolRecord[]> {
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, slug, address, phone, email, logo_url, created_at')
    .order('name')
  if (error || !data) return []

  const schools = data as unknown as Omit<SchoolRecord, 'headmaster_count'>[]
  const results: SchoolRecord[] = []
  for (const school of schools) {
    const { count } = await supabase
      .from('user_roles')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', school.id)
      .in(
        'role_id',
        (await supabase.from('roles').select('id').eq('name', 'school_admin')).data?.map((r: any) => r.id) ?? []
      )
    results.push({ ...school, headmaster_count: count ?? 0 })
  }
  return results
}

// Fetch school admins for a specific school
export interface SchoolHeadmaster {
  user_id: string
  full_name: string
  email: string | null
}

export async function getSchoolAdminsForSchool(schoolId: string): Promise<SchoolHeadmaster[]> {
  const { data: roleRow } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'school_admin')
    .maybeSingle()
  if (!roleRow) return []
  const roleId = (roleRow as unknown as { id: string }).id

  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id, profile:profiles(full_name)')
    .eq('school_id', schoolId)
    .eq('role_id', roleId)
  if (error || !data) return []

  type Raw = { user_id: string; profile: { full_name: string } | null }
  return (data as unknown as Raw[]).map(r => ({
    user_id: r.user_id,
    full_name: r.profile?.full_name ?? '—',
    email: null,
  }))
}

export const getHeadmastersForSchool = getSchoolAdminsForSchool

// Create a new school
export async function createSchool(data: SchoolFormData): Promise<{ id: string } | null> {
  const { data: result, error } = await db
    .from('schools')
    .insert({
      name: data.name.trim(),
      slug: data.slug.trim() || null,
      address: data.address.trim() || null,
      phone: data.phone.trim() || null,
      email: data.email.trim() || null,
    })
    .select('id')
    .single()
  if (error || !result) return null
  return { id: (result as unknown as { id: string }).id }
}

// Update a school
export async function updateSchool(id: string, data: Partial<SchoolFormData>): Promise<boolean> {
  const { error } = await db
    .from('schools')
    .update({
      ...(data.name    !== undefined && { name:    data.name.trim() }),
      ...(data.slug    !== undefined && { slug:    data.slug.trim() || null }),
      ...(data.address !== undefined && { address: data.address.trim() || null }),
      ...(data.phone   !== undefined && { phone:   data.phone.trim() || null }),
      ...(data.email   !== undefined && { email:   data.email.trim() || null }),
    })
    .eq('id', id)
  return !error
}

// Bootstrap a school_admin for a school
// Uses a separate ephemeral client (same anon key) to sign up without clobbering the super_admin session
function createEphemeralClient() {
  return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'educore-school-admin-bootstrap',
    },
  })
}

export async function bootstrapSchoolAdmin(
  schoolId: string,
  data: BootstrapHeadmasterData
): Promise<{ success: boolean; error?: string }> {
  const ephemeral = createEphemeralClient()
  const { data: signUpData, error: signUpError } = await ephemeral.auth.signUp({
    email: data.email.trim(),
    password: data.password,
    options: { data: { full_name: data.full_name.trim() } },
  })
  if (signUpError || !signUpData.user) {
    return { success: false, error: signUpError?.message ?? 'Failed to create account' }
  }

  const userId = signUpData.user.id

  // Update profile with phone if provided
  if (data.phone) {
    await db.from('profiles').update({ phone: data.phone.trim(), full_name: data.full_name.trim() }).eq('id', userId)
  }

  // Assign school_admin role scoped to this school
  const { data: roleRow } = await supabase.from('roles').select('id').eq('name', 'school_admin').maybeSingle()
  if (!roleRow) return { success: false, error: 'Migration 023 not applied yet — run it in your Supabase SQL editor first.' }
  const roleId = (roleRow as unknown as { id: string }).id

  const { error: roleError } = await db
    .from('user_roles')
    .insert({ user_id: userId, role_id: roleId, school_id: schoolId })
  if (roleError) return { success: false, error: roleError.message }

  return { success: true }
}

export const bootstrapHeadmaster = bootstrapSchoolAdmin
