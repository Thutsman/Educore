import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useTeachers, useStaffMembers } from '../hooks/useStaff'
import { TeacherFormModal } from './TeacherFormModal'
import type { Teacher, StaffMember } from '../types'

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  inactive: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  on_leave: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
}

function TeachersTab() {
  const { data: teachers = [], isLoading } = useTeachers()
  const [showForm, setShowForm]       = useState(false)
  const [selected, setSelected]       = useState<Teacher | null>(null)

  const openCreate = () => { setSelected(null); setShowForm(true) }
  const openEdit   = (t: Teacher) => { setSelected(t); setShowForm(true) }

  const columns: Column<Teacher>[] = [
    {
      key: 'full_name', header: 'Teacher', sortable: true,
      cell: r => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(r.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium leading-tight">{r.full_name}</p>
            {r.email && <p className="text-xs text-muted-foreground">{r.email}</p>}
          </div>
        </div>
      ),
    },
    { key: 'employee_no', header: 'Employee No.', className: 'font-mono text-xs text-muted-foreground' },
    { key: 'specialization', header: 'Specialization', cell: r => r.specialization || '—' },
    { key: 'department_name', header: 'Department', cell: r => r.department_name || '—' },
    {
      key: 'employment_type', header: 'Type',
      cell: r => (
        <span className="capitalize text-sm">{r.employment_type.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'status', header: 'Status',
      cell: r => (
        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[r.status])}>
          {r.status.replace('_', ' ')}
        </span>
      ),
    },
  ]

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      <DataTable<Teacher>
        columns={columns}
        data={teachers}
        keyExtractor={r => r.id}
        loading={isLoading}
        onRowClick={openEdit}
      />

      <TeacherFormModal
        open={showForm}
        onOpenChange={setShowForm}
        teacher={selected}
      />
    </>
  )
}

function StaffTab() {
  const { data: staff = [], isLoading } = useStaffMembers()

  const columns: Column<StaffMember>[] = [
    {
      key: 'full_name', header: 'Staff Member', sortable: true,
      cell: r => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
              {getInitials(r.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium leading-tight">{r.full_name}</p>
            {r.email && <p className="text-xs text-muted-foreground">{r.email}</p>}
          </div>
        </div>
      ),
    },
    { key: 'employee_no', header: 'Employee No.', className: 'font-mono text-xs text-muted-foreground' },
    { key: 'role_name', header: 'Role', cell: r => <span className="capitalize">{r.role_name.replace(/_/g, ' ')}</span> },
    { key: 'phone', header: 'Phone', cell: r => r.phone || '—' },
    {
      key: 'status', header: 'Status',
      cell: r => (
        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[r.status])}>
          {r.status.replace('_', ' ')}
        </span>
      ),
    },
  ]

  return (
    <DataTable<StaffMember>
      columns={columns}
      data={staff}
      keyExtractor={r => r.id}
      loading={isLoading}
    />
  )
}

export function StaffPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Staff Management" subtitle="Teachers and non-teaching staff" />
      <Tabs defaultValue="teachers">
        <TabsList>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="staff">Non-Teaching Staff</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="teachers"><TeachersTab /></TabsContent>
          <TabsContent value="staff"><StaffTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
