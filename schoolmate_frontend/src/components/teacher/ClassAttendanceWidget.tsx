// [woo] 학급 학생 출결 상태 위젯 (교사용)
// GET /api/attendance/student?date={오늘} → JWT 기반 담임반 자동 조회
// 필터 버튼으로 출석/지각/결석/조퇴 학생 필터링 + 전원출석 버튼

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/auth";

interface AttendanceRecord {
  id: number;
  studentInfoId: number;
  studentName: string;
  studentNumber: number;
  status: "PRESENT" | "LATE" | "ABSENT" | "EARLY_LEAVE" | "SICK" | "NONE";
  statusDesc?: string;
}

interface Props {
  grade: number;
  classNum: number;
}

type FilterKey = "PRESENT" | "LATE" | "ABSENT" | "EARLY_LEAVE";

const STATUS_CONFIG = {
  PRESENT: { label: "출석", color: "#22c55e", bg: "#f0fdf4" },
  LATE: { label: "지각", color: "#f97316", bg: "#fff7ed" },
  ABSENT: { label: "결석", color: "#ef4444", bg: "#fef2f2" },
  EARLY_LEAVE: { label: "조퇴", color: "#3b82f6", bg: "#eff6ff" },
  SICK: { label: "병결", color: "#a855f7", bg: "#faf5ff" },
  NONE: { label: "미처리", color: "#9ca3af", bg: "#f9fafb" },
} as const;

const FILTER_KEYS: FilterKey[] = ["PRESENT", "LATE", "ABSENT", "EARLY_LEAVE"];

// [woo] 출결 변경 토스트 알림 타입
interface Toast {
  id: number;
  message: string;
  color: string;
  bg: string;
  icon: string;
}

