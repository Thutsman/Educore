import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import { corsHeaders } from '../_shared/cors.ts'

const ALLOWED_ROLES = new Set([
  'super_admin',
  'headmaster',
  'deputy_headmaster',
  'school_admin',
])

type RoleRow = { school_id: string | null; roles: { name: string } | { name: string }[] }

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function callerMayResetParent(rolesData: RoleRow[] | null, schoolId: string): boolean {
  if (!rolesData?.length) return false
  for (const row of rolesData) {
    const r = row.roles
    const name = Array.isArray(r) ? r[0]?.name : r?.name
    if (!name) continue
    if (!ALLOWED_ROLES.has(name)) continue
    if (name === 'super_admin') return true
    if (row.school_id === schoolId) return true
  }
  return false
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(500, { error: 'Server configuration error' })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json(401, { error: 'Missing Authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Use admin client to verify the caller's JWT — more reliable than anon-key client
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return json(401, { error: 'Unauthorized' })
    }

    let body: { guardian_id?: string; school_id?: string; new_password?: string }
    try {
      body = await req.json()
    } catch {
      return json(400, { error: 'Invalid JSON body' })
    }

    const guardianId = body.guardian_id
    const schoolId = body.school_id
    const newPassword = body.new_password

    if (!guardianId || !schoolId || !newPassword) {
      return json(400, { error: 'guardian_id, school_id, and new_password are required' })
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return json(400, { error: 'Password must be at least 8 characters' })
    }

    const { data: roleRows, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('school_id, roles!inner(name)')
      .eq('user_id', user.id)

    if (rolesError) {
      return json(500, { error: 'Could not verify permissions' })
    }

    if (!callerMayResetParent(roleRows as RoleRow[] | null, schoolId)) {
      return json(403, { error: 'You do not have permission to reset this parent password' })
    }

    const { data: guardian, error: guardianError } = await supabaseAdmin
      .from('guardians')
      .select('id, profile_id')
      .eq('id', guardianId)
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .maybeSingle()

    if (guardianError || !guardian) {
      return json(404, { error: 'Guardian not found' })
    }

    const profileId = (guardian as { profile_id: string | null }).profile_id
    if (!profileId) {
      return json(400, { error: 'This guardian does not have a portal account yet' })
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profileId, {
      password: newPassword,
    })

    if (updateError) {
      return json(400, { error: updateError.message })
    }

    return json(200, { success: true })
  } catch {
    return json(500, { error: 'Internal server error' })
  }
})
