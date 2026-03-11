import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
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
  list: (schoolId: string, f?: AssessmentFilters) => ['assessments', 'list', schoolId, f] as const,
  marks: (id: string) => ['assessments', 'marks', id] as const,
  enrolled: (schoolId: string, classId: string) => ['assessments', 'enrolled', schoolId, classId] as const,
  classAverages: (schoolId: string, classId: string) => ['assessments', 'averages', schoolId, classId] as const,
}

export function useAssessments(filters?: AssessmentFilters) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.list(schoolId, filters),
    queryFn: () => getAssessments(schoolId, filters),
    enabled: !!schoolId,
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
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.enrolled(schoolId, classId ?? ''),
    queryFn: () => getEnrolledStudents(schoolId, classId!),
    enabled: !!classId && !!schoolId,
  })
}

export function useClassAssessmentAverages(classId: string | null) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.classAverages(schoolId, classId ?? ''),
    queryFn: () => getClassAssessmentAverages(schoolId, classId!),
    enabled: !!classId && !!schoolId,
  })
}

export function useCreateAssessment(teacherId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAssessmentInput) => createAssessment(input, teacherId!, schoolId),
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
