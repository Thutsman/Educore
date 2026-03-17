import { PageHeader } from '@/components/common/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { InvoicesTab } from './InvoicesTab'
import { ExpensesTab } from './ExpensesTab'

export function FinancePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Finance" subtitle="Invoices, payments and expenses" />
      <Tabs defaultValue="invoices">
        <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
          <TabsTrigger value="invoices" className="h-9 sm:h-10">Invoices & Payments</TabsTrigger>
          <TabsTrigger value="expenses" className="h-9 sm:h-10">Expenses</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="invoices"><InvoicesTab /></TabsContent>
          <TabsContent value="expenses"><ExpensesTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
