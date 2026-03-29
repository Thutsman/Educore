import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAdminResetParentPassword, useCreateGuardianParentAccount, useInviteGuardianAsParent, useUpdateGuardian } from '../hooks/useStudents'
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
  onParentAccountCreated?: (payload: { guardianId: string; email: string; tempPassword: string }) => void
}

export function GuardianFormModal({ open, onOpenChange, guardian, studentId, onParentAccountCreated }: Props) {
  const update = useUpdateGuardian(studentId)
  const isPending = update.isPending
  const inviteGuardian = useInviteGuardianAsParent(studentId)
  const createParentAccount = useCreateGuardianParentAccount(studentId)
  const adminResetPassword = useAdminResetParentPassword()
  const isInviting = inviteGuardian.isPending
  const isCreatingParentAccount = createParentAccount.isPending
  const isResettingPassword = adminResetPassword.isPending
  const [newParentPassword, setNewParentPassword] = useState('')

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

  useEffect(() => {
    if (!open) setNewParentPassword('')
  }, [open])

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

  const onSaveAndCreateParentAccount = async (values: FormValues) => {
    if (!guardian) return
    if (guardian.has_portal_access) {
      toast.success('This guardian already has portal access.')
      onOpenChange(false)
      return
    }

    const email = (values.email ?? '').trim()
    if (!email) {
      toast.error('Add an email to create a parent account.')
      return
    }

    const ok = await saveGuardian(values)
    if (!ok) return

    const result = await createParentAccount.mutateAsync({ guardianId: guardian.id })
    if (result.status === 'created') {
      toast.success(`Parent account created for ${guardian.full_name}.`)
      onParentAccountCreated?.({
        guardianId: guardian.id,
        email: result.email,
        tempPassword: result.tempPassword,
      })
      onOpenChange(false)
      return
    }
    if (result.status === 'missing_email') {
      toast.error('Cannot create account because no email is recorded.')
      return
    }
    if (result.status === 'already_linked') {
      toast.success('This guardian already has portal access.')
      onOpenChange(false)
      return
    }
    toast.error('Failed to create parent account. Please try again.')
  }

  const onSetParentPassword = async () => {
    if (!guardian) return
    if (!guardian.profile_id) {
      toast.error('This guardian does not have a portal account yet.')
      return
    }
    if (newParentPassword.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    const result = await adminResetPassword.mutateAsync({
      guardianId: guardian.id,
      newPassword: newParentPassword,
    })
    if (result.success) {
      toast.success('Parent portal password updated.')
      setNewParentPassword('')
      return
    }
    toast.error(result.error)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Guardian</DialogTitle>
          <DialogDescription className="sr-only">
            Update guardian details and parent portal password when applicable.
          </DialogDescription>
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

            {guardian?.has_portal_access && (
              <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                <Label htmlFor="new-parent-password">New parent portal password</Label>
                <Input
                  id="new-parent-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  value={newParentPassword}
                  onChange={e => setNewParentPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Sets the password immediately. Share it with the parent securely; email delivery is not used.
                </p>
              </div>
            )}

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
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending || isInviting || isCreatingParentAccount}
                    onClick={() => void form.handleSubmit(onSaveAndInvite)()}
                  >
                    {isPending || isInviting ? 'Saving & inviting...' : 'Save & Invite to portal'}
                  </Button>
                  <Button
                    type="button"
                    disabled={isPending || isInviting || isCreatingParentAccount}
                    onClick={() => void form.handleSubmit(onSaveAndCreateParentAccount)()}
                  >
                    {isPending || isCreatingParentAccount ? 'Saving & creating...' : 'Create parent account'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {guardian?.has_portal_access && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending || isResettingPassword || newParentPassword.length < 8}
                      onClick={() => void onSetParentPassword()}
                    >
                      {isResettingPassword ? 'Updating...' : 'Set parent password'}
                    </Button>
                  )}
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

