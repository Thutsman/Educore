import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { InvoicesTab } from './InvoicesTab'
import { ExpensesTab } from './ExpensesTab'
import { ProcurementTab } from '@/features/procurement/components/ProcurementTab'

export function FinancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab =
    tabParam === 'expenses' ? 'expenses' :
    tabParam === 'procurement' ? 'procurement' :
    'invoices'

  const setTab = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', value)
      return next
    }, { replace: true })
  }

  const tabCls =
    'flex-1 cursor-pointer rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-semibold text-muted-foreground shadow-none transition-colors hover:bg-muted/40 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none sm:flex-initial sm:min-h-11 sm:min-w-36 lg:min-w-40'

  return (
    <div className="space-y-6">
      <PageHeader title="Finance" subtitle="Invoices, expenses, procurement, and budgets" />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap gap-0 rounded-none border-0 border-b border-border bg-transparent p-0 text-foreground sm:inline-flex sm:w-auto">
          <TabsTrigger value="invoices" className={tabCls}>
            Invoices & Payments
          </TabsTrigger>
          <TabsTrigger value="expenses" className={tabCls}>
            Expenses
          </TabsTrigger>
          <TabsTrigger value="procurement" className={tabCls}>
            Procurement
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="invoices"><InvoicesTab /></TabsContent>
          <TabsContent value="expenses"><ExpensesTab /></TabsContent>
          <TabsContent value="procurement"><ProcurementTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
