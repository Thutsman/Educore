import { Fragment, useMemo, useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DateRangePicker } from '@/components/common/DateRangePicker'
import { formatCurrency, formatPercent, formatDate } from '@/utils/format'
import {
  useFinanceSummary,
  useBursarExpenseByStatus,
  useBursarExpenseLineItems,
  useBursarFeeCollectionLineItems,
  useBursarExpensesByCategory,
  useBursarMonthlyCollection,
} from '@/features/finance/hooks/useFinance'
import { groupExpensesByCategory } from '@/features/finance/financeSelectors'
import { Button } from '@/components/ui/button'
import { exportToCsv } from '@/utils/exportToCsv'
import { FinanceTermSelector, type FinanceTermSelection } from './FinanceTermSelector'
import { useSchool } from '@/context/SchoolContext'
import {
  getBursarExpenseLineItems,
  getBursarFeeCollectionLineItems,
  getBursarIncomeStatementLineItems,
} from '@/features/finance/services/finance'
import { useAcademicYears, useTerms } from '@/features/academics/hooks/useAcademics'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppPieChart } from '@/components/charts/AppPieChart'
import { AppBarChart } from '@/components/charts/AppBarChart'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { ExpenseLineItem } from '@/features/finance/types'

const CATEGORY_COLORS: Record<string, string> = {
  salaries: '#0ea5e9',
  utilities: '#f59e0b',
  maintenance: '#6366f1',
  supplies: '#10b981',
  equipment: '#f97316',
  transport: '#8b5cf6',
  events: '#ec4899',
  other: '#6b7280',
}

function reportSlug(selection: FinanceTermSelection, yearName?: string, termName?: string): string {
  const y = selection.academic_year_id ? (yearName ?? 'year').replace(/\s+/g, '-') : 'all-years'
  const t = selection.term_id ? (termName ?? 'term').replace(/\s+/g, '-') : 'all-terms'
  return `${t}-${y}`
}

function ddmmyyyy(iso: string | null | undefined): string {
  if (!iso) return ''
  return formatDate(iso, 'dd/MM/yyyy')
}

