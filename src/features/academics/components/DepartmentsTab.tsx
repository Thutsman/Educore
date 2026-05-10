import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useSubjects,
  useSetDepartmentSubjects,
  useEnsureDepartmentSubjects,
} from '../hooks/useAcademics'
import type { Department, Subject } from '../types'

const ZIMBABWE_DEPARTMENT_OPTIONS = [
  'Sciences',
  'Commercials',
  'Humanities',
  'Languages',
  'Mathematics',
  'ICT',
  'Technical/Vocational',
  'Arts',
  'Physical Education',
  'Agriculture',
]

const DEPARTMENT_CODE_MAP: Record<string, string> = {
  Sciences: 'SCI',
  Commercials: 'COMM',
  Humanities: 'HUM',
  Languages: 'LANG',
  Mathematics: 'MATH',
  ICT: 'ICT',
  'Technical/Vocational': 'TECH',
  Arts: 'ARTS',
  'Physical Education': 'PE',
  Agriculture: 'AGRI',
}

const DEPARTMENT_SUBJECT_HINTS: Record<string, string[]> = {
  Sciences: ['biology', 'chemistry', 'physics', 'combined science', 'science', 'computer science', 'agriculture', 'mathematics syl b', 'practical', 'crop science', 'animal science', 'sports science'],
  Commercials: ['accounting', 'principles of accounting', 'principles of accounts', 'accounts', 'commerce', 'economics', 'business studies', 'business enterprise', 'commercial studies', 'mathematics syl b', 'guidance and counselling', 'guidance & counseling', 'practical'],
  Humanities: ['history', 'geography', 'heritage studies', 'family and religious studies', 'divinity', 'economic history', 'sociology', 'guidance and counselling', 'guidance & counseling'],
  Languages: ['english language', 'english', 'shona', 'ndebele', 'isindebele', 'ndebele language', 'indigenous language', 'french', 'foreign language', 'literature in english', 'literature in ndebele', 'literature in indigenous'],
  Mathematics: ['mathematics', 'additional mathematics', 'pure mathematics', 'statistics', 'mathematics syl a', 'mathematics syl b'],
  ICT: ['ict', 'computer science', 'information and communication technology', 'computer studies'],
  'Technical/Vocational': ['wood technology', 'wood technology and design', 'food technology & design', 'woodwork', 'metal technology', 'metalwork', 'technical graphics', 'technical graphics and design', 'building technology', 'textile technology', 'textile technology and design', 'food technology', 'food technology and design', 'design and technology', 'home management', 'practical'],
  Arts: ['art', 'music', 'musical arts', 'dance', 'theatre arts', 'literature in english', 'literature in ndebele', 'family and religious studies', 'commercial studies', 'mathematics syl a', 'practical'],
  'Physical Education': ['physical education', 'sport', 'sports science', 'mass displays'],
  Agriculture: ['agriculture', 'crop science', 'animal science'],
}

