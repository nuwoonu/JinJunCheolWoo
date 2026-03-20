import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import NeisEventsWidget from "@/components/NeisEventsWidget";
import ClassNotebookWidget from "@/components/teacher/ClassNotebookWidget";

// [soojin] 학부모 자녀현황 - soojin/mychildren/status.html 마이그레이션
// 레이아웃: 상단 3컬럼(프로필+출결 | 시간표 | 학교일정) + 하단 2컬럼(가정통신문 | 급식) + 알림장

interface Child {
  id: number;
  studentInfoId: number; // [woo] 출결 조회용
  name: string;
  grade?: number;
  classNum?: number;
  attendanceNum?: number;
  profileImageUrl?: string;
}

interface Board {
  title: string;
  createDate?: string;
  writerName?: string;
}

interface CalendarEvent {
  title: string;
  startDate: string;
  endDate: string;
  eventType: string;
  dday: number;
  dateRangeText: string;
}

interface Meal {
  mealType: string;
  menu: string;
  calories?: number;
}

interface TimetableItem {
  period: number;
  subject: string;
}

interface ParentDashboardData {
  children?: Child[];
  boards?: Board[];
}

const MOCK_BOARDS: Board[] = [
  { title: "3월 가정통신문 안내", writerName: "담임", createDate: "2026-03-18" },
  { title: "학교 폭력 예방 교육 안내", writerName: "담임", createDate: "2026-03-15" },
  { title: "2026학년도 학사일정 안내", writerName: "교무", createDate: "2026-03-10" },
];

const MOCK_PARENT_POSTS: Board[] = [
  { title: "3월 학급 사진 공유드립니다", writerName: "담임", createDate: "2026-03-18" },
  { title: "이번 주 학습 안내 말씀드려요", writerName: "학부모", createDate: "2026-03-16" },
  { title: "3월 학부모 모임 공지", writerName: "학부모회", createDate: "2026-03-12" },
];

function isNew(dateStr: string) {
  return new Date().getTime() - new Date(dateStr).getTime() < 3 * 24 * 60 * 60 * 1000;
}

// [woo] 학부모 자녀 출결 통계 타입
interface AttendanceSummary {
  childName: string;
  studentInfoId: number;
  statusCounts: Record<string, number>;
  totalDays: number;
}

