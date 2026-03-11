import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface SetupProgress {
  academicYears: boolean
  terms: boolean
  departments: boolean
  subjects: boolean
  classes: boolean
  teachers: boolean
  students: boolean
  feeStructures: boolean
  completedCount: number
  totalCount: number
  percentage: number
}

async function fetchSetupProgress(): Promise<SetupProgress> {
  const [ayRes, termRes, deptRes, subRes, classRes, teacherRes, studentRes, feeRes] =
    await Promise.all([
      supabase.from('academic_years').select('id', { count: 'exact', head: true }),
      supabase.from('terms').select('id', { count: 'exact', head: true }),
      supabase.from('departments').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('subjects').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('classes').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('teachers').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('students').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('fee_structures').select('id', { count: 'exact', head: true }),
    ])

  const steps = {
    academicYears: (ayRes.count ?? 0) > 0,
    terms:         (termRes.count ?? 0) > 0,
    departments:   (deptRes.count ?? 0) > 0,
    subjects:      (subRes.count ?? 0) > 0,
    classes:       (classRes.count ?? 0) > 0,
    teachers:      (teacherRes.count ?? 0) > 0,
    students:      (studentRes.count ?? 0) > 0,
    feeStructures: (feeRes.count ?? 0) > 0,
  }

  const completedCount = Object.values(steps).filter(Boolean).length
  const totalCount = Object.keys(steps).length

  return {
    ...steps,
    completedCount,
    totalCount,
    percentage: Math.round((completedCount / totalCount) * 100),
  }
}

export function useSetupProgress() {
  return useQuery({
    queryKey: ['setup-progress'],
    queryFn: fetchSetupProgress,
    staleTime: 5 * 60 * 1000,
  })
}
