import { useEffect, useState } from 'react'
import api from '@/api/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import NeisEventsWidget from '@/components/NeisEventsWidget'

// [cheol] 학생 대시보드 - cheol/student-dashboard.html 마이그레이션

const STATUS_LABEL: Record<string, string> = {
  PENDING: '승인대기', ENROLLED: '재학', LEAVE_OF_ABSENCE: '휴학',
  DROPOUT: '자퇴', EXPELLED: '제적', GRADUATED: '졸업', TRANSFERRED: '전학',
}

interface Notice {
  nno?: number
  title: string
  content?: string
  createDate?: string
}

interface CalendarEvent {
  id: number
  title: string
  startDate: string
  eventType: string
  dday: number
  dateRangeText: string
}

interface StudentInfo {
  userName?: string
  year?: number
  classNum?: number
  studentNumber?: number
  status?: string
}

interface DashboardData {
  student?: StudentInfo
  profileImageUrl?: string
  notices?: Notice[]
}

interface TimetableItem {
  period: number
  subject: string
}

// [cheol] 학급 알림장 (고정 데이터)
const CLASS_DIARY = [
  { text: '내일 수학 퀴즈 있습니다', date: '2026-01-26' },
  { text: '체육복 준비해오세요', date: '2026-01-25' },
  { text: '과학 실험 준비물 확인', date: '2026-01-24' },
]

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData>({})
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([])
  const [timetable, setTimetable] = useState<TimetableItem[]>([])
  const [timetableLoading, setTimetableLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/student').then(res => {
      setData(res.data)
      // [woo] 학생 정보 로드 후 NEIS 시간표 조회
      const s = res.data?.student
      if (s?.year && s?.classNum) {
        fetch(`/api/calendar/timetable?grade=${s.year}&classNum=${s.classNum}`)
          .then(r => r.ok ? r.json() : [])
          .then(data => { setTimetable(data); setTimetableLoading(false) })
          .catch(() => setTimetableLoading(false))
      } else {
        setTimetableLoading(false)
      }
    }).catch(() => setTimetableLoading(false))

    // [woo] 오늘의 학사일정 (NEIS) - 이번달 일정에서 오늘 날짜만 필터
    const now = new Date()
    fetch(`/api/calendar/events?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: CalendarEvent[]) => {
        const todayStr = now.toISOString().slice(0, 10)
        setTodayEvents(data.filter(e => e.startDate === todayStr))
      })
      .catch(() => {})
  }, [])

  const { student, profileImageUrl, notices = [] } = data
  const statusLabel = student?.status ? (STATUS_LABEL[student.status] ?? student.status) : '재학'

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학생 대시보드</h6>
          {student && (
            <p className="text-neutral-600 mt-4 mb-0">
              어서오세요, <span className="fw-medium">{student.year}학년 {student.classNum}반 {student.userName}</span>님
            </p>
          )}
        </div>
      </div>

      {!student ? (
        <div className="card border-0 shadow-sm p-80 text-center" style={{ borderRadius: 16 }}>
          <i className="ri-user-search-line text-secondary-light mb-16" style={{ fontSize: 48 }} />
          <h5 className="text-secondary-light">학생 정보를 불러올 수 없습니다.</h5>
        </div>
      ) : (
        <>
          {/* 상단 3개 카드 */}
          <div className="row gy-4 mb-24">

            {/* 학생 프로필 카드 */}
            <div className="col-xl-4 col-md-5">
              <div className="card border-0 shadow-sm p-24 h-100 text-center" style={{ borderRadius: 16 }}>
                {/* 프로필 이미지 */}
                <div className="w-120-px h-120-px rounded-circle mx-auto mb-16 overflow-hidden border border-4 border-white shadow-sm">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="프로필" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="w-100 h-100 bg-primary-100 d-flex align-items-center justify-content-center">
                      <i className="ri-user-3-line text-primary-600" style={{ fontSize: 48 }} />
                    </div>
                  )}
                </div>
                <h4 className="fw-bold mb-4">{student.userName}</h4>
                <p className="text-secondary-light text-sm mb-12">
                  {student.year}학년 {student.classNum}반 {student.studentNumber}번
                </p>
                <span className="badge bg-success-600 px-16 py-6 rounded-pill fs-13 mx-auto mb-24">
                  {statusLabel}
                </span>

                {/* 출결 현황 */}
                <div className="border-top pt-20">
                  <h6 className="fw-bold mb-20 text-sm text-start">
                    <i className="ri-checkbox-circle-line text-success-600 me-2" />출결 현황
                  </h6>
                  <div className="d-flex justify-content-around text-center">
                    <div>
                      <div className="w-56-px h-56-px rounded-circle bg-success-600 d-flex align-items-center justify-content-center mx-auto mb-8">
                        <span className="text-white fw-bold fs-18">20</span>
                      </div>
                      <span className="text-xs text-secondary-light">출석</span>
                    </div>
                    <div>
                      <div className="w-56-px h-56-px rounded-circle bg-warning-main d-flex align-items-center justify-content-center mx-auto mb-8">
                        <span className="text-white fw-bold fs-18">1</span>
                      </div>
                      <span className="text-xs text-secondary-light">지각</span>
                    </div>
                    <div>
                      <div className="w-56-px h-56-px rounded-circle bg-danger-main d-flex align-items-center justify-content-center mx-auto mb-8">
                        <span className="text-white fw-bold fs-18">0</span>
                      </div>
                      <span className="text-xs text-secondary-light">결석</span>
                    </div>
                  </div>
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
                  {/* [woo] NEIS 시간표 - 학년/반 기준 */}
                  {timetableLoading ? (
                    <p className="text-secondary-light text-sm text-center py-16 mb-0">시간표를 불러오는 중...</p>
                  ) : timetable.length > 0 ? timetable.map((s, i) => (
                    <div key={s.period}
                      className={`p-10 bg-neutral-50 rounded-8 d-flex justify-content-between align-items-center${i < timetable.length - 1 || todayEvents.length > 0 ? ' mb-8' : ''}`}>
                      <span className="text-sm fw-bold">{s.period}교시</span>
                      <span className="fw-medium text-dark text-sm">{s.subject}</span>
                    </div>
                  )) : (
                    <p className="text-secondary-light text-sm text-center py-16 mb-0">오늘 시간표 정보가 없습니다.</p>
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

          {/* 중단: 공지사항 + 오늘의 급식 */}
          <div className="row gy-4 mb-24">
            {/* 공지사항 */}
            <div className="col-xl-8">
              <div className="card border-0 shadow-sm p-20" style={{ borderRadius: 16 }}>
                <div className="d-flex justify-content-between align-items-center mb-20">
                  <h6 className="fw-bold mb-0 text-sm">
                    <i className="ri-notification-badge-line text-primary-600 me-2" />공지사항
                  </h6>
                  <a href="/student/notice/list" className="text-primary-600 text-sm">더보기</a>
                </div>
                {notices.length > 0 ? notices.map((n, i) => (
                  <div key={n.nno ?? i}
                    className={`d-flex align-items-center justify-content-between py-12${i < notices.length - 1 ? ' border-bottom' : ''}`}>
                    <div className="d-flex align-items-center gap-12">
                      <i className="ri-file-text-line text-secondary-light" />
                      <span className="text-sm text-primary-light">{n.title}</span>
                    </div>
                    <span className="text-xs text-secondary-light">
                      {n.createDate?.slice(0, 10)}
                    </span>
                  </div>
                )) : (
                  <div className="text-center text-secondary-light text-sm py-20">
                    등록된 공지사항이 없습니다.
                  </div>
                )}
              </div>
            </div>

            {/* 오늘의 급식 */}
            <div className="col-xl-4">
              <div className="card border-0 shadow-sm p-20 h-100" style={{ borderRadius: 16 }}>
                <h6 className="fw-bold mb-20 text-sm">
                  <i className="ri-restaurant-2-line text-primary-600 me-2" />오늘의 급식
                </h6>
                <p className="text-sm mb-12">잡곡밥, 미역국, 제육볶음, 배추김치, 과일</p>
                <span className="badge bg-primary-100 text-primary-600 px-8 py-4 rounded-pill text-xs">
                  칼로리: 645kcal
                </span>
              </div>
            </div>
          </div>

          {/* 하단: 학급 알림장 */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm p-20" style={{ borderRadius: 16 }}>
                <h6 className="fw-bold mb-20 text-sm">
                  <i className="ri-notification-3-line text-warning-main me-2" />학급 알림장
                </h6>
                {CLASS_DIARY.map((item, i) => (
                  <div key={i}
                    className={`d-flex align-items-center justify-content-between py-12${i < CLASS_DIARY.length - 1 ? ' border-bottom' : ''}`}>
                    <div className="d-flex align-items-center gap-12">
                      <i className="ri-notification-line text-secondary-light" />
                      <span className="text-sm">{item.text}</span>
                    </div>
                    <span className="text-xs text-secondary-light">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
