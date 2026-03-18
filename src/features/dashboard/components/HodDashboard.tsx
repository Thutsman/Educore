import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format as formatDateFns, parseISO } from 'date-fns'
import {
  Users,
  ClipboardCheck,
  AlertTriangle,
  BookOpen,
  UserCog,
  LineChart,
  HelpCircle,
  BookMarked,
  TrendingUp,
  TrendingDown,
  FileText,
  CalendarDays,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell,
} from 'recharts'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import {
  useHodTeacher,
  usePendingSchemeApprovals,
  useDepartmentTeacherWorkload,
} from '@/features/dashboard/hooks/useHodDashboard'
import { useSchool } from '@/context/SchoolContext'
import { useAcademicYears, useTerms } from '@/features/academics/hooks/useAcademics'
import type {
  DepartmentTeacherRow,
} from '@/services/hod-dashboard'
import {
  getHodPassRateVsSchool,
  getHodAttendanceTrend,
  getHodAtRiskCount,
  getHodSchemeCompliance,
  getHodSubjectPerformance,
  getHodUpcomingAssessments,
  getHodTeacherLessonPlanStatus,
  getHodActivityFeed,
  type HodActivityItem,
} from '@/services/hod-dashboard'
import { formatPercent, formatRelativeTime } from '@/utils/format'

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-16 animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return <div className="w-full animate-pulse rounded-lg bg-muted" style={{ height }} />
}

function subjectBarFill(avg: number): string {
  if (avg >= 50) return 'rgb(34 197 94)' // green-500
  if (avg >= 40) return 'rgb(245 158 11)' // amber-500
  return 'rgb(239 68 68)' // red-500
}

type LessonPlanStatus = 'submitted' | 'pending'

type DepartmentTeacherRowWithLessonPlans = DepartmentTeacherRow & {
  lessonPlansThisWeek: LessonPlanStatus
}

const TEACHER_COLUMNS: Column<DepartmentTeacherRowWithLessonPlans>[] = [
  { key: 'teacherName', header: 'Teacher', sortable: true },
  {
    key: 'employeeNo',
    header: 'Emp. No.',
    className: 'text-muted-foreground tabular-nums',
  },
  {
    key: 'classCount',
    header: 'Classes',
    sortable: true,
    cell: row => (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {row.classCount}
      </span>
    ),
  },
  {
    key: 'subjectCount',
    header: 'Subjects',
    sortable: true,
    cell: row => (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/10 text-xs font-semibold text-violet-500">
        {row.subjectCount}
      </span>
    ),
  },
  {
    key: 'lessonPlansThisWeek',
    header: "This Week's Lesson Plans",
    cell: row => (
      <span
        className={[
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums',
          row.lessonPlansThisWeek === 'submitted'
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        ].join(' ')}
      >
        {row.lessonPlansThisWeek === 'submitted' ? 'Submitted' : 'Pending'}
      </span>
    ),
  },
]

const HOD_QUICK_LINKS = [
  { to: '/class-analytics', label: 'Class Analytics', icon: LineChart },
  { to: '/reports', label: 'Term Reports', icon: ClipboardCheck },
  { to: '/assessments', label: 'Assessments', icon: BookOpen },
  { to: '/attendance', label: 'Attendance', icon: Users },
  { to: '/lesson-plans', label: 'Lesson Plans', icon: CalendarDays },
]

