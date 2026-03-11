import { useEffect, useRef } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateSchool, useUpdateSchool } from '../hooks/useSuperAdmin'
import type { SchoolRecord } from '../services/superAdmin'

const schema = z.object({
  name: z.string().min(2, 'School name is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().email('Invalid email').optional().or(z.literal('')).default(''),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  school?: SchoolRecord | null
}

export function CreateSchoolModal({ open, onOpenChange, school }: Props) {
  const isEdit = !!school
  const createMutation = useCreateSchool()
  const updateMutation = useUpdateSchool()
  const slugManuallyEdited = useRef(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: '',
      slug: '',
      address: '',
      phone: '',
      email: '',
    },
  })

  const nameValue = watch('name')

  useEffect(() => {
    if (open) {
      slugManuallyEdited.current = false
      if (school) {
        reset({
          name: school.name,
          slug: school.slug ?? '',
          address: school.address ?? '',
          phone: school.phone ?? '',
          email: school.email ?? '',
        })
      } else {
        reset({ name: '', slug: '', address: '', phone: '', email: '' })
      }
    }
  }, [open, school, reset])

  useEffect(() => {
    if (!slugManuallyEdited.current && !isEdit) {
      const generated = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setValue('slug', generated, { shouldValidate: false })
    }
  }, [nameValue, isEdit, setValue])

  const onSubmit = async (values: FormValues) => {
    if (isEdit && school) {
      const ok = await updateMutation.mutateAsync({ id: school.id, data: values })
      if (ok) onOpenChange(false)
    } else {
      const result = await createMutation.mutateAsync(values)
      if (result) onOpenChange(false)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit School' : 'Add School'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">School Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. Springfield High School"
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
            <Input
              id="slug"
              placeholder="e.g. springfield-high"
              {...register('slug', {
                onChange: () => { slugManuallyEdited.current = true },
              })}
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            <p className="text-xs text-muted-foreground">Unique identifier used in URLs. Lowercase letters, numbers and hyphens only.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="123 Main Street, City" {...register('address')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+263 77 123 4567" {...register('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="school@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create School'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
