import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTeachers, getStaffMembers,
  getProfilesForTeacher, getDepartmentsForSelect,
  getTeachersForSelect,
  createUserAccount,
  createTeacher, updateTeacher,
} from '../services/staff'
import type { CreateUserAccountData, TeacherFormData } from '../types'

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
