import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getLearningResources,
  createResource,
  updateResource,
  deleteResource,
  uploadResourceFile,
  type ResourceFilters,
  type CreateResourceInput,
} from '../services/resources'

const KEY = {
  list: (f?: ResourceFilters) => ['resources', 'list', f] as const,
}

export function useLearningResources(filters?: ResourceFilters) {
  return useQuery({
    queryKey: KEY.list(filters),
    queryFn: () => getLearningResources(filters),
  })
}

export function useCreateResource(teacherId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateResourceInput) => createResource(input, teacherId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  })
}

export function useUpdateResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateResourceInput> }) =>
      updateResource(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  })
}

export function useDeleteResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteResource,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  })
}

export function useUploadResourceFile() {
  return useMutation({
    mutationFn: (file: File) => uploadResourceFile(file),
  })
}