export default function ParentChildrenStatus() {
  const location = useLocation();
  const [children, setChildren] = useState<Child[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(
    (location.state as { childId?: number } | null)?.childId ?? null,
  );
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [timetableLoading, setTimetableLoading] = useState(false);
  // [woo] 출결 통계 state
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceSummary>>({});

  useEffect(() => {
    api
      .get("/dashboard/parent")
      .then((res) => {
        const d: ParentDashboardData = res.data;
        setChildren(d.children ?? []);
        setBoards(d.boards ?? []);
        if (d.children && d.children.length > 0) {
          const fromState = (location.state as { childId?: number } | null)?.childId;
          const valid = fromState && d.children.some((c) => c.id === fromState);
          const resolvedId = valid ? fromState : d.children[0].id;
          setSelectedChildId(resolvedId);
          sessionStorage.setItem("selectedChildId", String(resolvedId));
        }
      })
      .catch(() => {});

    // [woo] 오늘의 학사일정 (NEIS) - 오늘 날짜만 필터
    const now = new Date();
    fetch(`/api/calendar/events?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CalendarEvent[]) => {
        const todayStr = now.toISOString().slice(0, 10);
        setTodayEvents(data.filter((e) => e.startDate === todayStr));
      })
      .catch(() => {});

    // [soojin] 오늘의 급식
    const _d = new Date();
    const _pad = (n: number) => String(n).padStart(2, "0");
    const _today = `${_d.getFullYear()}-${_pad(_d.getMonth() + 1)}-${_pad(_d.getDate())}`;
    fetch(`/api/meals/daily?date=${_today}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setMeals)
      .catch(() => {});

    // [woo] 학부모 자녀 출결 요약 API 호출
    const now2 = new Date();
    const startDate = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(now2.getFullYear(), now2.getMonth() + 1, 0).getDate();
    const endDate = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    api
      .get(`/attendance/parent/summary?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => {
        const map: Record<number, AttendanceSummary> = {};
        (res.data as AttendanceSummary[]).forEach((s) => {
          map[s.studentInfoId] = s;
        });
        setAttendanceMap(map);
      })
      .catch(() => {});
  }, []);

  // [woo] 선택된 자녀의 학년/반으로 NEIS 시간표 조회
  useEffect(() => {
    const child = children.find((c) => c.id === selectedChildId) ?? children[0];
    if (!child?.grade || !child?.classNum) return;
    setTimetableLoading(true);
    fetch(`/api/calendar/timetable?grade=${child.grade}&classNum=${child.classNum}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setTimetable(data);
        setTimetableLoading(false);
      })
      .catch(() => setTimetableLoading(false));
  }, [selectedChildId, children]);

  const selectedChild = children.find((c) => c.id === selectedChildId) ?? children[0];

  if (children.length === 0) {
    return (
      <DashboardLayout>
        {/* <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
          <h6 className="fw-semibold mb-0">자녀 현황</h6>
        </div> */}
        <div className="card border-0 p-80 text-center">
          <i className="ri-user-search-line text-5xl text-neutral-300 mb-16" />
          <h5 className="text-secondary-light">등록된 자녀가 없습니다.</h5>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h6 className="fw-semibold mb-0">자녀 현황</h6>
      </div> */}

      {/* [soojin] 자녀 탭 (여러 명일 때) */}
      {children.length > 1 && (
        <div className="d-flex flex-wrap gap-12 mb-24">
          {children.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`btn px-24 py-10 rounded-pill fw-bold shadow-sm ${selectedChildId === c.id ? "btn-primary" : "btn-white text-secondary-light border border-neutral-200"}`}
              onClick={() => {
                setSelectedChildId(c.id);
                sessionStorage.setItem("selectedChildId", String(c.id));
              }}
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
                  {selectedChild.profileImageUrl ? (
                    <img
                      src={selectedChild.profileImageUrl}
                      alt={selectedChild.name}
                      className="w-100 h-100 object-fit-cover"
                    />
                  ) : (
                    <i className="ri-user-3-line text-4xl" />
                  )}
                </div>
                <h4 className="fw-bold mb-4">{selectedChild.name}</h4>
                <p className="text-secondary-light text-sm mb-12">
                  {selectedChild.grade && <>{selectedChild.grade}학년 </>}
                  {selectedChild.classNum && <>{selectedChild.classNum}반 </>}
                  {selectedChild.attendanceNum && <>{selectedChild.attendanceNum}번</>}
                </p>
                {/* [woo] 오늘 출결 상태 뱃지 - 출결 데이터 기반 */}
                {(() => {
                  const summary = attendanceMap[selectedChild.studentInfoId];
                  const total = summary?.totalDays ?? 0;
                  if (total === 0)
                    return (
                      <span className="badge bg-neutral-300 px-16 py-6 rounded-pill fs-13 mx-auto mb-24">
                        출결 기록 없음
                      </span>
                    );
                  return (
                    <span className="badge bg-success-600 px-16 py-6 rounded-pill fs-13 mx-auto mb-24">
                      출결 {total}일 기록
                    </span>
                  );
                })()}

                {/* [woo] 출결 현황 서클 - API 연동 */}
                <div className="border-top pt-20">
                  <h6 className="fw-bold mb-20 text-sm text-start">
                    <i className="ri-checkbox-circle-line text-success-600 me-2" />
                    출결 현황
                  </h6>
                  {(() => {
                    const summary = attendanceMap[selectedChild.studentInfoId];
                    const counts = summary?.statusCounts ?? {};
                    return (
                      <div className="d-flex justify-content-around text-center">
                        {[
                          { label: "출석", color: "bg-success-600", key: "PRESENT" },
                          { label: "지각", color: "bg-warning-main", key: "LATE" },
                          { label: "결석", color: "bg-danger-main", key: "ABSENT" },
                        ].map((item) => (
                          <div key={item.label}>
                            <div
                              className={`w-56-px h-56-px rounded-circle ${item.color} d-flex align-items-center justify-content-center mx-auto mb-8`}
                            >
                              <span className="text-white fw-bold fs-18">{counts[item.key] ?? 0}</span>
                            </div>
                            <span className="text-xs text-secondary-light">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
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
                    <p className="text-secondary-light text-sm mb-0 py-20 text-center">오늘 시간표 정보가 없습니다.</p>
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

          {/* 하단: 가정통신문 + 오늘의 급식 */}
          <div className="row gy-4 mb-24" style={{ minHeight: 320 }}>
            <div className="col-xl-8 d-flex flex-column">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
                <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
                  <h6 className="fw-bold mb-0 text-sm">
                    <i className="ri-file-list-3-line text-primary-600 me-2" />
                    가정통신문
                  </h6>
                  <a href="/board/notice" className="text-primary-600 text-sm" style={{ lineHeight: 1 }}>
                    더보기
                  </a>
                </div>
                <div className="p-16">
                  {/* 기존 UI 주석처리
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
                */}
                  {(() => {
                    const list = boards.length > 0 ? boards : MOCK_BOARDS;
                    return list.map((b, i) => (
                      <div
                        key={i}
                        className={`d-flex align-items-center justify-content-between py-12${i < list.length - 1 ? " border-bottom" : ""}`}
                      >
                        <div className="d-flex align-items-center gap-12">
                          <i className="ri-file-text-line text-secondary-light" />
                          <span className="text-sm" style={{ color: "#374151" }}>
                            {b.title}
                          </span>
                          {b.createDate && isNew(b.createDate) && (
                            <span
                              style={{
                                background: "#25A194",
                                color: "white",
                                borderRadius: 4,
                                padding: "1px 7px",
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              새글
                            </span>
                          )}
                        </div>
                        {b.createDate && (
                          <span className="text-xs text-secondary-light flex-shrink-0 ms-8">
                            {b.createDate.slice(0, 10)}
                          </span>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="col-xl-4 d-flex flex-column">
              <div className="card border-0 shadow-sm d-flex flex-column h-100" style={{ borderRadius: 16 }}>
                {/* 헤더 */}
                <div className="p-16 border-bottom">
                  <h6 className="fw-bold mb-0 text-sm">
                    <i className="ri-restaurant-line text-primary-600 me-2" />
                    오늘의 급식
                  </h6>
                </div>
                {/* 본문: 세로 중앙 정렬 */}
                <div className="d-flex flex-column align-items-center justify-content-center p-20" style={{ flex: 1 }}>
                  {(() => {
                    const meal = meals[0];
                    const menu = meal?.menu ?? "잡곡밥, 미역국, 제육볶음, 배추김치, 과일";
                    const calories = meal?.calories ?? 646;
                    return (
                      <>
                        <p className="text-sm mb-12 text-center" style={{ color: "#374151", lineHeight: 1.7 }}>
                          {menu}
                        </p>
                        <span
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "center",
                            background: "#25A194",
                            color: "white",
                            borderRadius: 20,
                            padding: "5px 0",
                            fontSize: 12,
                            fontWeight: 500,
                            marginBottom: 16,
                          }}
                        >
                          칼로리: {calories}kcal
                        </span>
                        <div
                          style={{
                            width: "100%",
                            height: 110,
                            borderRadius: 10,
                            background: "#f3f4f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <i className="ri-image-line" style={{ fontSize: 32, color: "#9ca3af" }} />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* [soojin] 하단: 학급 알림장 - 추후 API 연동 예정, 현재 공란 */}
          {/* <div className="row">
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
          </div> */}

          {/* 3행: 학급 알림장 (col-6) | 학부모 게시판 (col-6) */}
          <div className="row gy-4">
            <div className="col-xl-6 d-flex flex-column">
              <ClassNotebookWidget classroomId={null} readonly moreHref="/board/notebook" />
            </div>
            <div className="col-xl-6 d-flex flex-column">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
                <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
                  <h6 className="fw-bold mb-0 text-sm">
                    <i className="ri-parent-line text-primary-600 me-2" />
                    학부모 게시판
                  </h6>
                  <a href="/board/parent" className="text-primary-600 text-sm" style={{ lineHeight: 1 }}>
                    더보기
                  </a>
                </div>
                <div className="p-16">
                  {/* 기존: 빈 상태 표시
                  <p className="text-secondary-light text-sm mb-0 text-center py-20">
                    등록된 게시글이 없습니다.
                  </p>
                  */}
                  {MOCK_PARENT_POSTS.map((b, i) => (
                    <div
                      key={i}
                      className={`d-flex align-items-center justify-content-between py-12${i < MOCK_PARENT_POSTS.length - 1 ? " border-bottom" : ""}`}
                    >
                      <div className="d-flex align-items-center gap-12">
                        <i className="ri-file-text-line text-secondary-light" />
                        <span className="text-sm" style={{ color: "#374151" }}>
                          {b.title}
                        </span>
                        {b.createDate && isNew(b.createDate) && (
                          <span
                            style={{
                              background: "#25A194",
                              color: "white",
                              borderRadius: 4,
                              padding: "1px 7px",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            새글
                          </span>
                        )}
                      </div>
                      {b.createDate && (
                        <span className="text-xs text-secondary-light flex-shrink-0 ms-8">
                          {b.createDate.slice(0, 10)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
