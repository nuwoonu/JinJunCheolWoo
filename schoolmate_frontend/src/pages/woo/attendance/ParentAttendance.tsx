import { useEffect, useState, useCallback } from "react";
import api from "../../../api/auth";
import DashboardLayout from "../../../components/layout/DashboardLayout";

// [woo] /attendance/parent - 학부모 자녀 출결 현황 조회
// 좌우 2패널: 왼쪽(출결 안내 파란 섹션 + 자녀 카운트 + 월별 통계), 오른쪽(월별 상세 테이블)
// 왼쪽 통계 월과 오른쪽 기록 월을 독립적으로 선택 가능 (StudentAttendance 동일 패턴)

interface ChildSummary {
  childName: string;
  studentInfoId: number;
  studentNumber: string;
  grade: number;
  classNum: number;
  statusCounts: Record<string, number>;
  totalDays: number;
}

interface ChildRecord {
  id: number;
  attendanceDate: string;
  status: string;
  statusDesc: string;
  checkInTime?: string;
  reason?: string;
}

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "출석",
  ABSENT: "결석",
  LATE: "지각",
  EARLY_LEAVE: "조퇴",
  SICK: "병결",
};

const STATUS_BADGE: Record<string, string> = {
  PRESENT: "bg-success-100 text-success-600",
  ABSENT: "bg-danger-100 text-danger-600",
  LATE: "bg-warning-100 text-warning-600",
  EARLY_LEAVE: "bg-info-100 text-info-600",
  SICK: "bg-lilac-100 text-lilac-600",
};

// [woo] 출결 안내 - 왼쪽 파란 배경 섹션에 표시
const ATTENDANCE_GUIDE = [
  "출석 인정 시간: 오전 9시까지",
  "지각: 오전 9시 이후 등교",
  "공결: 학교가 인정하는 사유로 결석한 경우 (가족 행사, 학교 행사 등)",
  "병결: 질병으로 인한 결석 (병원 진단서 제출 필요)",
  "출결 관련 문의사항은 담임 선생님께 연락해 주세요",
];

const _now = new Date();

