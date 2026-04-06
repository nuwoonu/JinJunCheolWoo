import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Schedule, DayColumn } from "@/shared/types";
import api from "@/shared/api";

// [woo] /teacher/schedule — 주간 시간표

const DAYS: DayColumn[] = [
  { key: "MONDAY", label: "월요일", shortLabel: "월" },
  { key: "TUESDAY", label: "화요일", shortLabel: "화" },
  { key: "WEDNESDAY", label: "수요일", shortLabel: "수" },
  { key: "THURSDAY", label: "목요일", shortLabel: "목" },
  { key: "FRIDAY", label: "금요일", shortLabel: "금" },
];

const MAX_PERIOD = 8;

// [woo] 교시별 기본 시간 (50분 수업 + 10분 쉬는시간, 4교시 후 점심)
const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "09:00", end: "09:50" },
  2: { start: "10:00", end: "10:50" },
  3: { start: "11:00", end: "11:50" },
  4: { start: "12:00", end: "12:50" },
  5: { start: "13:50", end: "14:40" },
  6: { start: "14:50", end: "15:40" },
  7: { start: "15:50", end: "16:40" },
  8: { start: "16:50", end: "17:40" },
};

// [woo] 과목별 파스텔 색상 6가지 — 셀 전체를 채우는 방식
const PALETTE = [
  { bg: "#dbeafe", text: "#1e40af" }, // 파랑
  { bg: "#d1fae5", text: "#065f46" }, // 초록
  { bg: "#fef3c7", text: "#92400e" }, // 노랑
  { bg: "#fce7f3", text: "#9d174d" }, // 분홍
  { bg: "#e0e7ff", text: "#3730a3" }, // 보라
  { bg: "#fed7aa", text: "#9a3412" }, // 주황
];

