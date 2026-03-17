import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '@/api/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import NeisEventsWidget from '@/components/NeisEventsWidget'

// [soojin] 학부모 자녀현황 - soojin/mychildren/status.html 마이그레이션
// 레이아웃: 상단 3컬럼(프로필+출결 | 시간표 | 학교일정) + 하단 2컬럼(가정통신문 | 급식) + 알림장

interface Child {
  id: number
  studentInfoId: number // [woo] 출결 조회용
  name: string
  grade?: number
  classNum?: number
  attendanceNum?: number
  profileImageUrl?: string
}

interface Board {
  title: string
  createDate?: string
  writerName?: string
}

interface CalendarEvent {
  title: string
  startDate: string
  endDate: string
  eventType: string
  dday: number
  dateRangeText: string
}

interface Meal {
  mealType: string
  menu: string
  calories?: number
}

interface TimetableItem {
  period: number
  subject: string
}

interface ParentDashboardData {
  children?: Child[]
  boards?: Board[]
}


const MEAL_TYPE_LABEL: Record<string, string> = { BREAKFAST: '조식', LUNCH: '중식', DINNER: '석식' }
const MEAL_TYPE_CLASS: Record<string, string> = {
  BREAKFAST: 'bg-warning-100 text-warning-600',
  LUNCH: 'bg-primary-100 text-primary-600',
  DINNER: 'bg-info-100 text-info-600',
}


// [woo] 학부모 자녀 출결 통계 타입
interface AttendanceSummary {
  childName: string
  studentInfoId: number
  statusCounts: Record<string, number>
  totalDays: number
}