export default function ParentAttendance() {
  // [soojin] 오른쪽 기록 패널 월 - 화살표 네비게이션
  const [recordsYear, setRecordsYear] = useState(_now.getFullYear());
  const [recordsMonth, setRecordsMonth] = useState(_now.getMonth() + 1);
  // [soojin] 왼쪽 통계 패널 월 - StudentAttendance shiftStatsMonth 동일 패턴으로 독립 선택
  const [statsYear, setStatsYear] = useState(_now.getFullYear());
  const [statsMonth, setStatsMonth] = useState(_now.getMonth() + 1);

  const [summaries, setSummaries] = useState<ChildSummary[]>([]);
  const [statsSummaries, setStatsSummaries] = useState<ChildSummary[]>([]);
  const [records, setRecords] = useState<ChildRecord[]>([]);
  const [activeChildIdx, setActiveChildIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // [woo] 오른쪽 패널 날짜 범위
  const startDate = new Date(recordsYear, recordsMonth - 1, 1).toISOString().slice(0, 10);
  const endDate = new Date(recordsYear, recordsMonth, 0).toISOString().slice(0, 10);

  const activeChild = summaries[activeChildIdx] ?? null;
  // [soojin] 왼쪽 통계는 statsYear/statsMonth 기준 summary에서 동일 자녀 찾아서 사용
  const statsChild = statsSummaries.find((s) => s.studentInfoId === activeChild?.studentInfoId) ?? activeChild;

  // [soojin] 미래 월 이동 불가
  const isRecordsFuture =
    recordsYear > _now.getFullYear() || (recordsYear === _now.getFullYear() && recordsMonth >= _now.getMonth() + 1);
  const isStatsFuture =
    statsYear > _now.getFullYear() || (statsYear === _now.getFullYear() && statsMonth >= _now.getMonth() + 1);

  // [woo] 자녀 출결 상세 기록 조회
  const fetchRecords = useCallback((child: ChildSummary, sDate: string, eDate: string) => {
    setRecordsLoading(true);
    api
      .get(`/attendance/parent/children/${child.studentInfoId}?startDate=${sDate}&endDate=${eDate}`)
      .then((res) => setRecords(res.data))
      .catch(() => setRecords([]))
      .finally(() => setRecordsLoading(false));
  }, []);

  // [woo] 오른쪽 기록 월 변경 시 summary + 상세 자동 조회
  useEffect(() => {
    setLoading(true);
    setRecords([]);
    api
      .get(`/attendance/parent/summary?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => {
        const data: ChildSummary[] = res.data ?? [];
        setSummaries(data);
        if (data.length > 0) {
          const idx = activeChildIdx < data.length ? activeChildIdx : 0;
          setActiveChildIdx(idx);
          fetchRecords(data[idx], startDate, endDate);
        }
      })
      .catch(() => setSummaries([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // [soojin] 왼쪽 통계 월 변경 시 별도 summary 조회 - StudentAttendance statsYear/statsMonth 패턴 동일
  useEffect(() => {
    const sDate = new Date(statsYear, statsMonth - 1, 1).toISOString().slice(0, 10);
    const eDate = new Date(statsYear, statsMonth, 0).toISOString().slice(0, 10);
    api
      .get(`/attendance/parent/summary?startDate=${sDate}&endDate=${eDate}`)
      .then((res) => setStatsSummaries(res.data ?? []))
      .catch(() => setStatsSummaries([]));
  }, [statsYear, statsMonth]);

  // [woo] 자녀 탭 전환
  const handleTabChange = (idx: number) => {
    setActiveChildIdx(idx);
    setFilterStatus(null);
    if (summaries[idx]) fetchRecords(summaries[idx], startDate, endDate);
  };

  // [soojin] 오른쪽 기록 월 네비게이션
  const shiftMonth = (delta: number) => {
    setFilterStatus(null);
    setRecordsMonth((m) => {
      const next = m + delta;
      if (next < 1) {
        setRecordsYear((y) => y - 1);
        return 12;
      }
      if (next > 12) {
        setRecordsYear((y) => y + 1);
        return 1;
      }
      return next;
    });
  };

  // [soojin] 왼쪽 통계 월 네비게이션 - StudentAttendance shiftStatsMonth 동일 패턴
  const shiftStatsMonth = (delta: number) => {
    setStatsMonth((m) => {
      const next = m + delta;
      if (next < 1) {
        setStatsYear((y) => y - 1);
        return 12;
      }
      if (next > 12) {
        setStatsYear((y) => y + 1);
        return 1;
      }
      return next;
    });
  };

  // [woo] 오른쪽 패널 기준 카운트 (현재 기록 월의 activeChild)
  const presentCount = activeChild?.statusCounts["PRESENT"] ?? 0;
  const absentCount = activeChild?.statusCounts["ABSENT"] ?? 0;
  const lateCount = activeChild?.statusCounts["LATE"] ?? 0;
  const earlyLeaveCount = activeChild?.statusCounts["EARLY_LEAVE"] ?? 0;
  const sickCount = activeChild?.statusCounts["SICK"] ?? 0;
  const totalDays = activeChild?.totalDays ?? 0;
  const rate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

  // [soojin] 왼쪽 통계 기준 카운트 (statsYear/statsMonth의 statsChild)
  const statsAbsent = statsChild?.statusCounts["ABSENT"] ?? 0;
  const statsLate = statsChild?.statusCounts["LATE"] ?? 0;
  const statsEarlyLeave = statsChild?.statusCounts["EARLY_LEAVE"] ?? 0;
  const statsSick = statsChild?.statusCounts["SICK"] ?? 0;
  const statsTotalDays = statsChild?.totalDays ?? 0;
  const statsPresent = statsChild?.statusCounts["PRESENT"] ?? 0;
  const statsRate = statsTotalDays > 0 ? Math.round((statsPresent / statsTotalDays) * 100) : 0;

  const filteredRecords = filterStatus ? records.filter((r) => r.status === filterStatus) : records;

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">자녀 출결 관리</h6>
        </div>
      </div>

      {/* [woo] 출결 안내 배너 - 가정통신문 안내 배너 동일 스타일 */}
      <div
        style={{
          background: "#f0faf8",
          border: "1px solid #c8ede8",
          borderRadius: 8,
          padding: "10px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <i className="ri-information-line" style={{ fontSize: 15, color: "#25a194" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2e2c", whiteSpace: "nowrap" }}>출결 안내</span>
        </div>
        <div style={{ width: 1, height: 14, background: "#c8ede8", flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {ATTENDANCE_GUIDE.map((text, i) => (
            <span
              key={i}
              style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 4 }}
            >
              <i className="ri-checkbox-circle-line" style={{ fontSize: 12, color: "#25a194", flexShrink: 0 }} />
              {text}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24 text-secondary-light">불러오는 중...</div>
      ) : summaries.length === 0 ? (
        <div className="card radius-12">
          <div className="card-body text-center py-24 text-secondary-light">
            연결된 자녀가 없거나 출결 기록이 없습니다.
          </div>
        </div>
      ) : (
        <>
          {/* [woo] 다자녀 탭 - 전체 레이아웃 위, 2명 이상일 때만 */}
          {summaries.length > 1 && (
            <div className="d-flex gap-8 mb-16">
              {summaries.map((child, idx) => (
                <button
                  key={child.studentInfoId}
                  type="button"
                  className={`btn btn-sm radius-8 px-16 py-8 fw-medium ${
                    activeChildIdx === idx ? "btn-primary-600 text-white" : "btn-outline-neutral-500"
                  }`}
                  onClick={() => handleTabChange(idx)}
                >
                  {child.childName} ({child.grade}-{child.classNum})
                </button>
              ))}
            </div>
          )}

          {/* [soojin] 좌우 2패널 레이아웃 - StudentAttendance 동일 구조 */}
          <div style={{ height: "calc(100vh - 4.5rem - 180px)" }}>
            <div className="row g-4" style={{ height: "100%", alignItems: "stretch" }}>
              {/* ── 왼쪽 패널 ── */}
              <div className="col-xl-3" style={{ height: "100%" }}>
                <div
                  className="card border-0 shadow-sm"
                  style={{ borderRadius: 12, height: "100%", overflowY: "auto", padding: 0 }}
                >
                  {/* [woo] 자녀 정보 + 출석률 헤더 */}
                  <div style={{ padding: "20px 20px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: "#e0f2fe",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <iconify-icon icon="mdi:account-school" style={{ fontSize: 22, color: "#0284c7" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 2 }}>
                          {activeChild?.childName}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          {activeChild?.grade}학년 {activeChild?.classNum}반 ({activeChild?.studentNumber})
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: 28,
                            fontWeight: 800,
                            color: rate >= 90 ? "#16a34a" : rate >= 70 ? "#d97706" : "#dc2626",
                            lineHeight: 1,
                          }}
                        >
                          {rate}%
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>출석률</div>
                      </div>
                    </div>
                  </div>

                  {/* 하단 영역 */}
                  <div style={{ padding: "0 20px 20px" }}>
                    {/* [woo] 상태별 카운트 그리드 - 뱃지 없이 컬러 라벨(작게) + 숫자(크게), 전체 포함 6개 */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "14px 8px",
                        marginBottom: 16,
                      }}
                    >
                      {[
                        { label: "출석", count: presentCount, color: "#16a34a" },
                        { label: "결석", count: absentCount, color: "#dc2626" },
                        { label: "지각", count: lateCount, color: "#d97706" },
                        { label: "조퇴", count: earlyLeaveCount, color: "#2563eb" },
                        { label: "병결", count: sickCount, color: "#9333ea" },
                        { label: "전체", count: totalDays, color: "#6b7280" },
                      ].map((item) => (
                        <div key={item.label} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: item.color, marginBottom: 4 }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                            {item.count}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 구분선 */}
                    <div style={{ borderTop: "1px solid #f3f4f6", marginBottom: 14 }} />

                    {/* [soojin] 왼쪽 통계 월 네비게이션 - StudentAttendance shiftStatsMonth 동일 패턴 */}
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                      <i
                        className="ri-arrow-left-s-line"
                        style={{ fontSize: 16, color: "#6b7280", cursor: "pointer" }}
                        onClick={() => shiftStatsMonth(-1)}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                          whiteSpace: "nowrap",
                          flex: 1,
                          textAlign: "center",
                        }}
                      >
                        {statsYear}년 {statsMonth}월
                      </span>
                      <i
                        className="ri-arrow-right-s-line"
                        style={{
                          fontSize: 16,
                          cursor: isStatsFuture ? "default" : "pointer",
                          color: isStatsFuture ? "#d1d5db" : "#6b7280",
                        }}
                        onClick={() => {
                          if (!isStatsFuture) shiftStatsMonth(1);
                        }}
                      />
                    </div>

                    {/* [soojin] 지각/조퇴/결석/병결 진행 바 - StudentAttendance 동일 스타일 */}
                    {[
                      { label: "지각", count: statsLate, color: "#f59e0b" },
                      { label: "조퇴", count: statsEarlyLeave, color: "#3b82f6" },
                      { label: "결석", count: statsAbsent, color: "#ef4444" },
                      { label: "병결", count: statsSick, color: "#a855f7" },
                    ].map((item) => {
                      const pct = statsTotalDays > 0 ? Math.round((item.count / statsTotalDays) * 100) : 0;
                      return (
                        <div key={item.label} style={{ marginBottom: 10 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 4,
                            }}
                          >
                            <span style={{ fontSize: 12, color: "#6b7280" }}>{item.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                              {item.count}건 ({pct}%)
                            </span>
                          </div>
                          <div style={{ background: "#f3f4f6", borderRadius: 4, height: 6, overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: item.color,
                                borderRadius: 4,
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* [soojin] 총 출석률 - StudentAttendance 동일 스타일 */}
                    <div style={{ marginTop: 6, textAlign: "right" }}>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>
                        총 출석률 <span style={{ fontWeight: 700, color: "#25A194" }}>{statsRate}%</span>
                        <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 4 }}>(총 {statsTotalDays}일)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* /왼쪽 패널 */}

              {/* ── 오른쪽 패널 ── */}
              <div className="col-xl-9" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    overflow: "hidden",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                  }}
                >
                  {/* [soojin] 카드 헤더: 제목(left) + 월 네비게이션(right) */}
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #e5e7eb",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>상세 출결 내역</span>

                    {/* [soojin] 월 네비게이션 - 중앙 배치, 아이콘만 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                    >
                      <i
                        className="ri-arrow-left-s-line"
                        style={{ fontSize: 18, color: "#374151", cursor: "pointer" }}
                        onClick={() => shiftMonth(-1)}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#374151",
                          minWidth: 80,
                          textAlign: "center",
                        }}
                      >
                        {recordsYear}.{String(recordsMonth).padStart(2, "0")}
                      </span>
                      <i
                        className="ri-arrow-right-s-line"
                        style={{
                          fontSize: 18,
                          cursor: isRecordsFuture ? "default" : "pointer",
                          color: isRecordsFuture ? "#d1d5db" : "#374151",
                        }}
                        onClick={() => {
                          if (!isRecordsFuture) shiftMonth(1);
                        }}
                      />
                    </div>
                  </div>

                  {/* 상태 필터 탭 */}
                  <div
                    style={{
                      padding: "8px 16px",
                      borderBottom: "1px solid #e5e7eb",
                      display: "flex",
                      gap: 6,
                      flexShrink: 0,
                      flexWrap: "wrap",
                    }}
                  >
                    {([null, "PRESENT", "ABSENT", "LATE", "EARLY_LEAVE", "SICK"] as const).map((status) => {
                      const label = status === null ? "전체" : STATUS_LABELS[status];
                      const isActive = filterStatus === status;
                      return (
                        <button
                          key={status ?? "all"}
                          type="button"
                          onClick={() => setFilterStatus(status)}
                          style={{
                            padding: "4px 12px",
                            fontSize: 12,
                            borderRadius: 6,
                            border: isActive ? "none" : "1px solid #e5e7eb",
                            background: isActive ? "#25a194" : "#fff",
                            color: isActive ? "#fff" : "#374151",
                            cursor: "pointer",
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* [woo] 출결 기록 테이블 - StudentAttendance 인라인 스타일 동일 */}
                  <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", minHeight: 0 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <colgroup>
                        <col style={{ width: 120 }} />
                        <col style={{ width: 60 }} />
                        <col style={{ width: 90 }} />
                        <col style={{ width: 110 }} />
                        <col />
                      </colgroup>
                      <thead>
                        <tr>
                          {(["날짜", "요일", "상태", "출석 시간", "사유"] as const).map((h, i) => (
                            <th
                              key={h}
                              style={{
                                padding: "16px",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#6b7280",
                                background: "#f9fafb",
                                borderBottom: "1px solid #e5e7eb",
                                whiteSpace: "nowrap",
                                textAlign: i === 2 ? "center" : "left",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recordsLoading ? (
                          <tr>
                            <td
                              colSpan={5}
                              style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}
                            >
                              불러오는 중...
                            </td>
                          </tr>
                        ) : filteredRecords.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}
                            >
                              {filterStatus ? "해당 상태의 출결 기록이 없습니다." : "이 달의 출결 기록이 없습니다."}
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((r) => {
                            const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
                            const day = dayNames[new Date(r.attendanceDate).getDay()];
                            const isIssue = r.status === "ABSENT" || r.status === "SICK";
                            // [soojin] 날짜 포맷 YYYY-MM-DD → YYYY.MM.DD
                            const dateFormatted = r.attendanceDate.replace(/-/g, ".");
                            return (
                              <tr
                                key={r.id}
                                style={isIssue ? { backgroundColor: "rgba(239, 68, 68, 0.04)" } : undefined}
                              >
                                <td
                                  style={{
                                    padding: "16px",
                                    fontSize: 13,
                                    color: "#374151",
                                    borderBottom: "1px solid #f3f4f6",
                                    verticalAlign: "middle",
                                    fontWeight: 500,
                                  }}
                                >
                                  {dateFormatted}
                                </td>
                                <td
                                  style={{
                                    padding: "16px",
                                    fontSize: 13,
                                    borderBottom: "1px solid #f3f4f6",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 500,
                                      color: day === "토" ? "#2563eb" : day === "일" ? "#dc2626" : "#6b7280",
                                    }}
                                  >
                                    ({day})
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: "16px",
                                    fontSize: 13,
                                    borderBottom: "1px solid #f3f4f6",
                                    verticalAlign: "middle",
                                    textAlign: "center",
                                  }}
                                >
                                  <span
                                    className={`badge px-10 py-4 radius-4 text-xs fw-medium ${
                                      STATUS_BADGE[r.status] ?? "bg-neutral-100 text-secondary-light"
                                    }`}
                                  >
                                    {r.statusDesc ?? STATUS_LABELS[r.status] ?? r.status}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: "16px",
                                    fontSize: 13,
                                    color: "#6b7280",
                                    borderBottom: "1px solid #f3f4f6",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {r.checkInTime
                                    ? (() => {
                                        const [h, m] = r.checkInTime!.split(":");
                                        const hour = parseInt(h);
                                        const ampm = hour < 12 ? "AM" : "PM";
                                        const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                                        return `${h12}:${m} ${ampm}`;
                                      })()
                                    : "-"}
                                </td>
                                <td
                                  style={{
                                    padding: "16px",
                                    fontSize: 13,
                                    color: "#6b7280",
                                    borderBottom: "1px solid #f3f4f6",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {r.reason ?? "-"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {/* /오른쪽 패널 */}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