// [woo] 오늘 요일 체크
const getTodayKey = (): string | null => {
  const map: Record<number, string> = { 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY", 4: "THURSDAY", 5: "FRIDAY" };
  return map[new Date().getDay()] ?? null;
};

// [woo] 현재 진행 중인 교시 체크
const getCurrentPeriod = (): number | null => {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  for (const [p, t] of Object.entries(PERIOD_TIMES)) {
    if (hhmm >= t.start && hhmm <= t.end) return Number(p);
  }
  return null;
};

// [woo] 이번 주 날짜 구하기 (월~금)
const getWeekDates = (): string[] => {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
};

export default function TimetableApp() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<Schedule[]>("/api/teacher/schedule");
      setSchedules(res.data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "일정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/api/teacher/schedule/${id}`);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다.");
    }
  }, []);

  // [woo] 과목명 → 색상 매핑 (같은 과목은 항상 같은 색)
  const colorMap = useMemo(() => {
    const map = new Map<string, (typeof PALETTE)[0]>();
    const subjects = [...new Set(schedules.map((s) => s.subjectName))];
    subjects.forEach((name, i) => map.set(name, PALETTE[i % PALETTE.length]));
    return map;
  }, [schedules]);

  const todayKey = getTodayKey();
  const currentPeriod = getCurrentPeriod();
  const weekDates = useMemo(getWeekDates, []);

  /* ── 로딩 ── */
  if (loading) {
    return (
      <div className="card radius-12">
        <div
          className="card-body d-flex flex-column align-items-center justify-content-center"
          style={{ padding: "80px 20px" }}
        >
          <div className="spinner-border text-primary-600" style={{ width: 40, height: 40 }} />
          <p className="text-secondary-light mt-16 mb-0 text-sm">시간표를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  /* ── 에러 ── */
  if (error) {
    return (
      <div className="card radius-12">
        <div className="card-body d-flex align-items-center justify-content-between py-20 px-24">
          <span className="text-sm text-danger-600">{error}</span>
          <button onClick={fetchSchedules} className="btn btn-sm btn-outline-danger radius-6">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  /* ── 빈 상태 ── */
  if (schedules.length === 0) {
    return (
      <div className="card radius-12">
        <div className="card-body text-center" style={{ padding: "80px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📅</div>
          <h6 className="fw-semibold mb-8">아직 등록된 수업이 없어요</h6>
          <p className="text-secondary-light mb-20 text-sm">시간표를 등록하면 한눈에 확인할 수 있어요</p>
          <button
            onClick={() => navigate("/teacher/schedule/add")}
            className="btn btn-primary-600 radius-8 d-inline-flex align-items-center gap-6"
          >
            <i className="ri-add-line" /> 첫 수업 등록하기
          </button>
        </div>
      </div>
    );
  }

  /* ── 시간표 ── */
  return (
    <div className="card radius-12" style={{ overflow: "hidden" }}>
      {/* 헤더 */}
      <div
        className="d-flex align-items-center justify-content-between py-16 px-20"
        style={{ borderBottom: "1px solid #e5e7eb" }}
      >
        <div>
          <h6 className="fw-bold mb-0" style={{ fontSize: 16 }}>
            주간 시간표
          </h6>
          <b>
            <span className="text-secondary-light text-xs">총 {schedules.length}개 수업</span>
          </b>
        </div>
        <button
          onClick={() => navigate("/teacher/schedule/add")}
          className="btn btn-primary-600 radius-8 btn-sm d-flex align-items-center gap-6"
        >
          <i className="ri-add-line" /> 일정 등록
        </button>
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th
                style={{
                  width: 100,
                  padding: "16px 12px",
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#94a3b8",
                  borderRight: "1px solid #e5e7eb",
                  borderBottom: "2px solid #e5e7eb",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              ></th>
              {DAYS.map((day, i) => {
                const isToday = day.key === todayKey;
                return (
                  <th
                    key={day.key}
                    style={{
                      padding: "10px 8px",
                      textAlign: "center",
                      minWidth: 120,
                      borderBottom: isToday ? "3px solid #25A194" : "2px solid #e5e7eb",
                      borderRight: "1px solid #f1f5f9",
                      background: isToday ? "rgba(37,161,148,0.06)" : undefined,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: isToday ? "#25A194" : "#334155",
                      }}
                    >
                      {day.shortLabel}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: isToday ? "#25A194" : "#94a3b8",
                        marginTop: 2,
                        fontWeight: isToday ? 600 : 400,
                      }}
                    >
                      {weekDates[i]}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: MAX_PERIOD }, (_, i) => i + 1).map((period) => {
              const pt = PERIOD_TIMES[period];
              const isNow = todayKey !== null && currentPeriod === period;
              return (
                <>
                  {/* [woo] 점심시간 구분 */}
                  {period === 5 && (
                    <tr key="lunch">
                      <td
                        colSpan={DAYS.length + 1}
                        style={{
                          textAlign: "center",
                          padding: "10px 0",
                          background: "#fafafa",
                          borderBottom: "1px solid #e5e7eb",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#94a3b8",
                        }}
                      >
                        🍚 점심시간 12:50 ~ 13:50
                      </td>
                    </tr>
                  )}
                  <tr key={period} style={{ background: isNow ? "rgba(37,161,148,0.03)" : undefined }}>
                    {/* 교시 */}
                    <td
                      style={{
                        padding: "10px 8px",
                        textAlign: "center",
                        verticalAlign: "middle",
                        borderRight: "1px solid #e5e7eb",
                        borderBottom: "1px solid #f1f5f9",
                        whiteSpace: "nowrap",
                        position: "relative",
                      }}
                    >
                      {isNow && (
                        <span
                          style={{
                            position: "absolute",
                            left: 6,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#25A194",
                            boxShadow: "0 0 0 3px rgba(37,161,148,0.2)",
                          }}
                        />
                      )}
                      <div style={{ fontSize: 13, fontWeight: 700, color: isNow ? "#25A194" : "#475569" }}>
                        {period}교시
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {pt.start}~{pt.end}
                      </div>
                    </td>

                    {/* 요일별 수업 */}
                    {DAYS.map((day) => {
                      const s = schedules.find((sc) => sc.dayOfWeek === day.key && sc.period === period);
                      const isToday = day.key === todayKey;
                      const isHover = s ? hovered === s.id : false;
                      const c = s ? (colorMap.get(s.subjectName) ?? PALETTE[0]) : null;
                      const isCurrentClass = isNow && isToday && !!s;

                      return (
                        <td
                          key={day.key}
                          onMouseEnter={() => s && setHovered(s.id)}
                          onMouseLeave={() => setHovered(null)}
                          style={{
                            padding: 0,
                            verticalAlign: "middle",
                            minWidth: 120,
                            height: 76,
                            background: s && c ? c.bg : isToday ? "rgba(37,161,148,0.02)" : undefined,
                            borderRight: "1px solid #f1f5f9",
                            borderBottom: "1px solid #f1f5f9",
                            position: "relative",
                            transition: "background 0.15s",
                          }}
                        >
                          {s && c ? (
                            <>
                              {/* 현재 수업 표시 */}
                              {isCurrentClass && (
                                <span
                                  style={{
                                    position: "absolute",
                                    top: 6,
                                    left: 6,
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: "#fff",
                                    background: "#25A194",
                                    borderRadius: 3,
                                    padding: "1px 5px",
                                    lineHeight: "16px",
                                  }}
                                >
                                  수업중
                                </span>
                              )}

                              <div
                                style={{
                                  height: "100%",
                                  minHeight: 76,
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "8px 10px",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: c.text,
                                    textAlign: "center",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {s.subjectName}
                                </div>
                                {s.className && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: c.text,
                                      opacity: 0.65,
                                      marginTop: 3,
                                      textAlign: "center",
                                    }}
                                  >
                                    {s.className}
                                  </div>
                                )}
                                {s.location && (
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: c.text,
                                      opacity: 0.45,
                                      marginTop: 2,
                                      textAlign: "center",
                                    }}
                                  >
                                    {s.location}
                                  </div>
                                )}
                              </div>

                              {/* hover 시 수정/삭제 */}
                              {isHover && (
                                <div
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "rgba(0,0,0,0.04)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                  }}
                                >
                                  <button
                                    onClick={() => navigate(`/teacher/schedule/edit/${s.id}`)}
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: 6,
                                      background: "#fff",
                                      border: "1px solid #e2e8f0",
                                      cursor: "pointer",
                                      fontSize: 11,
                                      fontWeight: 500,
                                      color: "#475569",
                                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                    }}
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDelete(s.id)}
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: 6,
                                      background: "#fff",
                                      border: "1px solid #e2e8f0",
                                      cursor: "pointer",
                                      fontSize: 11,
                                      fontWeight: 500,
                                      color: "#ef4444",
                                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                    }}
                                  >
                                    삭제
                                  </button>
                                </div>
                              )}
                            </>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* [woo] 과목 범례 */}
      {colorMap.size > 0 && (
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 16px",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, color: "#94a3b8", marginRight: 4 }}>과목</span>
          {[...colorMap.entries()].map(([name, c]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: c.bg,
                  border: `1px solid ${c.text}30`,
                }}
              />
              <span style={{ fontSize: 11, color: "#475569" }}>{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
