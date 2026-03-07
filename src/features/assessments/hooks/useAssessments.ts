import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAssessments,
  getAssessmentMarks,
  getEnrolledStudents,
  getClassAssessmentAverages,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  upsertAssessmentMark,
  type AssessmentFilters,
  type CreateAssessmentInput,
} from '../services/assessments'

const KEY = {
  list: (f?: AssessmentFilters) => ['assessments', 'list', f] as const,
  marks: (id: string) => ['assessments', 'marks', id] as const,
  enrolled: (classId: string) => ['assessments', 'enrolled', classId] as const,
  classAverages: (classId: string) => ['assessments', 'averages', classId] as const,
}

export function useAssessments(filters?: AssessmentFilters) {
  return useQuery({
    queryKey: KEY.list(filters),
    queryFn: () => getAssessments(filters),
  })
}

export function useAssessmentMarks(assessmentId: string | null) {
  return useQuery({
    queryKey: KEY.marks(assessmentId ?? ''),
    queryFn: () => getAssessmentMarks(assessmentId!),
    enabled: !!assessmentId,
  })
}

export function useEnrolledStudents(classId: string | null) {
  return useQuery({
    queryKey: KEY.enrolled(classId ?? ''),
    queryFn: () => getEnrolledStudents(classId!),
    enabled: !!classId,
  })
}

export function useClassAssessmentAverages(classId: string | null) {
  return useQuery({
    queryKey: KEY.classAverages(classId ?? ''),
    queryFn: () => getClassAssessmentAverages(classId!),
    enabled: !!classId,
  })
}

export function useCreateAssessment(teacherId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAssessmentInput) => createAssessment(input, teacherId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments'] }),
  })
}

export function useUpdateAssessment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAssessmentInput> }) =>
      updateAssessment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments'] }),
  })
}

export function useDeleteAssessment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAssessment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments'] }),
  })
}

export function useUpsertAssessmentMark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      assessmentId,
      studentId,
      marks_obtained,
      teacher_comment,
    }: {
      assessmentId: string
      studentId: string
      marks_obtained: number | null
      teacher_comment?: string
    }) => upsertAssessmentMark(assessmentId, studentId, marks_obtained, teacher_comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessments'] }),
  })
}
