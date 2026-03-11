import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import { getAssets, createAsset, updateAsset, deleteAsset } from '../services/assets'
import type { AssetFormData } from '../types'

const KEY = {
  list: (schoolId: string, f?: object) => ['assets', 'list', schoolId, f] as const,
}

export function useAssets(filters?: { category?: string; status?: string; search?: string }) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.list(schoolId, filters),
    queryFn: () => getAssets(schoolId, filters),
    enabled: !!schoolId,
  })
}

export function useCreateAsset() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: AssetFormData) => createAsset(schoolId, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  })
}

export function useUpdateAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetFormData> }) => updateAsset(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  })
}

export function useDeleteAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  })
}
