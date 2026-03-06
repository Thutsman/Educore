import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCreateUserAccount } from '../hooks/useStaff'
import type { StaffRole } from '../types'

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'teacher',           label: 'Teacher' },
  { value: 'class_teacher',     label: 'Class Teacher' },
  { value: 'hod',               label: 'Head of Department (HOD)' },
  { value: 'bursar',            label: 'Bursar' },
  { value: 'deputy_headmaster', label: 'Deputy Headmaster' },
  { value: 'non_teaching_staff', label: 'Non-Teaching Staff' },
]

const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  role: z.enum(['teacher', 'class_teacher', 'hod', 'bursar', 'deputy_headmaster', 'non_teaching_staff']),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a teacher/class_teacher account is created so the parent can open the teacher form. */
  onTeacherCreated?: (profileId: string) => void
}

export function CreateUserAccountModal({ open, onOpenChange, onTeacherCreated }: Props) {
  const create = useCreateUserAccount()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      phone: '',
      role: 'teacher',
    },
  })

  const selectedRole = form.watch('role')
  const isTeacherRole = selectedRole === 'teacher' || selectedRole === 'class_teacher'

  const onSubmit = async (values: FormValues) => {
    const result = await create.mutateAsync({
      ...values,
      phone: values.phone || undefined,
    })
    if (!result) {
      toast.error('Failed to create user account. Check that the email is not already in use.')
      return
    }
    form.reset()
    onOpenChange(false)
    if (isTeacherRole && onTeacherCreated) {
      onTeacherCreated(result.id)
    } else {
      toast.success('User account created successfully.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create User Account</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl><Input placeholder="e.g. Thulani Dube" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl><Input type="email" placeholder="teacher@school.edu" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input placeholder="+263..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Password *</FormLabel>
                  <FormControl><Input type="password" placeholder="At least 8 characters" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <p className="text-xs text-muted-foreground">
              {isTeacherRole
                ? 'After creating the account, you\'ll be taken directly to fill in employment details.'
                : 'The account will be ready to use immediately after creation.'}
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Creating...' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
