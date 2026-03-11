import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
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
  list: (schoolId: string, f?: LessonPlanFilters) => ['lesson-plans', 'list', schoolId, f] as const,
}

export function useLessonPlans(filters?: LessonPlanFilters) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.list(schoolId, filters),
    queryFn: () => getLessonPlans(schoolId, filters),
    enabled: !!schoolId,
  })
}

export function useCreateLessonPlan(teacherId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLessonPlanInput) => createLessonPlan(input, teacherId!, schoolId),
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
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, newDate }: { id: string; newDate: string }) =>
      duplicateLessonPlan(id, newDate, teacherId!, schoolId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lesson-plans'] }),
  })
}
