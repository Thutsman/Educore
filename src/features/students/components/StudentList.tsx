import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Users, UserCheck, UserX, Search } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { getInitials, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useStudents, useClassesForSelect } from '../hooks/useStudents'
import { StudentFormModal } from './StudentFormModal'
import type { Student, StudentFilters } from '../types'

const STATUS_STYLES: Record<string, string> = {
  active:      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  inactive:    'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
  graduated:   'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
  expelled:    'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
  transferred: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
}

export function StudentList() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const canAdd = role === 'headmaster' || role === 'deputy_headmaster'

  const [filters, setFilters] = useState<StudentFilters>({ search: '', classId: 'all', status: 'all' })
  const [showForm, setShowForm] = useState(false)

  const { data: students = [], isLoading } = useStudents(filters)
  const { data: classes = [] } = useClassesForSelect()

  const activeCount = students.filter(s => s.status === 'active').length
  const inactiveCount = students.filter(s => s.status !== 'active').length

  const columns: Column<Student>[] = [
    {
      key: 'admission_no',
      header: 'Adm. No.',
      sortable: true,
      className: 'font-mono text-xs text-muted-foreground',
    },
    {
      key: 'full_name',
      header: 'Student',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
              {getInitials(row.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium leading-tight">{row.full_name}</p>
            {row.email && <p className="text-xs text-muted-foreground">{row.email}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'class_name',
      header: 'Class',
      cell: (row) => row.class_name
        ? <span className="font-medium">{row.class_name}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'gender',
      header: 'Gender',
      cell: (row) => row.gender
        ? <span className="capitalize">{row.gender}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'admission_date',
      header: 'Admitted',
      cell: (row) => formatDate(row.admission_date),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[row.status])}>
          {row.status}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle={`${students.length} student${students.length !== 1 ? 's' : ''} found`}
        actions={
          canAdd ? (
            <Button variant="emerald" onClick={() => setShowForm(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          ) : undefined
        }
      />

      {/* Stats - elevated cards with emerald accent */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Students"
          value={students.length}
          icon={Users}
          iconClassName="bg-emerald-50 text-emerald-600"
          loading={isLoading}
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={UserCheck}
          iconClassName="bg-emerald-50 text-emerald-600"
          loading={isLoading}
        />
        <StatCard
          title="Other Status"
          value={inactiveCount}
          icon={UserX}
          iconClassName="bg-slate-100 text-slate-600"
          loading={isLoading}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or admission number..."
            className="pl-9"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <Select value={filters.classId} onValueChange={v => setFilters(f => ({ ...f, classId: v }))}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="graduated">Graduated</SelectItem>
            <SelectItem value="expelled">Expelled</SelectItem>
            <SelectItem value="transferred">Transferred</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable<Student>
        columns={columns}
        data={students}
        keyExtractor={r => r.id}
        loading={isLoading}
        onRowClick={row => navigate(`/students/${row.id}`)}
      />

      <StudentFormModal open={showForm} onOpenChange={setShowForm} />
    </div>
  )
}
