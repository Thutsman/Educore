import { useQuery } from '@tanstack/react-query'
import {
  getBursarStats,
  getMonthlyFinancials,
  getOutstandingByClass,
  getPaymentMethodBreakdown,
} from '@/services/dashboard'

export function useBursarStats() {
  return useQuery({
    queryKey: ['dashboard', 'bursar-stats'],
    queryFn:  getBursarStats,
    staleTime: 1000 * 60 * 5,
  })
}

export function useMonthlyFinancials(months = 12) {
  return useQuery({
    queryKey: ['dashboard', 'monthly-financials', months],
    queryFn:  () => getMonthlyFinancials(months),
    staleTime: 1000 * 60 * 10,
  })
}

export function useOutstandingByClass() {
  return useQuery({
    queryKey: ['dashboard', 'outstanding-by-class'],
    queryFn:  getOutstandingByClass,
    staleTime: 1000 * 60 * 5,
  })
}

export function usePaymentMethodBreakdown() {
  return useQuery({
    queryKey: ['dashboard', 'payment-methods'],
    queryFn:  getPaymentMethodBreakdown,
    staleTime: 1000 * 60 * 10,
  })
}
