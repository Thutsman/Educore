import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTeachers, getStaffMembers,
  getProfilesForTeacher, getDepartmentsForSelect,
  getTeachersForSelect, getNextTeacherEmployeeNo,
  getCurrentAcademicYear,
  getSubjectsForSelect, getClassesForSelect,
  getTeacherAllocations, addTeacherAllocation, addAllSubjectAllocations, removeTeacherAllocation,
  createUserAccount,
  createTeacher, updateTeacher,
  getRolesForUser,
  setUserRoles,
  setHomeroomClass,
  clearHomeroomForTeacher,
} from '../services/staff'
import type { CreateUserAccountData, TeacherFormData, TeacherSelectOption } from '../types'
import { useSchool } from '@/context/SchoolContext'

export type { TeacherSelectOption }

export function useTeachers() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['staff', 'teachers', schoolId],
    queryFn: () => getTeachers(schoolId),
    enabled: !!schoolId,
  })
}

export function useTeachersForSelect(enabled = true) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['staff', 'teachers-select', schoolId],
    queryFn: () => getTeachersForSelect(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useStaffMembers() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['staff', 'members', schoolId],
    queryFn: () => getStaffMembers(schoolId),
    enabled: !!schoolId,
  })
}

export function useProfilesForTeacher() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['staff', 'profiles-unlinked', schoolId],
    queryFn: () => getProfilesForTeacher(schoolId),
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  })
}

export function useDepartmentsForSelect() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['staff', 'departments', schoolId],
    queryFn: () => getDepartmentsForSelect(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useNextTeacherEmployeeNo(enabled = true) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['staff', 'next-employee-no', schoolId],
    queryFn: () => getNextTeacherEmployeeNo(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: 30 * 1000,
  })
}

export function useCurrentAcademicYear() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['staff', 'current-academic-year', schoolId],
    queryFn: () => getCurrentAcademicYear(schoolId),
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useSubjectsForSelect() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['staff', 'subjects-select', schoolId],
    queryFn: () => getSubjectsForSelect(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useClassesForSelect() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['staff', 'classes-select', schoolId],
    queryFn: () => getClassesForSelect(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useTeacherAllocations(teacherId: string | undefined) {
  return useQuery({
    queryKey: ['staff', 'teacher-allocations', teacherId],
    queryFn: () => getTeacherAllocations(teacherId!),
    enabled: !!teacherId,
  })
}

export function useAddTeacherAllocation() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: ({ teacherId, subjectId, classId }: { teacherId: string; subjectId: string; classId: string }) =>
      addTeacherAllocation(teacherId, subjectId, classId, schoolId),
    onSuccess: (_, { teacherId }) => {
      qc.invalidateQueries({ queryKey: ['staff', 'teacher-allocations', teacherId] })
      qc.invalidateQueries({ queryKey: ['staff', 'teachers'] })
    },
  })
}

export function useAddAllSubjectAllocations() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: ({ teacherId, classId, subjectIds }: { teacherId: string; classId: string; subjectIds: string[] }) =>
      addAllSubjectAllocations(teacherId, classId, subjectIds, schoolId),
    onSuccess: (_, { teacherId }) => {
      qc.invalidateQueries({ queryKey: ['staff', 'teacher-allocations', teacherId] })
      qc.invalidateQueries({ queryKey: ['staff', 'teachers'] })
    },
  })
}

export function useRemoveTeacherAllocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ allocationId, teacherId: _t }: { allocationId: string; teacherId: string }) =>
      removeTeacherAllocation(allocationId),
    onSuccess: (_, { teacherId }) => {
      qc.invalidateQueries({ queryKey: ['staff', 'teacher-allocations', teacherId] })
      qc.invalidateQueries({ queryKey: ['staff', 'teachers'] })
    },
  })
}

export function useSetHomeroomClass() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: ({ teacherId, classId }: { teacherId: string; classId: string }) =>
      setHomeroomClass(teacherId, classId, schoolId),
    onSuccess: (_, { teacherId }) => {
      qc.invalidateQueries({ queryKey: ['staff', 'teachers'] })
      qc.invalidateQueries({ queryKey: ['academics', 'classes'] })
      qc.invalidateQueries({ queryKey: ['staff', 'teacher-allocations', teacherId] })
    },
  })
}

export function useClearHomeroomForTeacher() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: ({ teacherId }: { teacherId: string }) =>
      clearHomeroomForTeacher(teacherId, schoolId),
    onSuccess: (_, { teacherId }) => {
      qc.invalidateQueries({ queryKey: ['staff', 'teachers'] })
      qc.invalidateQueries({ queryKey: ['academics', 'classes'] })
      qc.invalidateQueries({ queryKey: ['staff', 'teacher-allocations', teacherId] })
    },
  })
}

export function useCreateTeacher() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (data: TeacherFormData) => createTeacher(schoolId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff', 'teachers'] })
      qc.invalidateQueries({ queryKey: ['staff', 'profiles-unlinked'] })
    },
  })
}

export function useCreateUserAccount() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (data: CreateUserAccountData) => createUserAccount(data, schoolId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff', 'profiles-unlinked'] })
      qc.invalidateQueries({ queryKey: ['staff', 'teachers'] })
    },
  })
}

export function useUpdateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TeacherFormData> }) =>
      updateTeacher(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff', 'teachers'] })
    },
  })
}

export function useGetRolesForUser(userId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['staff', 'user-roles', userId],
    queryFn: () => getRolesForUser(userId!),
    enabled: Boolean(userId && enabled),
  })
}

export function useSetUserRoles() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: ({ userId, roleNames }: { userId: string; roleNames: string[] }) =>
      setUserRoles(userId, roleNames, schoolId),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['staff', 'user-roles', userId] })
      qc.invalidateQueries({ queryKey: ['staff', 'members'] })
      qc.invalidateQueries({ queryKey: ['staff', 'teachers'] })
    },
  })
}
