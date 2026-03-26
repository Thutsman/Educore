import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, ChevronDown, ArrowRight,
  BookOpen, FolderOpen,
  BookMarked, CalendarDays, FileQuestion, GraduationCap,
  Sun, AlertTriangle,
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

export function SubjectTeacherHelp() {
  const gettingStartedSteps: AccordionStep[] = [
    {
      step: 1,
      title: 'Verify Your Subject Assignments',
      content: (
        <>
          <p>
            Your subject assignments are set up by the Headmaster in Staff → Teacher Allocations.
            Check your dashboard to confirm which subjects and classes you have been assigned.
          </p>
          <StepList items={[
            'Look at the "Subjects Taught" card on your dashboard — it shows how many subjects across how many classes.',
            'Scroll down to the "My Subjects & Classes" list to see each assignment.',
            'If your subjects are not showing, ask the Headmaster to open Staff → Teachers, click Allocations next to your name, and add each subject + class pair using the + button. The Specialization field on the teacher form is for HR records only and does not affect your dashboard.',
            'If your account is not linked to a teacher record at all, ask the Headmaster to link it in Staff → Teachers.',
          ]} />
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Your dashboard shows "Teacher profile not linked" if your user account has not been connected to a staff record yet.
          </div>
        </>
      ),
    },
    {
      step: 2,
      title: 'Set Up Your Scheme Book',
      content: (
        <>
          <p>
            A scheme of work is your term-level plan — it maps each week to a topic, learning objectives, and references.
            Fill it in before the term starts so students and the HOD can see your curriculum plan.
          </p>
          <StepList items={[
            'Go to Scheme Book using the sidebar.',
            'Select the subject and class you want to plan.',
            'Click "New Scheme" or open an existing one.',
            'Add one row per week: week number, topic, objectives, and teaching resources.',
            'Save — the HOD and Deputy can view your scheme book for review.',
          ]} />
          <GoTo to="/scheme-book" label="Go to Scheme Book" />
        </>
      ),
    },
    {
      step: 3,
      title: 'Create Lesson Plans',
      content: (
        <>
          <p>
            Lesson plans break down each lesson within a week — more granular than the scheme book.
            Use them to structure your teaching and keep a record of what was covered.
          </p>
          <StepList items={[
            'Go to Lesson Plans using the sidebar.',
            'Select your subject and class.',
            'Click "New Lesson Plan".',
            'Link to the relevant scheme of work week.',
            'Add: lesson objectives, teaching methods, resources used, and a brief outcome note.',
            'You can duplicate plans for similar lessons to save time.',
          ]} />
          <GoTo to="/lesson-plans" label="Go to Lesson Plans" />
        </>
      ),
    },
    {
      step: 4,
      title: 'Create Your First Exam or Assessment',
      content: (
        <>
          <p>
            Exams and assessments are how you record student performance. Create the exam first, then
            enter grades after it has been completed.
          </p>
          <StepList items={[
            'Go to Academics using the sidebar.',
            'Navigate to the Exams section.',
            'Click "New Exam".',
            'Enter the exam name, type (test, quiz, mid-term, end-of-term, etc.), class, subject, and date.',
            'Set the total marks.',
            'After the exam, return to Academics → Grades to enter each student\'s score.',
          ]} />
          <GoTo to="/academics" label="Go to Academics" />
        </>
      ),
    },
  ]

  const dailyWorkflowSteps: AccordionStep[] = [
    {
      step: 1,
      title: 'Review Today\'s Lesson Plan',
      content: (
        <>
          <p>Start each teaching day by checking your lesson plan for the day. Verify that resources and materials are ready before the lesson.</p>
          <StepList items={[
            'Open Lesson Plans from the sidebar.',
            'Filter by subject and today\'s date.',
            'Confirm the topic, objectives, and any resources needed.',
            'Make quick notes on adjustments you\'ll make before entering the classroom.',
          ]} />
          <GoTo to="/lesson-plans" label="Go to Lesson Plans" />
        </>
      ),
    },
    {
      step: 2,
      title: 'Record Class Assessments',
      content: (
        <>
          <p>After classwork, tests, or quizzes, enter scores promptly while they are fresh. Timely grade entry helps parents and the HOD track student progress.</p>
          <StepList items={[
            'Go to Academics → Grades.',
            'Select the exam or assessment you want to grade.',
            'Enter each student\'s score out of the total marks.',
            'Add remarks where relevant (e.g. "student was absent").',
            'Save — the system calculates grade letters and percentages automatically.',
          ]} />
          <GoTo to="/academics" label="Go to Academics" />
        </>
      ),
    },
    {
      step: 3,
      title: 'Update Your Lesson Record',
      content: (
        <>
          <p>At the end of each class, note what was actually covered versus what was planned. This is important for tracking curriculum completion and for HOD reviews.</p>
          <StepList items={[
            'Return to your lesson plan in the Lesson Plans section.',
            'Update the "Outcome" field with what was covered.',
            'Note any topics not completed — they should be carried to the next lesson.',
            'The HOD can view your lesson records as part of academic monitoring.',
          ]} />
          <GoTo to="/lesson-plans" label="Go to Lesson Plans" />
        </>
      ),
    },
    {
      step: 4,
      title: 'Upload Learning Resources',
      content: (
        <>
          <p>Share notes, worksheets, and reference materials with students through the Resources module. Resources can be linked to specific lessons or made available to the whole class.</p>
          <StepList items={[
            'Go to Resources using the sidebar.',
            'Click "Upload Resource".',
            'Select the file (PDF, document, image, etc.).',
            'Assign it to a subject and class.',
            'Optionally link it to a lesson plan topic.',
            'Students with portal access can download resources directly.',
          ]} />
          <GoTo to="/resources" label="Go to Resources" />
        </>
      ),
    },
  ]

  const TOOLS = [
    { icon: BookMarked,   title: 'Scheme Book',    description: 'Term-level curriculum plan per subject and class.',                  color: 'bg-blue-500/10 text-blue-600',     to: '/scheme-book' },
    { icon: CalendarDays, title: 'Lesson Plans',   description: 'Detailed lesson-by-lesson plans with topics and outcomes.',          color: 'bg-violet-500/10 text-violet-600', to: '/lesson-plans' },
    { icon: FileQuestion, title: 'Assignments',    description: 'Set and track student assignments and deadlines.',                   color: 'bg-emerald-500/10 text-emerald-600', to: '/assignments' },
    { icon: BookOpen,     title: 'Assessments',    description: 'Create assessments in Academics (Exams tab) and enter marks in Grade Entry.', color: 'bg-orange-500/10 text-orange-600', to: '/academics' },
    { icon: BookOpen,     title: 'Academics',      description: 'Exams and grade entry for your assigned classes and subjects.',      color: 'bg-amber-500/10 text-amber-600',   to: '/academics' },
    { icon: FolderOpen,   title: 'Resources',      description: 'Upload and organise teaching materials and student resources.',      color: 'bg-rose-500/10 text-rose-600',     to: '/resources' },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">Subject Teacher Guide</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              As a Subject Teacher, you are responsible for planning, teaching, and assessing specific subjects
              across one or more classes. This guide walks you through getting set up and your daily routine.
            </p>
          </div>
        </div>

        {/* Role clarity */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Your Primary Role</p>
            <p className="text-xs text-muted-foreground">
              You teach one or more subjects across different classes. Your main responsibilities are planning
              lessons, entering grades, and uploading resources for your students.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">No Attendance Role</p>
            <p className="text-xs text-muted-foreground">
              Attendance is managed by Class Teachers. If you are also a Class Teacher for a homeroom class,
              you will see attendance tools on your dashboard as well.
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
            Complete these steps at the start of each term to ensure your curriculum is planned
            and your subjects are correctly configured in the system.
          </p>
          <StepAccordion steps={gettingStartedSteps} />
        </TabsContent>

        <TabsContent value="daily-workflow" className="mt-4 space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
            <Sun className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-medium">A recommended routine to follow on each teaching day.</p>
          </div>
          <StepAccordion steps={dailyWorkflowSteps} />
        </TabsContent>

        <TabsContent value="your-tools" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            These are the modules you will use most as a Subject Teacher. Click "Open" to go directly to the module.
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
