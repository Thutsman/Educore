import { useQuery } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  getSchoolStats,
  getEnrollmentTrend,
  getClassPerformance,
} from '@/services/dashboard'

export const dashboardKeys = {
  schoolStats:       (schoolId: string) => ['dashboard', 'school-stats', schoolId]      as const,
  enrollmentTrend:   (schoolId: string) => ['dashboard', 'enrollment-trend', schoolId]  as const,
  classPerformance:  (schoolId: string) => ['dashboard', 'class-performance', schoolId] as const,
}

export function useSchoolStats() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.schoolStats(schoolId),
    queryFn:  () => getSchoolStats(schoolId),
    enabled:  !!schoolId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useEnrollmentTrend(months = 12) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: [...dashboardKeys.enrollmentTrend(schoolId), months],
    queryFn:  () => getEnrollmentTrend(schoolId, months),
    enabled:  !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useClassPerformance() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.classPerformance(schoolId),
    queryFn:  () => getClassPerformance(schoolId),
    enabled:  !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}
