import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardCheck, BookOpen, FileText,
  CheckCircle2, XCircle, Clock, Home, AlertTriangle, UserX,
  MessageCircle, FileText as FileTextIcon, LineChart,
  BookMarked, CalendarDays, FileQuestion, FolderOpen,
  HelpCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard }   from '@/components/common/StatCard'
import { EmptyState } from '@/components/common/EmptyState'
import { AppAreaChart } from '@/components/charts/AppAreaChart'
import { AppPieChart }  from '@/components/charts/AppPieChart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import {
  useTeacherRecord,
  useHomeroomClass,
  useTeacherSubjects,
  useTodayAttendance,
  useClassAttendanceTrend,
  useTeacherRecentExams,
} from '@/features/dashboard/hooks/useTeacherDashboard'
import { ClassTeacherHelp }   from '@/features/dashboard/components/help/ClassTeacherHelp'
import { SubjectTeacherHelp } from '@/features/dashboard/components/help/SubjectTeacherHelp'
import { TeacherTimetableCard } from '@/features/timetable'
import { formatDate, formatPercent } from '@/utils/format'
import { cn } from '@/utils/cn'

// ── Skeleton helpers ─────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return <div className="w-full animate-pulse rounded-lg bg-muted" style={{ height }} />
}

// ── Exam type badge ──────────────────────────────────────────────────────────

const EXAM_TYPE_STYLES: Record<string, string> = {
  test:         'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  mid_term:     'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  end_of_term:  'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  mock:         'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  assignment:   'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  practical:    'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
  quiz:         'bg-amber-500/10 text-amber-700 dark:text-amber-400',
}

// ── Quick link definitions ───────────────────────────────────────────────────

const CLASS_TEACHER_LINKS = [
  { to: '/academics?tab=grades', label: 'Enter Grades', icon: FileText },
  { to: '/reports', label: 'Term Reports', icon: FileTextIcon },
  { to: '/parent-messages', label: 'Parent Messages', icon: MessageCircle },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/class-analytics', label: 'Class Analytics', icon: LineChart },
]
const SUBJECT_TEACHER_LINKS = [
  { to: '/academics?tab=grades', label: 'Enter Grades', icon: FileText },
  { to: '/scheme-book', label: 'Scheme Book', icon: BookMarked },
  { to: '/lesson-plans', label: 'Lesson Plans', icon: CalendarDays },
  { to: '/assignments', label: 'Assignments', icon: FileQuestion },
  { to: '/resources', label: 'Resources', icon: FolderOpen },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
]

const CLASS_TEACHER_ROLES   = ['headmaster', 'deputy_headmaster', 'hod', 'class_teacher'] as const
const SUBJECT_TEACHER_ROLES = ['headmaster', 'deputy_headmaster', 'hod', 'teacher'] as const

// ── Component ────────────────────────────────────────────────────────────────

