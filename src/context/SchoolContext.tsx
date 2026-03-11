import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import { useAuth } from '@/context/AuthContext'
import type { School } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SchoolContextValue {
  schools: School[]
  currentSchool: School | null
  isLoading: boolean
  setCurrentSchool: (school: School) => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const SchoolContext = createContext<SchoolContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const [schools, setSchools] = useState<School[]>([])
  const [currentSchool, setCurrentSchoolState] = useState<School | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSchools([])
      setCurrentSchoolState(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    async function fetchSchools() {
      const { data, error } = await supabase
        .from('user_roles')
        .select('school:schools(id, name, slug, logo_url)')
        .eq('user_id', user!.id)

      if (cancelled) return

      if (error || !data) {
        setIsLoading(false)
        return
      }

      type RawRow = { school: { id: string; name: string; slug: string | null; logo_url: string | null } | null }
      const seen = new Set<string>()
      const list: School[] = []
      for (const row of data as unknown as RawRow[]) {
        if (row.school && !seen.has(row.school.id)) {
          seen.add(row.school.id)
          list.push(row.school)
        }
      }

      setSchools(list)
      if (list.length === 1) {
        setCurrentSchoolState(list[0])
      }
      setIsLoading(false)
    }

    void fetchSchools()
    return () => { cancelled = true }
  }, [isAuthenticated, user])

  const setCurrentSchool = useCallback((school: School) => {
    setCurrentSchoolState(school)
    void queryClient.invalidateQueries()
  }, [])

  return (
    <SchoolContext.Provider value={{ schools, currentSchool, isLoading, setCurrentSchool }}>
      {children}
    </SchoolContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSchool() {
  const ctx = useContext(SchoolContext)
  if (!ctx) throw new Error('useSchool must be used within <SchoolProvider>')
  return ctx
}
