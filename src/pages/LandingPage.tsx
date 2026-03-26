import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  LayoutDashboard,
  Percent,
  Shield,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/utils/cn'
import { DashboardPreview } from '@/pages/landing/DashboardPreview'

const DEMO_WHATSAPP = `https://wa.me/263779035404?text=${encodeURIComponent(
  "Hi, I'd like to request a demo of Educore."
)}`
const SALES_WHATSAPP = `https://wa.me/263779035404?text=${encodeURIComponent(
  "Hi, I'd like to contact sales about Educore."
)}`

const darkSectionShell =
  'relative overflow-hidden border-y border-primary/25 py-24 sm:py-28'
const darkGradientBg = (
  <>
    <div
      className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary via-primary to-teal-950"
      aria-hidden
    />
    <div
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-18%,rgba(255,255,255,0.14),transparent)]"
      aria-hidden
    />
    <div
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_100%_100%,rgba(0,0,0,0.22),transparent)]"
      aria-hidden
    />
  </>
)

const darkCardClass =
  'border border-white/15 bg-black/25 shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-black/35 hover:shadow-xl hover:shadow-black/25'

const heroMotionStyles = `
@keyframes educore-hero-float {
  0%, 100% { transform: perspective(1000px) rotateY(-8deg) rotateX(2deg) translateY(0px); }
  50% { transform: perspective(1000px) rotateY(-8deg) rotateX(2deg) translateY(-8px); }
}
.educore-hero-mockup-3d {
  transform-style: preserve-3d;
  animation: educore-hero-float 4s ease-in-out infinite;
  transition: transform 0.5s ease;
}
.educore-hero-mockup-3d:hover {
  animation-play-state: paused;
  transform: perspective(1000px) rotateY(-4deg) rotateX(2deg) translateY(0px);
}
@media (max-width: 639px) {
  .educore-hero-mockup-3d {
    animation: none;
    transform: none;
  }
  .educore-hero-mockup-3d:hover {
    transform: none;
  }
}
@keyframes educore-hero-enter-left {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes educore-hero-enter-right {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes educore-hero-enter-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.educore-hero-enter-left {
  animation: educore-hero-enter-left 0.7s ease-out forwards;
}
.educore-hero-enter-right {
  opacity: 0;
  animation: educore-hero-enter-right 0.7s ease-out 0.15s forwards;
}
.educore-hero-enter-trust {
  opacity: 0;
  animation: educore-hero-enter-fade 0.6s ease-out 0.3s forwards;
}
`

