import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/** Ordered redirect targets for password recovery; each must be allowlisted in Supabase Auth (or omit for Site URL). */
export function getPasswordResetRedirectToAttempts(): (string | undefined)[] {
  const envBase = (import.meta.env.VITE_APP_URL as string | undefined)?.trim().replace(/\/$/, '')
  const fromEnv = envBase ? `${envBase}/reset-password` : undefined
  const fromWindow = `${window.location.origin}/reset-password`
  const out: (string | undefined)[] = []
  if (fromEnv && fromEnv !== fromWindow) out.push(fromEnv)
  out.push(fromWindow)
  out.push(undefined)
  return out
}
