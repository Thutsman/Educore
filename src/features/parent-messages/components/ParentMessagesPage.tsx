import { useState, useEffect } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useTeacherRecord } from '@/features/dashboard/hooks/useTeacherDashboard'
import { useAuth } from '@/hooks/useAuth'
import {
  useParentMessagesSent,
  useGuardiansWithStudents,
  useCreateParentMessage,
} from '../hooks/useParentMessages'
import type { ParentMessage } from '../types'

const schema = z.object({
  parent_id: z.string().min(1, 'Select a parent'),
  student_id: z.string().min(1, 'Select a student'),
  subject: z.string().min(1, 'Subject required'),
  message: z.string().min(1, 'Message required'),
})
type FormValues = z.infer<typeof schema>

export function ParentMessagesPage() {
  const { user } = useAuth()
  const { data: teacher } = useTeacherRecord(user?.id)
  const { data: messages = [], isLoading } = useParentMessagesSent()
  const { data: guardians = [] } = useGuardiansWithStudents()
  const createMessage = useCreateParentMessage(teacher?.id)
  const [showCompose, setShowCompose] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      parent_id: '',
      student_id: '',
      subject: '',
      message: '',
    },
  })

  const parentId = form.watch('parent_id')
  const selectedGuardian = guardians.find((g) => g.id === parentId)

  useEffect(() => {
    if (!parentId) form.setValue('student_id', '')
    else if (selectedGuardian && selectedGuardian.students.length === 1)
      form.setValue('student_id', selectedGuardian.students[0].id)
  }, [parentId, selectedGuardian, form])

  const onSubmit = async (v: FormValues) => {
    const ok = await createMessage.mutateAsync({
      parentId: v.parent_id,
      studentId: v.student_id,
      subject: v.subject,
      message: v.message,
    })
    if (ok) {
      form.reset()
      setShowCompose(false)
    }
  }

  const messagesByParent = messages.reduce((acc, m) => {
    if (!acc[m.parent_id]) acc[m.parent_id] = []
    acc[m.parent_id].push(m)
    return acc
  }, {} as Record<string, ParentMessage[]>)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parent Messages"
        subtitle="Communicate with parents about their children"
        actions={
          <Button onClick={() => setShowCompose(true)}>
            <Send className="mr-2 h-4 w-4" /> New message
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(messagesByParent).map(([pid, msgs]) => {
            const first = msgs[0]
            return (
              <div
                key={pid}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{first.parent_name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {msgs.length} message{msgs.length !== 1 ? 's' : ''} · Last: {format(new Date(first.created_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <ul className="mt-3 space-y-2 border-t border-border pt-3">
                  {msgs.slice(0, 5).map((m) => (
                    <li key={m.id} className="rounded-lg bg-muted/50 p-3 text-sm">
                      <p className="font-medium text-muted-foreground">{m.subject}</p>
                      <p className="mt-1">{m.message}</p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        To {m.parent_name} re: {m.student_name} · {format(new Date(m.created_at), 'dd MMM HH:mm')}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {!isLoading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <MessageCircle className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">No messages yet</p>
          <Button variant="outline" className="mt-3" onClick={() => setShowCompose(true)}>
            Send your first message
          </Button>
        </div>
      )}

      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New message to parent</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="parent_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {guardians.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.full_name} ({g.students.length} student{g.students.length !== 1 ? 's' : ''})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="student_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Regarding student *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!parentId}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {selectedGuardian?.students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                      )) ?? []}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl><Input placeholder="e.g. Homework, Attendance" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message *</FormLabel>
                  <FormControl><Textarea rows={4} placeholder="Your message..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
                <Button type="submit" disabled={createMessage.isPending}>
                  {createMessage.isPending ? 'Sending...' : 'Send'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
