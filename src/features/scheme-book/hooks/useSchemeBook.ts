import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  getSchemeBooks,
  createSchemeBook,
  updateSchemeBook,
  hodApproveSchemeBook,
  approveSchemeBook,
  getSchemeBookProgressByTerm,
  type SchemeBookFilters,
  type CreateSchemeBookInput,
} from '../services/schemeBook'

const KEY = {
  list: (schoolId: string, f?: SchemeBookFilters) => ['scheme-book', 'list', schoolId, f] as const,
  progress: (schoolId: string, termId: string) => ['scheme-book', 'progress', schoolId, termId] as const,
}

export function useSchemeBooks(filters?: SchemeBookFilters) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.list(schoolId, filters),
    queryFn: () => getSchemeBooks(schoolId, filters),
    enabled: !!schoolId,
  })
}

export function useSchemeBookProgress(termId: string | null) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.progress(schoolId, termId ?? ''),
    queryFn: () => getSchemeBookProgressByTerm(schoolId, termId!),
    enabled: !!termId && !!schoolId,
  })
}

export function useCreateSchemeBook(teacherId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSchemeBookInput) =>
      createSchemeBook(input, teacherId!, schoolId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheme-book'] }),
  })
}

export function useUpdateSchemeBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSchemeBookInput> }) =>
      updateSchemeBook(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheme-book'] }),
  })
}

export function useHodApproveSchemeBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, profileId }: { id: string; profileId: string }) =>
      hodApproveSchemeBook(id, profileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheme-book'] }),
  })
}

export function useApproveSchemeBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, profileId }: { id: string; profileId: string }) =>
      approveSchemeBook(id, profileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheme-book'] }),
  })
}
