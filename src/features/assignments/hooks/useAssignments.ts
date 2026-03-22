import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  getAssignments,
  getAssignmentSubmissions,
  getEnrolledStudentsForAssignment,
  getStudentRowForProfile,
  getMyAssignmentSubmissions,
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
  list: (schoolId: string, f?: AssignmentFilters) => ['assignments', 'list', schoolId, f] as const,
  submissions: (id: string) => ['assignments', 'submissions', id] as const,
  enrolled: (schoolId: string, classId: string) => ['assignments', 'enrolled', schoolId, classId] as const,
}

export function useAssignments(filters?: AssignmentFilters) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.list(schoolId, filters),
    queryFn: () => getAssignments(schoolId, filters),
    enabled: !!schoolId,
  })
}

export function useAssignmentsForClass(classId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const filters: AssignmentFilters | undefined = classId ? { classId } : undefined
  return useQuery({
    queryKey: KEY.list(schoolId, filters),
    queryFn: () => getAssignments(schoolId, filters),
    enabled: !!schoolId && !!classId,
  })
}

export function useCurrentStudentRow(profileId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: ['assignments', 'student-row', schoolId, profileId],
    queryFn: () => getStudentRowForProfile(schoolId, profileId!),
    enabled: !!schoolId && !!profileId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMyAssignmentSubmissions(studentId: string | undefined) {
  return useQuery({
    queryKey: ['assignments', 'my-submissions', studentId],
    queryFn: () => getMyAssignmentSubmissions(studentId!),
    enabled: !!studentId,
    staleTime: 60 * 1000,
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
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.enrolled(schoolId, classId ?? ''),
    queryFn: () => getEnrolledStudentsForAssignment(schoolId, classId!),
    enabled: !!classId && !!schoolId,
  })
}

export function useCreateAssignment(teacherId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAssignmentInput) => createAssignment(input, teacherId!, schoolId),
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
