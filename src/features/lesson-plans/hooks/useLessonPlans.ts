import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getLessonPlans,
  createLessonPlan,
  updateLessonPlan,
  deleteLessonPlan,
  duplicateLessonPlan,
  type LessonPlanFilters,
  type CreateLessonPlanInput,
} from '../services/lessonPlans'

const KEY = {
  list: (f?: LessonPlanFilters) => ['lesson-plans', 'list', f] as const,
}

export function useLessonPlans(filters?: LessonPlanFilters) {
  return useQuery({
    queryKey: KEY.list(filters),
    queryFn: () => getLessonPlans(filters),
  })
}

export function useCreateLessonPlan(teacherId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLessonPlanInput) => createLessonPlan(input, teacherId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lesson-plans'] }),
  })
}

export function useUpdateLessonPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLessonPlanInput> }) =>
      updateLessonPlan(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lesson-plans'] }),
  })
}

export function useDeleteLessonPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteLessonPlan,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lesson-plans'] }),
  })
}

export function useDuplicateLessonPlan(teacherId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, newDate }: { id: string; newDate: string }) =>
      duplicateLessonPlan(id, newDate, teacherId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lesson-plans'] }),
  })
}
