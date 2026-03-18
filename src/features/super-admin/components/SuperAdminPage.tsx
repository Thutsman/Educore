import { useState } from 'react'
import { Pencil, UserPlus, School, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { cn } from '@/utils/cn'
import { useAllSchools } from '../hooks/useSuperAdmin'
import { CreateSchoolModal } from './CreateSchoolModal'
import { BootstrapHeadmasterModal } from './BootstrapHeadmasterModal'
import type { SchoolRecord } from '../services/superAdmin'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function SuperAdminPage() {
  const { data: schools = [], isLoading } = useAllSchools()
  const [schoolModalOpen, setSchoolModalOpen] = useState(false)
  const [editSchool, setEditSchool] = useState<SchoolRecord | null>(null)
  const [bootstrapSchool, setBootstrapSchool] = useState<SchoolRecord | null>(null)

  const totalHeadmasters = schools.reduce((sum, s) => sum + s.headmaster_count, 0)

  const columns: Column<SchoolRecord>[] = [
    {
      key: 'name',
      header: 'School',
      sortable: true,
      cell: r => (
        <div>
          <p className="font-medium leading-tight">{r.name}</p>
          {r.slug && <p className="text-xs text-muted-foreground font-mono">{r.slug}</p>}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact',
      cell: r => (
        <div>
          {r.email && <p className="text-sm">{r.email}</p>}
          {r.phone && <p className="text-xs text-muted-foreground">{r.phone}</p>}
          {!r.email && !r.phone && <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: 'headmaster_count',
      header: 'School Admins',
      cell: r => (
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
            r.headmaster_count >= 1
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          )}
        >
          {r.headmaster_count}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: r => <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span>,
    },
    {
      key: 'actions' as keyof SchoolRecord,
      header: '',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={e => { e.stopPropagation(); setEditSchool(r); setSchoolModalOpen(true) }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={e => { e.stopPropagation(); setBootstrapSchool(r) }}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add School Admin
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin"
        subtitle="Manage schools and bootstrap school admin accounts"
        actions={
          <Button
            onClick={() => { setEditSchool(null); setSchoolModalOpen(true) }}
          >
            <School className="mr-2 h-4 w-4" />
            Add School
          </Button>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:w-96">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <School className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{schools.length}</p>
              <p className="text-xs text-muted-foreground">Total Schools</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalHeadmasters}</p>
              <p className="text-xs text-muted-foreground">Total School Admins</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable<SchoolRecord>
        columns={columns}
        data={schools}
        keyExtractor={r => r.id}
        loading={isLoading}
      />

      <CreateSchoolModal
        open={schoolModalOpen}
        onOpenChange={open => {
          setSchoolModalOpen(open)
          if (!open) setEditSchool(null)
        }}
        school={editSchool}
      />

      {bootstrapSchool && (
        <BootstrapHeadmasterModal
          open={!!bootstrapSchool}
          onOpenChange={open => { if (!open) setBootstrapSchool(null) }}
          school={bootstrapSchool}
        />
      )}
    </div>
  )
}
