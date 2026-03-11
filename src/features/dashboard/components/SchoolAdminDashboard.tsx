import { useNavigate } from 'react-router-dom'
import { CalendarDays, BookOpen, UserCog, GraduationCap, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { useSchool } from '@/context/SchoolContext'
import { useSchoolAdminSetupStats } from '@/features/dashboard/hooks/useSchoolAdminDashboard'

interface SetupStep {
  number: number
  icon: React.ElementType
  title: string
  description: string
  done: boolean
  action: string
}

export function SchoolAdminDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { currentSchool } = useSchool()
  const { data: stats, isLoading } = useSchoolAdminSetupStats()

  const steps: SetupStep[] = [
    {
      number: 1,
      icon: CalendarDays,
      title: 'Configure Academic Year',
      description: 'Set up the current academic year and terms.',
      done: false,
      action: '/academics',
    },
    {
      number: 2,
      icon: BookOpen,
      title: 'Create Classes',
      description: 'Add grade levels and class streams.',
      done: (stats?.classCount ?? 0) > 0,
      action: '/academics',
    },
    {
      number: 3,
      icon: UserCog,
      title: 'Add Teachers & Staff',
      description: 'Create teacher and staff accounts.',
      done: (stats?.teacherCount ?? 0) > 0,
      action: '/staff',
    },
    {
      number: 4,
      icon: GraduationCap,
      title: 'Enrol Students',
      description: 'Add students and assign them to classes.',
      done: (stats?.studentCount ?? 0) > 0,
      action: '/students',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Setup"
        subtitle={currentSchool?.name ?? 'Configure your school'}
      />

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Welcome, <span className="font-medium text-foreground">{profile?.full_name ?? 'School Admin'}</span>.
          Complete the setup steps below to get your school running.
        </p>
      </div>

      {/* Setup checklist */}
      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map(step => (
          <div
            key={step.number}
            className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="shrink-0 w-10 flex flex-col items-center">
              <span className={cn('text-2xl font-extrabold tabular-nums', step.done ? 'text-emerald-500' : 'text-muted-foreground/40')}>
                {step.number}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', step.done ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                    <step.icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold leading-tight">{step.title}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    step.done
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-amber-500/10 text-amber-600'
                  )}
                >
                  {step.done ? (
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Done</span>
                  ) : (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>
                  )}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 gap-1.5 px-0 text-xs font-medium text-primary"
                onClick={() => navigate(step.action)}
              >
                Go <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Stats strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Students"
          value={isLoading ? '—' : (stats?.studentCount ?? 0).toLocaleString()}
          subtitle="Enrolled students"
          icon={GraduationCap}
          iconClassName="bg-blue-500/10 text-blue-500"
          loading={isLoading}
        />
        <StatCard
          title="Teachers"
          value={isLoading ? '—' : (stats?.teacherCount ?? 0).toLocaleString()}
          subtitle="Teaching staff records"
          icon={UserCog}
          iconClassName="bg-violet-500/10 text-violet-500"
          loading={isLoading}
        />
        <StatCard
          title="Classes"
          value={isLoading ? '—' : (stats?.classCount ?? 0).toLocaleString()}
          subtitle="Active class rooms"
          icon={BookOpen}
          iconClassName="bg-emerald-500/10 text-emerald-500"
          loading={isLoading}
        />
        <StatCard
          title="Total Users"
          value={isLoading ? '—' : (stats?.userCount ?? 0).toLocaleString()}
          subtitle="Accounts with roles"
          icon={CalendarDays}
          iconClassName="bg-orange-500/10 text-orange-500"
          loading={isLoading}
        />
      </div>
    </div>
  )
}
