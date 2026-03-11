import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
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
  list: (schoolId: string, f?: ResourceFilters) => ['resources', 'list', schoolId, f] as const,
}

export function useLearningResources(filters?: ResourceFilters) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.list(schoolId, filters),
    queryFn: () => getLearningResources(schoolId, filters),
    enabled: !!schoolId,
  })
}

export function useCreateResource(teacherId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateResourceInput) => createResource(input, teacherId!, schoolId),
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
