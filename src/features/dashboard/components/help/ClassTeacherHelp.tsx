import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, ChevronDown, ArrowRight,
  GraduationCap, ClipboardCheck, MessageSquare,
  FileText, BarChart3, Users, BookOpen, Sun, AlertTriangle,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

// ── Accordion ────────────────────────────────────────────────────────────────

interface AccordionStep {
  step: number
  title: string
  completed?: boolean
  content: ReactNode
}

function StepAccordion({ steps, defaultOpen = 1 }: { steps: AccordionStep[]; defaultOpen?: number }) {
  const [open, setOpen] = useState<Set<number>>(new Set([defaultOpen]))

  const toggle = (n: number) =>
    setOpen(prev => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })

  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {steps.map(s => (
        <div key={s.step}>
          <button
            onClick={() => toggle(s.step)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40"
          >
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                s.completed
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {s.completed ? <CheckCircle2 className="h-4 w-4" /> : s.step}
            </div>
            <span className="flex-1 text-sm font-medium">{s.title}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                open.has(s.step) && 'rotate-180',
              )}
            />
          </button>
          {open.has(s.step) && (
            <div className="border-t border-border/50 bg-muted/20 px-5 py-4 pl-14 space-y-3 text-sm text-foreground/80">
              {s.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StepList({ items }: { items: string[] }) {
  return (
    <ol className="ml-4 list-decimal list-outside space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-muted-foreground">{item}</li>
      ))}
    </ol>
  )
}

function GoTo({ to, label }: { to: string; label: string }) {
  return (
    <div className="pt-1">
      <Button variant="outline" size="sm" asChild>
        <Link to={to} className="gap-2">
          {label} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  )
}

function ToolCard({
  icon: Icon, title, description, color, to,
}: {
  icon: React.ElementType
  title: string
  description: string
  color: string
  to: string
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
        <Button variant="ghost" size="sm" className="mt-2 justify-start px-0 text-xs font-medium" asChild>
          <Link to={to}>Open →</Link>
        </Button>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function ClassTeacherHelp() {
  const gettingStartedSteps: AccordionStep[] = [
    {
      step: 1,
      title: 'Verify Your Homeroom Class',
      content: (
        <>
          <p>
            Your homeroom class is assigned by the Headmaster in the Staff module. If your dashboard shows
            "No homeroom class assigned", contact your Headmaster to link your teacher profile to a class.
          </p>
          <StepList items={[
            'Check the "My Class" card on your dashboard.',
            'If it shows "—", your teacher record may not be linked to your account.',
            'Ask the Headmaster to go to Staff → Teachers → your name → Link User Account.',
            'Once linked, your class, student list, and attendance will appear on your dashboard.',
          ]} />
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            If your profile is not linked, you will not be able to mark attendance for your class.
          </div>
        </>
      ),
    },
    {
      step: 2,
      title: 'Review Your Student List',
      content: (
        <>
          <p>Before you can manage your class effectively, familiarise yourself with your students — their names, admission numbers, and any notes on their records.</p>
          <StepList items={[
            'Go to Students using the sidebar.',
            'Use the class filter to view only students in your homeroom class.',
            'Click on any student to see their full profile, guardian details, and history.',
            'Students not yet enrolled will need to be added by the Headmaster.',
          ]} />
          <GoTo to="/students" label="Go to Students" />
        </>
      ),
    },
    {
      step: 3,
      title: 'Mark Your First Attendance',
      content: (
        <>
          <p>Attendance should be marked every morning at the start of the school day. It is period-based and shows up in real time on your dashboard.</p>
          <StepList items={[
            'Go to Attendance using the sidebar.',
            'Click "Mark Attendance".',
            'Select your class and today\'s date.',
            'Mark each student as Present, Absent, Late, or Excused.',
            'Add a reason for any absences.',
            'Click Save — your dashboard will update immediately.',
          ]} />
          <GoTo to="/attendance" label="Go to Attendance" />
        </>
      ),
    },
    {
      step: 4,
      title: 'Send an Introductory Message to Parents',
      content: (
        <>
          <p>Start the term by introducing yourself to parents and guardians. Good communication sets the tone for a productive relationship throughout the year.</p>
          <StepList items={[
            'Go to Communication using the sidebar.',
            'Click "New Message" or "New Announcement".',
            'Address it to parents of your class.',
            'Introduce yourself, share your class schedule, and outline your expectations.',
            'Send — parents linked to your class will receive the message on their parent portal.',
          ]} />
          <GoTo to="/communication" label="Go to Communication" />
        </>
      ),
    },
  ]

  const dailyWorkflowSteps: AccordionStep[] = [
    {
      step: 1,
      title: 'Morning: Mark Attendance',
      content: (
        <>
          <p>The first task of every school day. Consistent attendance records feed into term reports and parent notifications.</p>
          <StepList items={[
            'Open Attendance from the sidebar.',
            'Select your class and today\'s date.',
            'Mark every student — do not skip absent students; mark them as Absent.',
            'Your dashboard "Today\'s Attendance" card updates once saved.',
            'Late arrivals can be updated throughout the day.',
          ]} />
          <GoTo to="/attendance" label="Mark Attendance" />
        </>
      ),
    },
    {
      step: 2,
      title: 'Check Parent Messages',
      content: (
        <>
          <p>Parents can send messages through the portal. Respond promptly — especially to queries about attendance or academic performance.</p>
          <StepList items={[
            'Go to Communication using the sidebar.',
            'Check your inbox for new parent messages.',
            'Reply directly within the platform — replies are logged.',
            'For urgent issues, note the parent\'s phone number from the student record.',
          ]} />
          <GoTo to="/communication" label="Go to Communication" />
        </>
      ),
    },
    {
      step: 3,
      title: 'Monitor Class Progress',
      content: (
        <>
          <p>Your dashboard gives you a live view of how your class is doing. Check it daily to catch issues early.</p>
          <StepList items={[
            'The "Today\'s Attendance" card shows current day status at a glance.',
            'The Class Attendance Trend chart shows the 30-day pattern — look for downward trends.',
            'Flag students with repeated absences to the Deputy Headmaster.',
            'Check Class Analytics (in the sidebar) for academic performance trends.',
          ]} />
          <GoTo to="/class-analytics" label="Go to Class Analytics" />
        </>
      ),
    },
    {
      step: 4,
      title: 'End of Term: Publish Reports',
      content: (
        <>
          <p>At the end of each term, generate and review student report cards before publishing them to parents.</p>
          <StepList items={[
            'Ensure all subject teachers have entered grades for your class.',
            'Go to Reports using the sidebar.',
            'Review each student\'s report card for accuracy.',
            'Click "Publish" to make reports visible on the parent portal.',
            'Inform parents via Communication that reports are available.',
          ]} />
          <GoTo to="/reports" label="Go to Reports" />
        </>
      ),
    },
  ]

  const TOOLS = [
    { icon: ClipboardCheck, title: 'Attendance',        description: 'Mark and review daily attendance for your homeroom class.',       color: 'bg-blue-500/10 text-blue-600',     to: '/attendance' },
    { icon: Users,          title: 'Students',          description: 'View and manage student profiles, guardian info, and class lists.', color: 'bg-violet-500/10 text-violet-600', to: '/students' },
    { icon: MessageSquare,  title: 'Communication',     description: 'Send announcements and reply to messages from parents.',           color: 'bg-emerald-500/10 text-emerald-600', to: '/communication' },
    { icon: FileText,       title: 'Term Reports',      description: 'Review and publish end-of-term student report cards.',             color: 'bg-orange-500/10 text-orange-600', to: '/reports' },
    { icon: BarChart3,      title: 'Class Analytics',   description: 'Attendance trends and academic performance charts for your class.',color: 'bg-rose-500/10 text-rose-600',    to: '/class-analytics' },
    { icon: BookOpen,       title: 'Parent Messages',   description: 'Dedicated inbox for messages from parents and guardians.',         color: 'bg-amber-500/10 text-amber-600',   to: '/parent-messages' },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">Class Teacher Guide</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              As a Class Teacher, you are responsible for your homeroom class — daily attendance, parent
              communication, and term reports. This guide walks you through everything you need to get started.
            </p>
          </div>
        </div>

        {/* Role clarity callout */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Your Primary Role</p>
            <p className="text-xs text-muted-foreground">
              You manage one homeroom class. You take daily attendance, communicate with parents, and publish term reports for all students in your class.
            </p>
          </div>
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-1">Subject Teaching</p>
            <p className="text-xs text-muted-foreground">
              If you also teach subjects, you will see a "Subject Teacher" section on your dashboard with access to scheme books, lesson plans, and grade entry.
            </p>
          </div>
        </div>
      </div>

      {/* ── Inner tabs ── */}
      <Tabs defaultValue="getting-started">
        <TabsList className="h-auto w-full justify-start gap-1 p-1">
          <TabsTrigger value="getting-started" className="text-sm">Getting Started</TabsTrigger>
          <TabsTrigger value="daily-workflow" className="text-sm">Daily Workflow</TabsTrigger>
          <TabsTrigger value="your-tools" className="text-sm">Your Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Complete these steps when you first log in to ensure your account is set up correctly and your class is ready to manage.
          </p>
          <StepAccordion steps={gettingStartedSteps} />
        </TabsContent>

        <TabsContent value="daily-workflow" className="mt-4 space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
            <Sun className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-medium">Follow this routine every school day for best results.</p>
          </div>
          <StepAccordion steps={dailyWorkflowSteps} />
        </TabsContent>

        <TabsContent value="your-tools" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            These are the modules you will use most frequently as a Class Teacher. Click "Open" to navigate directly.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {TOOLS.map(t => (
              <ToolCard key={t.title} {...t} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
