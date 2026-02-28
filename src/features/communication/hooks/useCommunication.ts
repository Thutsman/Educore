import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAnnouncements, createAnnouncement, deleteAnnouncement, togglePin } from '../services/communication'
import type { AnnouncementAudience } from '../types'

const KEY = { list: ['communication', 'announcements'] as const }

export function useAnnouncements() {
  return useQuery({ queryKey: KEY.list, queryFn: getAnnouncements })
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: { title: string; body: string; audience: AnnouncementAudience; is_pinned?: boolean }) => createAnnouncement(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY.list }),
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY.list }),
  })
}

export function useTogglePin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => togglePin(id, pinned),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY.list }),
  })
}
