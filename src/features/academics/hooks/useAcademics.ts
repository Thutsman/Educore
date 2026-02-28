import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClasses, createClass, updateClass, deleteClass,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getAcademicYears, getTerms,
  getExams, createExam, updateExam, deleteExam,
  getExamGrades, upsertGrade, getEnrolledStudents,
} from '../services/academics'

const KEY = {
  classes:   ['academics', 'classes'] as const,
  subjects:  ['academics', 'subjects'] as const,
  years:     ['academics', 'years'] as const,
  terms:     (yearId?: string) => ['academics', 'terms', yearId] as const,
  exams:     (f?: object) => ['academics', 'exams', f] as const,
  grades:    (examId: string) => ['academics', 'grades', examId] as const,
  enrolled:  (classId: string) => ['academics', 'enrolled', classId] as const,
}

export function useClasses() {
  return useQuery({ queryKey: KEY.classes, queryFn: getClasses })
}

export function useSubjects() {
  return useQuery({ queryKey: KEY.subjects, queryFn: getSubjects })
}

export function useAcademicYears() {
  return useQuery({ queryKey: KEY.years, queryFn: getAcademicYears, staleTime: 10 * 60 * 1000 })
}

export function useTerms(academicYearId?: string) {
  return useQuery({ queryKey: KEY.terms(academicYearId), queryFn: () => getTerms(academicYearId) })
}

export function useExams(filters?: { classId?: string; subjectId?: string; termId?: string }) {
  return useQuery({ queryKey: KEY.exams(filters), queryFn: () => getExams(filters) })
}

export function useExamGrades(examId: string | null) {
  return useQuery({
    queryKey: KEY.grades(examId ?? ''),
    queryFn: () => getExamGrades(examId!),
    enabled: !!examId,
  })
}

export function useEnrolledStudents(classId: string | null) {
  return useQuery({
    queryKey: KEY.enrolled(classId ?? ''),
    queryFn: () => getEnrolledStudents(classId!),
    enabled: !!classId,
  })
}

export function useCreateClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createClass,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY.classes }),
  })
}

export function useUpdateClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateClass>[1] }) => updateClass(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY.classes }),
  })
}

export function useDeleteClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteClass,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY.classes }),
  })
}

export function useCreateSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY.subjects }),
  })
}

export function useUpdateSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateSubject>[1] }) => updateSubject(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY.subjects }),
  })
}

export function useDeleteSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY.subjects }),
  })
}

export function useCreateExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createExam,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'exams'] }),
  })
}

export function useUpdateExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateExam>[1] }) => updateExam(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'exams'] }),
  })
}

export function useDeleteExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteExam,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'exams'] }),
  })
}

export function useUpsertGrade(examId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, marks, remarks }: { studentId: string; marks: number | null; remarks?: string }) =>
      upsertGrade(examId, studentId, marks, remarks),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY.grades(examId) }),
  })
}
