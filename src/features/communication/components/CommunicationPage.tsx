import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pin, PinOff, Trash2, Megaphone } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { useAuth } from '@/hooks/useAuth'
import { formatRelativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import {
  useAnnouncements, useCreateAnnouncement,
  useDeleteAnnouncement, useTogglePin,
} from '../hooks/useCommunication'
import type { AnnouncementAudience } from '../types'

const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  all: 'Everyone', staff: 'Staff', teachers: 'Teachers',
  parents: 'Parents', students: 'Students',
}

const AUDIENCE_COLORS: Record<AnnouncementAudience, string> = {
  all:      'bg-primary/10 text-primary',
  staff:    'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  teachers: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  parents:  'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  students: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
}

const schema = z.object({
  title:     z.string().min(1, 'Required'),
  body:      z.string().min(1, 'Required'),
  audience:  z.enum(['all', 'staff', 'teachers', 'parents', 'students']),
  is_pinned: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

function CreateAnnouncementModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateAnnouncement()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', body: '', audience: 'all', is_pinned: false },
  })
  const onSubmit = async (v: FormValues) => {
    const ok = await create.mutateAsync(v)
    if (ok) { form.reset(); onOpenChange(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title *</FormLabel><FormControl><Input placeholder="Announcement title..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="audience" render={({ field }) => (
              <FormItem>
                <FormLabel>Audience *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {(Object.keys(AUDIENCE_LABELS) as AnnouncementAudience[]).map(k => (
                      <SelectItem key={k} value={k}>{AUDIENCE_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="body" render={({ field }) => (
              <FormItem><FormLabel>Message *</FormLabel><FormControl><Textarea rows={5} placeholder="Write your announcement..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Posting...' : 'Post Announcement'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function CommunicationPage() {
  const { role } = useAuth()
  const canPost = ['headmaster', 'deputy_headmaster', 'hod', 'class_teacher', 'teacher'].includes(role ?? '')
  const canDelete = role === 'headmaster' || role === 'deputy_headmaster'

  const { data: announcements = [], isLoading } = useAnnouncements()
  const deleteAnn = useDeleteAnnouncement()
  const togglePin = useTogglePin()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        subtitle="School-wide communication board"
        actions={
          canPost ? (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />New Announcement
            </Button>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && announcements.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-24 text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No announcements yet</p>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map(ann => (
          <div
            key={ann.id}
            className={cn(
              'rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md',
              ann.is_pinned ? 'border-primary/30' : 'border-border'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {ann.is_pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                  <h3 className="font-semibold leading-tight">{ann.title}</h3>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', AUDIENCE_COLORS[ann.audience])}>
                    {AUDIENCE_LABELS[ann.audience]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{ann.body}</p>
                <p className="mt-3 text-xs text-muted-foreground/70">
                  Posted by <span className="font-medium text-muted-foreground">{ann.author_name}</span> · {formatRelativeTime(ann.created_at)}
                </p>
              </div>
              {(canPost || canDelete) && (
                <div className="flex shrink-0 gap-1">
                  {canDelete && (
                    <Button size="icon" variant="ghost" className="h-7 w-7"
                      onClick={() => togglePin.mutate({ id: ann.id, pinned: !ann.is_pinned })}
                      title={ann.is_pinned ? 'Unpin' : 'Pin'}>
                      {ann.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteAnn.mutate(ann.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <CreateAnnouncementModal open={showCreate} onOpenChange={setShowCreate} />
    </div>
  )
}
