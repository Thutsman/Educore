import { useQuery } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  getAttendanceTrend,
  getSubjectPerformance,
  getTeacherPerformance,
  getClassPerformance,
} from '@/services/dashboard'

export function useAttendanceTrend(days = 30) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['dashboard', 'attendance-trend', schoolId, days],
    queryFn:  () => getAttendanceTrend(schoolId, days),
    enabled:  !!schoolId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSubjectPerformance() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['dashboard', 'subject-performance', schoolId],
    queryFn:  () => getSubjectPerformance(schoolId),
    enabled:  !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useTeacherPerformance() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['dashboard', 'teacher-performance', schoolId],
    queryFn:  () => getTeacherPerformance(schoolId),
    enabled:  !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useDeputyClassPerformance() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['dashboard', 'class-performance', schoolId],
    queryFn:  () => getClassPerformance(schoolId),
    enabled:  !!schoolId,
    staleTime: 1000 * 60 * 10,
  })
}
