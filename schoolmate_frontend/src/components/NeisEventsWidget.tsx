import { useEffect, useState } from 'react'
import MiniCalendar from '@/components/MiniCalendar'

// [woo] NEIS 학교일정 위젯 - 모든 대시보드에서 공용 사용
// 이번달 + 다음달 일정 조회 → 오늘 이후 5개 표시, 목록↔캘린더 토글

interface CalendarEvent {
  title: string
  startDate: string
  eventType: string
  dday: number
  dateRangeText: string
}

const COLOR_MAP: Record<string, string> = {
  HOLIDAY: '#ffc107',
  EXAM: '#dc3545',
  EVENT: '#0d6efd',
  ACADEMIC: '#198754',
  ETC: '#6c757d',
}

export default function NeisEventsWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    const now = new Date()
    const nextMonth = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2
    const nextYear = now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear()
    Promise.all([
      fetch(`/api/calendar/events?year=${now.getFullYear()}&month=${now.getMonth() + 1}`),
      fetch(`/api/calendar/events?year=${nextYear}&month=${nextMonth}`),
    ])
      .then(([r1, r2]) => Promise.all([r1.ok ? r1.json() : [], r2.ok ? r2.json() : []]))
      .then(([d1, d2]) => {
        const todayStr = now.toISOString().slice(0, 10)
        const upcoming = [...d1, ...d2]
          .filter((e: CalendarEvent) => e.startDate >= todayStr)
          .sort((a: CalendarEvent, b: CalendarEvent) => a.startDate.localeCompare(b.startDate))
          .slice(0, 5)
        setEvents(upcoming)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="card h-100">
      <div className="card-body p-0">
        <div className="d-flex align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
          <h6 className="text-lg mb-0 fw-semibold">
            <i className="ri-calendar-event-line text-primary-600 me-8" />학교 일정
          </h6>
          <button
            className="btn btn-sm btn-outline-primary rounded-pill px-12 py-4"
            style={{ fontSize: 12 }}
            onClick={() => setShowCalendar(v => !v)}
          >
            {showCalendar
              ? <><i className="ri-list-check" /> 목록</>
              : <><i className="ri-calendar-2-line" /> 캘린더</>
            }
          </button>
        </div>
        <div className="px-16 py-12">
          {showCalendar ? (
            <MiniCalendar />
          ) : events.length > 0 ? (
            <div className="d-flex flex-column gap-8">
              {events.map((evt, i) => {
                const color = COLOR_MAP[evt.eventType] ?? '#6c757d'
                return (
                  <div key={i}
                    className="d-flex align-items-center justify-content-between p-12 rounded-8"
                    style={{ background: color + '12', border: `1px solid ${color}30` }}>
                    <span className="text-sm fw-medium" style={{ color }}>
                      <i className="ri-calendar-line me-8" />
                      {evt.dateRangeText} {evt.title}
                    </span>
                    <span className="badge text-white text-xs px-10 py-4 rounded-pill flex-shrink-0 ms-8"
                      style={{ background: evt.dday <= 3 ? '#dc3545' : '#0d6efd' }}>
                      {evt.dday === 0 ? 'D-DAY' : `D-${evt.dday}`}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-32 text-secondary-light">
              <p className="text-sm mb-0">예정된 일정이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
