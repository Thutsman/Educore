export type AnnouncementAudience = 'all' | 'staff' | 'parents' | 'students' | 'teachers'

export interface Announcement {
  id: string
  title: string
  body: string
  audience: AnnouncementAudience
  author_id: string
  author_name: string
  created_at: string
  is_pinned: boolean
}
