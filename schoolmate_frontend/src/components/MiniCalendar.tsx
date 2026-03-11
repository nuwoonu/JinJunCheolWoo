import { useEffect, useState } from 'react'

// [woo] FullCalendar dayGridMonth 대체 미니 캘린더
// - /api/calendar/events?year=&month= 에서 이벤트 직접 fetch
// - 이벤트 타입별 색상 pill 표시 (dayMaxEvents: 1, +N more)

interface CalendarEvent {
  title: string
  startDate: string
  endDate: string
  eventType: string
}

const EVENT_COLORS: Record<string, string> = {
  EVENT: '#0d6efd', EXAM: '#dc3545', HOLIDAY: '#ffc107', VACATION: '#198754',
  FIELD_TRIP: '#0dcaf0', MEETING: '#6610f2', BRIEFING: '#d63384', OTHER: '#6c757d',
}
const EVENT_TEXT_COLORS: Record<string, string> = {
  HOLIDAY: '#000', FIELD_TRIP: '#000',
}

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function MiniCalendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // [woo] 0-based
  const [events, setEvents] = useState<CalendarEvent[]>([])

  const todayStr = today.toISOString().slice(0, 10)

  useEffect(() => {
    // [woo] 현재 표시 월의 이벤트 fetch
    fetch(`/api/calendar/events?year=${year}&month=${month + 1}`)
      .then(r => r.ok ? r.json() : [])
      .then(setEvents)
      .catch(() => setEvents([]))
  }, [year, month])

  // [woo] 날짜별 이벤트 그룹핑 (startDate ~ endDate 범위 처리)
  const eventsByDate: Record<string, CalendarEvent[]> = {}
  for (const evt of events) {
    const start = new Date(evt.startDate)
    const end = new Date(evt.endDate ?? evt.startDate)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10)
      if (!eventsByDate[key]) eventsByDate[key] = []
      eventsByDate[key].push(evt)
    }
  }

  // [woo] 달력 셀 계산
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function toDateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return (
    <div style={{ fontSize: 11, userSelect: 'none' }}>
      {/* [woo] 월 네비게이션 */}
      <div className="d-flex align-items-center justify-content-between mb-8">
        <button onClick={prevMonth} className="btn btn-sm px-8 py-2" style={{ fontSize: 13, lineHeight: 1 }}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{year}년 {month + 1}월</span>
        <button onClick={nextMonth} className="btn btn-sm px-8 py-2" style={{ fontSize: 13, lineHeight: 1 }}>›</button>
      </div>

      {/* [woo] 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', borderBottom: '1px solid #dee2e6', paddingBottom: 4, marginBottom: 4 }}>
        {WEEK_LABELS.map((d, i) => (
          <span key={d} style={{ fontWeight: 600, color: i === 0 ? '#dc3545' : i === 6 ? '#0d6efd' : '#6c757d', padding: '2px 0' }}>
            {d}
          </span>
        ))}
      </div>

      {/* [woo] 날짜 + 이벤트 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} style={{ minHeight: 44 }} />

          const ds = toDateStr(day)
          const isToday = ds === todayStr
          const dayEvents = eventsByDate[ds] ?? []
          const col = idx % 7

          return (
            <div key={idx} style={{ minHeight: 44, padding: '2px 2px', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
              {/* 날짜 숫자 */}
              <div style={{ textAlign: 'right', paddingRight: 3 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 20, height: 20, borderRadius: '50%', fontSize: 11, fontWeight: isToday ? 700 : 400,
                  background: isToday ? '#f5e9c8' : 'transparent',
                  color: isToday ? '#b8860b' : col === 0 ? '#dc3545' : col === 6 ? '#0d6efd' : '#212529',
                  border: isToday ? '1.5px solid #e6c870' : 'none',
                }}>
                  {day}
                </span>
              </div>
              {/* 이벤트 pill (최대 1개 + +N) */}
              {dayEvents.slice(0, 1).map((evt, i) => (
                <div key={i} title={evt.title} style={{
                  background: EVENT_COLORS[evt.eventType] ?? '#6c757d',
                  color: EVENT_TEXT_COLORS[evt.eventType] ?? '#fff',
                  borderRadius: 3, padding: '1px 3px', fontSize: 9, fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  marginTop: 1,
                }}>
                  {evt.title}
                </div>
              ))}
              {dayEvents.length > 1 && (
                <div style={{ fontSize: 9, color: '#6c757d', paddingLeft: 2 }}>+{dayEvents.length - 1}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
