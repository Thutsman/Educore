import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Banknote, TrendingDown, TrendingUp, Scale, Percent, AlertTriangle, Activity, PiggyBank, Info } from 'lucide-react'
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
import {
  useFinanceSummary,
  useFinancialHealth,
  useBursarExpenseByStatus,
  useBursarBudgetVsActual,
} from '@/features/finance/hooks/useFinance'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  getRemainingMonthsInTerm,
  getExpectedExpenses,
  getProjectedEndOfTermBalance,
} from '@/features/finance/financeSelectors'
import { useAcademicYears, useTerms } from '@/features/academics/hooks/useAcademics'
import { FinanceTermSelector, type FinanceTermSelection } from '@/features/finance/components/FinanceTermSelector'
import { cn } from '@/utils/cn'

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
  const [termSelection, setTermSelection] = useState<FinanceTermSelection>({
    academic_year_id: undefined,
    term_id: undefined,
    date_from: undefined,
    date_to: undefined,
  })
  const { data: terms } = useTerms(currentYear?.id)
  const { data: termsForSelection } = useTerms(termSelection.academic_year_id ?? currentYear?.id)
  const currentTerm = terms?.find((t) => t.is_current) ?? terms?.[terms.length - 1]

  const { data: stats,      isLoading: statsLoading   } = useBursarStats()
  const { data: monthlyResult, isLoading: monthlyLoading } = useMonthlyFinancials()
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
  const { data: expenseByStatus } = useBursarExpenseByStatus(financeFilters)
  const budgetVs = useBursarBudgetVsActual(financeFilters)
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

  const monthly = monthlyResult?.points ?? []
  const chartStartLabel = monthlyResult?.chartStart
    ? format(parseISO(monthlyResult.chartStart), 'MMMM yyyy')
    : null
  const monthCount = monthlyResult?.monthCount ?? 0

  const yearName = years?.find((y) => y.id === termSelection.academic_year_id)?.name
  const termName = termsForSelection?.find((t) => t.id === termSelection.term_id)?.name
  const periodLabel =
    termSelection.term_id && termName && yearName
      ? `${termName} · ${yearName}`
      : termSelection.academic_year_id && yearName
        ? yearName
        : 'Selected period'

  const expenseInfoContent = (
    <div className="max-w-xs space-y-2 text-xs">
      <p>
        This card uses paid expenses only ({formatCurrency(expenseByStatus?.paid ?? 0)}). Pending approval (
        {formatCurrency(expenseByStatus?.pending ?? 0)}) and approved awaiting payment (
        {formatCurrency(expenseByStatus?.approved ?? 0)}) stay out of financial totals until paid.
      </p>
    </div>
  )

  const budgetLines = budgetVs.data?.lines ?? []
  const hasAnyBudget = budgetVs.data?.hasAnyBudget ?? false
  const totalBudgeted = budgetLines.reduce((s, l) => s + l.budgeted, 0)
  const totalSpentBudget = budgetLines.reduce((s, l) => s + l.spent, 0)
  const totalRemainingBudget = totalBudgeted - totalSpentBudget

  function budgetRowStatus(line: { hasBudget: boolean; percentUsed: number }) {
    if (!line.hasBudget) return { label: 'No Budget Set', className: 'border-border bg-muted/50 text-muted-foreground' }
    if (line.percentUsed >= 100) return { label: 'Over Budget', className: 'border-red-500/30 bg-red-500/10 text-red-700' }
    if (line.percentUsed > 80) return { label: 'Warning', className: 'border-amber-500/30 bg-amber-500/10 text-amber-800' }
    return { label: 'On Track', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' }
  }

  function barColor(line: { hasBudget: boolean; percentUsed: number }) {
    if (!line.hasBudget) return 'bg-muted-foreground/30'
    if (line.percentUsed >= 100) return 'bg-red-500'
    if (line.percentUsed > 80) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

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
        <Link to="/finance?tab=invoices&filter=outstanding" className="block cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <StatCard
            title="Outstanding Balance"
            value={formatCurrency(finance.outstanding ?? 0)}
            subtitle="Unpaid + partial + overdue (selected period)"
            icon={Banknote}
            iconClassName="bg-amber-500/10 text-amber-500"
            loading={finance.isLoading}
            className="h-full transition-opacity hover:opacity-95"
          >
            <p className="text-xs font-medium text-primary">View invoices →</p>
          </StatCard>
        </Link>
        <div className="relative">
          <StatCard
            title="Total Expenses (YTD)"
            value={formatCurrency(finance.totalExpenses ?? 0)}
            subtitle="Paid expenses only"
            icon={TrendingDown}
            iconClassName="bg-rose-500/10 text-rose-500"
            loading={finance.isLoading}
          >
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Expense breakdown by status"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  {expenseInfoContent}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </StatCard>
        </div>
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
        <Link to="/finance?tab=invoices&filter=overdue" className="block cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <StatCard
            title="Overdue Invoices"
            value={(finance.overdueCount ?? 0).toLocaleString()}
            subtitle="Past due & unpaid"
            icon={Banknote}
            iconClassName="bg-destructive/10 text-destructive"
            loading={finance.isLoading}
            className="h-full transition-opacity hover:opacity-95"
          >
            <p className="text-xs font-medium text-primary">View all →</p>
          </StatCard>
        </Link>
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
            <p className="text-xs text-muted-foreground">Monthly comparison from first recorded transaction</p>
          </div>

          {monthlyLoading ? (
            <ChartSkeleton />
          ) : !monthly.length ? (
            <EmptyState title="No financial data" className="py-10 border-0" />
          ) : (
            <>
              <AppAreaChart
                data={monthly}
                xKey="month"
                series={[
                  { key: 'revenue',  label: 'Revenue',  color: 'hsl(var(--chart-2))' },
                  { key: 'expenses', label: 'Expenses', color: 'hsl(var(--chart-5))' },
                ]}
                height={220}
                yTickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tooltipFormatter={(v) => formatCurrency(Number(v))}
              />
              {chartStartLabel ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing data from {chartStartLabel} · {monthCount} months of records
                </p>
              ) : null}
            </>
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

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold">Budget vs Actual</h3>
          <p className="text-xs text-muted-foreground">
            Expenditure against approved budgets · {periodLabel}
          </p>
        </div>
        <div className="p-6">
          {budgetVs.isLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
          ) : !hasAnyBudget ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">No budgets have been set for this period.</p>
              <Button asChild>
                <Link to="/budgets">Set Up Budgets →</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 pr-4">Category</th>
                      <th className="pb-3 pr-4 text-right tabular-nums">Budgeted</th>
                      <th className="pb-3 pr-4 text-right tabular-nums">Spent (Actual)</th>
                      <th className="pb-3 pr-4 text-right tabular-nums">Remaining</th>
                      <th className="pb-3 pr-4">% Used</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetLines.map((line) => {
                      const st = budgetRowStatus(line)
                      const pctDisplay = line.hasBudget ? `${line.percentUsed.toFixed(0)}%` : '—'
                      const pctBar = line.hasBudget ? Math.min(line.percentUsed, 100) : 0
                      return (
                        <tr key={line.category} className="border-b border-border last:border-0">
                          <td className="py-3 pr-4 capitalize">{line.category.replace(/_/g, ' ')}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">{formatCurrency(line.budgeted)}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">{formatCurrency(line.spent)}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">{formatCurrency(line.remaining)}</td>
                          <td className="py-3 pr-4 min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <span className="tabular-nums text-xs w-10 text-right">{pctDisplay}</span>
                              <div className="h-1.5 flex-1 max-w-[100px] rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${barColor(line)}`}
                                  style={{ width: `${pctBar}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', st.className)}>
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex flex-wrap gap-6 border-t border-border pt-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Budgeted: </span>
                  <span className="font-semibold tabular-nums">{formatCurrency(totalBudgeted)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Spent: </span>
                  <span className="font-semibold tabular-nums">{formatCurrency(totalSpentBudget)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Remaining: </span>
                  <span
                    className={cn(
                      'font-semibold tabular-nums',
                      totalRemainingBudget < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400',
                    )}
                  >
                    {formatCurrency(totalRemainingBudget)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
