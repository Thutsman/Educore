import { supabase } from '@/lib/supabase'
import type { Period, TimetableEntry } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function getPeriods(schoolId: string): Promise<Period[]> {
  const { data, error } = await supabase
    .from('periods')
    .select('id, school_id, label, start_time, end_time, sort_order')
    .eq('school_id', schoolId)
    .order('sort_order')
    .order('start_time')
  if (error || !data) return []
  return data as unknown as Period[]
}

export async function createPeriod(schoolId: string, d: { label: string; start_time: string; end_time: string; sort_order?: number }): Promise<boolean> {
  const { error } = await db.from('periods').insert({
    school_id: schoolId,
    label: d.label,
    start_time: d.start_time,
    end_time: d.end_time,
    sort_order: d.sort_order ?? 0,
  })
  return !error
}

export async function updatePeriod(id: string, d: Partial<{ label: string; start_time: string; end_time: string; sort_order: number }>): Promise<boolean> {
  const { error } = await db.from('periods').update(d).eq('id', id)
  return !error
}

export async function deletePeriod(id: string): Promise<boolean> {
  const { error } = await db.from('periods').delete().eq('id', id)
  return !error
}

export async function getTimetableEntries(
  schoolId: string,
  filters?: { classId?: string; teacherId?: string; academicYearId?: string }
): Promise<TimetableEntry[]> {
  let q = supabase
    .from('timetable_entries')
    .select(`
      id, school_id, class_id, subject_id, teacher_id, period_id, day_of_week, room, academic_year_id,
      class:classes(name),
      subject:subjects(name),
      teacher:teachers(id, profile:profiles(full_name)),
      period:periods(label, start_time, end_time)
    `)
    .eq('school_id', schoolId)
    .order('day_of_week')
    .order('period_id')

  if (filters?.classId) q = q.eq('class_id', filters.classId)
  if (filters?.teacherId) q = q.eq('teacher_id', filters.teacherId)
  if (filters?.academicYearId) q = q.eq('academic_year_id', filters.academicYearId)

  const { data, error } = await q
  if (error || !data) return []

  type Row = {
    id: string
    school_id: string
    class_id: string
    subject_id: string
    teacher_id: string
    period_id: string
    day_of_week: number
    room: string | null
    academic_year_id: string
    class: { name: string } | null
    subject: { name: string } | null
    teacher: { profile: { full_name: string } | null } | null
    period: { label: string; start_time: string; end_time: string } | null
  }
  return (data as unknown as Row[]).map((r) => ({
    id: r.id,
    school_id: r.school_id,
    class_id: r.class_id,
    class_name: r.class?.name ?? '—',
    subject_id: r.subject_id,
    subject_name: r.subject?.name ?? '—',
    teacher_id: r.teacher_id,
    teacher_name: r.teacher?.profile?.full_name ?? '—',
    period_id: r.period_id,
    period_label: r.period?.label ?? '—',
    period_start: r.period?.start_time ?? '',
    period_end: r.period?.end_time ?? '',
    day_of_week: r.day_of_week,
    room: r.room,
    academic_year_id: r.academic_year_id,
  }))
}

export async function upsertTimetableEntry(
  schoolId: string,
  d: {
    class_id: string
    subject_id: string
    teacher_id: string
    period_id: string
    day_of_week: number
    room?: string
    academic_year_id: string
  }
): Promise<boolean> {
  const { error } = await db.from('timetable_entries').upsert(
    {
      school_id: schoolId,
      class_id: d.class_id,
      subject_id: d.subject_id,
      teacher_id: d.teacher_id,
      period_id: d.period_id,
      day_of_week: d.day_of_week,
      room: d.room ?? null,
      academic_year_id: d.academic_year_id,
    },
    { onConflict: 'class_id,period_id,day_of_week,academic_year_id' }
  )
  return !error
}

export async function deleteTimetableEntry(id: string): Promise<boolean> {
  const { error } = await db.from('timetable_entries').delete().eq('id', id)
  return !error
}
