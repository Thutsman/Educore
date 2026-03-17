import { useState } from 'react'
import { Banknote, TrendingDown, TrendingUp, Scale, Percent, AlertTriangle, Activity, PiggyBank } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { EmptyState } from '@/components/common/EmptyState'
import { DataTable, type Column } from '@/components/common/DataTable'
import { AppAreaChart } from '@/components/charts/AppAreaChart'
import { AppPieChart } from '@/components/charts/AppPieChart'
import { CHART_COLORS } from '@/components/charts/AppAreaChart'
import { useAuth } from '@/hooks/useAuth'
import {
  useBursarStats,
  useMonthlyFinancials,
  useOutstandingByClass,
  usePaymentMethodBreakdown,
} from '@/features/dashboard/hooks/useBursarDashboard'
import { formatCurrency, formatPercent } from '@/utils/format'
import type { OutstandingByClass } from '@/services/dashboard'
import { useFinanceSummary, useFinancialHealth } from '@/features/finance/hooks/useFinance'
import {
  getRemainingMonthsInTerm,
  getExpectedExpenses,
  getProjectedEndOfTermBalance,
} from '@/features/finance/financeSelectors'
import { useAcademicYears, useTerms } from '@/features/academics/hooks/useAcademics'
import { FinanceTermSelector, type FinanceTermSelection } from '@/features/finance/components/FinanceTermSelector'

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return <div className="w-full animate-pulse rounded-lg bg-muted" style={{ height }} />
}

const OUTSTANDING_COLS: Column<OutstandingByClass>[] = [
  { key: 'className',   header: 'Class',    sortable: true },
  {
    key: 'students',
    header: 'Students',
    sortable: true,
    className: 'tabular-nums text-center',
    headerClassName: 'text-center',
    cell: (r) => (
      <span className="flex justify-center">
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold">
          {r.students}
        </span>
      </span>
    ),
  },
  {
    key: 'outstanding',
    header: 'Outstanding',
    sortable: true,
    className: 'text-right tabular-nums font-medium text-amber-500',
    headerClassName: 'text-right',
    cell: (r) => (
      <span className="flex justify-end font-medium text-amber-500">
        {formatCurrency(r.outstanding)}
      </span>
    ),
  },
]

