import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAssignments,
  getAssignmentSubmissions,
  getEnrolledStudentsForAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  upsertSubmissionGrade,
  uploadSubmissionFile,
  saveSubmissionUrl,
  uploadAssignmentAttachment,
  type AssignmentFilters,
  type CreateAssignmentInput,
} from '../services/assignments'

const KEY = {
  list: (f?: AssignmentFilters) => ['assignments', 'list', f] as const,
  submissions: (id: string) => ['assignments', 'submissions', id] as const,
  enrolled: (classId: string) => ['assignments', 'enrolled', classId] as const,
}

export function useAssignments(filters?: AssignmentFilters) {
  return useQuery({
    queryKey: KEY.list(filters),
    queryFn: () => getAssignments(filters),
  })
}

export function useAssignmentSubmissions(assignmentId: string | null) {
  return useQuery({
    queryKey: KEY.submissions(assignmentId ?? ''),
    queryFn: () => getAssignmentSubmissions(assignmentId!),
    enabled: !!assignmentId,
  })
}

export function useEnrolledStudentsForAssignment(classId: string | null) {
  return useQuery({
    queryKey: KEY.enrolled(classId ?? ''),
    queryFn: () => getEnrolledStudentsForAssignment(classId!),
    enabled: !!classId,
  })
}

export function useCreateAssignment(teacherId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAssignmentInput) => createAssignment(input, teacherId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })
}

export function useUpdateAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAssignmentInput> }) =>
      updateAssignment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })
}

export function useDeleteAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })
}

export function useUpsertSubmissionGrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      assignmentId,
      studentId,
      grade,
      teacher_comment,
    }: {
      assignmentId: string
      studentId: string
      grade: number | null
      teacher_comment?: string
    }) => upsertSubmissionGrade(assignmentId, studentId, grade, teacher_comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })
}

export function useUploadSubmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      assignmentId,
      studentId,
      file,
    }: {
      assignmentId: string
      studentId: string
      file: File
    }) => uploadSubmissionFile(assignmentId, studentId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })
}

export function useSaveSubmissionUrl() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      assignmentId,
      studentId,
      submissionUrl,
    }: {
      assignmentId: string
      studentId: string
      submissionUrl: string
    }) => saveSubmissionUrl(assignmentId, studentId, submissionUrl),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })
}

export function useUploadAssignmentAttachment() {
  return useMutation({
    mutationFn: (file: File) => uploadAssignmentAttachment(file),
  })
}
