import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useGetRolesForUser, useSetUserRoles } from '../hooks/useStaff'
import { cn } from '@/utils/cn'
import type { StaffRole } from '../types'

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'headmaster',        label: 'Headmaster' },
  { value: 'deputy_headmaster', label: 'Deputy Headmaster' },
  { value: 'bursar',            label: 'Bursar' },
  { value: 'hod',               label: 'Head of Department (HOD)' },
  { value: 'teacher',           label: 'Teacher' },
  { value: 'class_teacher',     label: 'Class Teacher' },
  { value: 'non_teaching_staff', label: 'Non-Teaching Staff' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  userName: string
}

export function ManageRolesModal({ open, onOpenChange, userId, userName }: Props) {
  const { data: currentRoles = [], isLoading } = useGetRolesForUser(userId, open && !!userId)
  const setRoles = useSetUserRoles()
  const [pending, setPending] = useState<string[]>([])

  useEffect(() => {
    if (open && currentRoles.length >= 0) setPending([...currentRoles])
  }, [open, currentRoles])

  const handleToggle = (roleName: string) => {
    setPending(prev =>
      prev.includes(roleName)
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    )
  }

  const handleSave = () => {
    if (!userId) return
    if (pending.length === 0) {
      toast.error('User must have at least one role.')
      return
    }
    setRoles.mutate(
      { userId, roleNames: pending },
      {
        onSuccess: (ok) => {
          if (ok) {
            toast.success('Roles updated.')
            onOpenChange(false)
          } else {
            toast.error('Failed to update roles.')
          }
        },
        onError: () => toast.error('Failed to update roles.'),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage roles — {userName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Assign one or more roles (e.g. Teacher + Class Teacher for both subject and class teacher modules).
        </p>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="grid grid-cols-2 gap-2 rounded-md border border-border p-3">
            {ROLE_OPTIONS.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => handleToggle(r.value)}
                className={cn(
                  'rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors',
                  pending.includes(r.value)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || pending.length === 0 || setRoles.isPending}>
            {setRoles.isPending ? 'Saving...' : 'Save roles'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
