import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MiniCalendar from "@/components/MiniCalendar";
import NeisEventsWidget from "@/components/NeisEventsWidget";

// [soojin] /school/schedule - 학교 일정 (NEIS 연동 / 목록↔달력 토글)
// [soojin] 기존: MiniCalendar + NeisEventsWidget 고정 표시
// [soojin] 변경: 기본 목록 보기(테이블), 버튼 클릭 시 달력 보기(MiniCalendar) 토글

interface CalendarEvent {
  title: string;
  startDate: string;
  endDate: string;
  eventType: string;
  targetGrade: number | null;
  description: string;
  dday: number;
  dateRangeText: string;
}

// [soojin] 유형 라벨 (NEIS eventType → 한글)
const EVENT_TYPE_LABEL: Record<string, string> = {
  HOLIDAY: "공휴일",
  EXAM: "시험",
  EVENT: "행사",
  ACADEMIC: "학사일정",
  ETC: "기타",
};

// [soojin] 유형별 뱃지 색상 (행 색상 없이 뱃지에만 적용)
const EVENT_TYPE_COLOR: Record<string, { bg: string; text: string }> = {
  HOLIDAY: { bg: "#ffc107", text: "#000" },
  EXAM: { bg: "#dc3545", text: "#fff" },
  EVENT: { bg: "#0d6efd", text: "#fff" },
  ACADEMIC: { bg: "#198754", text: "#fff" },
  ETC: { bg: "#6c757d", text: "#fff" },
};

export default function SchoolSchedule() {
  const today = new Date();

  // [soojin] 목록/달력 토글 상태 (기본: 목록)
  const [view, setView] = useState<"list" | "calendar">("list");

  // [soojin] 조회 년/월 상태 (기본: 이번 달)
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-based

  // [soojin] NEIS API 응답 이벤트 목록
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // [soojin] 필터 입력 상태 (조회 버튼 클릭 전)
  const [filterGrade, setFilterGrade] = useState("");
  const [filterType, setFilterType] = useState("");

  // [soojin] 실제 적용된 필터 상태 (조회 버튼 클릭 시 반영)
  const [appliedGrade, setAppliedGrade] = useState("");
  const [appliedType, setAppliedType] = useState("");

  // [soojin] 년/월 변경 시 NEIS API 재조회
  useEffect(() => {
    fetch(`/api/calendar/events?year=${year}&month=${month}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [year, month]);

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  }

  // [soojin] 조회 버튼 클릭 시 appliedGrade/appliedType에 반영
  function handleSearch() {
    setAppliedGrade(filterGrade);
    setAppliedType(filterType);
  }

  // [soojin] targetGrade가 null(전체)인 일정은 학년 필터 무관하게 항상 표시
  const filtered = events.filter((e) => {
    if (appliedGrade && e.targetGrade != null && String(e.targetGrade) !== appliedGrade) return false;
    if (appliedType && e.eventType !== appliedType) return false;
    return true;
  });

  return (
    <DashboardLayout>
      {/* breadcrumb - 기존 유지 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학교 일정</h6>
          <p className="text-neutral-600 mt-4 mb-0">NEIS 연동 학사 일정</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">학교 일정</li>
        </ul>
      </div>

      {/* [soojin] 기존 row 2컬럼 레이아웃 → 단일 카드로 변경 */}
      <div className="card border-0 shadow-sm">
        {/* [soojin] 카드 헤더: 타이틀 + 목록/달력 토글 버튼 */}
        <div className="card-header bg-white p-20 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">
            <i className={`${view === "list" ? "ri-list-check" : "ri-calendar-2-line"} me-8`} />
            학교 일정 {view === "list" ? "목록" : "달력"}
          </h5>
          <div className="d-flex gap-8">
            <button
              className={`btn btn-sm ${view === "list" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setView("list")}
            >
              <i className="ri-list-check me-4" />
              목록
            </button>
            <button
              className={`btn btn-sm ${view === "calendar" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setView("calendar")}
            >
              <i className="ri-calendar-2-line me-4" />
              달력
            </button>
          </div>
        </div>

        <div className="card-body p-20">
          {view === "list" ? (
            <>
              {/* [soojin] 필터: 년/월 중앙 / 학년·유형·조회 왼쪽 정렬 */}
              <div className="bg-light rounded-8 py-16 px-20 mb-20">
                {/* 년/월 네비게이션 - 중앙 */}
                <div className="d-flex align-items-center justify-content-center gap-8 mb-12">
                  <button className="btn btn-sm btn-outline-secondary px-12" onClick={prevMonth}>
                    ‹
                  </button>
                  <span className="fw-semibold" style={{ minWidth: 90, textAlign: "center", fontSize: 32 }}>
                    {year}년 {month}월
                  </span>
                  <button className="btn btn-sm btn-outline-secondary px-12" onClick={nextMonth}>
                    ›
                  </button>
                </div>
                {/* 학년 · 유형 · 조회 - 오른쪽 */}
                <div className="d-flex align-items-center justify-content-end gap-12">
                  <div className="d-flex align-items-center gap-8">
                    <label className="text-sm fw-medium mb-0 text-nowrap">학년</label>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 100 }}
                      value={filterGrade}
                      onChange={(e) => setFilterGrade(e.target.value)}
                    >
                      <option value="">전체</option>
                      <option value="1">1학년</option>
                      <option value="2">2학년</option>
                      <option value="3">3학년</option>
                    </select>
                  </div>
                  <div className="d-flex align-items-center gap-8">
                    <label className="text-sm fw-medium mb-0 text-nowrap">유형</label>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 110 }}
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="">전체</option>
                      {Object.entries(EVENT_TYPE_LABEL).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn-sm btn-primary px-16" onClick={handleSearch}>
                    조회
                  </button>
                </div>
              </div>

              {/* [soojin] 일정 목록 테이블 (행 색상 없음, 유형 뱃지에만 색상 적용) */}
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>기간</th>
                      <th>D-Day</th>
                      <th>유형</th>
                      <th>제목</th>
                      <th>대상</th>
                      <th>설명</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-32 text-secondary-light">
                          등록된 일정이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((evt, i) => {
                        const typeStyle = EVENT_TYPE_COLOR[evt.eventType] ?? { bg: "#6c757d", text: "#fff" };
                        const ddayText =
                          evt.dday === 0 ? "D-DAY" : evt.dday > 0 ? `D-${evt.dday}` : `D+${Math.abs(evt.dday)}`;
                        return (
                          <tr key={i}>
                            <td className="text-sm">{evt.dateRangeText}</td>
                            <td>
                              <span className="badge bg-secondary text-xs">{ddayText}</span>
                            </td>
                            <td>
                              <span
                                className="badge text-xs"
                                style={{ background: typeStyle.bg, color: typeStyle.text }}
                              >
                                {EVENT_TYPE_LABEL[evt.eventType] ?? evt.eventType}
                              </span>
                            </td>
                            <td className="fw-medium text-sm">{evt.title}</td>
                            <td className="text-sm">{evt.targetGrade == null ? "전체" : `${evt.targetGrade}학년`}</td>
                            <td className="text-sm text-secondary-light">{evt.description}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* [soojin] 달력 보기: 기존 MiniCalendar 컴포넌트 재사용 */
            <MiniCalendar />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
