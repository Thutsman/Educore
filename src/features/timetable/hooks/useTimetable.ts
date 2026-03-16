import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  getPeriods,
  createPeriod,
  updatePeriod,
  deletePeriod,
  getTimetableEntries,
  upsertTimetableEntry,
  deleteTimetableEntry,
} from '../services/timetable'

const KEY = {
  periods: (schoolId: string) => ['timetable', 'periods', schoolId] as const,
  entries: (schoolId: string, f?: object) => ['timetable', 'entries', schoolId, f] as const,
}

export function usePeriods() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.periods(schoolId),
    queryFn: () => getPeriods(schoolId),
    enabled: !!schoolId,
  })
}

export function useCreatePeriod() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (d: { label: string; start_time: string; end_time: string; sort_order?: number }) =>
      createPeriod(schoolId, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY.periods(schoolId) }),
  })
}

export function useUpdatePeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePeriod>[1] }) => updatePeriod(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }),
  })
}

export function useDeletePeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePeriod,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }),
  })
}

export function useTimetableEntries(filters?: { classId?: string; teacherId?: string; academicYearId?: string }) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.entries(schoolId, filters),
    queryFn: () => getTimetableEntries(schoolId, filters),
    enabled: !!schoolId,
  })
}

export function useUpsertTimetableEntry() {
  const qc = useQueryClient()
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useMutation({
    mutationFn: (d: Parameters<typeof upsertTimetableEntry>[1]) => upsertTimetableEntry(schoolId, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }),
  })
}

export function useDeleteTimetableEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTimetableEntry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }),
  })
}
