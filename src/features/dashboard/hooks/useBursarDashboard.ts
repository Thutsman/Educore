import { useQuery } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  getBursarStats,
  getMonthlyFinancials,
  getOutstandingByClass,
  getPaymentMethodBreakdown,
} from '@/services/dashboard'

export function useBursarStats() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['dashboard', 'bursar-stats', schoolId],
    queryFn:  () => getBursarStats(schoolId),
    enabled:  !!schoolId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useMonthlyFinancials() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['monthly-financials', schoolId],
    queryFn:  () => getMonthlyFinancials(schoolId),
    enabled:  !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useOutstandingByClass() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['dashboard', 'outstanding-by-class', schoolId],
    queryFn:  () => getOutstandingByClass(schoolId),
    enabled:  !!schoolId,
    staleTime: 1000 * 60 * 5,
  })
}

export function usePaymentMethodBreakdown() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['dashboard', 'payment-methods', schoolId],
    queryFn:  () => getPaymentMethodBreakdown(schoolId),
    enabled:  !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}
