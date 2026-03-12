import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AcademicYearsTab } from './AcademicYearsTab'
import { ClassesTab } from './ClassesTab'
import { SubjectsTab } from './SubjectsTab'
import { DepartmentsTab } from './DepartmentsTab'
import { ExamsTab } from './ExamsTab'
import { GradeEntryTab } from './GradeEntryTab'

export function AcademicsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'classes'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academics"
        subtitle="Manage academic years, classes, subjects, exams and grades"
      />
      <Tabs value={tab} onValueChange={t => setSearchParams({ tab: t })}>
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 lg:w-auto lg:inline-flex">
          <TabsTrigger value="years">Academic Years</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="grades">Grade Entry</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="years"><AcademicYearsTab /></TabsContent>
          <TabsContent value="classes"><ClassesTab /></TabsContent>
          <TabsContent value="departments"><DepartmentsTab /></TabsContent>
          <TabsContent value="subjects"><SubjectsTab /></TabsContent>
          <TabsContent value="exams"><ExamsTab /></TabsContent>
          <TabsContent value="grades"><GradeEntryTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
