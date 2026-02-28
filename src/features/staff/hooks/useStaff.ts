import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTeachers, getStaffMembers,
  getProfilesForTeacher, getDepartmentsForSelect,
  createTeacher, updateTeacher,
} from '../services/staff'
import type { TeacherFormData } from '../types'

export function useTeachers() {
  return useQuery({ queryKey: ['staff', 'teachers'], queryFn: getTeachers })
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
