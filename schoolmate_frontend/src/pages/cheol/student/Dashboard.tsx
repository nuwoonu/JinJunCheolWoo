import { useEffect, useState } from "react";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import NeisEventsWidget from "@/components/NeisEventsWidget";
import { getTodayMeal, type MealInfo } from "@/api/mealCache";

// [cheol] 학생 대시보드 - cheol/student-dashboard.html 마이그레이션

// [woo] 출결 현황 표시용 상수
const STATUS_LABELS: Record<string, string> = {
  PRESENT: '출석',
  ABSENT: '결석',
  LATE: '지각',
  EARLY_LEAVE: '조퇴',
  SICK: '병결',
}

const STATUS_BADGE: Record<string, string> = {
  PRESENT: 'bg-success-100 text-success-600',
  ABSENT: 'bg-danger-100 text-danger-600',
  LATE: 'bg-warning-100 text-warning-600',
  EARLY_LEAVE: 'bg-info-100 text-info-600',
  SICK: 'bg-neutral-200 text-neutral-600',
}

interface AttendanceSummary {
  PRESENT?: number
  ABSENT?: number
  LATE?: number
  EARLY_LEAVE?: number
  SICK?: number
  totalDays?: number
}

interface Notice {
  nno?: number;
  title: string;
  content?: string;
  createDate?: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  startDate: string;
  eventType: string;
  dday: number;
  dateRangeText: string;
}

interface StudentInfo {
  userName?: string;
  year?: number;
  classNum?: number;
  studentNumber?: number;
  status?: string;
}

interface DashboardData {
  student?: StudentInfo;
  profileImageUrl?: string;
  notices?: Notice[];
}

interface TimetableItem {
  period: number;
  subject: string;
}

interface DiaryItem {
  id: number;
  title: string;
  createDate: string;
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData>({});
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [timetableLoading, setTimetableLoading] = useState(true);
  // [woo] 출결 현황
  const [attendance, setAttendance] = useState<AttendanceSummary>({});
  const [meal, setMeal] = useState<MealInfo | null>(null);
  const [diary, setDiary] = useState<DiaryItem[]>([]);

