import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { AppRole, UserProfile } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  role: AppRole | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>
  signOut: () => Promise<void>
  hasRole: (...roles: AppRole[]) => boolean
  isAdmin: () => boolean
  updatePassword: (newPassword: string) => Promise<void>
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Profile fetcher (module-level, no re-creation) ────────────────────────────

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError || !profileData) return null

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  const raw = profileData as unknown as {
    id: string
    full_name: string
    avatar_url: string | null
    phone: string | null
    status: UserProfile['status']
  }

  const roleName = (roleData as { roles?: { name?: string } | null } | null)?.roles?.name as AppRole | undefined

  return {
    id: raw.id,
    full_name: raw.full_name,
    avatar_url: raw.avatar_url,
    phone: raw.phone,
    status: raw.status,
    role: roleName ?? 'student',
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const hydrateAuthState = async (session: Session) => {
      const profile = await fetchProfile(session.user.id)
      setState({
        user: session.user,
        profile,
        session,
        role: profile?.role ?? null,
        isLoading: false,
        isAuthenticated: true,
      })
    }

    // Subscribe to auth changes.
    // In Supabase v2, INITIAL_SESSION fires synchronously on subscription
    // with the current session (if any), replacing the need for a separate
    // getSession() call and eliminating the race window.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            // Only show the loading spinner if we are NOT already authenticated.
            // React Strict Mode double-invokes effects (mount → cleanup → remount),
            // which fires INITIAL_SESSION a second time while the user is already on
            // the dashboard. Without this guard, the loading state would reset to
            // true mid-session, causing ProtectedRoute to flash a full-screen spinner.
            // Supabase can also re-fire SIGNED_IN on token validation — same guard.
            setState(prev =>
              prev.isAuthenticated
                ? prev                                    // already auth'd — don't flash loading
                : { ...prev, isLoading: true }            // initial load — show spinner
            )
            // Avoid awaiting Supabase DB calls directly inside onAuthStateChange.
            // Doing so can deadlock auth flows like signInWithPassword.
            void hydrateAuthState(session)
          } else {
            // INITIAL_SESSION with no session — user is not logged in
            setState(prev => ({ ...prev, isLoading: false }))
          }
        } else if (event === 'PASSWORD_RECOVERY') {
          // Arrived via password-reset link — store session but don't mark
          // as fully authenticated (prevents dashboard redirect).
          setState(prev => ({ ...prev, user: session?.user ?? null, session, isLoading: false }))
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Silently update the session reference without resetting loading
          setState(prev => ({ ...prev, user: session.user, session }))
        } else if ((event as string) === 'TOKEN_REFRESH_FAILED') {
          // Session is no longer valid (e.g. missing/invalid refresh token).
          // Clear auth state so ProtectedRoute redirects back to /login.
          setState({
            user: null,
            profile: null,
            session: null,
            role: null,
            isLoading: false,
            isAuthenticated: false,
          })
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            session: null,
            role: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Auth actions ─────────────────────────────────────────────────────────────

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const hasRole = useCallback((...roles: AppRole[]): boolean => {
    return state.role !== null && roles.includes(state.role)
  }, [state.role])

  const isAdmin = useCallback((): boolean => {
    return hasRole('headmaster', 'deputy_headmaster')
  }, [hasRole])

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, hasRole, isAdmin, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
