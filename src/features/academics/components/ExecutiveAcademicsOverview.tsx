import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Percent, TrendingDown, BookMarked, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useAcademicYears, useTerms, useExecutiveClassOverview } from '../hooks/useAcademics'
import { formatPercent } from '@/utils/format'
import type { ExecutiveClassOverviewRow } from '../services/executiveAcademics'

const ATTENDANCE_WARN = 75
const PASS_WARN = 50

function median(nums: number[]): number | null {
  if (!nums.length) return null
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function ExecutiveAcademicsOverview() {
  const { data: years = [], isLoading: yearsLoading } = useAcademicYears()
  const [academicYearId, setAcademicYearId] = useState('')
  const [termId, setTermId] = useState<string>('') // '' = all terms
  const [lookbackDays, setLookbackDays] = useState(30)

  useEffect(() => {
    if (academicYearId || !years.length) return
    const cur = years.find(y => y.is_current)
    setAcademicYearId(cur?.id ?? years[0].id)
  }, [years, academicYearId])

  const { data: terms = [] } = useTerms(academicYearId || undefined)

  const overviewFilters = useMemo(
    () =>
      academicYearId
        ? {
            academicYearId,
            termId: termId || null,
            attendanceLookbackDays: lookbackDays,
          }
        : null,
    [academicYearId, termId, lookbackDays],
  )

  const { data: rows = [], isLoading } = useExecutiveClassOverview(overviewFilters)

  const kpis = useMemo(() => {
    const classCount = rows.length
    const markAvgs = rows.map(r => r.avgMarkPercent).filter((x): x is number => x != null)
    const schoolAvgMark = markAvgs.length
      ? Math.round((markAvgs.reduce((a, b) => a + b, 0) / markAvgs.length) * 10) / 10
      : null
    const lowAtt = rows.filter(r => r.activePupils > 0 && r.attendanceRate < ATTENDANCE_WARN).length
    const lowPass = rows.filter(
      r => r.passRatePercent != null && r.gradeRowCount > 0 && r.passRatePercent < PASS_WARN,
    ).length
    return { classCount, schoolAvgMark, lowAtt, lowPass, medianMark: median(markAvgs) }
  }, [rows])

  const columns: Column<ExecutiveClassOverviewRow>[] = [
    {
      key: 'className',
      header: 'Class',
      sortable: true,
      cell: r => (
        <div>
          <p className="font-medium">{r.className}</p>
          <p className="text-xs text-muted-foreground">
            {r.gradeLevel != null ? `Level ${r.gradeLevel}` : '—'}
            {r.stream ? ` · ${r.stream}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      cell: r => r.departmentName ?? '—',
    },
    {
      key: 'classTeacherName',
      header: 'Class teacher',
      cell: r => r.classTeacherName ?? '—',
    },
    {
      key: 'activePupils',
      header: 'Pupils',
      sortable: true,
      className: 'tabular-nums',
    },
    {
      key: 'attendanceRate',
      header: 'Attendance',
      sortable: true,
      className: 'tabular-nums',
      cell: r =>
        r.activePupils === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className={r.attendanceRate < ATTENDANCE_WARN ? 'font-medium text-amber-600' : ''}>
            {formatPercent(r.attendanceRate)}
          </span>
        ),
    },
    {
      key: 'avgMarkPercent',
      header: 'Avg mark',
      sortable: true,
      cell: r =>
        r.avgMarkPercent == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="tabular-nums">{formatPercent(r.avgMarkPercent)}</span>
        ),
    },
    {
      key: 'passRatePercent',
      header: 'Pass rate',
      sortable: true,
      cell: r =>
        r.passRatePercent == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span
            className={`tabular-nums ${r.passRatePercent < PASS_WARN ? 'font-medium text-amber-600' : ''}`}
          >
            {formatPercent(r.passRatePercent)}
          </span>
        ),
    },
    {
      key: 'subjectAllocations',
      header: 'Subjects',
      sortable: true,
      className: 'tabular-nums text-muted-foreground',
      cell: r => <span title="Teacher–subject allocations this year">{r.subjectAllocations}</span>,
    },
    {
      key: 'scheme' as keyof ExecutiveClassOverviewRow,
      header: 'Scheme books',
      cell: r => (
        <span className="text-xs text-muted-foreground">
          <span title="Awaiting HOD">{r.schemeAwaitingHod}H</span>
          {' · '}
          <span title="Awaiting executive">{r.schemeAwaitingFinal}E</span>
          {' · '}
          <span title="Fully approved">{r.schemeFullyApproved}✓</span>
        </span>
      ),
    },
    {
      key: 'assignmentsInTerm',
      header: 'Assign.',
      className: 'tabular-nums text-muted-foreground',
      cell: r =>
        r.assignmentsInTerm === 0 ? (
          '—'
        ) : (
          <span title="Assignment hand-in rate (term filter)">
            {r.assignmentsInTerm}
            {r.assignmentSubmissionRate != null && (
              <span className="text-muted-foreground"> ({formatPercent(r.assignmentSubmissionRate)})</span>
            )}
          </span>
        ),
    },
    {
      key: 'assessmentAvgPercent',
      header: 'Assess.',
      cell: r =>
        r.assessmentAvgPercent == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="tabular-nums" title={`${r.assessmentMarkCount} marks`}>
            {formatPercent(r.assessmentAvgPercent)}
          </span>
        ),
    },
    {
      key: 'actions' as keyof ExecutiveClassOverviewRow,
      header: '',
      className: 'text-right',
      cell: r => (
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <Link to={`/students?classId=${encodeURIComponent(r.classId)}`}>
            Students <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academics"
        subtitle="Read-only overview of class performance: attendance, exam results, allocations, scheme books, assignments, and assessments"
      />

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-2 sm:min-w-[200px]">
          <Label>Academic year</Label>
          <Select
            value={academicYearId}
            onValueChange={v => {
              setAcademicYearId(v)
              setTermId('')
            }}
            disabled={yearsLoading || !years.length}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                  {y.is_current ? ' (current)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:min-w-[200px]">
          <Label>Term (optional)</Label>
          <Select value={termId || 'all'} onValueChange={v => setTermId(v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All terms</SelectItem>
              {terms.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                  {t.is_current ? ' (current)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:min-w-[160px]">
          <Label>Attendance window</Label>
          <Select value={String(lookbackDays)} onValueChange={v => setLookbackDays(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Classes"
          value={kpis.classCount}
          subtitle="In selected academic year"
          icon={Users}
          iconClassName="bg-blue-500/10 text-blue-500"
          loading={isLoading && !!academicYearId}
        />
        <StatCard
          title="School avg mark"
          value={kpis.schoolAvgMark != null ? formatPercent(kpis.schoolAvgMark) : '—'}
          subtitle={
            kpis.medianMark != null
              ? `Median class average ${formatPercent(kpis.medianMark)}`
              : 'From exam grade entries'
          }
          icon={Percent}
          iconClassName="bg-violet-500/10 text-violet-500"
          loading={isLoading && !!academicYearId}
        />
        <StatCard
          title="Low attendance"
          value={kpis.lowAtt}
          subtitle={`Classes under ${ATTENDANCE_WARN}% (${lookbackDays}d window)`}
          icon={TrendingDown}
          iconClassName="bg-amber-500/10 text-amber-600"
          loading={isLoading && !!academicYearId}
        />
        <StatCard
          title="Low pass rate"
          value={kpis.lowPass}
          subtitle={`Classes under ${PASS_WARN}% pass (selected exams)`}
          icon={BookMarked}
          iconClassName="bg-rose-500/10 text-rose-600"
          loading={isLoading && !!academicYearId}
        />
      </div>

      <DataTable<ExecutiveClassOverviewRow>
        columns={columns}
        data={rows}
        keyExtractor={r => r.classId}
        loading={isLoading && !!academicYearId}
        emptyState={
          academicYearId && !isLoading && rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No classes for this academic year. School admins create classes under the standard Academics
              setup.
            </p>
          ) : undefined
        }
      />

      {rows.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Scheme books: H = awaiting HOD, E = awaiting executive approval, ✓ = fully approved. Assign. shows
          count for the term filter and hand-in rate vs expected submissions.
        </p>
      )}
    </div>
  )
}