  useEffect(() => {
    api
      .get("/dashboard/student")
      .then((res) => {
        setData(res.data);
        const s = res.data?.student;

        // NEIS 시간표 조회
        if (s?.year && s?.classNum) {
          api.get(`/calendar/timetable?grade=${s.year}&classNum=${s.classNum}`)
            .then((r) => { setTimetable(r.data ?? []); setTimetableLoading(false); })
            .catch(() => setTimetableLoading(false));
        } else {
          setTimetableLoading(false);
        }

        // 학급 알림장 조회 (classroomId 기반)
        if (s?.classroomId) {
          api.get(`/board/class-diary/${s.classroomId}?page=0&size=5`)
            .then((r) => setDiary(r.data?.content ?? []))
            .catch(() => {});
        }
      })
      .catch(() => setTimetableLoading(false));

    // [woo] 학생 본인 출결 현황 조회
    api
      .get('/attendance/my/summary')
      .then((res) => setAttendance(res.data))
      .catch(() => setAttendance({}));

    // 급식 캐시 조회
    getTodayMeal().then(setMeal).catch(() => {});

    // [woo] 오늘의 학사일정 (NEIS) - 이번달 일정에서 오늘 날짜만 필터
    const now = new Date();
    api.get(`/calendar/events?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then((r) => {
        const todayStr = now.toISOString().slice(0, 10);
        setTodayEvents((r.data as CalendarEvent[]).filter((e) => e.startDate === todayStr));
      })
      .catch(() => {});
  }, []);

  // [woo] profileImageUrl, statusLabel → 사이드바로 이동
  const { student, notices = [] } = data;

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학생 대시보드</h6>
          {student && (
            <p className="text-neutral-600 mt-4 mb-0">
              어서오세요,{" "}
              <span className="fw-medium">
                {student.year}학년 {student.classNum}반 {student.userName}
              </span>
              님
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
            {/* [woo] 출결 현황 카드 */}
            <div className="col-xl-4 col-md-5">
              <div className="card border-0 shadow-sm p-24 h-100" style={{ borderRadius: 16 }}>
                <h6 className="fw-bold mb-16 text-sm">
                  <i className="ri-calendar-check-line text-primary-600 me-2" />
                  이번 달 출결 현황
                </h6>
                {attendance.totalDays != null && attendance.totalDays > 0 ? (
                  <>
                    <div className="d-flex flex-wrap gap-8 mb-12">
                      {Object.entries(STATUS_LABELS).map(([key, label]) => {
                        const count = (attendance as Record<string, number>)[key] ?? 0;
                        if (count === 0) return null;
                        return (
                          <div key={key} className="text-center">
                            <span className={`badge px-10 py-4 radius-4 text-xs fw-medium ${STATUS_BADGE[key]}`}>
                              {label}
                            </span>
                            <div className="fw-semibold mt-4">{count}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-sm text-secondary-light">
                      총 {attendance.totalDays}일 기록
                    </div>
                  </>
                ) : (
                  <p className="text-secondary-light text-sm text-center py-16 mb-0">
                    출결 기록이 없습니다.
                  </p>
                )}
              </div>
            </div>

            {/* 오늘의 시간표 */}
            <div className="col-xl-4 col-md-7">
              <div className="card border-0 shadow-sm h-100 overflow-hidden" style={{ borderRadius: 16 }}>
                <div className="p-16 border-bottom">
                  <h6 className="fw-bold mb-0 text-sm">
                    <i className="ri-time-line text-primary-600 me-2" />
                    오늘의 시간표 {timetable.length > 0 && `(${timetable.length}교시)`}
                  </h6>
                </div>
                <div className="p-16">
                  {/* [woo] NEIS 시간표 - 학년/반 기준 */}
                  {timetableLoading ? (
                    <p className="text-secondary-light text-sm text-center py-16 mb-0">시간표를 불러오는 중...</p>
                  ) : timetable.length > 0 ? (
                    timetable.map((s, i) => (
                      <div
                        key={s.period}
                        className={`p-10 bg-neutral-50 rounded-8 d-flex justify-content-between align-items-center${i < timetable.length - 1 || todayEvents.length > 0 ? " mb-8" : ""}`}
                      >
                        <span className="text-sm fw-bold">{s.period}교시</span>
                        <span className="fw-medium text-dark text-sm">{s.subject}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-secondary-light text-sm text-center py-16 mb-0">오늘 시간표 정보가 없습니다.</p>
                  )}
                  {/* [woo] 오늘의 학사일정 (NEIS) - 시간표 아래 */}
                  {todayEvents.map((evt, i) => {
                    const colorMap: Record<string, string> = {
                      HOLIDAY: "#ffc107",
                      EXAM: "#dc3545",
                      EVENT: "#0d6efd",
                      ACADEMIC: "#198754",
                      ETC: "#6c757d",
                    };
                    const color = colorMap[evt.eventType] ?? "#6c757d";
                    return (
                      <div
                        key={i}
                        className={`p-10 rounded-8 d-flex justify-content-between align-items-center${i < todayEvents.length - 1 ? " mb-8" : ""}`}
                        style={{ background: color + "15", border: `1px solid ${color}50` }}
                      >
                        <span className="text-sm fw-medium" style={{ color }}>
                          <i className="ri-calendar-event-fill me-8" />
                          {evt.title}
                        </span>
                        <span
                          className="badge text-white text-xs px-8 py-4 rounded-pill"
                          style={{ background: color, flexShrink: 0 }}
                        >
                          학사일정
                        </span>
                      </div>
                    );
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
                    <i className="ri-notification-badge-line text-primary-600 me-2" />
                    공지사항
                  </h6>
                  <a href="/student/notice/list" className="text-primary-600 text-sm">
                    더보기
                  </a>
                </div>
                {notices.length > 0 ? (
                  notices.map((n, i) => (
                    <div
                      key={n.nno ?? i}
                      className={`d-flex align-items-center justify-content-between py-12${i < notices.length - 1 ? " border-bottom" : ""}`}
                    >
                      <div className="d-flex align-items-center gap-12">
                        <i className="ri-file-text-line text-secondary-light" />
                        <span className="text-sm text-primary-light">{n.title}</span>
                      </div>
                      <span className="text-xs text-secondary-light">{n.createDate?.slice(0, 10)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-secondary-light text-sm py-20">등록된 공지사항이 없습니다.</div>
                )}
              </div>
            </div>

            {/* 오늘의 급식 */}
            <div className="col-xl-4">
              <div className="card border-0 shadow-sm p-20 h-100" style={{ borderRadius: 16 }}>
                <div className="d-flex align-items-center justify-content-between mb-16">
                  <h6 className="fw-bold mb-0 text-sm">
                    <i className="ri-restaurant-2-line text-primary-600 me-2" />
                    오늘의 급식
                  </h6>
                  {meal?.mealType && (
                    <span className="badge bg-primary-100 text-primary-600 px-8 py-4 rounded-pill text-xs">
                      {meal.mealType}
                    </span>
                  )}
                </div>
                {meal ? (
                  <>
                    <p className="text-sm mb-12" style={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                      {meal.menu}
                    </p>
                    {meal.calories && (
                      <span className="badge bg-primary-100 text-primary-600 px-8 py-4 rounded-pill text-xs">
                        칼로리: {meal.calories} kcal
                      </span>
                    )}
                  </>
                ) : (
                  <p className="text-secondary-light text-sm">급식 정보가 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* 하단: 학급 알림장 */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm p-20" style={{ borderRadius: 16 }}>
                <h6 className="fw-bold mb-20 text-sm">
                  <i className="ri-notification-3-line text-warning-main me-2" />
                  학급 알림장
                </h6>
                {diary.length > 0 ? (
                  diary.map((item, i) => (
                    <div
                      key={item.id}
                      className={`d-flex align-items-center justify-content-between py-12${i < diary.length - 1 ? " border-bottom" : ""}`}
                    >
                      <div className="d-flex align-items-center gap-12">
                        <i className="ri-notification-line text-secondary-light" />
                        <span className="text-sm">{item.title}</span>
                      </div>
                      <span className="text-xs text-secondary-light">{item.createDate?.slice(0, 10)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-secondary-light text-sm py-20">등록된 알림장이 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
