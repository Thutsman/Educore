import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getClasses, createClass, updateClass, deleteClass,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getAcademicYears, createAcademicYear, updateAcademicYear,
  getTerms, createTerm, updateTerm, deleteTerm,
  getExams, createExam, updateExam, deleteExam,
  getExamGrades, upsertGrade, getEnrolledStudents,
} from '../services/academics'
import { useSchool } from '@/context/SchoolContext'

const KEY = {
  departments: (schoolId: string) => ['academics', 'departments', schoolId] as const,
  classes:   (schoolId: string) => ['academics', 'classes', schoolId] as const,
  subjects:  (schoolId: string) => ['academics', 'subjects', schoolId] as const,
  years:     (schoolId: string) => ['academics', 'years', schoolId] as const,
  terms:     (yearId?: string) => ['academics', 'terms', yearId] as const,
  exams:     (schoolId: string, f?: object) => ['academics', 'exams', schoolId, f] as const,
  grades:    (examId: string) => ['academics', 'grades', examId] as const,
  enrolled:  (classId: string) => ['academics', 'enrolled', classId] as const,
}

export function useDepartments() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.departments(schoolId),
    queryFn: () => getDepartments(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (d: Parameters<typeof createDepartment>[1]) => createDepartment(schoolId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academics', 'departments'] })
      qc.invalidateQueries({ queryKey: ['staff', 'departments'] })
    },
  })
}

export function useUpdateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateDepartment>[1] }) => updateDepartment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academics', 'departments'] })
      qc.invalidateQueries({ queryKey: ['staff', 'departments'] })
    },
  })
}

export function useDeleteDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academics', 'departments'] })
      qc.invalidateQueries({ queryKey: ['staff', 'departments'] })
    },
  })
}

export function useClasses() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.classes(schoolId),
    queryFn: () => getClasses(schoolId),
    enabled: !!schoolId,
  })
}

export function useSubjects() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.subjects(schoolId),
    queryFn: () => getSubjects(schoolId),
    enabled: !!schoolId,
  })
}

export function useAcademicYears() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.years(schoolId),
    queryFn: () => getAcademicYears(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useTerms(academicYearId?: string) {
  return useQuery({ queryKey: KEY.terms(academicYearId), queryFn: () => getTerms(academicYearId) })
}

export function useExams(filters?: { classId?: string; subjectId?: string; termId?: string }) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.exams(schoolId, filters),
    queryFn: () => getExams(schoolId, filters),
    enabled: !!schoolId,
  })
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

export function useCreateAcademicYear() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (d: { label: string; start_date: string; end_date: string; is_current: boolean }) =>
      createAcademicYear(schoolId, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'years'] }),
  })
}

export function useUpdateAcademicYear() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAcademicYear>[2] }) =>
      updateAcademicYear(id, schoolId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'years'] }),
  })
}

export function useCreateTerm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTerm,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'terms'] }),
  })
}

export function useUpdateTerm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTerm>[1] }) => updateTerm(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'terms'] }),
  })
}

export function useDeleteTerm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTerm,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'terms'] }),
  })
}

export function useCreateClass() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (d: Parameters<typeof createClass>[1]) => createClass(schoolId, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'classes'] }),
  })
}

export function useUpdateClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateClass>[1] }) => updateClass(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'classes'] }),
  })
}

export function useDeleteClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteClass,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'classes'] }),
  })
}

export function useCreateSubject() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (d: Parameters<typeof createSubject>[1]) => createSubject(schoolId, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'subjects'] }),
  })
}

export function useUpdateSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateSubject>[1] }) => updateSubject(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'subjects'] }),
  })
}

export function useDeleteSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academics', 'subjects'] }),
  })
}

export function useCreateExam() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (d: Parameters<typeof createExam>[1]) => createExam(schoolId, d),
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
