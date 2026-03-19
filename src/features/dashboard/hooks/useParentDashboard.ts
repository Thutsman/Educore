import { useQuery } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  getChildAssignmentStatus,
  getChildAttendanceBreakdown,
  getChildAttendanceRate,
  getChildRecentResults,
  getChildSubjectPerformance,
  getCurrentTermId,
  getGuardianChildren,
  getGuardianByProfile,
  getGuardianInvoices,
  getGuardianOutstandingBalance,
} from '@/services/parent-dashboard'

export function useGuardianRecord(profileId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'guardian', schoolId, profileId],
    queryFn:   () => getGuardianByProfile(schoolId, profileId!),
    enabled:   !!profileId && !!schoolId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useGuardianChildren(profileId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'children', schoolId, profileId],
    queryFn:   () => getGuardianChildren(schoolId, profileId!),
    enabled:   !!profileId && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCurrentTermId() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'current-term', schoolId],
    queryFn:   () => getCurrentTermId(schoolId),
    enabled:   !!schoolId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useChildSubjectPerformance(studentId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'subject-performance', schoolId, studentId],
    queryFn:   () => getChildSubjectPerformance(schoolId, studentId!),
    enabled:   !!studentId && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useChildRecentResults(studentId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'recent-results', schoolId, studentId],
    queryFn:   () => getChildRecentResults(schoolId, studentId!),
    enabled:   !!studentId && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useChildAssignmentStatus(studentId: string | undefined, classId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'assignments', schoolId, studentId, classId],
    queryFn:   () => getChildAssignmentStatus(schoolId, studentId!, classId!),
    enabled:   !!schoolId && !!studentId && !!classId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useChildAttendanceRate(studentId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'attendance-rate', schoolId, studentId],
    queryFn:   () => getChildAttendanceRate(schoolId, studentId!),
    enabled:   !!schoolId && !!studentId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useChildAttendanceBreakdown(studentId: string | undefined, termId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'attendance-breakdown', schoolId, studentId, termId],
    queryFn:   () => getChildAttendanceBreakdown(schoolId, studentId!, termId),
    enabled:   !!schoolId && !!studentId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGuardianOutstandingBalance(guardianId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'balance', schoolId, guardianId],
    queryFn:   () => getGuardianOutstandingBalance(schoolId, guardianId!),
    enabled:   !!schoolId && !!guardianId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGuardianInvoices(guardianId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'invoices', schoolId, guardianId],
    queryFn:   () => getGuardianInvoices(schoolId, guardianId!),
    enabled:   !!schoolId && !!guardianId,
    staleTime: 5 * 60 * 1000,
  })
}
