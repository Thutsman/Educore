import { useState, useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
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
import { useBootstrapHeadmaster } from '../hooks/useSuperAdmin'
import type { SchoolRecord } from '../services/superAdmin'

const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional().default(''),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  school: SchoolRecord
}

export function BootstrapHeadmasterModal({ open, onOpenChange, school }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const mutation = useBootstrapHeadmaster(school.id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { full_name: '', email: '', password: '', phone: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ full_name: '', email: '', password: '', phone: '' })
      setShowPassword(false)
    }
  }, [open, reset])

  const onSubmit = async (values: FormValues) => {
    const result = await mutation.mutateAsync({
      full_name: values.full_name,
      email: values.email,
      password: values.password,
      phone: values.phone || undefined,
    })
    if (result.success) onOpenChange(false)
  }

  const isPending = mutation.isPending || isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add School Admin</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Creating school admin account for <span className="font-medium text-foreground">{school.name}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
            <Input id="full_name" placeholder="John Doe" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hm_email">Email <span className="text-destructive">*</span></Label>
            <Input id="hm_email" type="email" placeholder="headmaster@school.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Temporary Password <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hm_phone">Phone <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="hm_phone" placeholder="+263 77 123 4567" {...register('phone')} />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            A confirmation email will be sent to the school admin. They can log in after confirming their email.
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