export default function ClassAttendanceWidget({ grade, classNum }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey | null>(null);
  // [woo] 토스트 알림 목록 (여러 개 동시 표시 가능)
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = { current: 0 };

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const mmdd = `${mm}-${dd}`;

  // [woo] 대한민국 공휴일 — 양력 고정 + 음력 기반(연도별 갱신 필요)
  const FIXED_HOLIDAYS: Record<string, string> = {
    "01-01": "새해 첫날",
    "03-01": "삼일절",
    "05-05": "어린이날",
    "06-06": "현충일",
    "08-15": "광복절",
    "10-03": "개천절",
    "10-09": "한글날",
    "12-25": "성탄절",
  };
  // [woo] 음력 기반 + 대체공휴일 포함 (매년 갱신 필요)
  const LUNAR_HOLIDAYS: Record<number, Record<string, string>> = {
    2025: {
      "01-28": "설날 연휴",
      "01-29": "설날",
      "01-30": "설날 연휴",
      "05-05": "부처님 오신 날",
      "05-06": "대체공휴일 (어린이날)",
      "10-05": "추석 연휴",
      "10-06": "추석",
      "10-07": "추석 연휴",
      "10-08": "대체공휴일 (추석)",
    },
    2026: {
      "02-16": "설날 연휴",
      "02-17": "설날",
      "02-18": "설날 연휴",
      "03-02": "대체공휴일 (삼일절)",
      "05-24": "부처님 오신 날",
      "05-25": "대체공휴일 (부처님 오신 날)",
      "09-24": "추석 연휴",
      "09-25": "추석",
      "09-26": "추석 연휴",
    },
    2027: {
      "02-05": "설날 연휴",
      "02-06": "설날",
      "02-07": "설날 연휴",
      "02-08": "대체공휴일 (설날)",
      "05-13": "부처님 오신 날",
      "10-14": "추석 연휴",
      "10-15": "추석",
      "10-16": "추석 연휴",
    },
  };
  const holidays = { ...FIXED_HOLIDAYS, ...(LUNAR_HOLIDAYS[now.getFullYear()] ?? {}) };
  const holidayName = holidays[mmdd] ?? null;
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const isHoliday = isWeekend || !!holidayName;

  // [woo] 휴일 안내 문구
  const holidayLabel = holidayName ? holidayName : now.getDay() === 6 ? "토요일" : "일요일";

  const fetchRecords = useCallback(() => {
    if (isHoliday) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(`/attendance/student?date=${today}`)
      .then((res) => setRecords(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [today, isHoliday]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const total = records.length;
  const counts = {
    PRESENT: records.filter((r) => r.status === "PRESENT").length,
    LATE: records.filter((r) => r.status === "LATE").length,
    ABSENT: records.filter((r) => r.status === "ABSENT").length,
    EARLY_LEAVE: records.filter((r) => r.status === "EARLY_LEAVE").length,
  };

  // [woo] 필터 적용된 학생 목록 (null이면 전체)
  const filtered = filter === null ? records : records.filter((r) => r.status === filter);

  // [woo] 토스트 띄우기 (2.5초 후 자동 제거)
  const showToast = (message: string, color: string, bg: string, icon: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, color, bg, icon }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  };

  // [woo] 개별 학생 출결 변경
  const handleStatusChange = async (studentInfoId: number, status: string) => {
    const studentName = records.find((r) => r.studentInfoId === studentInfoId)?.studentName ?? "";
    const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.NONE;
    try {
      await api.put(`/attendance/student/update?studentInfoId=${studentInfoId}&date=${today}`, { status });
      setRecords((prev) =>
        prev.map((r) =>
          r.studentInfoId === studentInfoId ? { ...r, status: status as AttendanceRecord["status"] } : r,
        ),
      );
      showToast(`${studentName} — ${cfg.label} 처리되었습니다`, cfg.color, cfg.bg, "ri-checkbox-circle-fill");
    } catch {
      showToast("출결 변경에 실패했습니다.", "#ef4444", "#fef2f2", "ri-error-warning-fill");
    }
  };

  const getFilterLabel = (key: FilterKey) => STATUS_CONFIG[key].label;
  const getFilterColor = (key: FilterKey) => STATUS_CONFIG[key].color;

  return (
    <>
    <div className="card shadow-sm h-100" style={{ borderRadius: 16 }}>
      {/* [woo] 헤더 */}
      <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
        <div className="d-flex align-items-center gap-8">
          <i className="ri-user-follow-line text-primary-600" style={{ fontSize: 20 }} />
          <div>
            <h6 className="fw-bold mb-0 text-sm">학급 학생 출결 상태</h6>
            <p className="text-secondary-light text-xs mb-0 mt-2">
              {grade}학년 {classNum}반 ({total}명)
            </p>
          </div>
        </div>
        <Link
          to="/attendance/student"
          style={{
            background: "#25A194",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "5px 14px",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          출결 관리
        </Link>
      </div>

      <div className="p-16 d-flex flex-column gap-12">
        {isHoliday ? (
          <div className="text-center py-32">
            <i className="ri-calendar-event-line d-block mb-12" style={{ fontSize: 40, color: "#d1d5db" }} />
            <p className="fw-semibold text-sm mb-4" style={{ color: "#6b7280" }}>
              오늘은 {holidayLabel} 휴일입니다.
            </p>
            <p className="text-xs text-secondary-light mb-0">
              {mm}월 {dd}일은 출결 관리가 필요하지 않습니다.
            </p>
          </div>
        ) : loading ? (
          <p className="text-secondary-light text-sm text-center py-16 mb-0">불러오는 중...</p>
        ) : (
          <>
            {/* [woo] 필터 버튼 행 */}
            <div className="d-flex flex-wrap gap-6">
              {FILTER_KEYS.map((key) => {
                const active = filter === key;
                const color = getFilterColor(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(active ? null : key)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      border: `1.5px solid ${active ? color : "var(--border-color, #e5e7eb)"}`,
                      background: active ? color : "transparent",
                      color: active ? "#fff" : color,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {getFilterLabel(key)} {counts[key]}
                  </button>
                );
              })}
            </div>

            {/* [woo] 학생 목록 */}
            <div style={{ overflowY: "auto", maxHeight: 300 }}>
              {filtered.length === 0 ? (
                <p className="text-secondary-light text-sm text-center py-20 mb-0">
                  {filter === null ? "출결 데이터가 없습니다." : `${getFilterLabel(filter)} 학생이 없습니다.`}
                </p>
              ) : (
                filtered.map((r, i) => {
                  const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.NONE;
                  return (
                    <div
                      key={r.studentInfoId}
                      className="d-flex align-items-center py-10 px-4"
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid var(--border-color, #f3f4f6)" : "none",
                      }}
                    >
                      <span className="text-secondary-light text-xs me-12" style={{ minWidth: 20, textAlign: "right" }}>
                        {r.studentNumber}
                      </span>
                      <span className="text-sm fw-medium flex-grow-1">{r.studentName}</span>
                      {/* [woo] 출결 상태 드롭다운 */}
                      <select
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.studentInfoId, e.target.value)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          border: `1.5px solid ${cfg.color}`,
                          background: cfg.bg,
                          color: cfg.color,
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        {(Object.keys(STATUS_CONFIG) as (keyof typeof STATUS_CONFIG)[])
                          .filter((key) => key !== "NONE")
                          .map((key) => (
                            <option key={key} value={key}>
                              {STATUS_CONFIG[key].label}
                            </option>
                          ))}
                      </select>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>

      {/* [woo] 출결 변경 토스트 알림 — 우하단 고정 */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#fff",
              border: `1.5px solid ${t.color}`,
              borderLeft: `4px solid ${t.color}`,
              borderRadius: 10,
              padding: "10px 16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              fontSize: 13,
              fontWeight: 500,
              color: "#111827",
              minWidth: 220,
              maxWidth: 320,
              animation: "toast-slide-in 0.25s ease",
              pointerEvents: "auto",
            }}
          >
            <i className={t.icon} style={{ fontSize: 18, color: t.color, flexShrink: 0 }} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
