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
import { useCreateStudent, useUpdateStudent, useClassesForSelect } from '../hooks/useStudents'
import type { Student } from '../types'

const schema = z.object({
  full_name:      z.string().min(1, 'Required'),
  admission_no:   z.string().min(1, 'Required'),
  gender:         z.enum(['male', 'female', 'other']).optional(),
  date_of_birth:  z.string().optional(),
  class_id:       z.string().optional(),
  status:         z.enum(['active', 'inactive', 'graduated', 'expelled', 'transferred']),
  admission_date: z.string().optional(),
  address:        z.string().optional(),
  // Guardian (primary) – optional but recommended
  guardian_full_name: z.string().optional(),
  guardian_relationship: z.enum(['father', 'mother', 'guardian', 'other']).optional(),
  guardian_phone: z.string().optional(),
  guardian_email: z.string().email('Invalid email').optional().or(z.literal('')),
  guardian_address: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
}

export function StudentFormModal({ open, onOpenChange, student }: Props) {
  const isEdit = !!student
  const create = useCreateStudent()
  const update = useUpdateStudent()
  const { data: classes = [] } = useClassesForSelect()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '', admission_no: '',
      status: 'active', gender: undefined, date_of_birth: '',
      class_id: '', admission_date: '', address: '',
      guardian_full_name: '', guardian_relationship: undefined, guardian_phone: '', guardian_email: '', guardian_address: '',
    },
  })

  useEffect(() => {
    if (open && student) {
      form.reset({
        full_name:      student.full_name,
        admission_no:   student.admission_no,
        gender:         student.gender ?? undefined,
        date_of_birth:  student.date_of_birth ?? '',
        class_id:       student.class_id ?? '',
        status:         student.status,
        admission_date: student.admission_date ?? '',
        address:        student.address ?? '',
        guardian_full_name: '',
        guardian_relationship: undefined,
        guardian_phone: '',
        guardian_email: '',
        guardian_address: '',
      })
    } else if (open && !student) {
      form.reset({
        full_name: '', admission_no: '',
        status: 'active', gender: undefined, date_of_birth: '',
        class_id: '', admission_date: '', address: '',
        guardian_full_name: '', guardian_relationship: undefined, guardian_phone: '', guardian_email: '', guardian_address: '',
      })
    }
  }, [open, student, form])

  const onSubmit = async (values: FormValues) => {
    const payload = {
      admission_no: values.admission_no,
      full_name: values.full_name,
      date_of_birth: values.date_of_birth || undefined,
      gender: values.gender || undefined,
      address: values.address || undefined,
      status: values.status,
      admission_date: values.admission_date || undefined,
      class_id: values.class_id || undefined,
      guardian_full_name: values.guardian_full_name || undefined,
      guardian_relationship: values.guardian_relationship || undefined,
      guardian_phone: values.guardian_phone || undefined,
      guardian_email: values.guardian_email || undefined,
      guardian_address: values.guardian_address || undefined,
    }
    if (isEdit && student) {
      const ok = await update.mutateAsync({ id: student.id, data: payload })
      if (ok) onOpenChange(false)
    } else {
      const result = await create.mutateAsync(payload as Parameters<typeof create.mutateAsync>[0])
      if (result) onOpenChange(false)
    }
  }

  const isPending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Student' : 'Add New Student'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="admission_no" render={({ field }) => (
                <FormItem>
                  <FormLabel>Admission Number *</FormLabel>
                  <FormControl><Input placeholder="ADM-2025-001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                      <SelectItem value="expelled">Expelled</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="class_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="admission_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Admission Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl><Textarea placeholder="Home address..." rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {!isEdit && (
              <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
                <p className="text-sm font-semibold">Primary Guardian (optional but recommended)</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="guardian_full_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Michael Ndlovu" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="guardian_relationship" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="guardian_phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Phone</FormLabel>
                      <FormControl><Input placeholder="+263 77 123 4567" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="guardian_email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Email</FormLabel>
                      <FormControl><Input type="email" placeholder="guardian@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="guardian_address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guardian Address</FormLabel>
                    <FormControl><Textarea placeholder="Guardian address..." rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Student'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