export function TeacherDashboard() {
  const { profile, user, hasRole } = useAuth()
  const showClassTeacherLinks   = hasRole(...CLASS_TEACHER_ROLES)
  const showSubjectTeacherLinks = hasRole(...SUBJECT_TEACHER_ROLES)

  const profileId = user?.id

  // Step 1: resolve teacher record
  const { data: teacher, isLoading: teacherLoading } = useTeacherRecord(profileId)

  // Step 2: dependent queries (need teacher.id)
  const { data: homeroom, isLoading: homeroomLoading } = useHomeroomClass(teacher?.id)
  const { data: subjects = [], isLoading: subjectsLoading } = useTeacherSubjects(teacher?.id)

  // Step 3: class-level data (need homeroom.id)
  const { data: todayAtt, isLoading: attLoading } = useTodayAttendance(homeroom?.id)
  const { data: attTrend = [], isLoading: trendLoading } = useClassAttendanceTrend(homeroom?.id)

  // Recent exams: classes this teacher teaches, or homeroom class for class teachers with no subject assignments
  const taughtClassIds = [...new Set(subjects.map(s => s.class_id))]
  const examClassIds = taughtClassIds.length > 0
    ? taughtClassIds
    : homeroom?.id
      ? [homeroom.id]
      : []
  const { data: recentExams = [], isLoading: examsLoading } = useTeacherRecentExams(examClassIds)

  // Unique subjects count (de-duped by subject_id)
  const uniqueSubjects = new Set(subjects.map(s => s.subject_id)).size

  // ── First-login help tab logic ────────────────────────────────────────────
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

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Teacher'

  const isInitialLoading = teacherLoading
  const isNotLinked = !teacherLoading && !teacher

  // ── Attendance pie data ────────────────────────────────────────────────────
  const pieDat = todayAtt && todayAtt.total > 0
    ? [
        { name: 'Present', value: todayAtt.present,  color: 'hsl(var(--chart-2))' },
        { name: 'Absent',  value: todayAtt.absent,   color: 'hsl(var(--destructive))' },
        { name: 'Late',    value: todayAtt.late,      color: 'hsl(var(--chart-3))' },
        { name: 'Excused', value: todayAtt.excused,   color: 'hsl(var(--chart-4))' },
      ].filter(d => d.value > 0)
    : []

  // Which help guide to show
  const helpContent = showClassTeacherLinks ? <ClassTeacherHelp /> : <SubjectTeacherHelp />

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle={
          homeroom
            ? `Class teacher — ${homeroom.name}`
            : subjects.length > 0
              ? `Subject Teacher · ${uniqueSubjects} subject${uniqueSubjects !== 1 ? 's' : ''} across ${taughtClassIds.length} class${taughtClassIds.length !== 1 ? 'es' : ''}`
              : 'Teacher Portal'
        }
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
          <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
          <TabsTrigger value="help" className="relative text-sm">
            Help Guide
            {!hasSeen && (
              <span className="ml-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Overview tab ── */}
        <TabsContent value="overview" className="mt-6 space-y-8">

          {/* Not-linked banner */}
          {isNotLinked && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <UserX className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-400">Teacher profile not linked</p>
                <p className="mt-1 text-amber-700 dark:text-amber-500">
                  Your user account has not been linked to a teacher record yet. Ask your headmaster to go to{' '}
                  <strong>Staff → Teachers</strong> and click <strong>"Link as Teacher"</strong> next to your name
                  to complete your profile setup.
                </p>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {isInitialLoading ? (
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            ) : (
              <>
                <StatCard
                  title="My Class"
                  value={homeroomLoading ? '…' : (homeroom?.name ?? '—')}
                  subtitle={
                    homeroomLoading
                      ? undefined
                      : homeroom
                      ? `${homeroom.student_count} active students · ${homeroom.room ?? 'No room'}`
                      : 'No homeroom class assigned'
                  }
                  icon={Home}
                  iconClassName="bg-blue-500/10 text-blue-500"
                />
                <StatCard
                  title="Today's Attendance"
                  value={
                    attLoading ? '…'
                    : !homeroom ? '—'
                    : !todayAtt?.marked ? 'Not marked'
                    : formatPercent(todayAtt.rate)
                  }
                  subtitle={
                    attLoading ? undefined
                    : !homeroom ? 'No homeroom class'
                    : todayAtt?.marked
                    ? `${todayAtt.present} present · ${todayAtt.absent} absent`
                    : 'Mark attendance in Attendance module'
                  }
                  icon={ClipboardCheck}
                  iconClassName={cn(
                    'text-white',
                    !todayAtt?.marked ? 'bg-amber-500/10 text-amber-500'
                    : (todayAtt?.rate ?? 0) >= 80 ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-red-500/10 text-red-500'
                  )}
                />
                <StatCard
                  title="Subjects Taught"
                  value={subjectsLoading ? '…' : uniqueSubjects}
                  subtitle={subjectsLoading ? undefined : `across ${taughtClassIds.length} class${taughtClassIds.length !== 1 ? 'es' : ''}`}
                  icon={BookOpen}
                  iconClassName="bg-violet-500/10 text-violet-500"
                />
                <StatCard
                  title="Recent Exams"
                  value={examsLoading ? '…' : recentExams.length}
                  subtitle={
                    examsLoading ? undefined
                    : recentExams.length === 0 ? 'No exams scheduled'
                    : recentExams[0]
                    ? `Latest: ${recentExams[0].name}`
                    : undefined
                  }
                  icon={FileText}
                  iconClassName="bg-orange-500/10 text-orange-500"
                />
              </>
            )}
          </div>

          {/* No teacher profile warning */}
          {!teacherLoading && !teacher && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Teacher profile not found
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Your account is not yet linked to a teacher record. Contact the administrator to set up your profile.
                </p>
              </div>
            </div>
          )}

          {/* Attendance charts (only if there's a homeroom class) */}
          {(homeroom || homeroomLoading) && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold">Class Attendance Trend</h3>
                  <p className="text-xs text-muted-foreground">
                    Daily rate for {homeroom?.name ?? '…'} — last 30 days
                  </p>
                </div>
                {trendLoading ? (
                  <ChartSkeleton height={220} />
                ) : !attTrend.length ? (
                  <EmptyState
                    title="No attendance records yet"
                    description="Start marking daily attendance in the Attendance module."
                    className="py-10 border-0"
                  />
                ) : (
                  <AppAreaChart
                    data={attTrend}
                    xKey="isoDate"
                    series={[{ key: 'rate', label: 'Attendance %' }]}
                    height={220}
                    xTickFormatter={(v) => formatDate(v, 'dd MMM')}
                    yTickFormatter={v => `${v}%`}
                    tooltipFormatter={v => (v == null ? '—' : `${v}%`)}
                    tooltipLabelFormatter={(v) => formatDate(v, 'dd MMM')}
                    showLegend={false}
                  />
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold">Today's Breakdown</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  {homeroom?.name ?? '—'} · {new Date().toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                </p>
                {attLoading ? (
                  <div className="h-44 animate-pulse rounded-lg bg-muted" />
                ) : !todayAtt?.marked ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <AlertTriangle className="h-8 w-8 text-amber-400" />
                    <p className="text-sm font-medium text-muted-foreground">Attendance not marked yet</p>
                    <p className="text-xs text-muted-foreground/70">
                      Go to Attendance → Mark Attendance to record today.
                    </p>
                  </div>
                ) : (
                  <>
                    <AppPieChart data={pieDat} height={160} donut showLegend={false} />
                    <div className="mt-3 space-y-2 text-sm">
                      {[
                        { label: 'Present', val: todayAtt.present,  icon: CheckCircle2, cls: 'text-emerald-500' },
                        { label: 'Absent',  val: todayAtt.absent,   icon: XCircle,      cls: 'text-destructive' },
                        { label: 'Late',    val: todayAtt.late,      icon: Clock,        cls: 'text-amber-500' },
                        { label: 'Excused', val: todayAtt.excused,   icon: CheckCircle2, cls: 'text-blue-500' },
                      ].filter(r => r.val > 0).map(r => (
                        <div key={r.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <r.icon className={cn('h-3.5 w-3.5', r.cls)} />
                            <span className="text-muted-foreground">{r.label}</span>
                          </div>
                          <span className="font-semibold tabular-nums">{r.val}</span>
                        </div>
                      ))}
                      <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
                        <span className="font-medium">Total</span>
                        <span className="font-semibold tabular-nums">{todayAtt.total}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Timetable (teachers) */}
          {(showClassTeacherLinks || showSubjectTeacherLinks) && (
            <TeacherTimetableCard />
          )}

          {/* Subjects & Recent Exams */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h3 className="text-sm font-semibold">My Subjects & Classes</h3>
                <p className="text-xs text-muted-foreground">All assigned teaching allocations</p>
              </div>
              {subjectsLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !subjects.length ? (
                <EmptyState
                  title="No subjects assigned"
                  description="Contact the administrator to assign subjects to your profile."
                  className="py-10"
                />
              ) : (
                <div className="divide-y divide-border">
                  {subjects.map(s => (
                    <div key={s.id} className="flex items-center gap-3 px-6 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                        <BookOpen className="h-4 w-4 text-violet-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{s.subject_name}</p>
                        <p className="text-xs text-muted-foreground">{s.class_name}</p>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Form {s.grade_level}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h3 className="text-sm font-semibold">Recent Exams</h3>
                <p className="text-xs text-muted-foreground">
                  {examClassIds.length === 1 && homeroom && taughtClassIds.length === 0
                    ? 'For your class'
                    : 'For all your assigned classes'}
                </p>
              </div>
              {examsLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                        <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !recentExams.length ? (
                <EmptyState
                  title="No exams yet"
                  description="Create exams in the Academics module to track student performance."
                  className="py-10"
                />
              ) : (
                <div className="divide-y divide-border">
                  {recentExams.map(exam => (
                    <div key={exam.id} className="flex items-start gap-3 px-6 py-3">
                      <span
                        className={cn(
                          'mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap',
                          EXAM_TYPE_STYLES[exam.exam_type] ?? 'bg-muted text-muted-foreground'
                        )}
                      >
                        {exam.exam_type.replace(/_/g, ' ')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{exam.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {exam.subject_name} · {exam.class_name}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {exam.exam_date ? formatDate(exam.exam_date, 'dd MMM') : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Role-based quick links */}
          {(showClassTeacherLinks || showSubjectTeacherLinks) && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold">Quick links</h3>
              <div className="flex flex-wrap gap-3">
                {showClassTeacherLinks && CLASS_TEACHER_LINKS.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/60"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </Link>
                ))}
                {showSubjectTeacherLinks && SUBJECT_TEACHER_LINKS.map(({ to, label, icon: Icon }) => (
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
          )}

          {/* Quick tips shown when no teacher data yet */}
          {!teacher && !teacherLoading && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Set up your teacher profile to unlock class, attendance, and exam insights.
              </p>
            </div>
          )}
        </TabsContent>

        {/* ── Help tab ── */}
        <TabsContent value="help" className="mt-6">
          {helpContent}
        </TabsContent>
      </Tabs>
    </div>
  )
}
