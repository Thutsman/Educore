import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStudents, getStudentById, getStudentGuardians, getStudentFeeSummary,
  getClassesForSelect, createStudent, updateStudent, deleteStudent,
} from '../services/students'
import type { StudentFilters, StudentFormData } from '../types'

export const studentKeys = {
  all:     ['students'] as const,
  list:    (f?: Partial<StudentFilters>) => ['students', 'list', f] as const,
  detail:  (id: string) => ['students', 'detail', id] as const,
  guardians: (id: string) => ['students', 'guardians', id] as const,
  fees:    (id: string) => ['students', 'fees', id] as const,
  classes: ['students', 'classes'] as const,
}

export function useStudents(filters?: Partial<StudentFilters>) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: () => getStudents(filters),
  })
}

export function useStudent(id: string | null) {
  return useQuery({
    queryKey: studentKeys.detail(id ?? ''),
    queryFn: () => getStudentById(id!),
    enabled: !!id,
  })
}

export function useStudentGuardians(studentId: string | null) {
  return useQuery({
    queryKey: studentKeys.guardians(studentId ?? ''),
    queryFn: () => getStudentGuardians(studentId!),
    enabled: !!studentId,
  })
}

export function useStudentFeeSummary(studentId: string | null) {
  return useQuery({
    queryKey: studentKeys.fees(studentId ?? ''),
    queryFn: () => getStudentFeeSummary(studentId!),
    enabled: !!studentId,
  })
}

export function useClassesForSelect() {
  return useQuery({
    queryKey: studentKeys.classes,
    queryFn: getClassesForSelect,
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StudentFormData) => createStudent(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: studentKeys.all }) },
  })
}

export function useUpdateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StudentFormData> }) =>
      updateStudent(id, data),
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: studentKeys.all })
      qc.invalidateQueries({ queryKey: studentKeys.detail(id) })
    },
  })
}

export function useDeleteStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: studentKeys.all }) },
  })
}
