import { useQuery } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  getTeacherByProfile,
  getHomeroomClass,
  getTeacherSubjects,
  getTodayAttendance,
  getClassAttendanceTrend,
  getTeacherRecentExams,
} from '@/services/teacher-dashboard'

export const teacherDashboardKeys = {
  teacher:         (schoolId: string, profileId: string) => ['teacher-dash', 'record',     schoolId, profileId] as const,
  homeroom:        (schoolId: string, teacherId: string) => ['teacher-dash', 'homeroom',   schoolId, teacherId] as const,
  subjects:        (schoolId: string, teacherId: string) => ['teacher-dash', 'subjects',   schoolId, teacherId] as const,
  todayAttendance: (schoolId: string, classId: string)   => ['teacher-dash', 'today-att',  schoolId, classId]   as const,
  attendanceTrend: (schoolId: string, classId: string)   => ['teacher-dash', 'att-trend',  schoolId, classId]   as const,
  recentExams:     (schoolId: string, classIds: string[]) => ['teacher-dash', 'exams',     schoolId, ...classIds] as const,
}

/** Step 1 — get the teacher row for the current user's profile. */
export function useTeacherRecord(profileId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: teacherDashboardKeys.teacher(schoolId, profileId ?? ''),
    queryFn:  () => getTeacherByProfile(schoolId, profileId!),
    enabled:  !!profileId && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

/** Step 2a — homeroom class (requires teacherId). */
export function useHomeroomClass(teacherId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: teacherDashboardKeys.homeroom(schoolId, teacherId ?? ''),
    queryFn:  () => getHomeroomClass(schoolId, teacherId!),
    enabled:  !!teacherId && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

/** Step 2b — subjects/classes this teacher teaches (requires teacherId). */
export function useTeacherSubjects(teacherId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: teacherDashboardKeys.subjects(schoolId, teacherId ?? ''),
    queryFn:  () => getTeacherSubjects(schoolId, teacherId!),
    enabled:  !!teacherId && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

/** Today's attendance for the homeroom class (requires classId). */
export function useTodayAttendance(classId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: teacherDashboardKeys.todayAttendance(schoolId, classId ?? ''),
    queryFn:  () => getTodayAttendance(schoolId, classId!),
    enabled:  !!classId && !!schoolId,
    staleTime: 60 * 1000,            // refresh every minute — live data
    refetchInterval: 60 * 1000,
  })
}

/** 30-day attendance trend for the homeroom class. */
export function useClassAttendanceTrend(classId: string | undefined, days = 30) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: teacherDashboardKeys.attendanceTrend(schoolId, classId ?? ''),
    queryFn:  () => getClassAttendanceTrend(schoolId, classId!, days),
    enabled:  !!classId && !!schoolId,
    staleTime: 10 * 60 * 1000,
  })
}

/** Recent exams for any of this teacher's classes. */
export function useTeacherRecentExams(classIds: string[]) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: teacherDashboardKeys.recentExams(schoolId, classIds),
    queryFn:  () => getTeacherRecentExams(schoolId, classIds),
    enabled:  classIds.length > 0 && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}