export function BursarDashboard() {
  const { profile } = useAuth()

  const { data: years } = useAcademicYears()
  const currentYear = years?.find((y) => y.is_current) ?? years?.[0]
  const { data: terms } = useTerms(currentYear?.id)
  const currentTerm = terms?.find((t) => t.is_current) ?? terms?.[terms.length - 1]
  const [termSelection, setTermSelection] = useState<FinanceTermSelection>({
    academic_year_id: undefined,
    term_id: undefined,
    date_from: undefined,
    date_to: undefined,
  })

  const { data: stats,      isLoading: statsLoading   } = useBursarStats()
  const { data: monthly,    isLoading: monthlyLoading } = useMonthlyFinancials(12)
  const { data: outstanding, isLoading: outLoading    } = useOutstandingByClass()
  const { data: methods,    isLoading: methodsLoading } = usePaymentMethodBreakdown()
  const financeFilters = {
    academic_year_id: termSelection.academic_year_id,
    term_id: termSelection.term_id,
    date_from: termSelection.date_from,
    date_to: termSelection.date_to,
  }
  const finance = useFinanceSummary(financeFilters)
  const { health } = useFinancialHealth(financeFilters)
  const termEndForForecast = termSelection.date_to ?? currentTerm?.end_date
  const remainingMonths = getRemainingMonthsInTerm(termEndForForecast)
  const expectedExpenses = getExpectedExpenses(finance.expenses, remainingMonths, 3)
  const projectedBalance = getProjectedEndOfTermBalance({
    currentNetCashPosition: finance.netCashPosition ?? 0,
    expectedRevenueRemaining: finance.outstanding ?? 0,
    expectedExpenses,
  })

  const pieData = (methods ?? []).map((m, i) => ({
    name: m.method.charAt(0).toUpperCase() + m.method.slice(1),
    value: m.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const netPositive = (finance.netCashPosition ?? 0) >= 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={`Finance Overview`}
          subtitle={`Welcome back, ${profile?.full_name?.split(' ')[0] ?? 'Bursar'}`}
        />
        <FinanceTermSelector value={termSelection} onChange={setTermSelection} />
      </div>

      {/* ── Financial Health Indicator ── */}
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          health === 'healthy'
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : health === 'warning'
              ? 'border-amber-500/30 bg-amber-500/10'
              : 'border-destructive/30 bg-destructive/10'
        }`}
      >
        <Activity
          className={`h-5 w-5 shrink-0 ${
            health === 'healthy'
              ? 'text-emerald-600 dark:text-emerald-400'
              : health === 'warning'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-destructive'
          }`}
        />
        <div className="flex-1">
          <span className="font-medium">
            Financial health: {health === 'healthy' ? 'Healthy' : health === 'warning' ? 'Warning' : 'Critical'}
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            {health === 'healthy'
              ? 'Collection rate ≥85%, outstanding ≤15%, expenses under control'
              : health === 'warning'
                ? 'Review collection, outstanding balances, or expense ratio'
                : 'Immediate action needed — low collection, high outstanding, or expenses exceed revenue'}
          </p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenue (YTD)"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          subtitle="Total payments received"
          icon={TrendingUp}
          iconClassName="bg-emerald-500/10 text-emerald-500"
          loading={statsLoading}
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(stats?.totalOutstanding ?? 0)}
          subtitle="Unpaid + partial invoices"
          icon={Banknote}
          iconClassName="bg-amber-500/10 text-amber-500"
          loading={statsLoading}
        />
        <StatCard
          title="Total Expenses (YTD)"
          value={formatCurrency(stats?.totalExpenses ?? 0)}
          subtitle="Approved & paid expenses"
          icon={TrendingDown}
          iconClassName="bg-rose-500/10 text-rose-500"
          loading={statsLoading}
        />
        <StatCard
          title="Net Cash Position"
          value={formatCurrency(finance.netCashPosition ?? 0)}
          subtitle={netPositive ? 'Surplus (payments - expenses)' : 'Deficit (payments - expenses)'}
          icon={Scale}
          iconClassName={netPositive ? 'bg-blue-500/10 text-blue-500' : 'bg-destructive/10 text-destructive'}
          loading={statsLoading || finance.isLoading}
        />
      </div>

      {/* ── Finance KPIs ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Expected Position"
          value={formatCurrency(finance.expectedPosition ?? 0)}
          subtitle="Invoiced fees - expenses"
          icon={Scale}
          iconClassName="bg-violet-500/10 text-violet-500"
          loading={finance.isLoading}
        />
        <StatCard
          title="Collection Rate"
          value={formatPercent((finance.collectionRate ?? 0) * 100)}
          subtitle="Total received / invoiced"
          icon={Percent}
          iconClassName="bg-emerald-500/10 text-emerald-500"
          loading={finance.isLoading}
        />
        <StatCard
          title="Outstanding %"
          value={formatPercent((finance.outstandingPercentage ?? 0) * 100)}
          subtitle="Outstanding / invoiced"
          icon={AlertTriangle}
          iconClassName="bg-amber-500/10 text-amber-500"
          loading={finance.isLoading}
        />
        <StatCard
          title="Overdue Invoices"
          value={(finance.overdueCount ?? 0).toLocaleString()}
          subtitle="Past due & unpaid"
          icon={Banknote}
          iconClassName="bg-destructive/10 text-destructive"
          loading={finance.isLoading}
        />
      </div>

      {/* ── Forecasting Widget ── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              Projected End-of-Term Balance
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Based on last 3 months of expenses. Expected revenue = outstanding to collect; expected expenses = avg monthly × {remainingMonths} remaining month{remainingMonths !== 1 ? 's' : ''}.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div
              className={`text-2xl font-bold tabular-nums ${
                projectedBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
              }`}
            >
              {finance.isLoading ? '—' : formatCurrency(projectedBalance)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {projectedBalance >= 0 ? 'Surplus' : 'Deficit'}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-muted-foreground">Net cash position</span>
            <div className="font-medium tabular-nums">{formatCurrency(finance.netCashPosition ?? 0)}</div>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-muted-foreground">Expected revenue remaining</span>
            <div className="font-medium tabular-nums">{formatCurrency(finance.outstanding ?? 0)}</div>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-muted-foreground">Expected expenses</span>
            <div className="font-medium tabular-nums">{formatCurrency(expectedExpenses)}</div>
          </div>
        </div>
      </div>

      {/* ── Monthly financials + Payment methods ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Revenue vs Expenses area chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Revenue vs Expenses</h3>
            <p className="text-xs text-muted-foreground">Monthly comparison — last 12 months</p>
          </div>

          {monthlyLoading ? (
            <ChartSkeleton />
          ) : !monthly?.length ? (
            <EmptyState title="No financial data" className="py-10 border-0" />
          ) : (
            <AppAreaChart
              data={monthly}
              xKey="month"
              series={[
                { key: 'revenue',  label: 'Revenue',  color: 'hsl(var(--chart-2))' },
                { key: 'expenses', label: 'Expenses', color: 'hsl(var(--chart-5))' },
              ]}
              height={220}
              yTickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tooltipFormatter={(v, name) => `${name}: ${formatCurrency(Number(v))}`}
            />
          )}
        </div>

        {/* Payment method donut */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold">Payment Methods</h3>
          <p className="mb-4 text-xs text-muted-foreground">Last 12 months by value</p>

          {methodsLoading ? (
            <ChartSkeleton height={180} />
          ) : !pieData.length ? (
            <EmptyState title="No payment data" className="py-8 border-0" />
          ) : (
            <>
              <AppPieChart
                data={pieData}
                height={160}
                donut
                tooltipFormatter={(v) => formatCurrency(Number(v))}
                showLegend={false}
              />
              <div className="mt-3 space-y-1.5">
                {pieData.slice(0, 4).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="capitalize text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Outstanding by class table ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold">Outstanding Balances by Class</h3>
            <p className="text-xs text-muted-foreground">Unpaid and partial invoices</p>
          </div>
        </div>

        <DataTable<OutstandingByClass>
          columns={OUTSTANDING_COLS}
          data={outstanding ?? []}
          keyExtractor={(r) => r.className}
          loading={outLoading}
          sortKey="outstanding"
          sortDir="desc"
          emptyState={
            <EmptyState
              icon={Banknote}
              title="All balances cleared"
              description="No outstanding invoices found. "
              className="py-12 border-0 rounded-none"
            />
          }
          className="border-0"
        />
      </div>
    </div>
  )
}
