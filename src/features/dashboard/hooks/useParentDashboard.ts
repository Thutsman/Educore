import { useQuery } from '@tanstack/react-query'
import {
  getGuardianByProfile,
  getChildren,
  getChildrenAttendance,
  getChildrenFeeStatus,
  getOutstandingInvoices,
  getRecentGrades,
} from '@/services/parent-dashboard'

export function useGuardianRecord(profileId: string | undefined) {
  return useQuery({
    queryKey:  ['parent-dash', 'guardian', profileId],
    queryFn:   () => getGuardianByProfile(profileId!),
    enabled:   !!profileId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useChildren(guardianId: string | undefined) {
  return useQuery({
    queryKey:  ['parent-dash', 'children', guardianId],
    queryFn:   () => getChildren(guardianId!),
    enabled:   !!guardianId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useChildrenAttendance(studentIds: string[], days = 30) {
  return useQuery({
    queryKey:       ['parent-dash', 'attendance', studentIds, days],
    queryFn:        () => getChildrenAttendance(studentIds, days),
    enabled:        studentIds.length > 0,
    staleTime:      5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useChildrenFeeStatus(studentIds: string[]) {
  return useQuery({
    queryKey:  ['parent-dash', 'fee-status', studentIds],
    queryFn:   () => getChildrenFeeStatus(studentIds),
    enabled:   studentIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

export function useOutstandingInvoices(studentIds: string[]) {
  return useQuery({
    queryKey:  ['parent-dash', 'invoices', studentIds],
    queryFn:   () => getOutstandingInvoices(studentIds),
    enabled:   studentIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRecentGrades(studentIds: string[]) {
  return useQuery({
    queryKey:  ['parent-dash', 'grades', studentIds],
    queryFn:   () => getRecentGrades(studentIds),
    enabled:   studentIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}
