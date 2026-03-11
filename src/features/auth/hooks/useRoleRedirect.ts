import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'
import type { AppRole } from '@/types'

const ROLE_DASHBOARD_MAP: Record<AppRole, string> = {
  super_admin: '/admin',
  school_admin: '/dashboard/admin',
  headmaster: '/dashboard/headmaster',
  deputy_headmaster: '/dashboard/deputy',
  bursar: '/dashboard/bursar',
  hod: '/dashboard/hod',
  class_teacher: '/dashboard/teacher',
  teacher: '/dashboard/teacher',
  non_teaching_staff: '/dashboard/staff',
  parent: '/dashboard/parent',
  student: '/dashboard/student',
}

export function useRoleRedirect() {
  const navigate = useNavigate()

  const redirectToDashboard = useCallback((role: AppRole) => {
    const path = ROLE_DASHBOARD_MAP[role] ?? '/dashboard'
    navigate(path, { replace: true })
  }, [navigate])

  return { redirectToDashboard }
}
