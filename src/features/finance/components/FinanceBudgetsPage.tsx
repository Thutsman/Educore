import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { DataTable, type Column } from '@/components/common/DataTable'
import { useAcademicYears, useTerms } from '@/features/academics/hooks/useAcademics'
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useExpenses,
} from '@/features/finance/hooks/useFinance'
import { type Budget, type BudgetFormData, type BudgetCategory } from '@/features/finance/types'
import {
  getBudgetVsActual,
  getBudgetStatus,
  type BudgetStatus,
} from '@/features/finance/financeSelectors'
import { formatCurrency } from '@/utils/format'

const BUDGET_CATEGORIES: { value: BudgetCategory; label: string }[] = [
  { value: 'salaries', label: 'Salaries' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'transport', label: 'Transport' },
  { value: 'events', label: 'Events' },
  { value: 'other', label: 'Other' },
]

const budgetSchema = z.object({
  category: z.enum([
    'salaries',
    'utilities',
    'maintenance',
    'supplies',
    'equipment',
    'transport',
    'events',
    'other',
  ]),
  allocated_amount: z.coerce.number().min(0.01, 'Must be greater than 0'),
  academic_year_id: z.string().min(1, 'Year is required'),
  term_id: z.string().optional(),
  notes: z.string().optional(),
})

type BudgetForm = z.infer<typeof budgetSchema>

function statusBadge(status: BudgetStatus) {
  if (status === 'over_budget') {
    return (
      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
        Over Budget
      </span>
    )
  }
  if (status === 'near_limit') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">
        Near Limit
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
      On Track
    </span>
  )
}

interface BudgetFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialYearId: string | undefined
  budget?: Budget | null
}

function BudgetFormModal({ open, onOpenChange, initialYearId, budget }: BudgetFormModalProps) {
  const isEdit = !!budget
  const createBudget = useCreateBudget()
  const updateBudget = useUpdateBudget()
  const { data: years = [] } = useAcademicYears()

  const [yearId, setYearId] = useState<string | undefined>(
    budget?.academic_year_id ?? initialYearId,
  )
  const { data: terms = [] } = useTerms(yearId)

  const form = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema) as Resolver<BudgetForm>,
    defaultValues: {
      category: budget?.category ?? 'other',
      allocated_amount: budget?.allocated_amount ?? 0,
      academic_year_id: budget?.academic_year_id ?? initialYearId ?? '',
      term_id: budget?.term_id ?? '',
      notes: budget?.notes ?? '',
    },
  })

  const onSubmit = async (values: BudgetForm) => {
    const payload: BudgetFormData = {
      category: values.category,
      allocated_amount: values.allocated_amount,
      academic_year_id: values.academic_year_id,
      term_id: values.term_id || undefined,
      notes: values.notes || undefined,
    }

    const ok = isEdit && budget
      ? await updateBudget.mutateAsync({ id: budget.id, data: payload })
      : await createBudget.mutateAsync(payload)

    if (ok) {
      form.reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUDGET_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allocated_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allocated Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="academic_year_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        setYearId(value)
                        form.setValue('term_id', '')
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y.id} value={y.id}>
                            {y.name || y.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="term_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term</FormLabel>
                    <Select
                      value={field.value || '__none__'}
                      onValueChange={(value) =>
                        field.onChange(value === '__none__' ? '' : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Annual" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Annual</SelectItem>
                        {terms.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBudget.isPending || updateBudget.isPending}
              >
                {isEdit ? 'Save Changes' : 'Create Budget'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function FinanceBudgetsPage() {
  const { data: years = [] } = useAcademicYears()
  const currentYear = years.find((y) => y.is_current) ?? years[0]
  const [yearId, setYearId] = useState<string | undefined>(currentYear?.id)
  const { data: terms = [] } = useTerms(yearId)
  const currentTerm = terms.find((t) => t.is_current) ?? terms[0]
  const [termId, setTermId] = useState<string | undefined>(currentTerm?.id)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const { data: budgets = [], isLoading } = useBudgets({
    academic_year_id: yearId,
    term_id: termId,
    category: categoryFilter,
  })
  const { data: expenses = [] } = useExpenses({ category: categoryFilter })

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [showForm, setShowForm] = useState(false)

  const rows = getBudgetVsActual(budgets, expenses, yearId, termId ?? null)

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: 'category',
      header: 'Category',
      cell: (row) => {
        const meta = BUDGET_CATEGORIES.find((c) => c.value === row.category)
        return <span className="font-medium capitalize">{meta?.label ?? row.category}</span>
      },
    },
    {
      key: 'budget',
      header: 'Budget',
      className: 'text-right tabular-nums',
      cell: (row) => formatCurrency(row.budget),
    },
    {
      key: 'actual',
      header: 'Actual',
      className: 'text-right tabular-nums',
      cell: (row) => formatCurrency(row.actual),
    },
    {
      key: 'remaining',
      header: 'Remaining',
      className: 'text-right tabular-nums',
      cell: (row) => (
        <span className={row.remaining < 0 ? 'text-destructive font-semibold' : ''}>
          {formatCurrency(row.remaining)}
        </span>
      ),
    },
    {
      key: 'ratio',
      header: 'Progress',
      cell: (row) => {
        const percent = Math.min(Math.max(row.ratio * 100, 0), 150)
        const status = getBudgetStatus(row.budget, row.actual)
        return (
          <div className="space-y-1">
            <Progress value={percent} className="h-1.5" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{percent.toFixed(0)}%</span>
              {statusBadge(status)}
            </div>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        subtitle="Plan and track spending against allocated amounts by category"
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm font-semibold">Budget Overview</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={yearId ?? ''}
              onValueChange={(value) => {
                setYearId(value)
                setTermId(undefined)
              }}
            >
              <SelectTrigger className="w-full sm:w-40 h-9 sm:h-10">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name || y.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={termId ?? '__all__'}
              onValueChange={(value) => {
                if (value === '__all__') setTermId(undefined)
                else if (value === '__none__') setTermId(undefined)
                else setTermId(value)
              }}
            >
              <SelectTrigger className="w-full sm:w-40 h-9 sm:h-10">
                <SelectValue placeholder="All terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All terms</SelectItem>
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-full sm:w-40 h-9 sm:h-10">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {BUDGET_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setEditingBudget(null)
                setShowForm(true)
              }}
              className="ml-auto h-9 sm:h-10"
            >
              Add Budget
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={rows}
            keyExtractor={(row) => row.category}
            loading={isLoading}
            onRowClick={(row) => {
              const existing = budgets.find((b) => b.category === row.category)
              if (existing) {
                setEditingBudget(existing)
                setShowForm(true)
              }
            }}
          />
          </div>
        </CardContent>
      </Card>

      <BudgetFormModal
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setEditingBudget(null)
        }}
        initialYearId={yearId}
        budget={editingBudget}
      />
    </div>
  )
}