export default function ParentChildrenStatus() {
  const location = useLocation()
  const [children, setChildren] = useState<Child[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(
    (location.state as { childId?: number } | null)?.childId ?? null
  )
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [timetable, setTimetable] = useState<TimetableItem[]>([])
  const [timetableLoading, setTimetableLoading] = useState(false)
  // [woo] 출결 통계 state
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceSummary>>({})

  useEffect(() => {
    api.get('/dashboard/parent').then(res => {
      const d: ParentDashboardData = res.data
      setChildren(d.children ?? [])
      setBoards(d.boards ?? [])
      if (d.children && d.children.length > 0) {
        const fromState = (location.state as { childId?: number } | null)?.childId
        const valid = fromState && d.children.some(c => c.id === fromState)
        setSelectedChildId(valid ? fromState : d.children[0].id)
      }
    }).catch(() => {})

    // [woo] 오늘의 학사일정 (NEIS) - 오늘 날짜만 필터
    const now = new Date()
    fetch(`/api/calendar/events?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: CalendarEvent[]) => {
        const todayStr = now.toISOString().slice(0, 10)
        setTodayEvents(data.filter(e => e.startDate === todayStr))
      }).catch(() => {})

    // [soojin] 오늘의 급식
    fetch('/api/meals/daily')
      .then(r => r.ok ? r.json() : [])
      .then(setMeals).catch(() => {})

    // [woo] 학부모 자녀 출결 요약 API 호출
    const now2 = new Date()
    const startDate = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}-01`
    const lastDay = new Date(now2.getFullYear(), now2.getMonth() + 1, 0).getDate()
    const endDate = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    api.get(`/attendance/parent/summary?startDate=${startDate}&endDate=${endDate}`)
      .then(res => {
        const map: Record<number, AttendanceSummary> = {}
        ;(res.data as AttendanceSummary[]).forEach(s => { map[s.studentInfoId] = s })
        setAttendanceMap(map)
      })
      .catch(() => {})
  }, [])

  // [woo] 선택된 자녀의 학년/반으로 NEIS 시간표 조회
  useEffect(() => {
    const child = children.find(c => c.id === selectedChildId) ?? children[0]
    if (!child?.grade || !child?.classNum) return
    setTimetableLoading(true)
    fetch(`/api/calendar/timetable?grade=${child.grade}&classNum=${child.classNum}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setTimetable(data); setTimetableLoading(false) })
      .catch(() => setTimetableLoading(false))
  }, [selectedChildId, children])

  const selectedChild = children.find(c => c.id === selectedChildId) ?? children[0]

  if (children.length === 0) {
    return (
      <DashboardLayout>
        <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
          <h6 className="fw-semibold mb-0">자녀 현황</h6>
        </div>
        <div className="card border-0 p-80 text-center">
          <i className="ri-user-search-line text-5xl text-neutral-300 mb-16" />
          <h5 className="text-secondary-light">등록된 자녀가 없습니다.</h5>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h6 className="fw-semibold mb-0">자녀 현황</h6>
      </div>

      {/* [soojin] 자녀 탭 (여러 명일 때) */}
      {children.length > 1 && (
        <div className="d-flex flex-wrap gap-12 mb-24">
          {children.map(c => (
            <button
              key={c.id}
              type="button"
              className={`btn px-24 py-10 rounded-pill fw-bold shadow-sm ${selectedChildId === c.id ? 'btn-primary' : 'btn-white text-secondary-light border border-neutral-200'}`}
              onClick={() => setSelectedChildId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {selectedChild && (
        <>
          {/* 상단 3컬럼 */}
          <div className="row gy-4 mb-24">

            {/* 자녀 프로필 + 출결 현황 */}
            <div className="col-xl-4 col-md-5">
              <div className="card border-0 shadow-sm p-24 h-100 text-center" style={{ borderRadius: 16 }}>
                <div className="w-120-px h-120-px rounded-circle bg-neutral-200 mx-auto mb-16 d-flex align-items-center justify-content-center text-secondary-light overflow-hidden">
                  {selectedChild.profileImageUrl
                    ? <img src={selectedChild.profileImageUrl} alt={selectedChild.name} className="w-100 h-100 object-fit-cover" />
                    : <i className="ri-user-3-line text-4xl" />
                  }
                </div>
                <h4 className="fw-bold mb-4">{selectedChild.name}</h4>
                <p className="text-secondary-light text-sm mb-12">
                  {selectedChild.grade && <>{selectedChild.grade}학년 </>}
                  {selectedChild.classNum && <>{selectedChild.classNum}반 </>}
                  {selectedChild.attendanceNum && <>{selectedChild.attendanceNum}번</>}
                </p>
                {/* [woo] 오늘 출결 상태 뱃지 - 출결 데이터 기반 */}
                {(() => {
                  const summary = attendanceMap[selectedChild.studentInfoId]
                  const total = summary?.totalDays ?? 0
                  if (total === 0) return <span className="badge bg-neutral-300 px-16 py-6 rounded-pill fs-13 mx-auto mb-24">미등록</span>
                  return <span className="badge bg-success-600 px-16 py-6 rounded-pill fs-13 mx-auto mb-24">출결 {total}일 기록</span>
                })()}

                {/* [woo] 출결 현황 서클 - API 연동 */}
                <div className="border-top pt-20">
                  <h6 className="fw-bold mb-20 text-sm text-start">
                    <i className="ri-checkbox-circle-line text-success-600 me-2" />출결 현황
                  </h6>
                  {(() => {
                    const summary = attendanceMap[selectedChild.studentInfoId]
                    const counts = summary?.statusCounts ?? {}
                    return (
                      <div className="d-flex justify-content-around text-center">
                        {[
                          { label: '출석', color: 'bg-success-600', key: 'PRESENT' },
                          { label: '지각', color: 'bg-warning-main', key: 'LATE' },
                          { label: '결석', color: 'bg-danger-main', key: 'ABSENT' },
                        ].map(item => (
                          <div key={item.label}>
                            <div className={`w-56-px h-56-px rounded-circle ${item.color} d-flex align-items-center justify-content-center mx-auto mb-8`}>
                              <span className="text-white fw-bold fs-18">{counts[item.key] ?? 0}</span>
                            </div>
                            <span className="text-xs text-secondary-light">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* 오늘의 시간표 */}
            <div className="col-xl-4 col-md-7">
              <div className="card border-0 shadow-sm h-100 overflow-hidden" style={{ borderRadius: 16 }}>
                <div className="p-16 border-bottom">
                  <h6 className="fw-bold mb-0 text-sm">
                    <i className="ri-time-line text-primary-600 me-2" />오늘의 시간표 {timetable.length > 0 && `(${timetable.length}교시)`}
                  </h6>
                </div>
                <div className="p-16">
                  {timetableLoading ? (
                    <p className="text-secondary-light text-sm text-center py-16 mb-0">시간표를 불러오는 중...</p>
                  ) : timetable.length > 0 ? timetable.map((s, i) => (
                    <div key={s.period}
                      className={`p-10 bg-neutral-50 rounded-8 d-flex justify-content-between align-items-center${i < timetable.length - 1 || todayEvents.length > 0 ? ' mb-8' : ''}`}>
                      <span className="text-sm fw-bold">{s.period}교시</span>
                      <span className="fw-medium text-dark text-sm">{s.subject}</span>
                    </div>
                  )) : (
                    <p className="text-secondary-light text-sm mb-0 py-20 text-center">오늘 시간표 정보가 없습니다.</p>
                  )}
                  {/* [woo] 오늘의 학사일정 (NEIS) - 시간표 아래 */}
                  {todayEvents.map((evt, i) => {
                    const colorMap: Record<string, string> = {
                      HOLIDAY: '#ffc107', EXAM: '#dc3545', EVENT: '#0d6efd', ACADEMIC: '#198754', ETC: '#6c757d',
                    }
                    const color = colorMap[evt.eventType] ?? '#6c757d'
                    return (
                      <div key={i}
                        className={`p-10 rounded-8 d-flex justify-content-between align-items-center${i < todayEvents.length - 1 ? ' mb-8' : ''}`}
                        style={{ background: color + '15', border: `1px solid ${color}50` }}>
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
                </div>
              </div>
            </div>

            {/* 학교 일정 - [woo] NEIS API 연동 */}
            <div className="col-xl-4 col-md-12">
              <NeisEventsWidget />
            </div>
          </div>

          {/* 하단: 가정통신문 + 오늘의 급식 */}
          <div className="row gy-4 mb-24">
            <div className="col-xl-8">
              <div className="card border-0 shadow-sm p-20" style={{ borderRadius: 16 }}>
                <h6 className="fw-bold mb-20 text-sm">
                  <i className="ri-file-list-3-line text-primary-600 me-2" />가정통신문
                </h6>
                {boards.length > 0 ? boards.map((b, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between py-12 border-bottom border-neutral-100">
                    <div className="d-flex align-items-center gap-12">
                      <i className="ri-file-text-line text-secondary-light" />
                      <div>
                        <p className="text-sm mb-1 fw-medium">{b.title}</p>
                        {b.writerName && <span className="text-xs text-secondary-light">{b.writerName}</span>}
                      </div>
                    </div>
                    {b.createDate && <span className="text-xs text-secondary-light flex-shrink-0">{b.createDate.slice(0, 10)}</span>}
                  </div>
                )) : (
                  <p className="text-secondary-light text-sm mb-0">등록된 가정통신문이 없습니다.</p>
                )}
              </div>
            </div>

            <div className="col-xl-4">
              <div className="card border-0 shadow-sm p-20 h-100" style={{ borderRadius: 16 }}>
                <h6 className="fw-bold mb-16 text-sm">
                  <i className="ri-restaurant-line text-success-600 me-2" />오늘의 급식
                </h6>
                {meals.length > 0 ? meals.map((meal, i) => (
                  <div key={i} className={i < meals.length - 1 ? 'mb-16' : ''}>
                    <span className={`badge ${MEAL_TYPE_CLASS[meal.mealType] ?? 'bg-neutral-100 text-secondary-light'} px-10 py-4 radius-4 fw-medium text-xs mb-8`}>
                      {MEAL_TYPE_LABEL[meal.mealType] ?? meal.mealType}
                    </span>
                    <p className="text-sm mb-4" style={{ whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>{meal.menu}</p>
                    <span className="text-xs text-secondary-light">칼로리: {meal.calories != null ? `${meal.calories}kcal` : '정보없음'}</span>
                  </div>
                )) : (
                  <p className="text-secondary-light text-sm mb-0">오늘 등록된 급식이 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* [soojin] 하단: 학급 알림장 - 추후 API 연동 예정, 현재 공란 */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm p-20" style={{ borderRadius: 16 }}>
                <h6 className="fw-bold mb-20 text-sm">
                  <i className="ri-notification-3-line text-warning-main me-2" />학급 알림장
                </h6>
                <p className="text-secondary-light text-sm mb-0 py-8 text-center">
                  알림장 데이터가 아직 등록되지 않았습니다.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
