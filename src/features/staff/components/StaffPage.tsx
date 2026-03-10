import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useTeachers, useStaffMembers, useProfilesForTeacher } from '../hooks/useStaff'
import { TeacherFormModal } from './TeacherFormModal'
import { CreateUserAccountModal } from './CreateUserAccountModal'
import { ManageRolesModal } from './ManageRolesModal'
import { TeacherAllocationsModal } from './TeacherAllocationsModal'
import type { Teacher, StaffMember, ProfileOption } from '../types'

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  inactive: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  on_leave: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
}

function TeachersTab() {
  const { data: teachers = [], isLoading } = useTeachers()
  const { data: unlinkedAccounts = [], isLoading: accountsLoading } = useProfilesForTeacher()
  const [showForm, setShowForm] = useState(false)
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [selected, setSelected] = useState<Teacher | null>(null)
  const [initialProfileId, setInitialProfileId] = useState<string | null>(null)
  const [manageRolesUser, setManageRolesUser] = useState<{ id: string; name: string } | null>(null)
  const [allocationsTeacher, setAllocationsTeacher] = useState<{ id: string; name: string } | null>(null)

  const openCreate = (profileId?: string, fromAccountCreation?: boolean) => {
    setSelected(null)
    setInitialProfileId(profileId ?? null)
    setShowForm(true)
    if (fromAccountCreation) {
      toast.info('Account created. Complete the teacher profile below.', { duration: 4000 })
    }
  }
  const openEdit = (t: Teacher) => {
    setSelected(t)
    setInitialProfileId(null)
    setShowForm(true)
  }

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
      key: 'homeroom_class_name', header: 'Homeroom Class',
      cell: r => r.homeroom_class_name
        ? <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{r.homeroom_class_name}</span>
        : <span className="text-xs text-muted-foreground">—</span>,
    },
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
    {
      key: 'actions' as keyof Teacher,
      header: '',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={e => { e.stopPropagation(); setAllocationsTeacher({ id: r.id, name: r.full_name }) }}
          >
            Allocations
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={e => { e.stopPropagation(); setManageRolesUser({ id: r.profile_id, name: r.full_name }) }}
          >
            Manage roles
          </Button>
        </div>
      ),
    },
  ]
  const unlinkedColumns: Column<ProfileOption>[] = [
    { key: 'full_name', header: 'Name', sortable: true, cell: r => <span className="font-medium">{r.full_name}</span> },
    { key: 'email', header: 'Email', cell: r => r.email ?? '—' },
    {
      key: 'actions' as keyof ProfileOption,
      header: '',
      className: 'text-right',
      cell: r => (
        <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); openCreate(r.id) }}>
          Link as Teacher
        </Button>
      ),
    },
  ]

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" className="mr-2" onClick={() => setShowAccountForm(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User Account
        </Button>
        <Button onClick={() => openCreate()}>
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

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold">Unlinked User Accounts</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Newly created accounts appear here until they are linked to a teacher record.
        </p>
        <DataTable<ProfileOption>
          columns={unlinkedColumns}
          data={unlinkedAccounts}
          keyExtractor={r => r.id}
          loading={accountsLoading}
        />
      </div>

      <TeacherFormModal
        open={showForm}
        onOpenChange={setShowForm}
        teacher={selected}
        initialProfileId={initialProfileId}
      />
      <CreateUserAccountModal
        open={showAccountForm}
        onOpenChange={setShowAccountForm}
        onTeacherCreated={profileId => {
          setShowAccountForm(false)
          openCreate(profileId, true)
        }}
      />
      <ManageRolesModal
        open={!!manageRolesUser}
        onOpenChange={open => !open && setManageRolesUser(null)}
        userId={manageRolesUser?.id ?? null}
        userName={manageRolesUser?.name ?? ''}
      />
      <TeacherAllocationsModal
        open={!!allocationsTeacher}
        onOpenChange={open => !open && setAllocationsTeacher(null)}
        teacherId={allocationsTeacher?.id ?? null}
        teacherName={allocationsTeacher?.name ?? ''}
      />
    </>
  )
}

function StaffTab() {
  const { data: staff = [], isLoading } = useStaffMembers()
  const [manageRolesUser, setManageRolesUser] = useState<{ id: string; name: string } | null>(null)

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
    {
      key: 'actions' as keyof StaffMember,
      header: '',
      className: 'text-right',
      cell: r => (
        <Button
          variant="ghost"
          size="sm"
          onClick={e => { e.stopPropagation(); setManageRolesUser({ id: r.profile_id, name: r.full_name }) }}
        >
          Manage roles
        </Button>
      ),
    },
  ]

  return (
    <>
      <DataTable<StaffMember>
        columns={columns}
        data={staff}
        keyExtractor={r => r.id}
        loading={isLoading}
      />
      <ManageRolesModal
        open={!!manageRolesUser}
        onOpenChange={open => !open && setManageRolesUser(null)}
        userId={manageRolesUser?.id ?? null}
        userName={manageRolesUser?.name ?? ''}
      />
    </>
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
