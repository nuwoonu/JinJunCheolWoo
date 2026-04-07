// [soojin] 오늘의 시간표 위젯 — grade/classNum/schoolId를 받아 직접 fetch (TodayMealWidget과 동일 패턴)
// - 학생 대시보드: schoolId는 JWT 컨텍스트로 처리되므로 생략 가능
// - 학부모 대시보드: 선택된 자녀의 schoolId를 전달해 다학교 지원

import { useEffect, useState } from "react"

// [soojin] 교시별 시간 범위 — 현재 시간과 비교해 활성 교시 강조
const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '09:00', end: '09:50' },
  2: { start: '10:00', end: '10:50' },
  3: { start: '11:00', end: '11:50' },
  4: { start: '12:00', end: '12:50' },
  5: { start: '13:50', end: '14:40' },
  6: { start: '14:50', end: '15:40' },
  7: { start: '15:50', end: '16:40' },
  8: { start: '16:50', end: '17:40' },
}

function getCurrentPeriod(): number | null {
  const now = new Date()
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  for (const [p, { start, end }] of Object.entries(PERIOD_TIMES)) {
    if (hhmm >= start && hhmm <= end) return Number(p)
  }
  return null
}

interface TimetableItem {
  period: number
  subject: string
  // [soojin] 선생님·학급 정보 (API 응답에 포함될 경우 표시)
  teacher?: string
  className?: string
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
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(getCurrentPeriod)

  // [soojin] 1분마다 현재 교시 갱신
  useEffect(() => {
    const id = setInterval(() => setCurrentPeriod(getCurrentPeriod()), 60_000)
    return () => clearInterval(id)
  }, [])

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
          <h6 className="fw-bold mb-0 text-lg">오늘의 시간표</h6>
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
            {/* [soojin] 현재 교시 = 민트 배경, 나머지 = 연한 회색 배경 */}
            {timetable.map((item, i) => {
              const isActive = item.period === currentPeriod
              return (
                <div
                  key={item.period}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    background: isActive ? '#e6f7f6' : '#f6f7f8',
                    border: `1px solid ${isActive ? '#25A194' : '#e5e7eb'}`,
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: i < timetable.length - 1 || hasEvents ? 8 : 0,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#25A194' : '#9ca3af', minWidth: 36, flexShrink: 0 }}>
                    {item.period}교시
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? '#111827' : '#6b7280' }}>{item.subject}</div>
                    {(item.teacher || item.className) && (
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        {[item.teacher, item.className].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

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
