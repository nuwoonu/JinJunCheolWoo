// [soojin] 이번 주 일정 캘린더 위젯
// NeisEventsWidget(src/components/NeisEventsWidget.tsx)을 참고해 이번 주 월~금 뷰로 재작성
// GET /api/calendar/events?year=&month= 호출 후 이번 주 월~금 날짜의 이벤트 필터링
//
// 레이아웃: 스크린샷 참고 - 요일+날짜가 상단, 이벤트 칩이 아래
//   월  화  수  목  금
//   16  17  18  19  20
//   [이벤트] [이벤트] ...

import { useEffect, useState } from 'react'

interface CalendarEvent {
  title: string
  startDate: string
  eventType: string
  dday: number
}

// 이번 주 월요일~금요일 날짜 문자열 배열 반환 (YYYY-MM-DD)
function getWeekDays(): string[] {
  const now = new Date()
  const day = now.getDay() // 0=일, 1=월, ..., 6=토
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

const DAY_LABEL = ['월', '화', '수', '목', '금']

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  HOLIDAY:  { bg: '#fff3cd', text: '#856404' },
  EXAM:     { bg: '#f8d7da', text: '#842029' },
  EVENT:    { bg: '#d1e7ff', text: '#0a58ca' },
  ACADEMIC: { bg: '#d1e7dd', text: '#0f5132' },
  ETC:      { bg: '#e2e3e5', text: '#41464b' },
}

export default function WeeklyCalendarWidget() {
  const [eventsByDay, setEventsByDay] = useState<Record<string, CalendarEvent[]>>({})
  const [loading, setLoading] = useState(true)
  const weekDays = getWeekDays()
  const todayStr = new Date().toISOString().slice(0, 10)

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
        const all: CalendarEvent[] = [...d1, ...d2]
        const grouped: Record<string, CalendarEvent[]> = {}
        for (const date of weekDays) {
          grouped[date] = all.filter(e => e.startDate === date)
        }
        setEventsByDay(grouped)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <div className="p-16 border-bottom">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-calendar-event-line text-primary-600 me-2" />
          이번 주 일정
        </h6>
      </div>

      <div className="p-16">
        {loading ? (
          <p className="text-secondary-light text-sm text-center py-16 mb-0">
            일정을 불러오는 중...
          </p>
        ) : (
          /* 5열 그리드: 각 열 = 요일 + 날짜 + 이벤트 */
          <div className="d-flex gap-8" style={{ minHeight: 120 }}>
            {weekDays.map((date, i) => {
              const events = eventsByDay[date] ?? []
              const isToday = date === todayStr

              return (
                <div
                  key={date}
                  className="d-flex flex-column"
                  style={{ flex: 1, minWidth: 0 }}
                >
                  {/* 요일 + 날짜 헤더 */}
                  <div className="text-center mb-8">
                    <div
                      className="text-xs fw-semibold mb-4"
                      style={{ color: isToday ? '#4361ee' : '#6c757d' }}
                    >
                      {DAY_LABEL[i]}
                    </div>
                    <div
                      className="fw-bold text-sm d-flex align-items-center justify-content-center mx-auto"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: isToday ? '#4361ee' : 'transparent',
                        color: isToday ? '#fff' : '#212529',
                      }}
                    >
                      {date.slice(8)}
                    </div>
                  </div>

                  {/* 이벤트 칩 목록 */}
                  <div className="d-flex flex-column gap-4">
                    {events.length > 0 ? (
                      events.map((evt, j) => {
                        const c = COLOR_MAP[evt.eventType] ?? COLOR_MAP.ETC
                        return (
                          <span
                            key={j}
                            className="rounded-4 text-center"
                            style={{
                              background: c.bg,
                              color: c.text,
                              fontSize: 10,
                              padding: '2px 4px',
                              wordBreak: 'keep-all',
                              lineHeight: 1.4,
                              display: 'block',
                            }}
                          >
                            {evt.title}
                          </span>
                        )
                      })
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
