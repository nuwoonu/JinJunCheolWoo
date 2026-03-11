// [woo] TeacherScheduleDTO.Response 에 대응하는 타입
export type DayKey = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY'

export interface Schedule {
  id: number
  dayOfWeek: DayKey
  dayOfWeekDescription: string
  period: number
  startTime: string   // "HH:mm:ss" (Jackson write-dates-as-timestamps=false)
  endTime: string
  subjectName: string
  className: string | null
  location: string | null
  repeatType: string
  repeatTypeDescription: string
  specificDate: string | null
  memo: string | null
}

export interface DayColumn {
  key: DayKey
  label: string
  shortLabel: string
}
