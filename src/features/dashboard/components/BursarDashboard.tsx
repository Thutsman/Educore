import { Banknote, TrendingDown, TrendingUp, Scale } from 'lucide-react'
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
import { formatCurrency } from '@/utils/format'
import type { OutstandingByClass } from '@/services/dashboard'

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

  const { data: stats,      isLoading: statsLoading   } = useBursarStats()
  const { data: monthly,    isLoading: monthlyLoading } = useMonthlyFinancials(12)
  const { data: outstanding, isLoading: outLoading    } = useOutstandingByClass()
  const { data: methods,    isLoading: methodsLoading } = usePaymentMethodBreakdown()

  const pieData = (methods ?? []).map((m, i) => ({
    name: m.method.charAt(0).toUpperCase() + m.method.slice(1),
    value: m.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const netPositive = (stats?.netPosition ?? 0) >= 0

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Finance Overview`}
        subtitle={`Welcome back, ${profile?.full_name?.split(' ')[0] ?? 'Bursar'}`}
      />

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
          title="Net Position"
          value={formatCurrency(Math.abs(stats?.netPosition ?? 0))}
          subtitle={netPositive ? 'Surplus' : 'Deficit'}
          icon={Scale}
          iconClassName={netPositive ? 'bg-blue-500/10 text-blue-500' : 'bg-destructive/10 text-destructive'}
          loading={statsLoading}
        />
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
