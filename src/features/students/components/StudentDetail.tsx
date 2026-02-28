import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit, Trash2, User, GraduationCap, Wallet, Users,
  Phone, Mail, MapPin, Calendar, Hash,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { getInitials, formatDate, formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import {
  useStudent, useStudentGuardians, useStudentFeeSummary,
  useDeleteStudent,
} from '../hooks/useStudents'
import { StudentFormModal } from './StudentFormModal'

const STATUS_STYLES: Record<string, string> = {
  active:      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  inactive:    'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
  graduated:   'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
  expelled:    'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
  transferred: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '—'}</p>
      </div>
    </div>
  )
}

export function StudentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role } = useAuth()
  const canEdit = role === 'headmaster' || role === 'deputy_headmaster'

  const { data: student, isLoading } = useStudent(id ?? null)
  const { data: guardians = [] } = useStudentGuardians(id ?? null)
  const { data: fees } = useStudentFeeSummary(id ?? null)
  const deleteStudent = useDeleteStudent()

  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = async () => {
    if (!id) return
    const ok = await deleteStudent.mutateAsync(id)
    if (ok) navigate('/students')
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Student not found.</p>
        <Button variant="outline" onClick={() => navigate('/students')}>Back to Students</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/students"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader
          title={student.full_name}
          subtitle={`${student.admission_no} · Admitted ${formatDate(student.admission_date)}`}
          actions={
            canEdit ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                  <Edit className="mr-2 h-4 w-4" />Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />Delete
                </Button>
              </div>
            ) : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">

          {/* Identity card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                  {getInitials(student.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold">{student.full_name}</h2>
                <p className="text-sm text-muted-foreground capitalize">{student.gender ?? 'Unknown gender'}</p>
                <span className={cn('mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[student.status])}>
                  {student.status}
                </span>
              </div>
            </div>

            <Separator className="mb-6" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow icon={Hash} label="Admission Number" value={student.admission_no} />
              <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(student.date_of_birth)} />
              <InfoRow icon={Phone} label="Phone" value={student.phone} />
              <InfoRow icon={Mail} label="Email" value={student.email} />
              <InfoRow icon={MapPin} label="Address" value={student.address} />
            </div>
          </div>

          {/* Academic info */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <GraduationCap className="h-4 w-4 text-primary" />
              Academic Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow icon={User} label="Current Class" value={student.class_name} />
              <InfoRow icon={Calendar} label="Admission Date" value={formatDate(student.admission_date)} />
            </div>
          </div>

        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Fee summary */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Wallet className="h-4 w-4 text-primary" />
              Fee Summary
            </h3>
            {fees ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Invoiced</span>
                  <span className="font-medium">{formatCurrency(fees.totalInvoiced)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(fees.totalPaid)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Outstanding Balance</span>
                  <span className={fees.balance > 0 ? 'text-red-600' : 'text-emerald-600'}>
                    {formatCurrency(fees.balance)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{fees.invoiceCount} invoice{fees.invoiceCount !== 1 ? 's' : ''}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No fee records found.</p>
            )}
          </div>

          {/* Guardians */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-primary" />
              Guardians
            </h3>
            {guardians.length === 0 ? (
              <p className="text-sm text-muted-foreground">No guardians recorded.</p>
            ) : (
              <div className="space-y-4">
                {guardians.map(g => (
                  <div key={g.id} className={cn('rounded-lg p-3', g.is_primary ? 'bg-primary/5 border border-primary/20' : 'bg-muted/40')}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{g.full_name}</p>
                      {g.is_primary && <span className="text-[10px] font-semibold uppercase text-primary">Primary</span>}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{g.relationship}</p>
                    {g.phone && <p className="mt-1 text-xs">{g.phone}</p>}
                    {g.email && <p className="text-xs text-muted-foreground">{g.email}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Edit modal */}
      <StudentFormModal open={showEdit} onOpenChange={setShowEdit} student={student} />

      {/* Delete confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{student.full_name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteStudent.isPending}>
              {deleteStudent.isPending ? 'Deleting...' : 'Delete Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
