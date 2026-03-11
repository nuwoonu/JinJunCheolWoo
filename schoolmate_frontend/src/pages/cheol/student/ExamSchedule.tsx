import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import MiniCalendar from '../../../components/MiniCalendar'

// [cheol] /exam/schedule - 시험 일정 (cheol/exam/exam-schedule.html 마이그레이션)
// 학사 일정 중 EXAM 타입 이벤트 표시 + 미니 캘린더

interface CalendarEvent {
  id: number
  title: string
  startDate: string
  endDate?: string
  eventType: string
  dDay: number
  dateRangeText: string
}

export default function ExamSchedule() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    // [cheol] 이번달 + 다음달 이벤트 조회 → EXAM 타입만 필터 + 오늘 이후 10개
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
          .filter((e: CalendarEvent) => e.startDate >= todayStr && e.eventType === 'EXAM')
          .sort((a: CalendarEvent, b: CalendarEvent) => a.startDate.localeCompare(b.startDate))
          .slice(0, 10)
        setEvents(upcoming)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">과제/성적</h6>
          <p className="text-neutral-600 mt-4 mb-0">시험 일정</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/student/dashboard" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">과제/성적</li>
          <li>-</li>
          <li className="fw-medium">시험 일정</li>
        </ul>
      </div>

      <div className="row gy-4">

        {/* 다가오는 시험 일정 목록 */}
        <div className="col-xl-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="d-flex justify-content-between align-items-center px-24 py-16 border-bottom">
              <h6 className="fw-bold mb-0 text-sm">
                <i className="ri-calendar-check-line text-danger-600 me-2" />다가오는 시험 일정
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
            <div className="p-20">
              {showCalendar ? (
                // [cheol] 캘린더 뷰 - MiniCalendar가 자체적으로 API fetch
                <MiniCalendar />
              ) : loading ? (
                <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
              ) : events.length === 0 ? (
                <div className="text-center py-48 text-secondary-light">
                  <i className="ri-calendar-close-line text-4xl d-block mb-12 text-neutral-300" />
                  예정된 시험 일정이 없습니다.
                </div>
              ) : (
                events.map((evt, i) => (
                  <div key={evt.id ?? i}
                    className={`d-flex align-items-center justify-content-between p-16 radius-12 mb-12${i === 0 ? ' bg-danger-50' : ' bg-neutral-50'}`}
                  >
                    <div className="d-flex align-items-center gap-16">
                      <div className={`w-48-px h-48-px rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${i === 0 ? 'bg-danger-100' : 'bg-neutral-200'}`}>
                        <i className={`ri-file-list-3-line text-xl ${i === 0 ? 'text-danger-600' : 'text-secondary-light'}`} />
                      </div>
                      <div>
                        <p className="fw-bold text-sm mb-4">{evt.title}</p>
                        <span className="text-xs text-secondary-light">{evt.dateRangeText}</span>
                      </div>
                    </div>
                    <span className="badge fw-bold px-12 py-6 radius-4"
                      style={{
                        background: evt.dDay === 0 ? '#dc3545' : evt.dDay <= 3 ? '#fd7e14' : '#d1f7e8',
                        color: evt.dDay === 0 || evt.dDay <= 3 ? '#fff' : '#198754',
                      }}>
                      {evt.dDay === 0 ? 'D-Day' : `D-${evt.dDay}`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 시험 준비 팁 */}
        <div className="col-xl-4">
          <div className="card border-0 shadow-sm p-24" style={{ borderRadius: 16 }}>
            <h6 className="fw-bold mb-20 text-sm">
              <i className="ri-lightbulb-line text-warning-main me-2" />시험 준비 체크리스트
            </h6>
            {[
              { icon: 'ri-book-3-line', color: 'text-primary-600', bg: 'bg-primary-50', text: '교과서 복습' },
              { icon: 'ri-pencil-line', color: 'text-success-600', bg: 'bg-success-50', text: '문제 풀기' },
              { icon: 'ri-time-line', color: 'text-warning-main', bg: 'bg-warning-50', text: '시간 관리' },
              { icon: 'ri-sleep-line', color: 'text-info-600', bg: 'bg-info-50', text: '충분한 수면' },
              { icon: 'ri-heart-line', color: 'text-danger-600', bg: 'bg-danger-50', text: '건강 관리' },
            ].map(item => (
              <div key={item.text} className={`d-flex align-items-center gap-12 p-12 ${item.bg} radius-8 mb-8`}>
                <i className={`${item.icon} ${item.color} text-xl`} />
                <span className="text-sm fw-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
