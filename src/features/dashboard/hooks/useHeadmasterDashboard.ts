import { useQuery } from '@tanstack/react-query'
import {
  getSchoolStats,
  getEnrollmentTrend,
  getClassPerformance,
} from '@/services/dashboard'

export const dashboardKeys = {
  schoolStats:       ['dashboard', 'school-stats']      as const,
  enrollmentTrend:   ['dashboard', 'enrollment-trend']  as const,
  classPerformance:  ['dashboard', 'class-performance'] as const,
}

export function useSchoolStats() {
  return useQuery({
    queryKey: dashboardKeys.schoolStats,
    queryFn:  getSchoolStats,
    staleTime: 1000 * 60 * 5,
  })
}

export function useEnrollmentTrend(months = 12) {
  return useQuery({
    queryKey: [...dashboardKeys.enrollmentTrend, months],
    queryFn:  () => getEnrollmentTrend(months),
    staleTime: 1000 * 60 * 10,
  })
}

export function useClassPerformance() {
  return useQuery({
    queryKey: dashboardKeys.classPerformance,
    queryFn:  getClassPerformance,
    staleTime: 1000 * 60 * 10,
  })
}
