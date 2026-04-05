// [soojin] 오늘의 시간표 위젯 — grade/classNum/schoolId를 받아 직접 fetch (TodayMealWidget과 동일 패턴)
// - 학생 대시보드: schoolId는 JWT 컨텍스트로 처리되므로 생략 가능
// - 학부모 대시보드: 선택된 자녀의 schoolId를 전달해 다학교 지원

import { useEffect, useState } from "react"

interface TimetableItem {
  period: number
  subject: string
}

interface CalendarEvent {
  title: string
  eventType: string
}

interface Props {
  grade?: number | null
  classNum?: number | null
  schoolId?: number | null
  // [soojin] 학부모 대시보드에서 오늘의 학사일정을 함께 표시할 때 사용
  events?: CalendarEvent[]
}

const EVENT_COLOR: Record<string, string> = {
  HOLIDAY: '#ffc107',
  EXAM:    '#dc3545',
  EVENT:   '#0d6efd',
  ACADEMIC:'#198754',
  ETC:     '#6c757d',
}

export default function TodayTimetableWidget({ grade, classNum, schoolId, events }: Props) {
  const [timetable, setTimetable] = useState<TimetableItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!grade || !classNum) return
    setLoading(true)
    // [soojin] schoolId 있으면 query param으로 전달 (학부모 다학교 지원)
    const url = schoolId != null
      ? `/api/calendar/timetable?grade=${grade}&classNum=${classNum}&schoolId=${schoolId}`
      : `/api/calendar/timetable?grade=${grade}&classNum=${classNum}`
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setTimetable(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [grade, classNum, schoolId])

  const hasEvents = events && events.length > 0

  return (
    <div className="card shadow-sm h-100 dash-card">
      {/* 헤더 */}
      <div className="d-flex align-items-center justify-content-between dash-card-header">
        <div className="d-flex align-items-center gap-8">
          <i className="ri-time-line text-primary-600" style={{ fontSize: 18 }} />
          <h6 className="fw-bold mb-0 text-sm">오늘의 시간표</h6>
        </div>
        {timetable.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#25A194',
            background: '#e6f7f6', borderRadius: 20, padding: '2px 10px',
          }}>
            {timetable.length}교시
          </span>
        )}
      </div>

      {/* 본문 */}
      <div className="p-16">
        {loading ? (
          <p className="text-secondary-light text-sm text-center py-16 mb-0">시간표를 불러오는 중...</p>
        ) : timetable.length === 0 && !hasEvents ? (
          <p className="text-secondary-light text-sm text-center py-20 mb-0">오늘 시간표 정보가 없습니다.</p>
        ) : (
          <>
            {timetable.map((item, i) => (
              <div
                key={item.period}
                className="p-10 bg-neutral-50 rounded-8 d-flex justify-content-between align-items-center"
                style={{ marginBottom: i < timetable.length - 1 || hasEvents ? 8 : 0 }}
              >
                <span className="text-sm fw-bold text-secondary-light">{item.period}교시</span>
                <span className="fw-medium text-dark text-sm">{item.subject}</span>
              </div>
            ))}

            {/* [soojin] 학부모 대시보드 전달용 오늘의 학사일정 */}
            {hasEvents && events!.map((evt, i) => {
              const color = EVENT_COLOR[evt.eventType] ?? '#6c757d'
              return (
                <div
                  key={i}
                  className="p-10 rounded-8 d-flex justify-content-between align-items-center"
                  style={{
                    background: color + '15', border: `1px solid ${color}50`,
                    marginBottom: i < events!.length - 1 ? 8 : 0,
                  }}
                >
                  <span className="text-sm fw-medium" style={{ color }}>
                    <i className="ri-calendar-event-fill me-8" />
                    {evt.title}
                  </span>
                  <span className="badge text-white text-xs px-8 py-4 rounded-pill" style={{ background: color, flexShrink: 0 }}>
                    학사일정
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
