import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getAllSchools, createSchool, updateSchool,
  getHeadmastersForSchool, bootstrapHeadmaster,
  type SchoolFormData, type BootstrapHeadmasterData,
} from '../services/superAdmin'

export function useAllSchools() {
  return useQuery({
    queryKey: ['super-admin', 'schools'],
    queryFn: getAllSchools,
  })
}

export function useHeadmastersForSchool(schoolId: string | null) {
  return useQuery({
    queryKey: ['super-admin', 'headmasters', schoolId],
    queryFn: () => getHeadmastersForSchool(schoolId!),
    enabled: !!schoolId,
  })
}

export function useCreateSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SchoolFormData) => createSchool(data),
    onSuccess: (result) => {
      if (result) {
        toast.success('School created successfully')
        qc.invalidateQueries({ queryKey: ['super-admin', 'schools'] })
      } else {
        toast.error('Failed to create school')
      }
    },
    onError: () => toast.error('Failed to create school'),
  })
}

export function useUpdateSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SchoolFormData> }) => updateSchool(id, data),
    onSuccess: (ok) => {
      if (ok) {
        toast.success('School updated')
        qc.invalidateQueries({ queryKey: ['super-admin', 'schools'] })
      } else {
        toast.error('Failed to update school')
      }
    },
    onError: () => toast.error('Failed to update school'),
  })
}

export function useBootstrapHeadmaster(schoolId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BootstrapHeadmasterData) => bootstrapHeadmaster(schoolId, data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Headmaster account created. They will receive a confirmation email.')
        qc.invalidateQueries({ queryKey: ['super-admin', 'headmasters', schoolId] })
        qc.invalidateQueries({ queryKey: ['super-admin', 'schools'] })
      } else {
        toast.error(result.error ?? 'Failed to create headmaster')
      }
    },
    onError: () => toast.error('Failed to create headmaster'),
  })
}
