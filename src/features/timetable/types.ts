export interface Period {
  id: string
  school_id: string
  label: string
  start_time: string
  end_time: string
  sort_order: number
}

export interface TimetableEntry {
  id: string
  school_id: string
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
  teacher_id: string
  teacher_name: string
  period_id: string
  period_label: string
  period_start: string
  period_end: string
  day_of_week: number
  room: string | null
  academic_year_id: string
}

export interface TimetableGridCell {
  entry: TimetableEntry | null
  periodId: string
  dayOfWeek: number
}
