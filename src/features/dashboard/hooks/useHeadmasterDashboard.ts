import { useQuery } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  getSchoolStats,
  getEnrollmentTrend,
  getClassPerformance,
  getHeadmasterAttendanceOverview,
  getHeadmasterAttendanceWeekly,
  getSchemeBookApprovalStats,
} from '@/services/dashboard'

export const dashboardKeys = {
  schoolStats:       (schoolId: string) => ['dashboard', 'school-stats', schoolId] as const,
  enrollmentTrend:   (schoolId: string) => ['dashboard', 'enrollment-trend', schoolId] as const,
  classPerformance:  (schoolId: string) => ['dashboard', 'class-performance', schoolId] as const,
  headmasterAttendance:       (schoolId: string) => ['dashboard', 'headmaster-attendance', schoolId] as const,
  headmasterAttendanceWeeks:(schoolId: string, weeks: number) =>
    ['dashboard', 'headmaster-attendance-weeks', schoolId, weeks] as const,
  schemeBookApprovals:       (schoolId: string) => ['dashboard', 'scheme-book-approvals', schoolId] as const,
}

export function useSchoolStats() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.schoolStats(schoolId),
    queryFn: () => getSchoolStats(schoolId),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useEnrollmentTrend(months = 12) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: [...dashboardKeys.enrollmentTrend(schoolId), months],
    queryFn: () => getEnrollmentTrend(schoolId, months),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useClassPerformance() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.classPerformance(schoolId),
    queryFn: () => getClassPerformance(schoolId),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useHeadmasterAttendanceOverview(lookbackDays = 30) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: [...dashboardKeys.headmasterAttendance(schoolId), lookbackDays],
    queryFn: () => getHeadmasterAttendanceOverview(schoolId, lookbackDays),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useHeadmasterAttendanceWeekly(weeks = 8) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.headmasterAttendanceWeeks(schoolId, weeks),
    queryFn: () => getHeadmasterAttendanceWeekly(schoolId, weeks),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSchemeBookApprovalStats() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.schemeBookApprovals(schoolId),
    queryFn: () => getSchemeBookApprovalStats(schoolId),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5,
  })
}
