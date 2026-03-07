import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTermReports, updateTermReportComment, generateTermReports } from '../services/reports'

const KEY = {
  list: (f?: { termId?: string; classId?: string }) => ['reports', 'term-reports', f] as const,
}

export function useTermReports(filters?: { termId?: string; classId?: string }) {
  return useQuery({
    queryKey: KEY.list(filters),
    queryFn: () => getTermReports(filters),
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
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ termId, classId }: { termId: string; classId?: string }) =>
      generateTermReports(termId, classId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })
}
