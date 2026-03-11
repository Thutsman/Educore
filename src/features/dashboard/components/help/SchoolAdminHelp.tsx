import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, ChevronDown, ArrowRight, Settings2,
  CalendarDays, BookOpen, UserCog, GraduationCap, Banknote, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

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

// ── Main component ───────────────────────────────────────────────────────────

export function SchoolAdminHelp() {
  const setupSteps: AccordionStep[] = [
    {
      step: 1,
      title: 'Configure Academic Year',
      content: (
        <>
          <p>Go to Academics and create the current academic year and its terms.</p>
          <StepList items={[
            'Navigate to Academics using the sidebar.',
            'Open the Academic Years section.',
            'Click "New Academic Year" and enter the year label, start date, and end date.',
            'Toggle "Set as Current" to activate this year.',
            'Add Term 1, Term 2, and Term 3 with correct start and end dates.',
            'Mark the currently running term as active.',
          ]} />
          <GoTo to="/academics" label="Go to Academics" />
        </>
      ),
    },
    {
      step: 2,
      title: 'Create Classes',
      content: (
        <>
          <p>Add your school's grade levels, streams, and class rooms.</p>
          <StepList items={[
            'Go to Academics → Classes.',
            'Click "Add Class".',
            'Enter the class name, grade level, capacity, and room number.',
            'Link the class to the current academic year.',
            'You can assign a class teacher after teacher accounts are created.',
          ]} />
          <GoTo to="/academics" label="Go to Academics" />
        </>
      ),
    },
    {
      step: 3,
      title: 'Create Headmaster Account',
      content: (
        <>
          <p>Go to Staff and create a user account for the headmaster, then assign them the Headmaster role.</p>
          <StepList items={[
            'Go to Staff using the sidebar.',
            'Click "Create User Account" in the Teachers tab.',
            'Enter the headmaster\'s full name, email, and a temporary password.',
            'After the account is created, click "Manage Roles" next to their record.',
            'Assign the "headmaster" role scoped to this school.',
            'The headmaster will receive a confirmation email to activate their account.',
          ]} />
          <GoTo to="/staff" label="Go to Staff" />
        </>
      ),
    },
    {
      step: 4,
      title: 'Add Teachers & Staff',
      content: (
        <>
          <p>Create accounts for teachers, bursars, HODs, and non-teaching staff.</p>
          <StepList items={[
            'Go to Staff → Teachers and click "Add Teacher" to create a staff record.',
            'Click "Create User Account" to create a login account.',
            'Use "Manage Roles" to assign the appropriate role (teacher, class_teacher, hod, bursar).',
            'Use the Allocations button to assign a teacher to their subjects and classes.',
            'Return to Academics → Classes and set each class\'s class teacher.',
          ]} />
          <GoTo to="/staff" label="Go to Staff" />
        </>
      ),
    },
    {
      step: 5,
      title: 'Enrol Students',
      content: (
        <>
          <p>Go to Students and add student records, assign guardians, and assign to classes.</p>
          <StepList items={[
            'Go to Students using the sidebar.',
            'Click "Add Student".',
            'Enter: full name, admission number, date of birth, and gender.',
            'Select the student\'s current class.',
            'Add guardian information (name, relationship, contact number).',
            'Students will immediately appear in attendance lists for their class.',
          ]} />
          <GoTo to="/students" label="Go to Students" />
        </>
      ),
    },
    {
      step: 6,
      title: 'Configure Fee Structures',
      content: (
        <>
          <p>Go to Finance and set up fee structures for each class/term.</p>
          <StepList items={[
            'Go to Finance using the sidebar.',
            'Open the Fee Structures section.',
            'Click "Add Fee Structure".',
            'Enter the fee name, amount, and category (tuition, boarding, transport, etc.).',
            'Link the structure to an academic year and optionally a specific class or term.',
            'Use Finance → Invoices to generate invoices from these structures in bulk.',
          ]} />
          <GoTo to="/finance" label="Go to Finance" />
        </>
      ),
    },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
            <Settings2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">School Admin Setup Guide</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Follow these 6 steps to configure your school on Educore and hand over daily operations to the Headmaster.
            </p>
          </div>
        </div>
      </div>

      {/* ── Step list ── */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Complete these steps in order. Once finished, the headmaster and teaching staff can take over day-to-day operations.
        </p>
        <StepAccordion steps={setupSteps} />
      </div>

      {/* ── Quick links ── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Quick Links</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: CalendarDays, label: 'Academics', to: '/academics', color: 'bg-blue-500/10 text-blue-600' },
            { icon: UserCog,      label: 'Staff',     to: '/staff',     color: 'bg-violet-500/10 text-violet-600' },
            { icon: GraduationCap,label: 'Students',  to: '/students',  color: 'bg-emerald-500/10 text-emerald-600' },
            { icon: Banknote,     label: 'Finance',   to: '/finance',   color: 'bg-amber-500/10 text-amber-600' },
            { icon: BookOpen,     label: 'Classes',   to: '/academics', color: 'bg-orange-500/10 text-orange-600' },
            { icon: Users,        label: 'User Roles',to: '/staff',     color: 'bg-pink-500/10 text-pink-600' },
          ].map(item => (
            <Link
              key={item.label}
              to={item.to}
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm font-medium transition-colors hover:bg-muted/40"
            >
              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', item.color)}>
                <item.icon className="h-4 w-4" />
              </div>
              {item.label}
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
