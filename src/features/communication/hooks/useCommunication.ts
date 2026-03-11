import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import { getAnnouncements, createAnnouncement, deleteAnnouncement, togglePin } from '../services/communication'
import type { AnnouncementAudience } from '../types'

const KEY = { list: (schoolId: string) => ['communication', 'announcements', schoolId] as const }

export function useAnnouncements() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.list(schoolId),
    queryFn: () => getAnnouncements(schoolId),
    enabled: !!schoolId,
  })
}

export function useCreateAnnouncement() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: { title: string; body: string; audience: AnnouncementAudience; is_pinned?: boolean }) => createAnnouncement(schoolId, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication', 'announcements'] }),
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication', 'announcements'] }),
  })
}

export function useTogglePin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => togglePin(id, pinned),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication', 'announcements'] }),
  })
}
