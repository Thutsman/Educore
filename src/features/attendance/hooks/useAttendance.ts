import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAttendanceForDate, batchUpsertAttendance,
  getClassAttendanceSummary, getClassesForAttendance, getStudentsForClass,
} from '../services/attendance'
import type { AttendanceStatus } from '../types'
import { useSchool } from '@/context/SchoolContext'

const KEY = {
  classes:  (schoolId: string) => ['attendance', 'classes', schoolId] as const,
  students: (classId: string) => ['attendance', 'students', classId] as const,
  daily:    (classId: string, date: string) => ['attendance', 'daily', classId, date] as const,
  summary:  (classId: string, start: string, end: string) => ['attendance', 'summary', classId, start, end] as const,
}

export function useAttendanceClasses() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.classes(schoolId),
    queryFn: () => getClassesForAttendance(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useStudentsForClass(classId: string | null) {
  return useQuery({
    queryKey: KEY.students(classId ?? ''),
    queryFn: () => getStudentsForClass(classId!),
    enabled: !!classId,
  })
}

export function useAttendanceForDate(classId: string | null, date: string) {
  return useQuery({
    queryKey: KEY.daily(classId ?? '', date),
    queryFn: () => getAttendanceForDate(classId!, date),
    enabled: !!classId && !!date,
  })
}

export function useClassAttendanceSummary(classId: string | null, startDate: string, endDate: string) {
  return useQuery({
    queryKey: KEY.summary(classId ?? '', startDate, endDate),
    queryFn: () => getClassAttendanceSummary(classId!, startDate, endDate),
    enabled: !!classId && !!startDate && !!endDate,
  })
}

export function useBatchSaveAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (records: Array<{ studentId: string; classId: string; date: string; status: AttendanceStatus; remarks?: string }>) =>
      batchUpsertAttendance(records),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  })
}
