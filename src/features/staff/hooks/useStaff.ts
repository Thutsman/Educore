import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTeachers, getStaffMembers,
  getProfilesForTeacher, getDepartmentsForSelect,
  getTeachersForSelect, getNextTeacherEmployeeNo,
  getCurrentAcademicYear,
  getSubjectsForSelect, getClassesForSelect,
  getTeacherAllocations, addTeacherAllocation, removeTeacherAllocation,
  createUserAccount,
  createTeacher, updateTeacher,
  getRolesForUser,
  setUserRoles,
} from '../services/staff'
import type { CreateUserAccountData, TeacherFormData, TeacherSelectOption } from '../types'

export type { TeacherSelectOption }

export function useTeachers() {
  return useQuery({ queryKey: ['staff', 'teachers'], queryFn: getTeachers })
}

export function useTeachersForSelect(enabled = true) {
  return useQuery({
    queryKey: ['staff', 'teachers-select'],
    queryFn: getTeachersForSelect,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useStaffMembers() {
  return useQuery({ queryKey: ['staff', 'members'], queryFn: getStaffMembers })
}

export function useProfilesForTeacher() {
  return useQuery({
    queryKey: ['staff', 'profiles-unlinked'],
    queryFn: getProfilesForTeacher,
    staleTime: 30 * 1000,
  })
}

export function useDepartmentsForSelect() {
  return useQuery({
    queryKey: ['staff', 'departments'],
    queryFn: getDepartmentsForSelect,
    staleTime: 10 * 60 * 1000,
  })
}

export function useNextTeacherEmployeeNo(enabled = true) {
  return useQuery({
    queryKey: ['staff', 'next-employee-no'],
    queryFn: getNextTeacherEmployeeNo,
    enabled,
    staleTime: 30 * 1000,
  })
}

export function useCurrentAcademicYear() {
  return useQuery({
    queryKey: ['staff', 'current-academic-year'],
    queryFn: getCurrentAcademicYear,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSubjectsForSelect() {
  return useQuery({
    queryKey: ['staff', 'subjects-select'],
    queryFn: getSubjectsForSelect,
    staleTime: 10 * 60 * 1000,
  })
}

export function useClassesForSelect() {
  return useQuery({
    queryKey: ['staff', 'classes-select'],
    queryFn: getClassesForSelect,
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
  return useMutation({
    mutationFn: ({ teacherId, subjectId, classId }: { teacherId: string; subjectId: string; classId: string }) =>
      addTeacherAllocation(teacherId, subjectId, classId),
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

export function useCreateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TeacherFormData) => createTeacher(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff', 'teachers'] })
      qc.invalidateQueries({ queryKey: ['staff', 'profiles-unlinked'] })
    },
  })
}

export function useCreateUserAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserAccountData) => createUserAccount(data),
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
  return useMutation({
    mutationFn: ({ userId, roleNames }: { userId: string; roleNames: string[] }) =>
      setUserRoles(userId, roleNames),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['staff', 'user-roles', userId] })
      qc.invalidateQueries({ queryKey: ['staff', 'members'] })
      qc.invalidateQueries({ queryKey: ['staff', 'teachers'] })
    },
  })
}