const DEPARTMENT_SUBJECT_TEMPLATES: Record<string, Array<{ name: string; code: string }>> = {
  Sciences: [
    { name: 'Biology', code: 'BIO' },
    { name: 'Chemistry', code: 'CHEM' },
    { name: 'Physics', code: 'PHY' },
    { name: 'Combined Science', code: 'CSCI' },
    { name: 'Practical', code: 'PRACT' },
    { name: 'Computer Science', code: 'COMP' },
    { name: 'Agriculture', code: 'AGRI' },
    { name: 'Crop Science', code: 'CROP' },
    { name: 'Animal Science', code: 'ANSCI' },
    { name: 'Sports Science', code: 'SPORT' },
  ],
  Commercials: [
    { name: 'Accounting', code: 'ACC' },
    { name: 'Principles of Accounts', code: 'POA' },
    { name: 'Economics', code: 'ECON' },
    { name: 'Commerce', code: 'COMM' },
    { name: 'Commercial Studies', code: 'CSTUD' },
    { name: 'Business Studies', code: 'BS' },
    { name: 'Mathematics Syl B', code: 'MATHB' },
    { name: 'Guidance and Counselling', code: 'GUIDE' },
    { name: 'Practical', code: 'PRACT' },
  ],
  Humanities: [
    { name: 'History', code: 'HIST' },
    { name: 'Geography', code: 'GEO' },
    { name: 'Family and Religious Studies', code: 'FRS' },
    { name: 'Heritage Studies', code: 'HER' },
    { name: 'Guidance and Counselling', code: 'GUIDE' },
    { name: 'Sociology', code: 'SOC' },
  ],
  Languages: [
    { name: 'English Language', code: 'ENG' },
    { name: 'English', code: 'ENGLISH' },
    { name: 'Shona', code: 'SHO' },
    { name: 'IsiNdebele', code: 'ISNDEB' },
    { name: 'Ndebele Language', code: 'NDEBL' },
    { name: 'Ndebele', code: 'NDEB' },
    { name: 'Literature in English', code: 'LIT' },
    { name: 'Literature in Ndebele', code: 'LITNDEB' },
    { name: 'French', code: 'FRE' },
  ],
  Mathematics: [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Mathematics Syl A', code: 'MATHA' },
    { name: 'Mathematics Syl B', code: 'MATHB' },
    { name: 'Additional Mathematics', code: 'ADDM' },
    { name: 'Pure Mathematics', code: 'PMATH' },
    { name: 'Statistics', code: 'STAT' },
  ],
  ICT: [
    { name: 'ICT', code: 'ICT' },
    { name: 'Computer Science', code: 'COMP' },
  ],
  'Technical/Vocational': [
    { name: 'Technical Graphics', code: 'TG' },
    { name: 'Technical Graphics and Design', code: 'TGD' },
    { name: 'Building Technology', code: 'BUILD' },
    { name: 'Wood Technology', code: 'WOOD' },
    { name: 'Wood Technology and Design', code: 'WTD' },
    { name: 'Metal Technology', code: 'METAL' },
    { name: 'Food Technology & Design', code: 'FTD' },
    { name: 'Textile Technology and Design', code: 'TTD' },
    { name: 'Practical', code: 'PRACT' },
  ],
  Arts: [
    { name: 'Art', code: 'ART' },
    { name: 'Musical Arts', code: 'MUS' },
    { name: 'Music', code: 'MUSIC' },
    { name: 'Dance', code: 'DAN' },
    { name: 'Family and Religious Studies', code: 'FRS' },
    { name: 'Commercial Studies', code: 'CSTUD' },
    { name: 'Literature in English', code: 'LIT' },
    { name: 'Literature in Ndebele', code: 'LITNDEB' },
    { name: 'Mathematics Syl A', code: 'MATHA' },
    { name: 'Practical', code: 'PRACT' },
    { name: 'Theatre Arts', code: 'THA' },
  ],
  'Physical Education': [
    { name: 'Physical Education', code: 'PE' },
    { name: 'Physical Education & Mass Displays', code: 'PEMD' },
    { name: 'Sports Science', code: 'SPORT' },
  ],
  Agriculture: [
    { name: 'Agriculture', code: 'AGRI' },
    { name: 'Crop Science', code: 'CROP' },
    { name: 'Animal Science', code: 'ANSCI' },
  ],
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function getRelevantSubjectsForDepartment(departmentName: string, allSubjects: Subject[]): Subject[] {
  const hints = DEPARTMENT_SUBJECT_HINTS[departmentName]
  if (!hints) return allSubjects
  const normalizedHints = hints.map(normalizeToken)
  return allSubjects.filter(subject => {
    const haystacks = [subject.name, subject.code].filter(Boolean).map(v => normalizeToken(String(v)))
    return normalizedHints.some(hint => haystacks.some(h => h.includes(hint) || hint.includes(h)))
  })
}

function getMissingTemplatesForDepartment(departmentName: string, allSubjects: Subject[]): Array<{ name: string; code: string }> {
  const templates = DEPARTMENT_SUBJECT_TEMPLATES[departmentName] ?? []
  if (templates.length === 0) return []
  return templates.filter(template => {
    const normalizedTemplateName = normalizeToken(template.name)
    const normalizedTemplateCode = normalizeToken(template.code)
    const exists = allSubjects.some(subject => {
      const normalizedName = normalizeToken(subject.name)
      const normalizedCode = normalizeToken(subject.code)
      return normalizedName === normalizedTemplateName || normalizedCode === normalizedTemplateCode
    })
    return !exists
  })
}

const schema = z.object({
  name: z.string().min(1, 'Required'),
  code: z.string().optional(),
  subject_ids: z.array(z.string()).default([]),
})
type FormValues = z.infer<typeof schema>

function DepartmentFormModal({
  open,
  onOpenChange,
  dept,
  subjects,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  dept?: Department | null
  subjects: Subject[]
}) {
  const isEdit = !!dept
  const create = useCreateDepartment()
  const update = useUpdateDepartment()
  const setSubjects = useSetDepartmentSubjects()
  const ensureSubjects = useEnsureDepartmentSubjects()
  const departmentOptions = useMemo(() => {
    if (!dept?.name || ZIMBABWE_DEPARTMENT_OPTIONS.includes(dept.name)) return ZIMBABWE_DEPARTMENT_OPTIONS
    return [dept.name, ...ZIMBABWE_DEPARTMENT_OPTIONS]
  }, [dept?.name])
  const selectedSubjectIdsForDept = useMemo(
    () => (dept ? subjects.filter(s => s.department_id === dept.id).map(s => s.id) : []),
    [dept, subjects],
  )
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: dept?.name ?? '', code: dept?.code ?? '', subject_ids: selectedSubjectIdsForDept },
  })
  const selectedDepartmentName = form.watch('name')
  const relevantSubjects = useMemo(
    () => (selectedDepartmentName ? getRelevantSubjectsForDepartment(selectedDepartmentName, subjects) : []),
    [selectedDepartmentName, subjects],
  )
  const missingTemplates = useMemo(
    () => (selectedDepartmentName ? getMissingTemplatesForDepartment(selectedDepartmentName, subjects) : []),
    [selectedDepartmentName, subjects],
  )
  const [selectedTemplateCodes, setSelectedTemplateCodes] = useState<string[]>([])

  useEffect(() => {
    form.reset({
      name: dept?.name ?? '',
      code: dept?.code ?? '',
      subject_ids: selectedSubjectIdsForDept,
    })
  }, [dept, form, open, selectedSubjectIdsForDept])

  useEffect(() => {
    if (!open) {
      setSelectedTemplateCodes([])
      return
    }
    if (!selectedDepartmentName) {
      setSelectedTemplateCodes([])
      return
    }
    setSelectedTemplateCodes(isEdit ? [] : missingTemplates.map(template => template.code))
  }, [isEdit, missingTemplates, open, selectedDepartmentName])

  const onSubmit = async (v: FormValues) => {
    const selectedTemplates = missingTemplates.filter(template => selectedTemplateCodes.includes(template.code))

    if (isEdit && dept) {
      const ensuredSubjectIds = selectedTemplates.length > 0
        ? await ensureSubjects.mutateAsync({ departmentId: dept.id, templates: selectedTemplates })
        : []
      const extraIds = ensuredSubjectIds ?? []
      const updated = await update.mutateAsync({ id: dept.id, data: { name: v.name, code: v.code || undefined } })
      const subjectsSaved = updated
        ? await setSubjects.mutateAsync({ departmentId: dept.id, subjectIds: [...v.subject_ids, ...extraIds] })
        : false
      if (updated && subjectsSaved) {
        toast.success('Department updated.')
        form.reset()
        onOpenChange(false)
        return
      }
      toast.error('Failed to save department subjects. The code may already be in use.')
      return
    }

    const departmentId = await create.mutateAsync({ name: v.name, code: v.code })
    const ensuredSubjectIds = departmentId && selectedTemplates.length > 0
      ? await ensureSubjects.mutateAsync({ departmentId, templates: selectedTemplates })
      : []
    const extraIds = ensuredSubjectIds ?? []
    const subjectsSaved = departmentId
      ? await setSubjects.mutateAsync({ departmentId, subjectIds: [...v.subject_ids, ...extraIds] })
      : false
    if (departmentId && subjectsSaved) {
      toast.success(isEdit ? 'Department updated.' : 'Department created.')
      form.reset()
      onOpenChange(false)
    } else {
      toast.error('Failed to save department. The code may already be in use.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) form.reset() }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Department' : 'Add Department'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Department Name *</FormLabel>
                <Select value={field.value} onValueChange={(value) => {
                  field.onChange(value)
                  const suggestedCode = DEPARTMENT_CODE_MAP[value]
                  if (suggestedCode) form.setValue('code', suggestedCode, { shouldDirty: true })
                  const suggestedSubjectIds = getRelevantSubjectsForDepartment(value, subjects).map(subject => subject.id)
                  form.setValue('subject_ids', suggestedSubjectIds, { shouldDirty: true })
                  const templates = getMissingTemplatesForDepartment(value, subjects)
                  setSelectedTemplateCodes(isEdit ? [] : templates.map(template => template.code))
                }}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departmentOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="code" render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl><Input placeholder="e.g. SCI, MATH, LANG" className="uppercase" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                <p className="text-xs text-muted-foreground">Short identifier used in reports. Must be unique per school.</p>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="subject_ids" render={({ field }) => (
              <FormItem>
                <FormLabel>Subjects Under This Department</FormLabel>
                <FormControl>
                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border p-3">
                    {!selectedDepartmentName ? (
                      <p className="text-sm text-muted-foreground">Select a department first to see suggested subjects.</p>
                    ) : subjects.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No subjects found. Add subjects first in the Subjects tab.</p>
                    ) : relevantSubjects.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No existing subjects found for this department yet.</p>
                    ) : (
                      relevantSubjects.map(subject => {
                        const checked = field.value.includes(subject.id)
                        return (
                          <label key={subject.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, subject.id])
                                  return
                                }
                                field.onChange(field.value.filter(id => id !== subject.id))
                              }}
                            />
                            <span>{subject.name}</span>
                            <span className="text-xs text-muted-foreground">({subject.code})</span>
                          </label>
                        )
                      })
                    )}
                  </div>
                </FormControl>
                {selectedDepartmentName && missingTemplates.length > 0 && (
                  <div className="space-y-2 rounded-md border border-dashed p-3">
                    <p className="text-xs font-medium text-foreground">Create suggested subjects now</p>
                    <p className="text-xs text-muted-foreground">
                      These subjects are common for {selectedDepartmentName} and will be created automatically on save.
                    </p>
                    <div className="space-y-1.5">
                      {missingTemplates.map(template => {
                        const checked = selectedTemplateCodes.includes(template.code)
                        return (
                          <label key={template.code} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedTemplateCodes(prev => [...prev, template.code])
                                  return
                                }
                                setSelectedTemplateCodes(prev => prev.filter(code => code !== template.code))
                              }}
                            />
                            <span>{template.name}</span>
                            <span className="text-xs text-muted-foreground">({template.code})</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Zimbabwe example: Commercials usually includes Accounting, Economics, Commerce, and Business Studies.
                </p>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending || update.isPending || setSubjects.isPending || ensureSubjects.isPending}>
                {create.isPending || update.isPending || setSubjects.isPending || ensureSubjects.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function DepartmentsTab() {
  const { role } = useAuth()
  const canEdit = role === 'school_admin'
  const { data: departments = [], isLoading } = useDepartments()
  const { data: subjects = [] } = useSubjects()
  const deleteDept = useDeleteDepartment()
  const [editTarget, setEditTarget] = useState<Department | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const subjectsByDepartment = useMemo(() => {
    return subjects.reduce<Record<string, Subject[]>>((acc, subject) => {
      if (!subject.department_id) return acc
      acc[subject.department_id] = [...(acc[subject.department_id] ?? []), subject]
      return acc
    }, {})
  }, [subjects])

  const columns: Column<Department>[] = [
    { key: 'name', header: 'Department', sortable: true, cell: r => <span className="font-medium">{r.name}</span> },
    { key: 'code', header: 'Code', className: 'font-mono text-xs', cell: r => r.code ?? <span className="text-muted-foreground">—</span> },
    {
      key: 'subjects',
      header: 'Subjects Offered',
      cell: r => {
        const departmentSubjects = subjectsByDepartment[r.id] ?? []
        if (departmentSubjects.length === 0) return <span className="text-muted-foreground">—</span>
        return (
          <div className="text-xs leading-5">
            {departmentSubjects.slice(0, 3).map(s => s.name).join(', ')}
            {departmentSubjects.length > 3 ? ` +${departmentSubjects.length - 3} more` : ''}
          </div>
        )
      },
    },
    ...(canEdit ? [{
      key: 'actions' as keyof Department,
      header: '',
      className: 'text-right',
      cell: (r: Department) => (
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); setEditTarget(r); setShowForm(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); setDeleteId(r.id) }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    }] : []),
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
        <strong>What is a Department?</strong> Departments are organisational units (e.g. Science Dept, Languages Dept) that group teachers and subjects. HODs are assigned to departments. Departments are different from Subjects — a department may contain many subjects.
        <p className="mt-2 text-xs">
          Common Zimbabwean departments include Sciences, Commercials, Humanities, Languages, Technical/Vocational, ICT, and Arts.
        </p>
      </div>
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={() => { setEditTarget(null); setShowForm(true) }}>
            <Plus className="mr-2 h-4 w-4" />Add Department
          </Button>
        </div>
      )}
      <DataTable<Department>
        columns={columns}
        data={departments}
        keyExtractor={r => r.id}
        loading={isLoading}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-16">
            <Building2 className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No departments yet</p>
            {canEdit && <p className="text-xs text-muted-foreground">Create departments so teachers can be assigned to them.</p>}
          </div>
        }
      />
      <DepartmentFormModal
        open={showForm}
        onOpenChange={v => { setShowForm(v); if (!v) setEditTarget(null) }}
        dept={editTarget}
        subjects={subjects}
      />
      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Department</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will soft-delete the department. Teachers and subjects linked to it will remain but lose the department association.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteDept.isPending}
              onClick={async () => {
                if (deleteId) {
                  const ok = await deleteDept.mutateAsync(deleteId)
                  if (ok) { toast.success('Department deleted.'); setDeleteId(null) }
                  else toast.error('Failed to delete department.')
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
