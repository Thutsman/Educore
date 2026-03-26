import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useInviteGuardianAsParent, useUpdateGuardian } from '../hooks/useStudents'
import type { Guardian } from '../types'

const schema = z.object({
  full_name: z.string().min(1, 'Required'),
  relationship: z.enum(['father', 'mother', 'guardian', 'other']),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  guardian: Guardian | null
  studentId: string | null
}

export function GuardianFormModal({ open, onOpenChange, guardian, studentId }: Props) {
  const update = useUpdateGuardian(studentId)
  const isPending = update.isPending
  const inviteGuardian = useInviteGuardianAsParent(studentId)
  const isInviting = inviteGuardian.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', relationship: 'guardian', phone: '', email: '', address: '' },
  })

  useEffect(() => {
    if (!open) return
    if (!guardian) return
    form.reset({
      full_name: guardian.full_name,
      relationship: (guardian.relationship as FormValues['relationship']) ?? 'guardian',
      phone: guardian.phone ?? '',
      email: guardian.email ?? '',
      address: guardian.address ?? '',
    })
  }, [open, guardian, form])

  const saveGuardian = async (values: FormValues) => {
    if (!guardian) return false
    const ok = await update.mutateAsync({
      id: guardian.id,
      data: {
        full_name: values.full_name,
        relationship: values.relationship,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
      },
    })

    if (ok) toast.success('Guardian updated successfully')
    else toast.error('Failed to update guardian')
    return ok
  }

  const onSave = async (values: FormValues) => {
    const ok = await saveGuardian(values)
    if (!ok) return
    onOpenChange(false)
  }

  const onSaveAndInvite = async (values: FormValues) => {
    if (!guardian) return
    if (guardian.has_portal_access) {
      toast.success('This guardian already has portal access.')
      onOpenChange(false)
      return
    }

    const email = (values.email ?? '').trim()
    if (!email) {
      toast.error('Add an email to invite this guardian.')
      return
    }

    const ok = await saveGuardian(values)
    if (!ok) return

    const result = await inviteGuardian.mutateAsync({ guardianId: guardian.id })
    if (result === 'created') {
      toast.success(
        `Portal access created for ${guardian.full_name}. The parent will receive an email to set their password.`,
      )
      onOpenChange(false)
    } else if (result === 'missing_email') {
      toast.error('Cannot invite this guardian because no email address is recorded.')
    } else if (result === 'already_linked') {
      toast.success('This guardian already has portal access.')
      onOpenChange(false)
    } else {
      toast.error('Failed to invite guardian. Please try again or check the email address.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Guardian</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl><Input placeholder="e.g. Thulani Dube" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="relationship" render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input placeholder="+263 77 123 4567" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="guardian@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl><Textarea placeholder="Guardian address..." rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending || isInviting}
              >
                Cancel
              </Button>
              {guardian && !guardian.has_portal_access ? (
                <Button
                  type="button"
                  disabled={isPending || isInviting}
                  onClick={() => void form.handleSubmit(onSaveAndInvite)()}
                >
                  {isPending || isInviting ? 'Saving & inviting...' : 'Save & Invite to portal'}
                </Button>
              ) : (
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

