import { useQuery } from '@tanstack/react-query'
import {
  getTeacherByProfile,
  getHomeroomClass,
  getTeacherSubjects,
  getTodayAttendance,
  getClassAttendanceTrend,
  getTeacherRecentExams,
} from '@/services/teacher-dashboard'

export const teacherDashboardKeys = {
  teacher:         (profileId: string) => ['teacher-dash', 'record',     profileId] as const,
  homeroom:        (teacherId: string) => ['teacher-dash', 'homeroom',   teacherId] as const,
  subjects:        (teacherId: string) => ['teacher-dash', 'subjects',   teacherId] as const,
  todayAttendance: (classId: string)   => ['teacher-dash', 'today-att',  classId]   as const,
  attendanceTrend: (classId: string)   => ['teacher-dash', 'att-trend',  classId]   as const,
  recentExams:     (classIds: string[]) => ['teacher-dash', 'exams',     ...classIds] as const,
}

/** Step 1 — get the teacher row for the current user's profile. */
export function useTeacherRecord(profileId: string | undefined) {
  return useQuery({
    queryKey: teacherDashboardKeys.teacher(profileId ?? ''),
    queryFn:  () => getTeacherByProfile(profileId!),
    enabled:  !!profileId,
    staleTime: 5 * 60 * 1000,
  })
}

/** Step 2a — homeroom class (requires teacherId). */
export function useHomeroomClass(teacherId: string | undefined) {
  return useQuery({
    queryKey: teacherDashboardKeys.homeroom(teacherId ?? ''),
    queryFn:  () => getHomeroomClass(teacherId!),
    enabled:  !!teacherId,
    staleTime: 5 * 60 * 1000,
  })
}

/** Step 2b — subjects/classes this teacher teaches (requires teacherId). */
export function useTeacherSubjects(teacherId: string | undefined) {
  return useQuery({
    queryKey: teacherDashboardKeys.subjects(teacherId ?? ''),
    queryFn:  () => getTeacherSubjects(teacherId!),
    enabled:  !!teacherId,
    staleTime: 5 * 60 * 1000,
  })
}

/** Today's attendance for the homeroom class (requires classId). */
export function useTodayAttendance(classId: string | undefined) {
  return useQuery({
    queryKey: teacherDashboardKeys.todayAttendance(classId ?? ''),
    queryFn:  () => getTodayAttendance(classId!),
    enabled:  !!classId,
    staleTime: 60 * 1000,            // refresh every minute — live data
    refetchInterval: 60 * 1000,
  })
}

/** 30-day attendance trend for the homeroom class. */
export function useClassAttendanceTrend(classId: string | undefined, days = 30) {
  return useQuery({
    queryKey: teacherDashboardKeys.attendanceTrend(classId ?? ''),
    queryFn:  () => getClassAttendanceTrend(classId!, days),
    enabled:  !!classId,
    staleTime: 10 * 60 * 1000,
  })
}

/** Recent exams for any of this teacher's classes. */
export function useTeacherRecentExams(classIds: string[]) {
  return useQuery({
    queryKey: teacherDashboardKeys.recentExams(classIds),
    queryFn:  () => getTeacherRecentExams(classIds),
    enabled:  classIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}
