import { PageHeader } from '@/components/common/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ClassesTab } from './ClassesTab'
import { SubjectsTab } from './SubjectsTab'
import { ExamsTab } from './ExamsTab'
import { GradeEntryTab } from './GradeEntryTab'

export function AcademicsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Academics"
        subtitle="Manage classes, subjects, exams and grades"
      />
      <Tabs defaultValue="classes">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="grades">Grade Entry</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="classes"><ClassesTab /></TabsContent>
          <TabsContent value="subjects"><SubjectsTab /></TabsContent>
          <TabsContent value="exams"><ExamsTab /></TabsContent>
          <TabsContent value="grades"><GradeEntryTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
