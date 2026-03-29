import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStudents,
  getAtRiskStudents,
  getStudentById,
  getStudentGuardians,
  getStudentFeeSummary,
  getClassesForSelect,
  createStudent,
  updateStudent,
  deleteStudent,
  inviteGuardianAsParent,
  createGuardianParentAccount,
  adminResetParentPassword,
  updateGuardian,
} from '../services/students'
import type { StudentFilters, StudentFormData } from '../types'
import { useSchool } from '@/context/SchoolContext'

export const studentKeys = {
  all:     ['students'] as const,
  list:    (schoolId: string, f?: Partial<StudentFilters>) => ['students', 'list', schoolId, f] as const,
  detail:  (id: string) => ['students', 'detail', id] as const,
  guardians: (id: string) => ['students', 'guardians', id] as const,
  fees:    (id: string) => ['students', 'fees', id] as const,
  classes: (schoolId: string) => ['students', 'classes', schoolId] as const,
}

export function useStudents(filters?: Partial<StudentFilters>) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: studentKeys.list(schoolId, filters),
    queryFn: () => getStudents(schoolId, filters),
    enabled: !!schoolId,
  })
}

export function useAtRiskStudents(departmentId: string | null) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['students', 'at-risk', schoolId, departmentId ?? ''] as const,
    queryFn: () => getAtRiskStudents(schoolId, departmentId!),
    enabled: !!schoolId && !!departmentId,
    staleTime: 10 * 60 * 1000,
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
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: studentKeys.classes(schoolId),
    queryFn: () => getClassesForSelect(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateStudent() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (data: StudentFormData) => createStudent(schoolId, data),
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

export function useInviteGuardianAsParent(studentId: string | null) {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''

  return useMutation({
    mutationFn: ({ guardianId }: { guardianId: string }) => inviteGuardianAsParent(guardianId, schoolId),
    onSuccess: () => {
      if (studentId) {
        qc.invalidateQueries({ queryKey: studentKeys.guardians(studentId) })
      }
    },
  })
}

export function useCreateGuardianParentAccount(studentId: string | null) {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''

  return useMutation({
    mutationFn: ({ guardianId }: { guardianId: string }) => createGuardianParentAccount(guardianId, schoolId),
    onSuccess: () => {
      if (studentId) {
        qc.invalidateQueries({ queryKey: studentKeys.guardians(studentId) })
      }
    },
  })
}

export function useAdminResetParentPassword() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: ({ guardianId, newPassword }: { guardianId: string; newPassword: string }) =>
      adminResetParentPassword(guardianId, schoolId, newPassword),
  })
}

export function useUpdateGuardian(studentId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateGuardian>[1] }) =>
      updateGuardian(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.all })
      if (studentId) {
        qc.invalidateQueries({ queryKey: studentKeys.guardians(studentId) })
      }
    },
  })
}
