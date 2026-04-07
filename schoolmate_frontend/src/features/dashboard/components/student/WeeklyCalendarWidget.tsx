// [soojin] 이번 주 일정 캘린더 위젯
// 발표용: API 주석 처리, 더미 데이터 사용 중

import { useEffect, useState } from 'react'

interface CalendarEvent {
  title: string
  startDate: string
  eventType: string
  dday: number
}

function toLocalDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getWeekDays(): string[] {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return toLocalDateStr(d)
  })
}

const DAY_LABEL = ['월', '화', '수', '목', '금']

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  HOLIDAY:  { bg: '#d1fae5', text: '#065f46' },
  EVENT:    { bg: '#d1fae5', text: '#065f46' },
  ACADEMIC: { bg: '#ffe8cc', text: '#9c4a00' },
  EXAM:     { bg: '#fde2e2', text: '#9b1c1c' },
  ETC:      { bg: '#dbeafe', text: '#1e40af' },
}


export default function WeeklyCalendarWidget() {
  const [eventsByDay, setEventsByDay] = useState<Record<string, CalendarEvent[]>>({})
  const [loading, setLoading] = useState(true)
  const weekDays = getWeekDays()
  const todayStr = toLocalDateStr(new Date())

  useEffect(() => {
    const applyData = (all: CalendarEvent[]) => {
      const grouped: Record<string, CalendarEvent[]> = {}
      for (const date of weekDays) {
        grouped[date] = all.filter(e => e.startDate === date)
      }

      // 발표용: 항상 더미 데이터 사용
      const hasAny = weekDays.some(d => grouped[d].length > 0)
      if (!hasAny) {
        const [mon, tue, wed, thu, fri] = weekDays
        grouped[mon] = [
          { title: '개학식', startDate: mon, eventType: 'EVENT', dday: 0 },
          { title: '독후감 제출', startDate: mon, eventType: 'ACADEMIC', dday: 0 },
        ]
        grouped[tue] = [{ title: '수학 1단원 과제', startDate: tue, eventType: 'ACADEMIC', dday: 0 }]
        grouped[wed] = [{ title: '학부모 상담주간', startDate: wed, eventType: 'ETC', dday: 0 }]
        grouped[thu] = [{ title: '영어 단어 시험', startDate: thu, eventType: 'EXAM', dday: 0 }]
        grouped[fri] = [{ title: '봄 방학 전날', startDate: fri, eventType: 'EVENT', dday: 0 }]
      }

      setEventsByDay(grouped)
      setLoading(false)
    }

    // 발표용: API 주석 처리 → 더미 데이터 바로 사용
    // const now = new Date()
    // const nextMonth = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2
    // const nextYear = now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear()
    // Promise.all([
    //   fetch(`/api/calendar/events?year=${now.getFullYear()}&month=${now.getMonth() + 1}`).then(r => r.ok ? r.json() : []),
    //   fetch(`/api/calendar/events?year=${nextYear}&month=${nextMonth}`).then(r => r.ok ? r.json() : []),
    // ])
    //   .then(([d1, d2]) => applyData([...d1, ...d2]))
    //   .catch(() => applyData([]))
    applyData([])
  }, [])

  return (
    <div className="card shadow-sm h-100 dash-card">
      {/* 헤더 */}
      <div className="d-flex justify-content-between align-items-center dash-card-header">
        <div className="d-flex align-items-center gap-8">
          <i className="ri-calendar-event-line text-primary-600" style={{ fontSize: 20 }} />
          <h6 className="fw-bold mb-0 text-lg">이번 주 일정</h6>
        </div>
      </div>

      {/* 범례 */}
      <div className="d-flex gap-12 px-16 pt-12 pb-4">
        {[
          { label: '학교 행사', bg: '#d1fae5', text: '#065f46' },
          { label: '과제 제출', bg: '#ffe8cc', text: '#9c4a00' },
          { label: '시험',     bg: '#fde2e2', text: '#9b1c1c' },
          { label: '기타',     bg: '#dbeafe', text: '#1e40af' },
        ].map(l => (
          <div key={l.label} className="d-flex align-items-center" style={{ gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: l.bg, border: `1px solid ${l.text}44`, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 15, color: '#374151' }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div className="p-16" style={{ paddingTop: 8 }}>
        {loading ? (
          <p className="text-secondary-light text-md text-center py-16 mb-0">일정을 불러오는 중...</p>
        ) : (
          <div className="d-flex gap-10">
            {weekDays.map((date, i) => {
              const events = eventsByDay[date] ?? []
              const isToday = date === todayStr

              return (
                <div
                  key={date}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: `1.5px solid ${isToday ? '#25A194' : '#e5e7eb'}`,
                    borderRadius: 12,
                    padding: '10px 8px',
                    background: isToday ? '#f0faf9' : '#fff',
                  }}
                >
                  <div
                    className="text-center fw-semibold mb-2"
                    style={{ fontSize: 15, color: isToday ? '#25A194' : '#9ca3af' }}
                  >
                    {DAY_LABEL[i]}
                  </div>
                  <div className="d-flex justify-content-center mb-10">
                    <div
                      className="fw-bold d-flex align-items-center justify-content-center"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: isToday ? '#25A194' : 'transparent',
                        color: isToday ? '#fff' : '#111827',
                        fontSize: 20,
                      }}
                    >
                      {Number(date.slice(8))}
                    </div>
                  </div>
                  <div className="d-flex flex-column gap-4">
                    {events.map((evt, j) => {
                      const c = COLOR_MAP[evt.eventType] ?? COLOR_MAP.ETC
                      return (
                        <div
                          key={j}
                          style={{
                            background: c.bg,
                            color: c.text,
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 500,
                            padding: '3px 6px',
                            textAlign: 'center',
                            wordBreak: 'keep-all',
                            lineHeight: 1.4,
                          }}
                        >
                          {evt.title}
                        </div>
                      )
                    })}
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
