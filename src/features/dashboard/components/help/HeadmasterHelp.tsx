import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, ChevronDown, ArrowRight, School,
  GraduationCap, Users, BookOpen, BookMarked, ClipboardCheck,
  Banknote, MessageSquare, Package, BarChart3,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { useSetupProgress } from '@/features/dashboard/hooks/useSetupProgress'

// ── Shared accordion ─────────────────────────────────────────────────────────

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
            {s.completed && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Done
              </span>
            )}
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

// ── Step content helpers ─────────────────────────────────────────────────────

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

// ── Module card ──────────────────────────────────────────────────────────────

function ModuleCard({
  icon: Icon, title, description, color, to,
}: {
  icon: React.ElementType
  title: string
  description: string
  color: string
  to: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <Button variant="ghost" size="sm" className="mt-auto justify-start px-0 text-xs font-medium" asChild>
        <Link to={to}>Open module →</Link>
      </Button>
    </div>
  )
}

// ── Role definitions ─────────────────────────────────────────────────────────

const ROLES = [
  { label: 'Headmaster',          description: 'Full system access. Manages all users, settings, and data.',                                    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  { label: 'Deputy Headmaster',   description: 'Academic and staff oversight. Attendance and performance reports.',                              color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  { label: 'Bursar',              description: 'Finance management: invoices, payments, expenses, budgets.',                                     color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { label: 'Head of Department',  description: 'Department-level oversight of subjects and teachers.',                                          color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
  { label: 'Class Teacher',       description: 'Homeroom class, attendance, parent communication, and term reports.',                           color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { label: 'Subject Teacher',     description: 'Scheme book, lesson plans, exams, and grades for assigned subjects.',                           color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { label: 'Non-Teaching Staff',  description: 'Limited access based on job function.',                                                         color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  { label: 'Parent / Guardian',   description: 'View child progress, attendance, fees, and school announcements.',                              color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
]

// ── Main component ───────────────────────────────────────────────────────────

export function HeadmasterHelp() {
  const { data: progress, isLoading } = useSetupProgress()

  const completedCount = progress?.completedCount ?? 0
  const totalCount     = progress?.totalCount ?? 8
  const percentage     = progress?.percentage ?? 0

  // ── Setup checklist steps ────────────────────────────────────────────────

  const setupSteps: AccordionStep[] = [
    {
      step: 1,
      title: 'Create an Academic Year',
      completed: progress?.academicYears,
      content: (
        <>
          <p>Define the school year that all classes, terms, and fees will be linked to.</p>
          <StepList items={[
            'Navigate to Academics using the sidebar.',
            'Open the Academic Years section.',
            'Click "New Academic Year".',
            'Enter a label (e.g. "2025/2026"), a start date, and an end date.',
            'Toggle "Set as Current" to activate this year.',
            'Click Save.',
          ]} />
          <GoTo to="/academics" label="Go to Academics" />
        </>
      ),
    },
    {
      step: 2,
      title: 'Add Terms',
      completed: progress?.terms,
      content: (
        <>
          <p>Terms divide the academic year into manageable periods. They control which attendance records, grades, and fees are currently active.</p>
          <StepList items={[
            'Open your academic year in Academics.',
            'Click "Add Term".',
            'Create Term 1, Term 2, and Term 3 with correct start and end dates.',
            'Mark the currently running term as active.',
          ]} />
          <GoTo to="/academics" label="Go to Academics" />
        </>
      ),
    },
    {
      step: 3,
      title: 'Create Departments',
      completed: progress?.departments,
      content: (
        <>
          <p>Departments group subjects and teachers together. Common examples: Sciences, Mathematics, Languages, Social Sciences, Arts & Technology.</p>
          <StepList items={[
            'Go to Staff using the sidebar.',
            'Open the Departments tab.',
            'Click "Add Department".',
            'Enter the department name and a short code.',
            'You can assign a Head of Department after teachers are added.',
          ]} />
          <GoTo to="/staff" label="Go to Staff" />
        </>
      ),
    },
    {
      step: 4,
      title: 'Create Subjects',
      completed: progress?.subjects,
      content: (
        <>
          <p>Subjects are what teachers teach and students are assessed on. They must exist before teachers can be assigned to them.</p>
          <StepList items={[
            'Go to Academics → Subjects.',
            'Click "Add Subject".',
            'Enter the subject name and a unique code (e.g. "Mathematics" / "MATH").',
            'Assign it to a department.',
            'Check "Elective" if the subject is optional.',
          ]} />
          <GoTo to="/academics" label="Go to Academics" />
        </>
      ),
    },
    {
      step: 5,
      title: 'Create Classes',
      completed: progress?.classes,
      content: (
        <>
          <p>Classes are the student groups. Create one class per stream per grade level — e.g. Form 1A, Form 1B, Form 2A.</p>
          <StepList items={[
            'Go to Academics → Classes.',
            'Click "Add Class".',
            'Enter the class name, grade level, capacity, and room number.',
            'Link it to the current academic year.',
            'Assign a class teacher after staff are added.',
          ]} />
          <GoTo to="/academics" label="Go to Academics" />
        </>
      ),
    },
    {
      step: 6,
      title: 'Add Teaching Staff',
      completed: progress?.teachers,
      content: (
        <>
          <p>Staff records are separate from login accounts. Create the staff record first, then link it to their user account so they can log in and see their data.</p>
          <StepList items={[
            'Go to Staff → Teachers.',
            'Click "Add Teacher" and fill in employee details. The Specialization field is for HR records only — it does not assign subjects.',
            'To give a teacher a login, invite them via the Users section and set their role.',
            'Return to Staff → Teachers and use "Link User Account" to connect the records.',
            'Click the Allocations button next to a teacher to open the subject allocation panel.',
            'Select a subject, select a class, then press +. The subject is kept selected — just pick a different class and press + again to assign the same subject to multiple classes (e.g. Maths → Form 1A, then Maths → Form 1B).',
            'Return to Classes and set each class\'s class teacher.',
          ]} />
          <GoTo to="/staff" label="Go to Staff" />
        </>
      ),
    },
    {
      step: 7,
      title: 'Enroll Students',
      completed: progress?.students,
      content: (
        <>
          <p>Add student records and assign them to classes. Students must be enrolled before attendance can be marked or invoices generated.</p>
          <StepList items={[
            'Go to Students using the sidebar.',
            'Click "Add Student".',
            'Enter: full name, admission number, date of birth, and gender.',
            'Set the admission date and select the student\'s current class.',
            'Add guardian information (name, relationship, contact number).',
            'The student will immediately appear in attendance lists for their class.',
          ]} />
          <GoTo to="/students" label="Go to Students" />
        </>
      ),
    },
    {
      step: 8,
      title: 'Set Up Fee Structures',
      completed: progress?.feeStructures,
      content: (
        <>
          <p>Fee structures define what each class owes per term or year. Once created, you can generate invoices for students in bulk.</p>
          <StepList items={[
            'Go to Finance using the sidebar.',
            'Open the Fee Structures section.',
            'Click "Add Fee Structure".',
            'Enter the fee name, amount, and category (tuition, boarding, transport, etc.).',
            'Link it to an academic year and optionally a specific class or term.',
            'Use Finance → Invoices to generate invoices from these structures.',
          ]} />
          <GoTo to="/finance" label="Go to Finance" />
        </>
      ),
    },
  ]

  // ── User management steps ────────────────────────────────────────────────

  const userManagementSteps: AccordionStep[] = [
    {
      step: 1,
      title: 'Creating User Accounts',
      content: (
        <>
          <p>Every person who needs to log in — teachers, parents, the bursar — requires a user account. Accounts are separate from staff and student records and must be linked after creation.</p>
          <StepList items={[
            'Go to Users in the sidebar (visible to Headmaster only).',
            'Click "Invite User" or "Add User".',
            'Enter the person\'s full name, email address, and assign a role.',
            'They will receive an email invitation to set their own password.',
            'Once logged in, their profile is created and can be linked to a staff or student record.',
          ]} />
          <GoTo to="/users" label="Go to Users" />
        </>
      ),
    },
    {
      step: 2,
      title: 'Assigning & Changing Roles',
      content: (
        <>
          <p>A user's role controls exactly what they can see and do in Educore. Roles can be updated at any time and take effect immediately.</p>
          <StepList items={[
            'Go to Users in the sidebar.',
            'Find the user, click their name to open their record.',
            'Use the Role dropdown to select the appropriate role.',
            'Save the change — it takes effect on the user\'s next page load.',
            'Tip: a Class Teacher needs the "class_teacher" role; a finance manager needs "bursar".',
          ]} />
          <GoTo to="/users" label="Go to Users" />
        </>
      ),
    },
    {
      step: 3,
      title: 'Linking Teacher Profiles',
      content: (
        <>
          <p>A teacher's user account must be linked to their staff record before they can see their class, students, or attendance data on their dashboard.</p>
          <StepList items={[
            'Create the teacher record first: Staff → Teachers → Add Teacher.',
            'Invite the teacher via Users and set their role to "class_teacher" or "teacher".',
            'Go to Staff → Teachers and open the teacher\'s record.',
            'Click "Link User Account" and select the matching user profile.',
            'The teacher will now see their homeroom class and subjects on their dashboard.',
          ]} />
          <GoTo to="/staff" label="Go to Staff" />
        </>
      ),
    },
    {
      step: 4,
      title: 'Understanding the Role Hierarchy',
      content: (
        <>
          <p>Each role has a defined level of access. Higher roles can see more data and perform more actions.</p>
          <div className="mt-2 space-y-2">
            {ROLES.map(r => (
              <div key={r.label} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                <span className={cn('mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', r.color)}>
                  {r.label}
                </span>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </div>
            ))}
          </div>
        </>
      ),
    },
  ]

  // ── Modules ──────────────────────────────────────────────────────────────

  const MODULES = [
    { icon: GraduationCap, title: 'Students',       description: 'Manage student records, enrolments, guardian links, and individual profiles.', color: 'bg-blue-500/10 text-blue-600',    to: '/students' },
    { icon: Users,         title: 'Staff',          description: 'Teacher and non-teaching staff records, departments, and subject allocations.', color: 'bg-violet-500/10 text-violet-600', to: '/staff' },
    { icon: BookOpen,      title: 'Academics',      description: 'Classes, subjects, academic years, terms, exams, grades, and scheme books.',    color: 'bg-emerald-500/10 text-emerald-600', to: '/academics' },
    { icon: ClipboardCheck,title: 'Attendance overview', description: 'School-wide attendance rates are on your dashboard. Registers are marked by class and subject teachers.', color: 'bg-orange-500/10 text-orange-600', to: '/dashboard/headmaster' },
    { icon: BookMarked,    title: 'Scheme Book',    description: 'Review scheme book uploads, HOD approvals, and complete executive sign-off when needed.', color: 'bg-sky-500/10 text-sky-600', to: '/scheme-book' },
    { icon: Banknote,      title: 'Finance',        description: 'Fee structures, invoices, payments, expenses, and financial reporting.',         color: 'bg-amber-500/10 text-amber-600',   to: '/finance' },
    { icon: MessageSquare, title: 'Communication',  description: 'Announcements, messages to parents, and school circular letters.',              color: 'bg-pink-500/10 text-pink-600',     to: '/communication' },
    { icon: Package,       title: 'Assets',         description: 'School asset inventory, maintenance requests, and disposals.',                  color: 'bg-cyan-500/10 text-cyan-600',     to: '/assets' },
    { icon: BarChart3,     title: 'Analytics',      description: 'School-wide performance analytics, trends, and executive summary reports.',     color: 'bg-rose-500/10 text-rose-600',     to: '/analytics' },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header + progress ── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <School className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">Headmaster Setup Guide</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Follow these steps to get your school fully operational on Educore.
              The system checks your progress automatically — completed steps are marked in green.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">
              {isLoading
                ? 'Checking progress…'
                : `${completedCount} of ${totalCount} setup steps completed`}
            </span>
            <span
              className={cn(
                'text-sm font-bold tabular-nums',
                percentage === 100 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-muted-foreground',
              )}
            >
              {isLoading ? '—' : `${percentage}%`}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                percentage === 100 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-blue-500',
              )}
              style={{ width: isLoading ? '0%' : `${percentage}%` }}
            />
          </div>
          {percentage === 100 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Your school is fully set up — great work!
            </p>
          )}
        </div>
      </div>

      {/* ── Inner tabs ── */}
      <Tabs defaultValue="getting-started">
        <TabsList className="h-auto w-full justify-start gap-1 p-1">
          <TabsTrigger value="getting-started" className="text-sm">Getting Started</TabsTrigger>
          <TabsTrigger value="user-management" className="text-sm">User Management</TabsTrigger>
          <TabsTrigger value="modules" className="text-sm">Modules Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Complete these 8 steps in order to get your school fully operational.
            Each step is checked live against the database — steps marked <span className="font-medium text-emerald-600">Done</span> are already complete.
          </p>
          <StepAccordion steps={setupSteps} />
        </TabsContent>

        <TabsContent value="user-management" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Manage who can access Educore, what they can do, and how their profiles connect to staff or student records.
          </p>
          <StepAccordion steps={userManagementSteps} />
        </TabsContent>

        <TabsContent value="modules" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Educore is organised into focused modules accessible from the sidebar. Each module handles a specific area of school management.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {MODULES.map(m => (
              <ModuleCard key={m.title} {...m} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
