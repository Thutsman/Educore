import { useEffect, useCallback } from 'react'
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
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  useCreateTeacher, useUpdateTeacher,
  useProfilesForTeacher, useDepartmentsForSelect,
  useNextTeacherEmployeeNo,
} from '../hooks/useStaff'
import { isEmployeeNoTaken } from '../services/staff'
import { useSchool } from '@/context/SchoolContext'
import type { Teacher } from '../types'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  profile_id:      z.string().min(1, 'Select a user profile'),
  employee_no:     z.string().min(1, 'Employee number is required'),
  department_id:   z.string().optional(),
  employment_type: z.enum(['permanent', 'contract', 'part_time']),
  join_date:       z.string().optional(),
  qualification:   z.string().optional(),
  specialization:  z.string().optional(),
  status:          z.enum(['active', 'inactive', 'on_leave']),
})

type FormValues = z.infer<typeof schema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher?: Teacher | null
  initialProfileId?: string | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TeacherFormModal({ open, onOpenChange, teacher, initialProfileId }: Props) {
  const isEdit = !!teacher
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''

  const create = useCreateTeacher()
  const update = useUpdateTeacher()
  const { data: profiles = [] }          = useProfilesForTeacher()
  const { data: departments = [] }       = useDepartmentsForSelect()
  const { data: suggestedEmployeeNo }    = useNextTeacherEmployeeNo(!isEdit)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      profile_id:      '',
      employee_no:     '',
      department_id:   '',
      employment_type: 'permanent',
      join_date:       '',
      qualification:   '',
      specialization:  '',
      status:          'active',
    },
  })

  useEffect(() => {
    if (open && teacher) {
      form.reset({
        profile_id:      teacher.profile_id,
        employee_no:     teacher.employee_no,
        department_id:   teacher.department_id ?? '',
        employment_type: teacher.employment_type,
        join_date:       teacher.join_date ?? '',
        qualification:   teacher.qualification ?? '',
        specialization:  teacher.specialization ?? '',
        status:          teacher.status,
      })
    } else if (open && !teacher) {
      form.reset({
        profile_id:      initialProfileId ?? '',
        employee_no:     suggestedEmployeeNo ?? '',
        department_id:   '',
        employment_type: 'permanent',
        join_date:       '',
        qualification:   '',
        specialization:  '',
        status:          'active',
      })
    }
  }, [open, teacher, initialProfileId, suggestedEmployeeNo, form])

  // If the suggestion loads after the modal opens, fill it in (only if field is still empty)
  useEffect(() => {
    if (open && !teacher && suggestedEmployeeNo && !form.getValues('employee_no')) {
      form.setValue('employee_no', suggestedEmployeeNo)
    }
  }, [suggestedEmployeeNo, open, teacher, form])

  const validateEmployeeNo = useCallback(async (value: string) => {
    if (!value || !schoolId) return
    const taken = await isEmployeeNoTaken(value, schoolId, teacher?.id)
    if (taken) {
      form.setError('employee_no', { message: 'This employee number is already in use' })
    } else {
      form.clearErrors('employee_no')
    }
  }, [teacher?.id, schoolId, form])

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      department_id:  values.department_id || undefined,
      join_date:      values.join_date      || undefined,
      qualification:  values.qualification  || undefined,
      specialization: values.specialization || undefined,
    }

    if (isEdit && teacher) {
      const ok = await update.mutateAsync({ id: teacher.id, data: payload })
      if (ok) {
        toast.success('Teacher profile updated.')
        onOpenChange(false)
      } else {
        toast.error('Failed to update teacher. Check the browser console for details.')
      }
    } else {
      const result = await create.mutateAsync(payload)
      if (result) {
        toast.success('Teacher added successfully.')
        onOpenChange(false)
      } else {
        toast.error('Failed to add teacher. The employee number may already be in use, or check the browser console.')
      }
    }
  }

  const isPending = create.isPending || update.isPending

  // In edit mode the profile is already locked — we just show the name
  const currentProfile = isEdit
    ? { id: teacher!.profile_id, full_name: teacher!.full_name, email: teacher!.email }
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Profile — disabled in edit mode, required in create */}
            <FormField control={form.control} name="profile_id" render={({ field }) => (
              <FormItem>
                <FormLabel>User Account *</FormLabel>
                {isEdit ? (
                  <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                    {currentProfile?.full_name}
                    {currentProfile?.email && (
                      <span className="ml-2 text-xs opacity-60">&lt;{currentProfile.email}&gt;</span>
                    )}
                  </div>
                ) : (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user to link" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {profiles.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No unlinked user accounts found
                        </div>
                      ) : (
                        profiles.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="font-medium">{p.full_name}</span>
                            {p.email && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                &lt;{p.email}&gt;
                              </span>
                            )}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
                {!isEdit && (
                  <p className="text-xs text-muted-foreground">
                    Only accounts not yet linked to a teacher record are shown.
                  </p>
                )}
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="employee_no" render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee No. *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="TCH-001"
                      {...field}
                      onBlur={e => { field.onBlur(); validateEmployeeNo(e.target.value) }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="department_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No departments yet — create them in the Academics module first.
                        </div>
                      ) : (
                        departments.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {departments.length === 0 && (
                    <p className="text-xs text-amber-600">
                      No departments yet. Go to <strong>Academics → Departments</strong> to create them. You can save without one and update later.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="employment_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="qualification" render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualification</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. B.Ed, BSc, Dip.Ed" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="specialization" render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mathematics, Science" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    For HR records only. To assign this teacher to actual subjects and classes, use the <strong>Allocations</strong> button on the teacher list after saving.
                  </p>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="join_date" render={({ field }) => (
              <FormItem>
                <FormLabel>Join Date</FormLabel>
                <FormControl>
                  <Input type="date" className="w-48" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Teacher'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