export function HodDashboard() {
  const { profile, user } = useAuth()
  const { teacher, isLoading: teacherLoading } = useHodTeacher()
  const departmentId = teacher?.department_id ?? null

  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''

  const { data: pendingApprovals = 0, isLoading: pendingLoading } = usePendingSchemeApprovals()

  const { data: years = [] } = useAcademicYears()
  const currentYearId = useMemo(() => years.find(y => y.is_current)?.id, [years])
  const { data: terms = [] } = useTerms(currentYearId)
  const currentTermId = useMemo(() => terms.find(t => t.is_current)?.id, [terms])

  const passRateQuery = useQuery({
    queryKey: ['hod-dash', 'pass-rate-vs-school', schoolId, departmentId ?? ''],
    queryFn: () => getHodPassRateVsSchool(schoolId, departmentId!),
    enabled: !!schoolId && !!departmentId,
    staleTime: 5 * 60 * 1000,
  })

  const attendanceTrendQuery = useQuery({
    queryKey: ['hod-dash', 'attendance-trend', schoolId, departmentId ?? ''],
    queryFn: () => getHodAttendanceTrend(schoolId, departmentId!),
    enabled: !!schoolId && !!departmentId,
    staleTime: 5 * 60 * 1000,
  })

  const atRiskCountQuery = useQuery({
    queryKey: ['hod-dash', 'at-risk-count', schoolId, departmentId ?? ''],
    queryFn: () => getHodAtRiskCount(schoolId, departmentId!),
    enabled: !!schoolId && !!departmentId,
    staleTime: 10 * 60 * 1000,
  })

  const schemeComplianceQuery = useQuery({
    queryKey: ['hod-dash', 'scheme-compliance', schoolId, departmentId ?? '', currentTermId ?? ''],
    queryFn: () => getHodSchemeCompliance(schoolId, departmentId!, currentTermId),
    enabled: !!schoolId && !!departmentId && !!currentTermId,
    staleTime: 10 * 60 * 1000,
  })

  const subjectPerformanceQuery = useQuery({
    queryKey: ['hod-dash', 'subject-performance', schoolId, departmentId ?? ''],
    queryFn: () => getHodSubjectPerformance(schoolId, departmentId!),
    enabled: !!schoolId && !!departmentId,
    staleTime: 10 * 60 * 1000,
  })

  const upcomingAssessmentsQuery = useQuery({
    queryKey: ['hod-dash', 'upcoming-assessments', schoolId, departmentId ?? ''],
    queryFn: () => getHodUpcomingAssessments(schoolId, departmentId!),
    enabled: !!schoolId && !!departmentId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: teachers = [], isLoading: teacherRowsLoading } = useDepartmentTeacherWorkload(departmentId)

  const teacherLessonPlanStatusQuery = useQuery({
    queryKey: ['hod-dash', 'teacher-lesson-plan-status', schoolId, departmentId ?? ''],
    queryFn: () => getHodTeacherLessonPlanStatus(schoolId, departmentId!),
    enabled: !!schoolId && !!departmentId,
    staleTime: 5 * 60 * 1000,
  })

  const mergedTeacherRows = useMemo(() => {
    const byEmployeeNo = new Map(
      (teacherLessonPlanStatusQuery.data ?? []).map(s => [s.employeeNo, s])
    )
    return (teachers ?? []).map(t => {
      const status = byEmployeeNo.get(t.employeeNo)
      return {
        ...t,
        lessonPlansThisWeek: status?.submitted ? 'submitted' : 'pending',
      }
    }) as Array<DepartmentTeacherRow & { lessonPlansThisWeek: LessonPlanStatus }>
  }, [teachers, teacherLessonPlanStatusQuery.data])

  const activityFeedQuery = useQuery({
    queryKey: ['hod-dash', 'activity-feed', schoolId, departmentId ?? ''],
    queryFn: () => getHodActivityFeed(schoolId, departmentId!),
    enabled: !!schoolId && !!departmentId,
    staleTime: 5 * 60 * 1000,
  })

  const [activeTab, setActiveTab] = useState('overview')
  const [hasSeen, setHasSeen] = useState(true)
  const [tabInitialized, setTabInitialized] = useState(false)

  useEffect(() => {
    if (!tabInitialized && user?.id) {
      const key = `educore_help_seen_${user.id}`
      const seen = !!localStorage.getItem(key)
      setHasSeen(seen)
      setActiveTab(seen ? 'overview' : 'help')
      setTabInitialized(true)
    }
  }, [user?.id, tabInitialized])

  const handleTabChange = (val: string) => {
    setActiveTab(val)
    if (val === 'help' && user?.id) {
      localStorage.setItem(`educore_help_seen_${user.id}`, 'true')
      setHasSeen(true)
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'HOD'

  const isDeptMissing = !teacherLoading && !departmentId

  const passVsSchool = passRateQuery.data
  const passEmpty = !passVsSchool || (passVsSchool.deptAvg === 0 && passVsSchool.schoolAvg === 0)
  const passAbove = passVsSchool ? passVsSchool.deptAvg >= passVsSchool.schoolAvg : false

  const attendanceTrend = attendanceTrendQuery.data
  const attendanceEmpty = !attendanceTrend || (attendanceTrend.thisWeek === 0 && attendanceTrend.lastWeek === 0)
  const attendanceUp = attendanceTrend ? attendanceTrend.thisWeek >= attendanceTrend.lastWeek : false

  const atRiskCount = atRiskCountQuery.data ?? 0
  const schemeCompliance = schemeComplianceQuery.data
  const schemeComplianceEmpty = !schemeCompliance || schemeCompliance.total === 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle="Department-level academic and staff overview"
        actions={
          activeTab === 'overview' ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleTabChange('help')}
            >
              <HelpCircle className="h-4 w-4" />
              Help Guide
              {!hasSeen && (
                <span className="ml-0.5 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              )}
            </Button>
          ) : null
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="help" className="relative text-sm">
            Help Guide
            {!hasSeen && (
              <span className="ml-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-8">
          {isDeptMissing && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-400">No department set</p>
                <p className="mt-1 text-amber-700 dark:text-amber-500">
                  Your user account is not yet linked to a department as HOD. Ask your school
                  administrator to assign you as the head of a department.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {(
              passRateQuery.isLoading
              || attendanceTrendQuery.isLoading
              || atRiskCountQuery.isLoading
              || pendingLoading
              || schemeComplianceQuery.isLoading
            ) ? (
              Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
            ) : (
              <>
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium text-muted-foreground">Dept Pass Rate</p>
                      <p
                        className={[
                          'text-3xl font-bold tracking-tight tabular-nums',
                          passEmpty
                            ? 'text-foreground'
                            : passAbove
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-destructive',
                        ].join(' ')}
                      >
                        {passEmpty ? '—' : formatPercent(passVsSchool!.deptAvg, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {passEmpty ? 'No assessment data' : `vs school avg: ${formatPercent(passVsSchool!.schoolAvg, 0)}`}
                      </p>
                    </div>
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                        passEmpty || passAbove ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      <BookOpen className="h-5 w-5" />
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium text-muted-foreground">Dept Attendance (This Week)</p>
                      <p
                        className={[
                          'text-3xl font-bold tracking-tight tabular-nums',
                          attendanceEmpty
                            ? 'text-foreground'
                            : attendanceUp
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-destructive',
                        ].join(' ')}
                      >
                        {attendanceEmpty ? '—' : formatPercent(attendanceTrend!.thisWeek, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {attendanceEmpty ? 'No attendance data' : (
                          <span className={attendanceUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}>
                            {attendanceUp ? <TrendingUp className="inline h-3.5 w-3.5" /> : <TrendingDown className="inline h-3.5 w-3.5" />}
                            <span className="ml-1">vs last week</span>
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                      <ClipboardCheck className="h-5 w-5" />
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium text-muted-foreground">At-risk Learners</p>
                      <Link
                        to="/students?filter=at-risk&dept=true"
                        className="block text-3xl font-bold tracking-tight tabular-nums text-destructive hover:underline"
                      >
                        {atRiskCount.toLocaleString()}
                      </Link>
                      <p className="text-xs text-muted-foreground">Below pass threshold</p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-xs font-medium leading-tight text-muted-foreground">
                        Scheme Book Compliance
                      </p>
                      <p className="text-3xl font-bold tracking-tight tabular-nums">
                        {schemeComplianceEmpty ? '—' : `${schemeCompliance!.submitted} / ${schemeCompliance!.total}`}
                      </p>
                      <p className="text-xs text-muted-foreground">This term</p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                      <BookOpen className="h-5 w-5" />
                    </span>
                  </div>
                </div>

                <Link
                  to="/scheme-book"
                  className="block rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium text-muted-foreground">Pending Approvals</p>
                      <p className="text-3xl font-bold tracking-tight tabular-nums">{pendingApprovals}</p>
                      <p className="text-xs text-muted-foreground">Scheme books · Lesson plans</p>
                    </div>
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                        pendingApprovals > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      <BookMarked className="h-5 w-5" />
                    </span>
                  </div>
                </Link>
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[60%_40%]">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Subject Performance</h3>
                <p className="text-xs text-muted-foreground">
                  Average score per subject · Latest assessment window
                </p>
              </div>
              {subjectPerformanceQuery.isLoading ? (
                <ChartSkeleton />
              ) : !subjectPerformanceQuery.data?.length ? (
                <EmptyState
                  icon={BookOpen}
                  title="No grade data"
                  description="Subject performance will appear once grades are entered."
                  className="py-8 border-0"
                />
              ) : (
                <div className="w-full" style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={subjectPerformanceQuery.data}
                      margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                      barCategoryGap="28%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        horizontal={false}
                        vertical
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `${v}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="subject"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={92}
                      />
                      <Bar dataKey="average" radius={[0, 6, 6, 0]}>
                        {(subjectPerformanceQuery.data ?? []).map(row => (
                          <Cell key={row.subject} fill={subjectBarFill(row.average)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Upcoming Assessments</h3>
                <p className="text-xs text-muted-foreground">Next 14 days across your department</p>
              </div>
              {upcomingAssessmentsQuery.isLoading ? (
                <ChartSkeleton />
              ) : !upcomingAssessmentsQuery.data?.length ? (
                <EmptyState
                  icon={CalendarDays}
                  title="No upcoming assessments"
                  description="Assessments due in the next 14 days will appear here."
                  className="py-8 border-0"
                />
              ) : (
                <div className="space-y-3">
                  {upcomingAssessmentsQuery.data.map(a => (
                    <div
                      key={a.id}
                      className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.subject} · {a.className}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Assessment due</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatDateFns(parseISO(a.date), 'EEE d MMM')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[55%_45%]">
            <div className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h3 className="text-sm font-semibold">Teacher Coverage & Workload</h3>
                  <p className="text-xs text-muted-foreground">
                    Classes and subjects per teacher in your department
                  </p>
                </div>
              </div>

              <DataTable<DepartmentTeacherRowWithLessonPlans>
                columns={TEACHER_COLUMNS}
                data={mergedTeacherRows}
                keyExtractor={r => r.employeeNo}
                loading={teacherRowsLoading || teacherLessonPlanStatusQuery.isLoading}
                sortKey="teacherName"
                sortDir="asc"
                emptyState={
                  <EmptyState
                    icon={UserCog}
                    title="No teachers found"
                    description="Teacher assignments in your department will appear here once added."
                    className="py-12 border-0 rounded-none"
                  />
                }
                className="border-0"
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Department Activity</h3>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>

              {activityFeedQuery.isLoading ? (
                <ChartSkeleton height={320} />
              ) : !activityFeedQuery.data?.length ? (
                <EmptyState
                  icon={BookOpen}
                  title="No recent activity"
                  description="When scheme books, assessments, or lesson plans are submitted, they will appear here."
                  className="py-10 border-0"
                />
              ) : (
                <div className="space-y-3">
                  {activityFeedQuery.data.map((item: HodActivityItem) => {
                    const iconMeta = (() => {
                      switch (item.kind) {
                        case 'scheme_book':
                          return { Icon: BookOpen, className: 'bg-blue-500/10 text-blue-500' }
                        case 'assessment_result':
                          return { Icon: ClipboardCheck, className: 'bg-violet-500/10 text-violet-500' }
                        case 'at_risk':
                          return { Icon: AlertTriangle, className: 'bg-red-500/10 text-red-500' }
                        case 'lesson_plan':
                          return { Icon: FileText, className: 'bg-emerald-500/10 text-emerald-500' }
                      }
                    })()
                    const Icon = iconMeta.Icon
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3"
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconMeta.className}`}>
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{item.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(item.occurredAt)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold">Quick actions</h3>
            <div className="flex flex-wrap gap-3">
              {HOD_QUICK_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/60"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="help" className="mt-6">
          <div className="space-y-4 rounded-xl border border-border bg-card p-6 text-sm">
            <h2 className="text-base font-semibold">How to use the HOD Dashboard</h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                Use the <span className="font-medium">KPI cards</span> to spot what needs attention in your department.
              </li>
              <li>
                The <span className="font-medium">Subject Performance</span> chart and{' '}
                <span className="font-medium">Upcoming Assessments</span> list help you prioritise support.
              </li>
              <li>
                The <span className="font-medium">Teacher Coverage & Workload</span> table shows who has
                submitted <span className="font-medium">this week&apos;s lesson plans</span> so you can follow up fast.
              </li>
              <li>
                The <span className="font-medium">Department Activity</span> feed highlights recent submissions
                and at-risk learners across the last 7 days.
              </li>
              <li>
                Use the <span className="font-medium">Quick actions</span> to jump directly into
                the relevant modules.
              </li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