export function FinanceReportsPage() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [termSelection, setTermSelection] = useState<FinanceTermSelection>({
    academic_year_id: undefined,
    term_id: undefined,
    date_from: undefined,
    date_to: undefined,
  })
  const { data: years = [] } = useAcademicYears()
  const { data: terms = [] } = useTerms(termSelection.academic_year_id)
  const yearLabel = years.find((y) => y.id === termSelection.academic_year_id)?.name
  const termLabel = terms.find((t) => t.id === termSelection.term_id)?.name
  const slug = reportSlug(termSelection, yearLabel, termLabel)

  const filterObj = {
    academic_year_id: termSelection.academic_year_id,
    term_id: termSelection.term_id,
    date_from: termSelection.date_from ?? dateFrom ?? undefined,
    date_to: termSelection.date_to ?? dateTo ?? undefined,
  }

  const finance = useFinanceSummary(filterObj)
  const expenseByStatus = useBursarExpenseByStatus(filterObj)
  const expenseLinesQuery = useBursarExpenseLineItems(filterObj)
  const feeLinesQuery = useBursarFeeCollectionLineItems(filterObj)
  const byCategoryQuery = useBursarExpensesByCategory(filterObj)
  const monthlyColQuery = useBursarMonthlyCollection(filterObj)

  const expenses = finance.expenses
  const expenseGroups = groupExpensesByCategory(expenses)
  const totalExpenses = finance.totalExpenses || 0

  const [expSearch, setExpSearch] = useState('')
  const [expCat, setExpCat] = useState('all')
  const [expStatus, setExpStatus] = useState('all')
  const [expPage, setExpPage] = useState(1)
  const expPageSize = 20
  const [expExpanded, setExpExpanded] = useState<Set<string>>(() => new Set())

  const filteredExpenseRows = useMemo(() => {
    const rows = expenseLinesQuery.data ?? []
    const q = expSearch.trim().toLowerCase()
    return rows.filter((r) => {
      if (expCat !== 'all' && r.category !== expCat) return false
      if (expStatus !== 'all' && r.status !== expStatus) return false
      if (q) {
        const d = r.description.toLowerCase()
        const v = (r.vendor ?? '').toLowerCase()
        if (!d.includes(q) && !v.includes(q)) return false
      }
      return true
    })
  }, [expenseLinesQuery.data, expSearch, expCat, expStatus])

  const expSlice = filteredExpenseRows.slice((expPage - 1) * expPageSize, expPage * expPageSize)

  const [feeStatus, setFeeStatus] = useState('all')
  const [feeExpanded, setFeeExpanded] = useState<Set<string>>(() => new Set())

  const filteredFeeRows = useMemo(() => {
    const rows = feeLinesQuery.data ?? []
    if (feeStatus === 'all') return rows
    return rows.filter((r) => r.status === feeStatus)
  }, [feeLinesQuery.data, feeStatus])

  const pieDonutData = useMemo(() => {
    const list = byCategoryQuery.data ?? []
    return list
      .filter((x) => x.total > 0)
      .map((x) => ({
        name: x.category.replace(/_/g, ' '),
        value: x.total,
        color: CATEGORY_COLORS[x.category] ?? '#6b7280',
      }))
  }, [byCategoryQuery.data])

  const barData = useMemo(() => {
    return (monthlyColQuery.data ?? []).map((m) => ({
      month: m.month,
      Invoiced: m.invoiced,
      Collected: m.collected,
    }))
  }, [monthlyColQuery.data])

  const handleExportIncomeStatement = async () => {
    if (!schoolId) return
    try {
      const { revenues, expenses: expRows } = await getBursarIncomeStatementLineItems(schoolId, filterObj)
      const rows: (string | number)[][] = []
      rows.push(['section', 'date', 'reference', 'description', 'student_or_vendor', 'method', 'amount'])
      for (const r of revenues) {
        rows.push([
          'REVENUE',
          ddmmyyyy(r.payment_date),
          r.payment_no ?? '',
          r.invoice_description ?? '',
          r.student_name,
          r.payment_method,
          r.amount,
        ])
      }
      rows.push([])
      for (const r of expRows) {
        rows.push([
          'EXPENSE',
          ddmmyyyy(r.expense_date),
          r.receipt_no ?? '',
          `${r.description} (${r.category})`,
          r.vendor ?? '',
          r.payment_method ?? '',
          r.amount,
        ])
      }
      rows.push([])
      const revSum = revenues.reduce((s, r) => s + r.amount, 0)
      const expSum = expRows.reduce((s, r) => s + r.amount, 0)
      rows.push(['SUMMARY', '', '', '', '', '', ''])
      rows.push(['Total Revenue', '', '', '', '', '', Math.round(revSum * 100) / 100])
      rows.push(['Total Expenses', '', '', '', '', '', Math.round(expSum * 100) / 100])
      rows.push(['Net Cash Position', '', '', '', '', '', Math.round((revSum - expSum) * 100) / 100])
      exportToCsv(`income-statement-${slug}.csv`, rows)
      toast.success('Income statement exported')
    } catch {
      toast.error('Export failed')
    }
  }

  const handleExportFeeCollection = async () => {
    if (!schoolId) return
    try {
      const lines = await getBursarFeeCollectionLineItems(schoolId, filterObj)
      const rows: (string | number)[][] = [
        [
          'invoice_no',
          'student_name',
          'class',
          'invoice_date',
          'due_date',
          'description',
          'invoiced_amount',
          'paid_amount',
          'outstanding_amount',
          'status',
          'last_payment_date',
          'last_payment_method',
        ],
      ]
      let sumInv = 0
      let sumPaid = 0
      let sumBal = 0
      for (const r of lines) {
        sumInv += r.invoiced_amount
        sumPaid += r.paid_amount
        sumBal += r.outstanding_amount
        rows.push([
          r.invoice_no,
          r.student_name,
          r.class_name ?? '',
          ddmmyyyy(r.invoice_date),
          ddmmyyyy(r.due_date),
          r.description ?? '',
          r.invoiced_amount,
          r.paid_amount,
          r.outstanding_amount,
          r.status,
          ddmmyyyy(r.last_payment_date),
          r.last_payment_method ?? '',
        ])
      }
      const rate = sumInv > 0 ? ((sumPaid / sumInv) * 100).toFixed(2) : '0.00'
      rows.push([])
      rows.push(['', '', '', '', 'TOTAL INVOICED', sumInv, '', '', '', '', '', ''])
      rows.push(['', '', '', '', 'TOTAL COLLECTED', '', sumPaid, '', '', '', '', ''])
      rows.push(['', '', '', '', 'OUTSTANDING', '', '', sumBal, '', '', '', ''])
      rows.push(['', '', '', '', 'COLLECTION RATE', '', '', '', `${rate}%`, '', '', ''])
      exportToCsv(`fee-collection-${slug}.csv`, rows)
      toast.success('Fee collection exported')
    } catch {
      toast.error('Export failed')
    }
  }

  const handleExportExpenses = async () => {
    if (!schoolId) return
    try {
      const lines = await getBursarExpenseLineItems(schoolId, filterObj)
      const rows: (string | number)[][] = [
        ['date', 'description', 'category', 'amount', 'vendor', 'receipt_no', 'payment_method', 'status', 'notes'],
      ]
      let sum = 0
      for (const r of lines) {
        sum += r.amount
        rows.push([
          ddmmyyyy(r.expense_date),
          r.description,
          r.category,
          r.amount,
          r.vendor ?? '',
          r.receipt_no ?? '',
          r.payment_method ?? '',
          r.status,
          r.notes ?? '',
        ])
      }
      rows.push(['', '', 'TOTAL', sum, '', '', '', '', ''])
      exportToCsv(`expense-breakdown-${slug}.csv`, rows)
      toast.success('Expense breakdown exported')
    } catch {
      toast.error('Export failed')
    }
  }

  const expColumns: Column<ExpenseLineItem & { _key: string }>[] = [
    {
      key: '_expand',
      header: '',
      className: 'w-8',
      cell: (r) =>
        r.notes ? (
          <button
            type="button"
            className="p-1 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              setExpExpanded((prev) => {
                const n = new Set(prev)
                if (n.has(r._key)) n.delete(r._key)
                else n.add(r._key)
                return n
              })
            }}
          >
            {expExpanded.has(r._key) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : null,
    },
    { key: 'expense_date', header: 'Date', cell: (r) => formatDate(r.expense_date, 'dd/MM/yyyy') },
    {
      key: 'description',
      header: 'Description',
      cell: (r) => (
        <div>
          <div>{r.description}</div>
          {r.notes && expExpanded.has(r._key) ? (
            <p className="mt-1 border-l-2 border-border pl-2 text-xs text-muted-foreground">{r.notes}</p>
          ) : null}
        </div>
      ),
    },
    { key: 'category', header: 'Category', cell: (r) => <span className="capitalize">{r.category.replace(/_/g, ' ')}</span> },
    { key: 'amount', header: 'Amount', className: 'text-right tabular-nums', cell: (r) => formatCurrency(r.amount) },
    { key: 'vendor', header: 'Vendor', cell: (r) => r.vendor ?? '—' },
    { key: 'receipt_no', header: 'Receipt No.', cell: (r) => r.receipt_no ?? '—' },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
            r.status === 'paid' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
            r.status === 'approved' && 'border-blue-500/30 bg-blue-500/10 text-blue-700',
            r.status === 'pending' && 'border-amber-500/30 bg-amber-500/10 text-amber-800',
          )}
        >
          {r.status}
        </span>
      ),
    },
  ]

  const expRowsForTable = expSlice.map((r, i) => ({ ...r, _key: `${r.expense_date}-${i}-${r.description.slice(0, 20)}` }))
  const feeRowsForTable = filteredFeeRows.map((r, i) => ({ ...r, _key: `${r.invoice_no}-${i}` }))

  function feeStatusBadge(status: string) {
    return (
      <span
        className={cn(
          'rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
          status === 'paid' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
          status === 'partial' && 'border-amber-500/30 bg-amber-500/10 text-amber-800',
          status === 'unpaid' && 'border-border bg-muted/50 text-muted-foreground',
          status === 'overdue' && 'border-red-500/30 bg-red-500/10 text-red-700',
          status === 'waived' && 'border-blue-500/30 bg-blue-500/10 text-blue-700',
          status === 'void' && 'border-border bg-muted/50 text-muted-foreground line-through',
        )}
      >
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Reports"
        subtitle="Income statement, fee collection, and expense breakdown from real finance data"
      />

      <div className="flex flex-wrap items-center gap-4">
        <FinanceTermSelector value={termSelection} onChange={setTermSelection} />
        <DateRangePicker
          from={dateFrom}
          to={dateTo}
          onChange={({ from, to }) => {
            setDateFrom(from)
            setDateTo(to)
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-9 sm:h-10" onClick={handleExportIncomeStatement}>
            Export Income Statement (CSV)
          </Button>
          <Button variant="outline" size="sm" className="h-9 sm:h-10" onClick={handleExportFeeCollection}>
            Export Fee Collection (CSV)
          </Button>
          <Button variant="outline" size="sm" className="h-9 sm:h-10" onClick={handleExportExpenses}>
            Export Expense Breakdown (CSV)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Income Statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Revenue (received)</span>
              <span className="font-medium">{formatCurrency(finance.totalPaid ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Expenses</span>
              <span className="font-medium text-rose-600">{formatCurrency(finance.totalExpenses ?? 0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Net Cash Position</span>
              <span className={finance.netCashPosition >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                {formatCurrency(finance.netCashPosition ?? 0)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground pt-1 border-t border-border">
              Financial totals use paid expenses only. Approved (pending payment):{' '}
              {formatCurrency(expenseByStatus.data?.approved ?? 0)} · Pending approval:{' '}
              {formatCurrency(expenseByStatus.data?.pending ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Fee Collection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Invoiced</span>
              <span className="font-medium">{formatCurrency(finance.totalInvoiced ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Collected</span>
              <span className="font-medium text-emerald-600">{formatCurrency(finance.totalPaid ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outstanding</span>
              <span className="font-medium text-amber-600">{formatCurrency(finance.outstanding ?? 0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Collection Rate</span>
              <span>{formatPercent((finance.collectionRate ?? 0) * 100)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {expenseGroups.length === 0 ? (
              <p className="text-xs text-muted-foreground">No paid expenses recorded yet.</p>
            ) : (
              expenseGroups.map((group) => {
                const pct = totalExpenses > 0 ? (group.total / totalExpenses) * 100 : 0
                return (
                  <div key={group.category} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="capitalize">{group.category.replace('_', ' ')}</span>
                      <span className="text-xs text-muted-foreground">{formatPercent(pct)}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(group.total)}</span>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense Transactions</CardTitle>
          <p className="text-sm text-muted-foreground">Paid expenses only for the selected period</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search description or vendor…"
                value={expSearch}
                onChange={(e) => {
                  setExpSearch(e.target.value)
                  setExpPage(1)
                }}
              />
            </div>
            <Select value={expCat} onValueChange={(v) => { setExpCat(v); setExpPage(1) }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {['salaries', 'utilities', 'maintenance', 'supplies', 'equipment', 'transport', 'events', 'other'].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={expStatus} onValueChange={(v) => { setExpStatus(v); setExpPage(1) }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing {filteredExpenseRows.length === 0 ? 0 : (expPage - 1) * expPageSize + 1}–
            {Math.min(expPage * expPageSize, filteredExpenseRows.length)} of {filteredExpenseRows.length} expenses
          </p>
          {filteredExpenseRows.length === 0 && !expenseLinesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No paid expenses recorded for the selected filters</p>
          ) : (
            <DataTable
              columns={expColumns}
              data={expRowsForTable}
              keyExtractor={(r) => r._key}
              loading={expenseLinesQuery.isLoading}
              pagination={{
                page: expPage,
                pageSize: expPageSize,
                total: filteredExpenseRows.length,
                onPageChange: setExpPage,
              }}
              className="border-0"
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {!pieDonutData.length && !byCategoryQuery.isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No expense data for this period</p>
            ) : (
              <>
                <AppPieChart
                  data={pieDonutData}
                  height={200}
                  donut
                  showLegend={false}
                  tooltipFormatter={(v) => formatCurrency(Number(v))}
                />
                <div className="mt-3 space-y-1.5">
                  {(byCategoryQuery.data ?? []).filter((x) => x.total > 0).map((x) => (
                    <div key={x.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[x.category] ?? '#6b7280' }}
                        />
                        <span className="capitalize text-muted-foreground">{x.category.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(x.total)} ({formatPercent(x.percentage)})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Monthly Fee Collection</CardTitle>
            <p className="text-xs text-muted-foreground">Invoiced vs collected per month</p>
          </CardHeader>
          <CardContent>
            {!barData.length && !monthlyColQuery.isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No collection data for this period</p>
            ) : (
              <AppBarChart
                data={barData}
                xKey="month"
                series={[
                  { key: 'Invoiced', label: 'Invoiced', color: '#d1d5db' },
                  { key: 'Collected', label: 'Collected', color: '#10b981' },
                ]}
                height={260}
                yTickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tooltipFormatter={(v) => formatCurrency(Number(v))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle className="text-base">Fee Collection Detail</CardTitle>
            <p className="text-sm text-muted-foreground">All invoices for selected period</p>
          </div>
          <Select value={feeStatus} onValueChange={setFeeStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredFeeRows.length === 0 && !feeLinesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No invoices found for the selected period</p>
          ) : feeLinesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="w-8 px-4 py-3" />
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice No.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoiced</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paid</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeRowsForTable.map((r) => (
                      <Fragment key={r._key}>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3">
                            {r.payments.length > 0 ? (
                              <button
                                type="button"
                                className="p-1 text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                  setFeeExpanded((prev) => {
                                    const n = new Set(prev)
                                    if (n.has(r._key)) n.delete(r._key)
                                    else n.add(r._key)
                                    return n
                                  })
                                }
                              >
                                {feeExpanded.has(r._key) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{r.invoice_no}</td>
                          <td className="px-4 py-3 font-medium">{r.student_name}</td>
                          <td className="px-4 py-3">{r.class_name ?? '—'}</td>
                          <td className="px-4 py-3">{r.description ?? '—'}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(r.invoiced_amount)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(r.paid_amount)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(r.outstanding_amount)}</td>
                          <td className="px-4 py-3">{feeStatusBadge(r.status)}</td>
                          <td className="px-4 py-3">{formatDate(r.due_date)}</td>
                        </tr>
                        {feeExpanded.has(r._key) && r.payments.length > 0 ? (
                          <tr key={`${r._key}-detail`} className="border-b border-border bg-muted/20">
                            <td colSpan={10} className="px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment history</p>
                              <div className="space-y-1">
                                {[...r.payments].sort((a, b) => (a.payment_date < b.payment_date ? 1 : -1)).map((p, j) => (
                                  <div key={j} className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                    <span>{formatDate(p.payment_date)}</span>
                                    <span className="font-mono text-xs">{p.payment_no ?? '—'}</span>
                                    <span className="capitalize">{p.payment_method.replace(/_/g, ' ')}</span>
                                    <span className="font-medium text-foreground tabular-nums">{formatCurrency(p.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
