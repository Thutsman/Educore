import { useQuery } from '@tanstack/react-query'
import {
  getAttendanceTrend,
  getSubjectPerformance,
  getTeacherPerformance,
  getClassPerformance,
} from '@/services/dashboard'

export function useAttendanceTrend(days = 30) {
  return useQuery({
    queryKey: ['dashboard', 'attendance-trend', days],
    queryFn:  () => getAttendanceTrend(days),
    staleTime: 1000 * 60 * 5,
  })
}

export function useSubjectPerformance() {
  return useQuery({
    queryKey: ['dashboard', 'subject-performance'],
    queryFn:  getSubjectPerformance,
    staleTime: 1000 * 60 * 10,
  })
}

export function useTeacherPerformance() {
  return useQuery({
    queryKey: ['dashboard', 'teacher-performance'],
    queryFn:  getTeacherPerformance,
    staleTime: 1000 * 60 * 10,
  })
}

export function useDeputyClassPerformance() {
  return useQuery({
    queryKey: ['dashboard', 'class-performance'],
    queryFn:  getClassPerformance,
    staleTime: 1000 * 60 * 10,
  })
}
