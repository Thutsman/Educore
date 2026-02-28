import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAssets, createAsset, updateAsset, deleteAsset } from '../services/assets'
import type { AssetFormData } from '../types'

const KEY = {
  list: (f?: object) => ['assets', 'list', f] as const,
}

export function useAssets(filters?: { category?: string; status?: string; search?: string }) {
  return useQuery({ queryKey: KEY.list(filters), queryFn: () => getAssets(filters) })
}

export function useCreateAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: AssetFormData) => createAsset(d),
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
