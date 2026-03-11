import { useQuery } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  getGuardianByProfile,
  getChildren,
  getChildrenAttendance,
  getChildrenFeeStatus,
  getOutstandingInvoices,
  getRecentGrades,
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

export function useChildren(guardianId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'children', schoolId, guardianId],
    queryFn:   () => getChildren(schoolId, guardianId!),
    enabled:   !!guardianId && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useChildrenAttendance(studentIds: string[], days = 30) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:       ['parent-dash', 'attendance', schoolId, studentIds, days],
    queryFn:        () => getChildrenAttendance(schoolId, studentIds, days),
    enabled:        studentIds.length > 0 && !!schoolId,
    staleTime:      5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useChildrenFeeStatus(studentIds: string[]) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'fee-status', schoolId, studentIds],
    queryFn:   () => getChildrenFeeStatus(schoolId, studentIds),
    enabled:   studentIds.length > 0 && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useOutstandingInvoices(studentIds: string[]) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'invoices', schoolId, studentIds],
    queryFn:   () => getOutstandingInvoices(schoolId, studentIds),
    enabled:   studentIds.length > 0 && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRecentGrades(studentIds: string[]) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey:  ['parent-dash', 'grades', schoolId, studentIds],
    queryFn:   () => getRecentGrades(schoolId, studentIds),
    enabled:   studentIds.length > 0 && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}
