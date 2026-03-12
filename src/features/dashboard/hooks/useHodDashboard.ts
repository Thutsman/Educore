import { useQuery } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import { useAuth } from '@/hooks/useAuth'
import { useTeacherRecord } from '@/features/dashboard/hooks/useTeacherDashboard'
import {
  getDepartmentStats,
  getDepartmentSubjectPerformance,
  getDepartmentAttendanceTrend,
  getDepartmentTeacherWorkload,
  getDepartmentClassesOverview,
} from '@/services/hod-dashboard'

export const hodDashboardKeys = {
  teacher:        (schoolId: string, profileId: string)  => ['hod-dash', 'teacher',        schoolId, profileId] as const,
  departmentMeta: (schoolId: string, departmentId: string) => ['hod-dash', 'department',    schoolId, departmentId] as const,
  stats:          (schoolId: string, departmentId: string) => ['hod-dash', 'stats',        schoolId, departmentId] as const,
  subjectPerf:    (schoolId: string, departmentId: string) => ['hod-dash', 'subject-perf', schoolId, departmentId] as const,
  attendance:     (schoolId: string, departmentId: string, days: number) =>
    ['hod-dash', 'attendance', schoolId, departmentId, days] as const,
  teachers:       (schoolId: string, departmentId: string) => ['hod-dash', 'teachers',     schoolId, departmentId] as const,
  classes:        (schoolId: string, departmentId: string, days: number) =>
    ['hod-dash', 'classes', schoolId, departmentId, days] as const,
}

export function useHodTeacher() {
  const { currentSchool } = useSchool()
  const { user } = useAuth()
  const schoolId = currentSchool?.id ?? ''
  const profileId = user?.id ?? ''

  const query = useTeacherRecord(profileId || undefined)

  return {
    teacher: query.data,
    isLoading: query.isLoading,
    schoolId,
    profileId,
  }
}

export function useDepartmentStats(departmentId: string | null | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''

  return useQuery({
    queryKey: hodDashboardKeys.stats(schoolId, departmentId ?? ''),
    queryFn: () => getDepartmentStats(schoolId, departmentId!),
    enabled: !!schoolId && !!departmentId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useDepartmentSubjectPerformance(departmentId: string | null | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''

  return useQuery({
    queryKey: hodDashboardKeys.subjectPerf(schoolId, departmentId ?? ''),
    queryFn: () => getDepartmentSubjectPerformance(schoolId, departmentId!),
    enabled: !!schoolId && !!departmentId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useDepartmentAttendanceTrend(
  departmentId: string | null | undefined,
  days = 30
) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''

  return useQuery({
    queryKey: hodDashboardKeys.attendance(schoolId, departmentId ?? '', days),
    queryFn: () => getDepartmentAttendanceTrend(schoolId, departmentId!, days),
    enabled: !!schoolId && !!departmentId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useDepartmentTeacherWorkload(departmentId: string | null | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''

  return useQuery({
    queryKey: hodDashboardKeys.teachers(schoolId, departmentId ?? ''),
    queryFn: () => getDepartmentTeacherWorkload(schoolId, departmentId!),
    enabled: !!schoolId && !!departmentId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useDepartmentClassesOverview(
  departmentId: string | null | undefined,
  days = 7
) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''

  return useQuery({
    queryKey: hodDashboardKeys.classes(schoolId, departmentId ?? '', days),
    queryFn: () => getDepartmentClassesOverview(schoolId, departmentId!, days),
    enabled: !!schoolId && !!departmentId,
    staleTime: 10 * 60 * 1000,
  })
}

