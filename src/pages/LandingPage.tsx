import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Check,
  LayoutDashboard,
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
const SALES_MAIL =
  'mailto:sales@educore.com?subject=Educore%20%E2%80%94%20Sales%20inquiry'

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
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-teal-500/7 via-white to-slate-50 dark:from-teal-500/10 dark:via-slate-950 dark:to-slate-900"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-32 -top-24 size-[480px] rounded-full bg-teal-500/6 blur-3xl dark:bg-teal-500/10" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-[400px] rounded-full bg-sky-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <p className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-teal-400">
          School performance control center
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.08] dark:text-white">
          Stop guessing.{' '}
          <span className="text-teal-600 dark:text-teal-400">
            Run your school on live data.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl dark:text-slate-300">
          Educore gives heads, bursars, and owners one place to see fees,
          expenses, category budgets, financial reports, class performance, and
          staff accountability — before small issues become expensive surprises.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="lg" className="h-12 px-8 text-base" asChild>
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
            className="h-12 border-slate-300 bg-white px-8 text-base dark:border-slate-600 dark:bg-transparent"
            asChild
          >
            <Link to="/login">Login</Link>
          </Button>
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
      title: 'Finance intelligence',
      body: 'Live fee collection, outstanding balances, expenses, and cash position — plus category budgets with actual vs allocated tracking and dedicated finance reports for committees and auditors.',
    },
    {
      icon: BarChart3,
      title: 'Academic tracking',
      body: 'See performance patterns across classes and terms so you intervene while students can still recover — not after results are final.',
    },
    {
      icon: Shield,
      title: 'Staff accountability',
      body: 'Clear ownership for attendance, marking, and approvals. Less ambiguity, fewer “I thought someone else did it” moments.',
    },
    {
      icon: LayoutDashboard,
      title: 'Real-time dashboards',
      body: 'Executive-ready snapshots for heads and deputies: what needs attention this week, not what happened last term on paper.',
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
          <DashboardPreview
            className={previewTone}
            title="Bursar: financial health & forecasting"
            description="Revenue, outstanding fees, expenses, collection rate, and projected end-of-term position — so you intervene before cash turns critical."
            imageSrc="/Finance.png"
            imageAlt="Educore bursar dashboard showing financial health KPIs and projected end-of-term balance"
          />
          <DashboardPreview
            className={previewTone}
            title="Headmaster: academic control center"
            description="Attendance trends, scheme-book pipeline, and approvals waiting on HODs or executives — leadership sees what needs action this week."
            imageSrc="/Academia.png"
            imageAlt="Educore headmaster dashboard with attendance trend chart and scheme book approval status"
          />
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
                We tailor plans to school size, modules, and support needs. No
                generic price list — talk to us and we will map something that
                fits your budget and rollout.
              </p>
            </div>
            <Button size="lg" asChild>
              <a href={SALES_MAIL}>
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
          Start running your school with data
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
            <a href={SALES_MAIL}>Contact Sales</a>
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
          <a href={SALES_MAIL} className="transition-colors hover:text-white">
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
