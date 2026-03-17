import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DateRangePicker } from '@/components/common/DateRangePicker'
import { formatCurrency, formatPercent } from '@/utils/format'
import { useFinanceSummary, useExpenses } from '@/features/finance/hooks/useFinance'
import { groupExpensesByCategory } from '@/features/finance/financeSelectors'
import { Button } from '@/components/ui/button'
import { toCsv, downloadCsv } from '@/utils/csv'
import { FinanceTermSelector, type FinanceTermSelection } from './FinanceTermSelector'

export function FinanceReportsPage() {
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [termSelection, setTermSelection] = useState<FinanceTermSelection>({
    academic_year_id: undefined,
    term_id: undefined,
    date_from: undefined,
    date_to: undefined,
  })

  const expensesQuery = useExpenses({
    date_from: termSelection.date_from ?? dateFrom ?? undefined,
    date_to: termSelection.date_to ?? dateTo ?? undefined,
  })
  const finance = useFinanceSummary({
    academic_year_id: termSelection.academic_year_id,
    term_id: termSelection.term_id,
    date_from: termSelection.date_from ?? dateFrom ?? undefined,
    date_to: termSelection.date_to ?? dateTo ?? undefined,
  })

  const expenses = expensesQuery.data ?? []

  const expenseGroups = groupExpensesByCategory(expenses)
  const totalExpenses = finance.totalExpenses || 0

  const handleExportIncomeStatement = () => {
    const rows = [
      {
        metric: 'Total Revenue (received)',
        value: finance.totalPaid ?? 0,
      },
      {
        metric: 'Total Expenses',
        value: finance.totalExpenses ?? 0,
      },
      {
        metric: 'Net Cash Position',
        value: finance.netCashPosition ?? 0,
      },
    ]
    const csv = toCsv(rows)
    downloadCsv('income-statement.csv', csv)
  }

  const handleExportFeeCollection = () => {
    const rows = [
      {
        metric: 'Total Invoiced',
        value: finance.totalInvoiced ?? 0,
      },
      {
        metric: 'Total Collected',
        value: finance.totalPaid ?? 0,
      },
      {
        metric: 'Outstanding',
        value: finance.outstanding ?? 0,
      },
      {
        metric: 'Collection Rate (%)',
        value: ((finance.collectionRate ?? 0) * 100).toFixed(2),
      },
    ]
    const csv = toCsv(rows)
    downloadCsv('fee-collection.csv', csv)
  }

  const handleExportExpenses = () => {
    const rows = expenseGroups.map(group => ({
      category: group.category,
      total: group.total,
      percentage: totalExpenses > 0 ? ((group.total / totalExpenses) * 100).toFixed(2) : '0.00',
    }))
    const csv = toCsv(rows)
    downloadCsv('expense-breakdown.csv', csv)
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
              <p className="text-xs text-muted-foreground">No expenses recorded yet.</p>
            ) : (
              expenseGroups.map((group) => {
                const pct = totalExpenses > 0 ? (group.total / totalExpenses) * 100 : 0
                return (
                  <div key={group.category} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="capitalize">{group.category.replace('_', ' ')}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatPercent(pct)}
                      </span>
                    </div>
                    <span className="font-medium">{formatCurrency(group.total)}</span>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

