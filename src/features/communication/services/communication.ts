import { supabase } from '@/lib/supabase'
import type { Announcement, AnnouncementAudience } from '../types'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function getAnnouncements(schoolId: string): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, body, audience, author_id, created_at, is_pinned, author:profiles(full_name)')
    .eq('school_id', schoolId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
  if (error || !data) return []
  type Raw = { id: string; title: string; body: string; audience: string; author_id: string; created_at: string; is_pinned: boolean; author: { full_name: string } | null }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id, title: r.title, body: r.body,
    audience: r.audience as AnnouncementAudience,
    author_id: r.author_id,
    author_name: r.author?.full_name ?? 'Unknown',
    created_at: r.created_at,
    is_pinned: r.is_pinned ?? false,
  }))
}

export async function createAnnouncement(schoolId: string, d: { title: string; body: string; audience: AnnouncementAudience; is_pinned?: boolean }): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await db.from('announcements').insert({
    school_id: schoolId,
    title: d.title, body: d.body, audience: d.audience,
    is_pinned: d.is_pinned ?? false, author_id: user.id,
  })
  return !error
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const { error } = await db.from('announcements').delete().eq('id', id)
  return !error
}

export async function togglePin(id: string, pinned: boolean): Promise<boolean> {
  const { error } = await db.from('announcements').update({ is_pinned: pinned }).eq('id', id)
  return !error
}
