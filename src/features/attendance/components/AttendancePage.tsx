import { PageHeader } from '@/components/common/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MarkAttendanceTab } from './MarkAttendanceTab'
import { AttendanceReportTab } from './AttendanceReportTab'

export function AttendancePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Mark daily attendance and view reports" />
      <Tabs defaultValue="mark">
        <TabsList>
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="mark"><MarkAttendanceTab /></TabsContent>
          <TabsContent value="report"><AttendanceReportTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