export function DashboardMockup() {
  const [activeSlide, setActiveSlide] = useState(0)

  const barPairs: { rev: number; exp: number }[] = [
    { rev: 36, exp: 26 },
    { rev: 48, exp: 32 },
    { rev: 30, exp: 42 },
    { rev: 54, exp: 28 },
    { rev: 40, exp: 36 },
    { rev: 58, exp: 32 },
  ]
  const attendanceBars = [82, 88, 80, 91, 86]
  const classPerformance = [
    { cls: 'Grade 4', pass: '78%' },
    { cls: 'Grade 5', pass: '84%' },
    { cls: 'Grade 6', pass: '81%' },
  ]
  const teachingTasks = [
    { label: 'Attendance marked', value: '96%' },
    { label: 'Schemes submitted', value: '14/16' },
    { label: 'Assessments due', value: '3' },
  ]

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3)
    }, 6000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div
      className="educore-hero-mockup-3d w-full max-w-[560px] max-lg:mx-auto max-lg:max-w-full"
      style={{ perspective: '1000px' }}
    >
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-100 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="mx-2 min-w-0 flex-1 truncate rounded-md bg-white/90 px-2 py-1 text-center text-[10px] text-gray-500 dark:bg-gray-700/80 dark:text-gray-300">
            educore.app/dashboard
          </div>
        </div>

        <div className="space-y-3 bg-gray-50 p-3 dark:bg-slate-950">
          {activeSlide === 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-100">
                  Finance Overview
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="size-6 shrink-0 rounded-full bg-linear-to-br from-teal-400 to-teal-700"
                    aria-hidden
                  />
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">
                    Bursar
                  </span>
                </div>
              </div>

              <div className="rounded-md bg-amber-100 px-2 py-1.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                Financial health: Monitor - Collection rate at 64%
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                  <TrendingUp className="size-3.5 text-emerald-600" aria-hidden />
                  <p className="mt-1 text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                    $24,800
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Revenue (YTD)
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                  <AlertCircle className="size-3.5 text-amber-500" aria-hidden />
                  <p className="mt-1 text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                    $8,200
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Outstanding
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                  <ArrowDownRight className="size-3.5 text-rose-600" aria-hidden />
                  <p className="mt-1 text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                    $12,400
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Total Expenses
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                  <Percent className="size-3.5 text-blue-600" aria-hidden />
                  <p className="mt-1 text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                    64.3%
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Collection Rate
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  Revenue vs Expenses - Last 6 months
                </p>
                <div className="flex items-end justify-between gap-1 border-t border-gray-200 pt-2 dark:border-gray-700">
                  {barPairs.map((pair, i) => (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div className="flex h-22 w-full items-end justify-center gap-0.5">
                        <div
                          className="w-2 max-w-[10px] rounded-t-sm bg-emerald-500"
                          style={{ height: `${pair.rev}px` }}
                        />
                        <div
                          className="w-2 max-w-[10px] rounded-t-sm bg-rose-400"
                          style={{ height: `${pair.exp}px` }}
                        />
                      </div>
                      <span className="text-[8px] text-gray-400">M{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSlide === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-100">
                  Teacher Classroom Dashboard
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="size-6 shrink-0 rounded-full bg-linear-to-br from-indigo-400 to-indigo-700"
                    aria-hidden
                  />
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">
                    Teacher
                  </span>
                </div>
              </div>

              <div className="rounded-md bg-indigo-100 px-2 py-1.5 text-[10px] font-medium text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100">
                Class 6A attendance complete - 2 assessments due this week
              </div>

              <div className="grid grid-cols-3 gap-2">
                {teachingTasks.map((task) => (
                  <div
                    key={task.label}
                    className="rounded-lg border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-slate-800"
                  >
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {task.value}
                    </p>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400">
                      {task.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                <p className="mb-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  Class attendance trend - Mon-Fri
                </p>
                <div className="flex h-24 items-end justify-between gap-1 border-t border-gray-200 pt-2 dark:border-gray-700">
                  {attendanceBars.map((height, i) => (
                    <div
                      key={`teacher-${i}`}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div
                        className="w-3 rounded-t-sm bg-indigo-500"
                        style={{ height: `${height * 0.65}px` }}
                      />
                      <span className="text-[8px] text-gray-400">D{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-2.5 text-[10px] shadow-sm dark:border-gray-700 dark:bg-slate-800">
                <p className="mb-1.5 font-semibold text-gray-700 dark:text-gray-200">
                  Needing intervention
                </p>
                <div className="space-y-1 text-gray-600 dark:text-gray-300">
                  <div className="flex items-center justify-between gap-2">
                    <span>Mathematics - Unit test prep</span>
                    <span className="font-medium text-amber-600">11 learners</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>English - Reading fluency</span>
                    <span className="font-medium text-rose-600">8 learners</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSlide === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-100">
                  Headmaster Oversight
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="size-6 shrink-0 rounded-full bg-linear-to-br from-emerald-400 to-emerald-700"
                    aria-hidden
                  />
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">
                    Headmaster
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                  <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                    93.4%
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    School attendance rate
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                  <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                    18
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Pending executive approvals
                  </p>
                </div>
              </div>

              <div className="rounded-md bg-emerald-100 px-2 py-1.5 text-[10px] font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                Weekly alert: Grade 4 pass rate dropped 5% in Maths
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                <p className="mb-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  Class pass-rate snapshot
                </p>
                <div className="space-y-1 text-[10px]">
                  {classPerformance.map((item) => (
                    <div
                      key={item.cls}
                      className="flex items-center justify-between text-gray-700 dark:text-gray-300"
                    >
                      <span>{item.cls}</span>
                      <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {item.pass}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 border-t border-gray-200 pt-2 dark:border-gray-700">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Show dashboard slide ${idx + 1}`}
                onClick={() => setActiveSlide(idx)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  activeSlide === idx
                    ? 'w-6 bg-teal-600 dark:bg-teal-400'
                    : 'w-2.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight text-slate-900 dark:text-white"
        >
          <div className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-teal-600/10 ring-1 ring-slate-200 dark:ring-slate-700">
            <img
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="size-7 object-contain p-0.5"
            />
          </div>
          <span>Educore</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <a
            href="#features"
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            Pricing
          </a>
          <Link
            to="/login"
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            Login
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="md:hidden" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button size="sm" className="hidden sm:inline-flex" asChild>
            <a
              href={DEMO_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
            >
              Request Demo
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  const valueBullets = [
    'Track school fees, payments, and outstanding balances in real time',
    'Monitor expenses and enforce approval workflows',
    'See class performance and attendance instantly',
    'Hold staff accountable with clear roles and actions',
  ]

  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-linear-to-br from-teal-50 via-white to-emerald-50 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <style>{heroMotionStyles}</style>
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-teal-500/7 via-transparent to-emerald-500/5 dark:from-teal-500/10 dark:to-emerald-500/5"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-32 -top-24 size-[480px] rounded-full bg-teal-500/6 blur-3xl dark:bg-teal-500/10" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-[400px] rounded-full bg-emerald-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-10 lg:gap-12">
          <div className="educore-hero-enter-left min-w-0">
            <p className="mb-4 inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold tracking-wider text-teal-700 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300">
              SCHOOL PERFORMANCE CONTROL CENTER
            </p>
            <h1 className="max-w-xl text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl lg:text-5xl lg:leading-[1.1] dark:text-white">
              Stop guessing.{' '}
              <span className="text-teal-600 dark:text-teal-400">
                Run your school on live data.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-gray-500 dark:text-gray-400">
              Educore gives school owners and leaders one clear view of finance,
              academics, attendance, and daily operations so you can act early,
              not at the end of term.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {valueBullets.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal-600 dark:text-teal-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={DEMO_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-teal-800"
              >
                Request Demo
                <ArrowRight className="size-4" />
              </a>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-900 dark:text-gray-100 dark:hover:bg-slate-800"
              >
                Login
              </Link>
            </div>
            <div className="mt-4 space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
              <p className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-teal-600 dark:text-teal-400" />
                We help you set up your school in under 24 hours
              </p>
              <p className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-teal-600 dark:text-teal-400" />
                No technical experience required
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900">
                Built for Zimbabwean schools
              </span>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900">
                Secure, role-based access for staff
              </span>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900">
                Your data is safely stored and backed up
              </span>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900">
                Designed with real school workflows in mind
              </span>
            </div>
            <div className="educore-hero-enter-trust mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400 dark:text-gray-500">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5 shrink-0 text-teal-600 opacity-80" />
                No setup fee
              </span>
              <span className="text-gray-300 dark:text-gray-600" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5 shrink-0 text-teal-600 opacity-80" />
                Free 30-day trial
              </span>
              <span className="text-gray-300 dark:text-gray-600" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5 shrink-0 text-teal-600 opacity-80" />
                Cancel anytime
              </span>
            </div>
          </div>

          <div className="educore-hero-enter-right flex justify-center md:justify-end md:origin-right md:scale-[0.8] lg:scale-100">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  )
}

function WhatEducoreDoesSection() {
  const blocks = [
    'Track fees and know exactly who has not paid',
    'Record and control expenses with approvals',
    'Monitor student performance across classes',
    'Manage attendance and daily school operations',
    'Generate finance and academic reports instantly',
  ]

  return (
    <section className="border-b border-slate-200/80 bg-white py-20 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          What Educore helps you do
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          Run your school with clear daily visibility instead of waiting for
          end-of-term surprises.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blocks.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            >
              <span className="inline-flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal-600 dark:text-teal-400" />
                <span>{item}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProblemSection() {
  const items = [
    'No real-time financial visibility — you only see problems after the term ends.',
    'Academic drift hides in spreadsheets until parents or inspectors ask hard questions.',
    'Manual reporting burns leadership time and still arrives too late to act.',
    'Weak accountability: who marked what, who spent what, and who followed up?',
  ]
  return (
    <section className="border-b border-slate-200/80 bg-slate-50 py-24 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Schools are flying blind
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          Most schools run on disconnected registers, delayed reports, and gut
          feel. That is not mismanagement — it is missing infrastructure.
        </p>
        <p className="mt-4 max-w-3xl text-base font-medium text-slate-700 dark:text-slate-200">
          Most schools only discover problems at the end of term — when it&apos;s
          too late to fix them.
        </p>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {items.map((text) => (
            <li
              key={text}
              className="flex gap-3 rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80 dark:shadow-black/20"
            >
              <span className="mt-1 size-2 shrink-0 rounded-full bg-red-500/80" />
              <span className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100">
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function SolutionSection() {
  const cards = [
    {
      icon: Wallet,
      title: 'Track fees, expenses, and cash flow',
      body: 'See payments, balances, and spending in one place so finance decisions are based on today&apos;s numbers, not old spreadsheets.',
    },
    {
      icon: BarChart3,
      title: 'Monitor student and class performance',
      body: 'Compare class trends, spot weak subjects early, and intervene before final results are locked in.',
    },
    {
      icon: Shield,
      title: 'Know who did what and when',
      body: 'Track attendance, approvals, and key actions with clear role ownership across your team.',
    },
    {
      icon: LayoutDashboard,
      title: "See your school's status instantly",
      body: 'Get weekly leadership visibility on finance, academics, and operations so you can act before issues grow.',
    },
  ]
  return (
    <section id="features" className={cn(darkSectionShell, 'scroll-mt-20')}>
      {darkGradientBg}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          One platform. Total visibility.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          Educore is not another siloed module. It is the layer where financial
          and academic signals meet — so leadership can steer with evidence.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon: Icon, title, body }) => (
            <Card key={title} className={darkCardClass}>
              <CardHeader className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-black/30 text-white ring-1 ring-white/20">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="text-lg leading-snug text-white">
                  {title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-slate-300">
                  {body}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function DashboardShowcase() {
  const previewTone =
    '[&_h3]:text-slate-900 [&_p]:text-slate-600 dark:[&_h3]:text-slate-900 dark:[&_p]:text-slate-600'
  return (
    <section className="border-y border-slate-200 bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 text-slate-900 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          See your school in real time
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          The same dashboards your headmaster and bursar use every day —
          financial health, budgets, and academic control in one system.
        </p>
        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              What your bursar sees daily
            </p>
            <DashboardPreview
              className={previewTone}
              title="Bursar: financial health & forecasting"
              description="See who hasn&apos;t paid, track cash flow, and act before problems grow."
              imageSrc="/Finance.png"
              imageAlt="Educore bursar dashboard showing financial health KPIs and projected end-of-term balance"
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              What your headmaster monitors weekly
            </p>
            <DashboardPreview
              className={previewTone}
              title="Headmaster: academic control center"
              description="Track attendance patterns, monitor class outcomes, and follow up on pending approvals before they delay progress."
              imageSrc="/Academia.png"
              imageAlt="Educore headmaster dashboard with attendance trend chart and scheme book approval status"
            />
          </div>
        </div>
        <div className="mt-12 max-w-4xl">
          <DashboardPreview
            className={previewTone}
            title="Budgets & spend discipline"
            description="Plan by category, compare budget to actuals, and spot overruns early — the foundation for credible financial reporting to your board."
            imageSrc="/budget.png"
            imageAlt="Educore budgets screen with category allocations, actual spend, and progress tracking"
          />
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const outcomes = [
    {
      title: 'Know exactly who has not paid fees',
      copy: 'Stop chasing partial lists. See balances and follow-up priorities in one place so cash flow matches your expectations.',
    },
    {
      title: 'Track class performance instantly',
      copy: 'Compare classes and terms without rebuilding pivot tables. Spot trends while teachers can still adjust.',
    },
    {
      title: 'Monitor expenses and prevent leakages',
      copy: 'Every payment and approval leaves a trail. Reduce “invisible” spend and make audits boring in a good way.',
    },
    {
      title: 'Budget by category and produce finance reports',
      copy: 'Allocate per line item, watch actuals against budget in real time, and use built-in finance reporting instead of recompiling spreadsheets every term.',
    },
    {
      title: 'Hold staff to clear, fair standards',
      copy: 'Roles and actions are visible. Leaders get consistency; teachers get clarity on what “done” looks like.',
    },
  ]
  return (
    <section className={darkSectionShell}>
      {darkGradientBg}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Outcomes your board will recognize
            </h2>
            <p className="mt-3 max-w-xl text-lg text-slate-300">
              Below is what changes when visibility is default — not a project
              you run once a term.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white drop-shadow-sm">
            <TrendingUp className="size-4 text-primary-foreground" />
            Built for heads, bursars, and owners
          </div>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {outcomes.map(({ title, copy }) => (
            <Card key={title} className={darkCardClass}>
              <CardHeader>
                <CardTitle className="text-xl leading-snug text-white">
                  {title}
                </CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-300">
                  {copy}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function ComparisonSection() {
  const rows = [
    {
      label: 'Visibility',
      traditional: 'No analytics — you reconstruct the story from files',
      educore: 'Real-time dashboards tuned for school leadership',
    },
    {
      label: 'Reporting',
      traditional: 'Manual reports that age before they are read',
      educore:
        'Finance and operations insights plus report-ready views while the term is still in motion',
    },
    {
      label: 'Budgeting',
      traditional: 'Budgets live in separate files nobody reconciles weekly',
      educore: 'Category budgets tracked against actual spend inside the same platform',
    },
    {
      label: 'Tools',
      traditional: 'Fragmented spreadsheets, messages, and paper',
      educore: 'One unified system for finance, academics, and operations',
    },
  ]
  return (
    <section className="border-t border-slate-200/80 bg-slate-50 py-24 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Educore vs. how most schools operate today
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          You are not choosing software for its own sake. You are choosing how
          fast your leadership team can see truth and act on it.
        </p>
        <div className="mt-12 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800/60 dark:shadow-black/30">
          <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-slate-200 dark:md:divide-slate-700">
            <div className="hidden bg-slate-100 px-6 py-4 text-sm font-semibold text-slate-500 md:block dark:bg-slate-900/50 dark:text-slate-400" />
            <div className="border-b border-slate-200 bg-slate-100 px-6 py-4 text-center text-sm font-semibold text-slate-800 md:border-b-0 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
              Traditional tools
            </div>
            <div className="bg-teal-600/10 px-6 py-4 text-center text-sm font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
              Educore
            </div>
          </div>
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-1 border-t border-slate-200 md:grid-cols-3 md:divide-x md:divide-slate-200 dark:border-slate-700 dark:md:divide-slate-700"
            >
              <div className="bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-900 md:bg-slate-50 dark:bg-slate-900/40 dark:text-white">
                {row.label}
              </div>
              <div className="flex gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 md:border-t-0 dark:border-slate-700 dark:text-slate-300">
                <X className="mt-0.5 size-4 shrink-0 text-red-500/90" />
                {row.traditional}
              </div>
              <div className="flex gap-3 border-t border-slate-200 bg-teal-50/50 px-6 py-4 text-sm text-slate-800 md:border-t-0 dark:border-slate-700 dark:bg-teal-950/25 dark:text-slate-100">
                <Check className="mt-0.5 size-4 shrink-0 text-teal-600 dark:text-teal-400" />
                {row.educore}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-b border-slate-200/80 bg-white py-24 dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Card className="border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900/80">
          <CardContent className="flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Pricing
              </h2>
              <p className="mt-2 max-w-xl text-slate-600 dark:text-slate-300">
                Simple pricing designed for schools. Affordable plans based on
                your school size, modules, and support needs.
              </p>
            </div>
            <Button size="lg" asChild>
              <a
                href={SALES_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact sales
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section
      id="cta"
      className={cn(darkSectionShell, 'scroll-mt-20 border-b-0 py-28 sm:py-32')}
    >
      {darkGradientBg}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_100%,rgba(255,255,255,0.1),transparent)]" />
      <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Stop running your school blindly. Take control with Educore.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
          Book a walkthrough with our team, or sign in if your school is already
          on Educore.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="h-12 min-w-[200px] px-8 text-base" asChild>
            <a
              href={DEMO_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
            >
              Request Demo
              <ArrowRight className="size-4" />
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 min-w-[200px] border-white/40 bg-transparent px-8 text-base text-white hover:bg-black/25 hover:text-white"
            asChild
          >
            <a
              href={SALES_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Sales
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-slate-800 ring-1 ring-slate-700">
            <img
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="size-7 object-contain p-0.5"
            />
          </div>
          <div>
            <p className="font-semibold text-white">Educore</p>
            <p className="text-sm text-slate-400">
              Integrated school management & performance
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <a href="#features" className="transition-colors hover:text-white">
            Features
          </a>
          <a href="#pricing" className="transition-colors hover:text-white">
            Pricing
          </a>
          <Link to="/login" className="transition-colors hover:text-white">
            Login
          </Link>
          <a
            href={SALES_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            Contact
          </a>
        </div>
        <p className="text-xs text-slate-500 lg:text-right">
          © {new Date().getFullYear()} Educore. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen antialiased">
      <LandingNavbar />
      <main>
        <HeroSection />
        <WhatEducoreDoesSection />
        <ProblemSection />
        <SolutionSection />
        <DashboardShowcase />
        <FeaturesSection />
        <ComparisonSection />
        <PricingSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
