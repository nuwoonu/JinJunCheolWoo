import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MiniCalendar from "@/components/MiniCalendar";
// @ts-ignore [woo] 추후 사용 예정
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

  // [soojin] 초기화: 필터 상태 모두 초기화
  function handleReset() {
    setFilterGrade("");
    setFilterType("");
    setAppliedGrade("");
    setAppliedType("");
  }

  // [soojin] targetGrade가 null(전체)인 일정은 학년 필터 무관하게 항상 표시
  const filtered = events.filter((e) => {
    if (appliedGrade && e.targetGrade != null && String(e.targetGrade) !== appliedGrade) return false;
    if (appliedType && e.eventType !== appliedType) return false;
    return true;
  });

  const isFiltered = !!(appliedGrade || appliedType);

  return (
    <DashboardLayout>
      {/* [soojin] 화면 꽉 채우기: 테이블 내부 스크롤, 카드 flex:1 */}
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 4.5rem - 48px)" }}>
      {/* [soojin] 플랜 패턴 적용: 제목 + 뷰 토글 버튼 */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
        <h6
          style={{
            fontWeight: 700,
            color: "#111827",
            marginBottom: 0,
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          학교 일정
          {view === "list" && (
            <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>
              {isFiltered ? (
                <>
                  <span style={{ fontWeight: 600, color: "#111827" }}>{filtered.length}건</span> / 전체 {events.length}
                  건
                </>
              ) : (
                `전체 ${events.length}건`
              )}
            </span>
          )}
        </h6>
        {/* [soojin] 목록/달력 토글 - 플랜 버튼 스타일 적용 */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setView("list")}
            style={{
              padding: "5px 12px",
              fontSize: 13,
              borderRadius: 6,
              cursor: "pointer",
              background: view === "list" ? "#25A194" : "#fff",
              border: view === "list" ? "none" : "1px solid #d1d5db",
              color: view === "list" ? "#fff" : "#374151",
            }}
          >
            <i className="ri-list-check" style={{ marginRight: 4 }} />
            목록
          </button>
          <button
            onClick={() => setView("calendar")}
            style={{
              padding: "5px 12px",
              fontSize: 13,
              borderRadius: 6,
              cursor: "pointer",
              background: view === "calendar" ? "#25A194" : "#fff",
              border: view === "calendar" ? "none" : "1px solid #d1d5db",
              color: view === "calendar" ? "#fff" : "#374151",
            }}
          >
            <i className="ri-calendar-2-line" style={{ marginRight: 4 }} />
            달력
          </button>
        </div>
      </div>

      {/* [soojin] 컨트롤 바: 필터만 카드 밖 좌측, 년/월 네비는 카드 안으로 이동 */}
      {view === "list" && (
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
          {/* 학년 select */}
          <div style={{ position: "relative" }}>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              style={{ appearance: "none", padding: "5px 28px 5px 10px", fontSize: 13, borderRadius: 6, border: "1px solid #d1d5db", color: "#374151", background: "#fff", cursor: "pointer", minWidth: 95 }}
            >
              <option value="">전체 학년</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>
            <i className="ri-arrow-down-s-line" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280", fontSize: 14 }} />
          </div>
          {/* 유형 select */}
          <div style={{ position: "relative" }}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ appearance: "none", padding: "5px 28px 5px 10px", fontSize: 13, borderRadius: 6, border: "1px solid #d1d5db", color: "#374151", background: "#fff", cursor: "pointer", minWidth: 105 }}
            >
              <option value="">전체 유형</option>
              {Object.entries(EVENT_TYPE_LABEL).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280", fontSize: 14 }} />
          </div>
          {/* 조회 버튼 */}
          <button onClick={handleSearch} style={{ padding: "5px 12px", fontSize: 13, borderRadius: 6, background: "#25A194", border: "none", color: "#fff", cursor: "pointer" }}>
            조회
          </button>
          {/* 초기화 버튼 */}
          <button onClick={handleReset} style={{ padding: "5px 12px", fontSize: 13, borderRadius: 6, background: "#fff", border: "1px solid #d1d5db", color: "#374151", cursor: "pointer" }}>
            초기화
          </button>
        </div>
      )}

      {/* [soojin] 카드: flex:1, 화면 꽉 채움 (플랜 패턴) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {view === "list" ? (
          <>
            {/* [soojin] 년/월 네비게이션: 카드 안 중앙, 테이블과 분리 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #e5e7eb" }}>
              <button
                onClick={prevMonth}
                style={{ background: "none", border: "none", padding: "2px 4px", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}
              >
                <i className="ri-arrow-left-s-line" style={{ fontSize: 18 }} />
              </button>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#111827", minWidth: 90, textAlign: "center" }}>
                {year}년 {month}월
              </span>
              <button
                onClick={nextMonth}
                style={{ background: "none", border: "none", padding: "2px 4px", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}
              >
                <i className="ri-arrow-right-s-line" style={{ fontSize: 18 }} />
              </button>
            </div>
            {/* [soojin] 스크롤 div: flex:1, overflowY:auto */}
            <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", minHeight: 0 }}>
            <table style={{ tableLayout: "fixed", width: "100%", borderCollapse: "collapse" }}>
              <colgroup>
                <col style={{ width: 150 }} />
                {/* 기간 */}
                <col style={{ width: 80 }} /> {/* D-Day */}
                <col style={{ width: 90 }} /> {/* 유형 */}
                <col /> {/* 제목 */}
                <col style={{ width: 80 }} /> {/* 대상 */}
                <col style={{ width: 200 }} />
                {/* 설명 */}
              </colgroup>
              <thead>
                <tr>
                  {["기간", "D-Day", "유형", "제목", "대상", "설명"].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontSize: 13,
                        background: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                        textAlign: "left",
                        padding: "10px 12px",
                        fontWeight: 600,
                        color: "#374151",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 13 }}>
                      등록된 일정이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((evt, i) => {
                    const typeStyle = EVENT_TYPE_COLOR[evt.eventType] ?? { bg: "#6c757d", text: "#fff" };
                    const ddayText =
                      evt.dday === 0 ? "D-DAY" : evt.dday > 0 ? `D-${evt.dday}` : `D+${Math.abs(evt.dday)}`;
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ fontSize: 13, padding: "10px 12px", verticalAlign: "middle" }}>
                          {evt.dateRangeText}
                        </td>
                        <td style={{ fontSize: 13, padding: "10px 12px", verticalAlign: "middle" }}>
                          <span
                            style={{
                              background: "#6b7280",
                              color: "#fff",
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 4,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ddayText}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, padding: "10px 12px", verticalAlign: "middle" }}>
                          <span
                            style={{
                              background: typeStyle.bg,
                              color: typeStyle.text,
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 4,
                            }}
                          >
                            {EVENT_TYPE_LABEL[evt.eventType] ?? evt.eventType}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, padding: "10px 12px", verticalAlign: "middle", fontWeight: 500 }}>
                          {evt.title}
                        </td>
                        <td style={{ fontSize: 13, padding: "10px 12px", verticalAlign: "middle" }}>
                          {evt.targetGrade == null ? "전체" : `${evt.targetGrade}학년`}
                        </td>
                        <td style={{ fontSize: 13, padding: "10px 12px", verticalAlign: "middle", color: "#6b7280" }}>
                          {evt.description}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          /* [soojin] 달력 보기: flex:1로 카드 내부 꽉 채움 */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '0 16px 16px' }}>
            <MiniCalendar />
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
