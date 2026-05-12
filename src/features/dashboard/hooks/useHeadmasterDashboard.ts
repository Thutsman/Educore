import { useQuery } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  getSchoolStats,
  getEnrollmentTrend,
  getClassPerformance,
  getHeadmasterAttendanceOverview,
  getHeadmasterAttendanceWeekly,
  getSchemeBookApprovalStats,
  getHeadmasterAttendanceMonthly,
  getInvoiceFeeBreakdown,
  getCumulativeEnrollmentTrend,
  getClassPassRatesForSchool,
  getWorkforceStatusBreakdown,
  getWorkforcePresenceSummary,
  getHeadmasterKpiComparison,
  getSubjectPerformance,
  getHeadmasterAlerts,
} from '@/services/dashboard'

export const dashboardKeys = {
  schoolStats:       (schoolId: string) => ['dashboard', 'school-stats', schoolId] as const,
  enrollmentTrend:   (schoolId: string) => ['dashboard', 'enrollment-trend', schoolId] as const,
  classPerformance:  (schoolId: string) => ['dashboard', 'class-performance', schoolId] as const,
  headmasterAttendance:       (schoolId: string) => ['dashboard', 'headmaster-attendance', schoolId] as const,
  headmasterAttendanceWeeks:(schoolId: string, weeks: number) =>
    ['dashboard', 'headmaster-attendance-weeks', schoolId, weeks] as const,
  schemeBookApprovals:       (schoolId: string) => ['dashboard', 'scheme-book-approvals', schoolId] as const,
  headmasterAttendanceMonths: (schoolId: string, months: number) =>
    ['dashboard', 'headmaster-attendance-months', schoolId, months] as const,
  headmasterFeeBreakdown: (schoolId: string) =>
    ['dashboard', 'headmaster-fee-breakdown', schoolId] as const,
  headmasterEnrollmentCumulative: (schoolId: string, years: number) =>
    ['dashboard', 'headmaster-enrollment-cumulative', schoolId, years] as const,
  headmasterClassPassRates: (schoolId: string) =>
    ['dashboard', 'headmaster-class-pass-rates', schoolId] as const,
  headmasterWorkforceSlices: (schoolId: string) =>
    ['dashboard', 'headmaster-workforce-slices', schoolId] as const,
  headmasterWorkforcePresence: (schoolId: string) =>
    ['dashboard', 'headmaster-workforce-presence', schoolId] as const,
  headmasterKpis: (schoolId: string) => ['dashboard', 'headmaster-kpis', schoolId] as const,
  headmasterSubjectPerf: (schoolId: string) =>
    ['dashboard', 'headmaster-subject-perf', schoolId] as const,
  headmasterAlerts: (schoolId: string, termStart?: string) =>
    ['dashboard', 'headmaster-alerts', schoolId, termStart ?? ''] as const,
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

export function useHeadmasterAttendanceMonthly(months = 6) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.headmasterAttendanceMonths(schoolId, months),
    queryFn: () => getHeadmasterAttendanceMonthly(schoolId, months),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useHeadmasterInvoiceFeeBreakdown() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.headmasterFeeBreakdown(schoolId),
    queryFn: () => getInvoiceFeeBreakdown(schoolId),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useHeadmasterCumulativeEnrollment(years = 5) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.headmasterEnrollmentCumulative(schoolId, years),
    queryFn: () => getCumulativeEnrollmentTrend(schoolId, years),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useHeadmasterClassPassRates() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.headmasterClassPassRates(schoolId),
    queryFn: () => getClassPassRatesForSchool(schoolId),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useHeadmasterWorkforceSlices() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.headmasterWorkforceSlices(schoolId),
    queryFn: () => getWorkforceStatusBreakdown(schoolId),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useHeadmasterWorkforcePresence() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.headmasterWorkforcePresence(schoolId),
    queryFn: () => getWorkforcePresenceSummary(schoolId),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useHeadmasterKpiComparison() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.headmasterKpis(schoolId),
    queryFn: () => getHeadmasterKpiComparison(schoolId),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useHeadmasterSubjectPerformance() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.headmasterSubjectPerf(schoolId),
    queryFn: () => getSubjectPerformance(schoolId),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useHeadmasterDashboardAlerts(termStart?: string | null) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: dashboardKeys.headmasterAlerts(schoolId, termStart ?? undefined),
    queryFn: () =>
      getHeadmasterAlerts(schoolId, termStart ?? undefined),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5,
  })
}
