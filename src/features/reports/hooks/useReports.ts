import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  getTermReports,
  updateTermReportComment,
  generateTermReports,
  getTermReportSubjectBreakdown,
} from '../services/reports'

const KEY = {
  list: (schoolId: string, f?: { termId?: string; classId?: string }) => ['reports', 'term-reports', schoolId, f] as const,
  breakdown: (studentId: string, termId: string) => ['reports', 'term-report-breakdown', studentId, termId] as const,
}

export function useTermReports(filters?: { termId?: string; classId?: string }) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.list(schoolId, filters),
    queryFn: () => getTermReports(schoolId, filters),
    enabled: !!schoolId,
  })
}

export function useUpdateTermReportComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, teacher_comment }: { id: string; teacher_comment: string | null }) =>
      updateTermReportComment(id, teacher_comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })
}

export function useGenerateTermReports() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ termId, classId }: { termId: string; classId?: string }) =>
      generateTermReports(schoolId, termId, classId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })
}

export function useTermReportSubjectBreakdown(studentId: string | null, termId: string | null) {
  return useQuery({
    queryKey: KEY.breakdown(studentId ?? '', termId ?? ''),
    queryFn: () => getTermReportSubjectBreakdown(studentId!, termId!),
    enabled: !!studentId && !!termId,
  })
}
