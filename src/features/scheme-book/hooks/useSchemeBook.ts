import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSchemeBooks,
  createSchemeBook,
  updateSchemeBook,
  approveSchemeBook,
  getSchemeBookProgressByTerm,
  type SchemeBookFilters,
  type CreateSchemeBookInput,
} from '../services/schemeBook'

const KEY = {
  list: (f?: SchemeBookFilters) => ['scheme-book', 'list', f] as const,
  progress: (termId: string) => ['scheme-book', 'progress', termId] as const,
}

export function useSchemeBooks(filters?: SchemeBookFilters) {
  return useQuery({
    queryKey: KEY.list(filters),
    queryFn: () => getSchemeBooks(filters),
  })
}

export function useSchemeBookProgress(termId: string | null) {
  return useQuery({
    queryKey: KEY.progress(termId ?? ''),
    queryFn: () => getSchemeBookProgressByTerm(termId!),
    enabled: !!termId,
  })
}

export function useCreateSchemeBook(teacherId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSchemeBookInput) =>
      createSchemeBook(input, teacherId!),
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

export function useApproveSchemeBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, profileId }: { id: string; profileId: string }) =>
      approveSchemeBook(id, profileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheme-book'] }),
  })
}
