import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo] /attendance/student - 학생 출결 관리 (TEACHER)
// 담임 반 학생 목록을 보여주고, 교사가 직접 상태를 설정/변경
// "전원출석" 버튼으로 일괄 출석 처리 가능
// 사유 입력 모달, 주말 안내, 학생 검색, 월간 요약 탭 포함

interface AttendanceRecord {
  id: number;
  studentInfoId: number;
  studentName: string;
  studentNumber: string;
  year: number;
  classNum: number;
  date: string;
  status: string; // PRESENT, ABSENT, LATE, EARLY_LEAVE, SICK, NONE(미처리)
  statusDesc?: string;
  reason?: string;
}

// [woo] 상태별 뱃지 스타일
const ATTENDANCE_BADGE: Record<string, string> = {
  PRESENT: "bg-success-100 text-success-600",
  ABSENT: "bg-danger-100 text-danger-600",
  LATE: "bg-warning-100 text-warning-600",
  EARLY_LEAVE: "bg-info-100 text-info-600",
  SICK: "bg-lilac-100 text-lilac-600",
  NONE: "bg-neutral-100 text-secondary-light",
};

const STATUS_OPTIONS = [
  { value: "NONE", label: "미처리" },
  { value: "PRESENT", label: "출석" },
  { value: "ABSENT", label: "결석" },
  { value: "LATE", label: "지각" },
  { value: "EARLY_LEAVE", label: "조퇴" },
  { value: "SICK", label: "병결" },
];

// [woo] 사유 입력이 필요한 상태
const REASON_REQUIRED = ["ABSENT", "LATE", "EARLY_LEAVE", "SICK"];

// [woo] 사유 빠른 선택 옵션 (상태별)
const QUICK_REASONS: Record<string, string[]> = {
  ABSENT: ["가정 사정", "병원 방문", "경조사", "기타"],
  LATE: ["교통 지연", "병원 방문 후 등교", "가정 사정", "기타"],
  EARLY_LEAVE: ["병원 예약", "가정 사정", "컨디션 난조", "기타"],
  SICK: ["감기/독감", "복통/두통", "코로나 의심", "병원 진료", "기타"],
};

const today = new Date().toISOString().slice(0, 10);

export default function StudentAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(today);
  // [soojin] 달력 아이콘 클릭 시 날짜 picker 열기용 ref
  const datePickerRef = useRef<HTMLInputElement>(null);
  const [myGrade, setMyGrade] = useState<number | null>(null);
  const [myClassNum, setMyClassNum] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processedDays, setProcessedDays] = useState(0);
  const [currentDay, setCurrentDay] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchName, setSearchName] = useState("");
  // [woo] 상태 필터 (카드 클릭 시 해당 상태 학생만 표시, null이면 전체)
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  // [soojin] 월별 출석률 통계 - 날짜와 독립적으로 월 선택 가능
  const [monthlyStats, setMonthlyStats] = useState({
    rate: 0,
    presentCount: 0,
    lateCount: 0,
    earlyLeaveCount: 0,
    absentCount: 0,
    sickCount: 0,
    totalCount: 0,
  });
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());
  const [statsMonth, setStatsMonth] = useState(new Date().getMonth() + 1);

  // [woo] 사유 입력 모달 상태
  const [reasonModal, setReasonModal] = useState<{
    open: boolean;
    studentInfoId: number;
    studentName: string;
    newStatus: string;
    reason: string;
  }>({ open: false, studentInfoId: 0, studentName: "", newStatus: "", reason: "" });

  // [woo] 모달 열림 시 배경 스크롤 잠금
  useEffect(() => {
    if (reasonModal.open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [reasonModal.open]);

  // [soojin] 월별 출석률 조회 - statsYear/statsMonth 변경 시 재조회
  useEffect(() => {
    api
      .get(`/attendance/student/monthly-stats?year=${statsYear}&month=${statsMonth}`)
      .then((res) =>
        setMonthlyStats({
          rate: res.data?.rate ?? 0,
          presentCount: res.data?.presentCount ?? 0,
          lateCount: res.data?.lateCount ?? 0,
          earlyLeaveCount: res.data?.earlyLeaveCount ?? 0,
          absentCount: res.data?.absentCount ?? 0,
          sickCount: res.data?.sickCount ?? 0,
          totalCount: res.data?.totalCount ?? 0,
        }),
      )
      .catch(() => {});
  }, [statsYear, statsMonth]);

  // [woo] 이번 달 출결 처리 일수 조회
  const fetchProcessedDays = useCallback(() => {
    api
      .get("/attendance/student/processed-days")
      .then((res) => {
        setProcessedDays(res.data?.processedDays ?? 0);
        setCurrentDay(res.data?.currentDay ?? 0);
      })
      .catch(() => {});
  }, []);

  // [woo] 출결 목록 조회
  const fetchRecords = useCallback((d: string) => {
    setLoading(true);
    setErrorMsg(null);
    api
      .get(`/attendance/student?date=${d}`)
      .then((res) => {
        if (res.data?.error) {
          setErrorMsg(res.data.error);
          setRecords([]);
        } else {
          setRecords(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.error || err.response?.data?.message || "출결 데이터를 불러올 수 없습니다.";
        setErrorMsg(msg);
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // [woo] 페이지 진입 시 담임 반 정보 + 출결 목록 조회
  useEffect(() => {
    api
      .get("/attendance/student/myclass")
      .then((res) => {
        if (res.data.grade) {
          setMyGrade(res.data.grade);
          setMyClassNum(res.data.classNum);
        }
      })
      .catch(() => {})
      .finally(() => {
        fetchRecords(today);
        fetchProcessedDays();
      });
  }, [fetchRecords, fetchProcessedDays]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    fetchRecords(newDate);
  };

  // [woo] 이전일/다음일/오늘 이동
  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    handleDateChange(d.toISOString().slice(0, 10));
  };
  const goToday = () => handleDateChange(today);

  // [soojin] 통계 월 이동
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

  // [woo] 요일 표시
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
  const selectedDate = new Date(date);
  const dayOfWeek = DAY_NAMES[selectedDate.getDay()];
  const isToday = date === today;
  const isWeekend = dayOfWeek === "토" || dayOfWeek === "일";

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
  const selMmdd = date.slice(5); // "MM-DD"
  const selYear = selectedDate.getFullYear();
  const allHolidays = { ...FIXED_HOLIDAYS, ...(LUNAR_HOLIDAYS[selYear] ?? {}) };
  const holidayName = allHolidays[selMmdd] ?? null;
  const isHoliday = isWeekend || !!holidayName;
  const holidayLabel = holidayName ? holidayName : dayOfWeek === "토" ? "토요일" : "일요일";

  // [woo] 개별 학생 출결 상태 변경 - 사유 필요 시 모달 오픈
  const handleStatusChange = (studentInfoId: number, status: string, studentName: string) => {
    if (status === "NONE") return;
    if (REASON_REQUIRED.includes(status)) {
      // [woo] 사유 입력 모달 열기
      setReasonModal({ open: true, studentInfoId, studentName, newStatus: status, reason: "" });
    } else {
      // [woo] 출석은 바로 처리
      submitStatusChange(studentInfoId, status, undefined);
    }
  };

  // [woo] 상태 변경 API 호출
  const submitStatusChange = async (studentInfoId: number, status: string, reason?: string) => {
    try {
      await api.put(`/attendance/student/update?studentInfoId=${studentInfoId}&date=${date}`, { status, reason });
      fetchRecords(date);
      fetchProcessedDays();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || "알 수 없는 오류";
      alert(`출결 변경 실패: ${msg}`);
    }
  };

  // [woo] 사유 모달 확인
  const handleReasonSubmit = () => {
    submitStatusChange(reasonModal.studentInfoId, reasonModal.newStatus, reasonModal.reason || undefined);
    setReasonModal({ open: false, studentInfoId: 0, studentName: "", newStatus: "", reason: "" });
  };

  // [woo] 전원출석 처리
  const handleAllPresent = async () => {
    if (!confirm(`${date} 전원 출석 처리하시겠습니까?`)) return;
    try {
      const res = await api.post(`/attendance/student/all-present?date=${date}`);
      alert(res.data?.message || "전원 출석 처리 완료");
      fetchRecords(date);
      fetchProcessedDays();
    } catch (err: any) {
      const msg = err.response?.data?.error || "전원출석 처리에 실패했습니다.";
      alert(msg);
    }
  };

  // [woo] 상태별 카운트
  const noneCount = records.filter((r) => r.status === "NONE").length;
  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const lateCount = records.filter((r) => r.status === "LATE").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const sickCount = records.filter((r) => r.status === "SICK").length;
  const earlyLeaveCount = records.filter((r) => r.status === "EARLY_LEAVE").length;
  const totalCount = records.length;

  // [woo] 학생 이름 검색 + 상태 필터 (카드 클릭)
  const filteredRecords = records.filter((r) => {
    if (searchName.trim() && !r.studentName.includes(searchName.trim())) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  // [soojin] 출석률 + 도넛 차트 세그먼트 계산
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  const circumference = 2 * Math.PI * 45;
  const donutSegments = (() => {
    const segs: { key: string; count: number; color: string }[] = [
      { key: "PRESENT", count: presentCount, color: "#22c55e" },
      { key: "ABSENT", count: absentCount, color: "#ef4444" },
      { key: "LATE", count: lateCount, color: "#f59e0b" },
      { key: "EARLY_LEAVE", count: earlyLeaveCount, color: "#3b82f6" },
      { key: "SICK", count: sickCount, color: "#a855f7" },
      { key: "NONE", count: noneCount, color: "#e5e7eb" },
    ];
    let acc = 0;
    return segs.map((seg) => {
      const len = totalCount > 0 ? (seg.count / totalCount) * circumference : 0;
      const result = { ...seg, len, offset: acc };
      acc += len;
      return result;
    });
  })();

  return (
    <DashboardLayout>
      {/* [soojin] 페이지 헤더 - 카드 없이 타이틀 + 브레드크럼 */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-16 mb-24">
        <div className="d-flex align-items-center gap-16">
          <div>
            <h6 className="fw-bold mb-4">출결 관리</h6>
            <p className="text-secondary-light text-sm mb-0">
              {myGrade && myClassNum
                ? `${myGrade}학년 ${myClassNum}반 학생 출결 현황을 관리합니다`
                : "담당 학생 출결 현황을 관리합니다"}
            </p>
          </div>
        </div>
      </div>

      {/* [soojin] 좌우 분할 레이아웃 - 출결 현황(좌) + 날짜/테이블(우) / 화면 꽉 채우기 */}
      <div style={{ height: "calc(100vh - 4.5rem - 120px)" }}>
        <div className="row g-4" style={{ height: "100%", alignItems: "stretch" }}>
          {/* ── 왼쪽 패널 ── */}
          {/* [soojin] 출결 현황 + 상세 현황 카드 1개로 합침 */}
          <div className="col-xl-3" style={{ height: "100%" }}>
            <div
              className="card border-0 shadow-sm p-24"
              style={{ borderRadius: 12, height: "100%", overflowY: "auto" }}
            >
              {/* 총 학생 수 헤더 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span className="text-secondary-light text-sm">전체 총 학생 수</span>
                <span className="fw-bold">{totalCount}명</span>
              </div>
              {/* 차트(좌) + 범례(우) 가로 배치 */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
                <svg viewBox="0 0 120 120" width={140} height={140} style={{ flexShrink: 0 }}>
                  {totalCount === 0 ? (
                    <circle cx={60} cy={60} r={45} fill="none" stroke="#e5e7eb" strokeWidth={14} />
                  ) : (
                    <g transform="rotate(-90, 60, 60)">
                      {donutSegments
                        .filter((s) => s.len > 0)
                        .map((s) => (
                          <circle
                            key={s.key}
                            cx={60}
                            cy={60}
                            r={45}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={14}
                            strokeDasharray={`${s.len} ${circumference}`}
                            strokeDashoffset={-s.offset}
                          />
                        ))}
                    </g>
                  )}
                  <text x={60} y={56} textAnchor="middle" fontSize={15} fontWeight="bold" fill="#374151">
                    {attendanceRate}%
                  </text>
                  <text x={60} y={70} textAnchor="middle" fontSize={9} fill="#9ca3af">
                    출석률
                  </text>
                </svg>
                {/* [soojin] 범례 - 그래프 오른쪽 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  {[
                    { label: "출석", count: presentCount, color: "#22c55e" },
                    { label: "지각", count: lateCount, color: "#f59e0b" },
                    { label: "조퇴", count: earlyLeaveCount, color: "#3b82f6" },
                    { label: "결석", count: absentCount, color: "#ef4444" },
                    { label: "병결", count: sickCount, color: "#a855f7" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: item.color,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
                        {item.count}명
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* 구분선 */}
              <div style={{ borderTop: "1px solid #f3f4f6", marginBottom: 16 }} />
              {/* [soojin] 월별 출석률 - 월 선택 네비게이션 + 숫자 + 진행 바 */}
              {/* [soojin] 월 네비게이션 */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                <i
                  className="ri-arrow-left-s-line"
                  style={{ fontSize: 16, color: "#6b7280", cursor: "pointer" }}
                  onClick={() => shiftStatsMonth(-1)}
                />
                <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                  {statsYear}년 {statsMonth}월
                </span>
                <i
                  className="ri-arrow-right-s-line"
                  style={{ fontSize: 16, color: "#6b7280", cursor: "pointer" }}
                  onClick={() => shiftStatsMonth(1)}
                />
              </div>
              {/* [soojin] 지각/조퇴/결석/병결 개별 그래프 (출석 제외) */}
              {[
                { label: "지각", count: monthlyStats.lateCount, color: "#f59e0b" },
                { label: "조퇴", count: monthlyStats.earlyLeaveCount, color: "#3b82f6" },
                { label: "결석", count: monthlyStats.absentCount, color: "#ef4444" },
                { label: "병결", count: monthlyStats.sickCount, color: "#a855f7" },
              ].map((item) => {
                const pct = monthlyStats.totalCount > 0 ? Math.round((item.count / monthlyStats.totalCount) * 100) : 0;
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
              {/* [soojin] 총 출석률 + 처리 건수 하단 우측 정렬 */}
              <div style={{ marginTop: 6, textAlign: "right" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  총 출석률 <span style={{ fontWeight: 700, color: "#25A194" }}>{monthlyStats.rate}%</span>
                  <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 4 }}>
                    (총 처리 {monthlyStats.totalCount}건)
                  </span>
                </span>
              </div>
            </div>
          </div>
          {/* /왼쪽 패널 */}

          {/* ── 오른쪽 패널 ── */}
          <div className="col-xl-9" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* [soojin] 검색 + 상태 필터 드롭다운 - 테이블 바깥 왼쪽 상단 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexShrink: 0 }}>
              {/* [soojin] 상태 필터 드롭다운 - TeacherList 커스텀 화살표 패턴 */}
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                <select
                  value={statusFilter ?? ""}
                  onChange={(e) => setStatusFilter(e.target.value || null)}
                  style={{
                    padding: "5px 24px 5px 8px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                    color: "#374151",
                    background: "#fff",
                    cursor: "pointer",
                    appearance: "none",
                    WebkitAppearance: "none",
                  }}
                >
                  <option value="">전체</option>
                  <option value="PRESENT">출석</option>
                  <option value="LATE">지각</option>
                  <option value="EARLY_LEAVE">조퇴</option>
                  <option value="ABSENT">결석</option>
                  <option value="SICK">병결</option>
                </select>
                <i
                  className="ri-arrow-down-s-line"
                  style={{ position: "absolute", right: 4, pointerEvents: "none", fontSize: 16, color: "#6b7280" }}
                />
              </div>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                <i
                  className="ri-search-line"
                  style={{ position: "absolute", left: 8, color: "#9ca3af", fontSize: 13, pointerEvents: "none" }}
                />
                <input
                  type="text"
                  placeholder="이름 검색"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSearchName(searchInput);
                  }}
                  style={{
                    padding: "5px 8px 5px 28px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                    minWidth: 150,
                    background: "#fff",
                  }}
                />
              </div>
              <button
                type="button"
                style={{
                  padding: "5px 12px",
                  background: "#25A194",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                onClick={() => setSearchName(searchInput)}
              >
                검색
              </button>
              <button
                type="button"
                style={{
                  padding: "5px 10px",
                  background: "#fff",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: "pointer",
                  color: "#374151",
                  whiteSpace: "nowrap",
                }}
                onClick={() => {
                  setSearchInput("");
                  setSearchName("");
                  setStatusFilter(null);
                }}
              >
                초기화
              </button>
            </div>

            {/* [soojin] 테이블 카드 - 교사 관리 스타일 / flex:1로 남은 높이 채우기 */}
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
              {/* [soojin] 카드 헤더: 처리현황(left) | 날짜 선택(center) | 전원출석(right) */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #e5e7eb",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {/* left: 처리 현황 */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                  {noneCount > 0 && (
                    <span style={{ fontSize: 13, color: "#d97706", fontWeight: 500 }}>
                      <i className="ri-error-warning-line" style={{ marginRight: 4 }} />
                      미처리 {noneCount}명
                    </span>
                  )}
                </div>
                {/* [soojin] center: 날짜 네비게이션 - 화살표 아이콘만, 요일 input 안에 */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <i
                    className="ri-arrow-left-s-line"
                    style={{ fontSize: 18, color: "#6b7280", cursor: "pointer" }}
                    onClick={() => shiftDate(-1)}
                    title="이전일"
                  />
                  {/* [soojin] date + 요일 표시 / 달력 아이콘 클릭으로만 picker 열기 (showPicker ref 방식) */}
                  {/* [soojin] 글자·아이콘 색 통일(#6b7280), 날짜-(요일) 간격 축소 */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      background: "#fff",
                      padding: "3px 8px",
                      gap: 6,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", whiteSpace: "nowrap" }}>
                        {`${date.slice(0, 4)}.${date.slice(5, 7)}.${date.slice(8, 10)}.`}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          color: dayOfWeek === "토" ? "#2563eb" : dayOfWeek === "일" ? "#dc2626" : "#6b7280",
                        }}
                      >
                        ({dayOfWeek})
                      </span>
                    </span>
                    <i
                      className="ri-calendar-line"
                      style={{ fontSize: 14, color: "#6b7280", cursor: "pointer" }}
                      onClick={() => datePickerRef.current?.showPicker?.()}
                    />
                    <input
                      ref={datePickerRef}
                      type="date"
                      value={date}
                      onChange={(e) => handleDateChange(e.target.value)}
                      style={{ position: "absolute", width: 0, height: 0, opacity: 0, border: "none", padding: 0 }}
                    />
                  </div>
                  <i
                    className="ri-arrow-right-s-line"
                    style={{ fontSize: 18, color: "#6b7280", cursor: "pointer" }}
                    onClick={() => shiftDate(1)}
                    title="다음일"
                  />
                  {/* [soojin] 오늘 버튼 - 항상 공간 확보하여 날짜 위치 고정 */}
                  <div style={{ minWidth: 52 }}>
                    {!isToday && (
                      <button
                        type="button"
                        style={{
                          padding: "3px 10px",
                          background: "#fff",
                          border: "1px solid #25A194",
                          borderRadius: 6,
                          fontSize: 13,
                          cursor: "pointer",
                          color: "#25A194",
                          fontWeight: 500,
                        }}
                        onClick={goToday}
                      >
                        오늘
                      </button>
                    )}
                  </div>
                </div>
                {/* right: 전원출석 */}
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    style={{
                      padding: "5px 12px",
                      background: "#22c55e",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: loading || records.length === 0 || isHoliday ? "not-allowed" : "pointer",
                      opacity: loading || records.length === 0 || isHoliday ? 0.5 : 1,
                      whiteSpace: "nowrap",
                    }}
                    onClick={handleAllPresent}
                    disabled={loading || records.length === 0 || isHoliday}
                  >
                    <i className="ri-checkbox-multiple-line" />
                    전원 출석
                  </button>
                </div>
              </div>

              {/* [woo] 휴일 안내 배너 */}
              {isHoliday && (
                <div
                  style={{
                    padding: "16px",
                    background: "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)",
                    borderBottom: "1px solid #e5e7eb",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <i className="ri-calendar-close-line" style={{ fontSize: 20, color: "#2563eb" }} />
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: 2, color: "#2563eb", fontSize: 13 }}>
                        오늘은 {holidayLabel}, 휴일입니다
                      </p>
                      <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                        휴일에는 출결 처리가 필요하지 않습니다. 이전 날짜 조회는 가능합니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* [soojin] 테이블 - 교사 관리 스타일 / flex:1로 남은 높이 채우기 */}
              <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", minHeight: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <colgroup>
                    <col style={{ width: 60 }} />
                    <col style={{ width: 120 }} />
                    <col />
                    <col style={{ width: 120 }} />
                    <col style={{ width: 130 }} />
                    <col />
                  </colgroup>
                  <thead>
                    <tr>
                      {(["번호", "학번", "이름", "현재 상태", "변경", "사유"] as const).map((h, i) => (
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
                            textAlign: i === 0 || i === 3 || i === 4 ? "center" : "left",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}
                        >
                          불러오는 중...
                        </td>
                      </tr>
                    ) : errorMsg ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "#ef4444" }}
                        >
                          {errorMsg}
                        </td>
                      </tr>
                    ) : filteredRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}
                        >
                          {searchName.trim()
                            ? "검색 결과가 없습니다."
                            : "담당 학생이 없습니다. 관리자에게 담임 배정을 확인하세요."}
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r, idx) => (
                        <tr
                          key={r.studentInfoId}
                          style={
                            r.status === "ABSENT" || r.status === "SICK"
                              ? { backgroundColor: "rgba(239, 68, 68, 0.04)" }
                              : r.status === "NONE"
                                ? { backgroundColor: "rgba(245, 158, 11, 0.04)" }
                                : undefined
                          }
                        >
                          <td
                            style={{
                              padding: "16px",
                              fontSize: 13,
                              color: "#6b7280",
                              borderBottom: "1px solid #f3f4f6",
                              verticalAlign: "middle",
                              textAlign: "center",
                            }}
                          >
                            {idx + 1}
                          </td>
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
                            {r.studentNumber}
                          </td>
                          <td
                            style={{
                              padding: "16px",
                              fontSize: 13,
                              color: "#374151",
                              borderBottom: "1px solid #f3f4f6",
                              verticalAlign: "middle",
                            }}
                          >
                            {r.studentName}
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
                              className={`badge px-10 py-4 radius-4 text-xs fw-medium ${ATTENDANCE_BADGE[r.status] ?? "bg-neutral-100 text-secondary-light"}`}
                            >
                              {r.statusDesc ?? r.status}
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
                            <select
                              style={{
                                padding: "4px 8px",
                                border: "1px solid #d1d5db",
                                borderRadius: 6,
                                fontSize: 13,
                                background: "#fff",
                                maxWidth: 110,
                              }}
                              value={r.status}
                              onChange={(e) => handleStatusChange(r.studentInfoId, e.target.value, r.studentName)}
                              disabled={isHoliday}
                            >
                              {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
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
                            {r.reason ? (
                              <span title={r.reason}>
                                <i className="ri-chat-3-line" style={{ marginRight: 4, color: "#25A194" }} />
                                {r.reason.length > 15 ? r.reason.slice(0, 15) + "..." : r.reason}
                              </span>
                            ) : r.status !== "PRESENT" && r.status !== "NONE" ? (
                              <button
                                type="button"
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  color: "#25A194",
                                  fontSize: 13,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                                onClick={() =>
                                  setReasonModal({
                                    open: true,
                                    studentInfoId: r.studentInfoId,
                                    studentName: r.studentName,
                                    newStatus: r.status,
                                    reason: "",
                                  })
                                }
                              >
                                <i className="ri-edit-line" />
                                사유 입력
                              </button>
                            ) : (
                              <span style={{ color: "#d1d5db" }}>-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* /오른쪽 패널 */}
        </div>
      </div>
      {/* /row */}

      {/* [woo] 사유 입력 모달 */}
      {reasonModal.open && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setReasonModal({ ...reasonModal, open: false })}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title fw-bold">
                  {reasonModal.studentName} - {STATUS_OPTIONS.find((o) => o.value === reasonModal.newStatus)?.label}{" "}
                  사유
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setReasonModal({ ...reasonModal, open: false })}
                />
              </div>
              <div className="modal-body px-24 py-20">
                {/* [woo] 빠른 선택 버튼 */}
                <p className="text-sm fw-medium mb-8 text-secondary-light">빠른 선택</p>
                <div className="d-flex flex-wrap gap-8 mb-16">
                  {(QUICK_REASONS[reasonModal.newStatus] ?? []).map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`btn btn-sm radius-4 ${
                        reasonModal.reason === r ? "btn-primary-600 text-white" : "btn-outline-neutral-500"
                      }`}
                      onClick={() => setReasonModal({ ...reasonModal, reason: r === "기타" ? "" : r })}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {/* [woo] 직접 입력 */}
                <p className="text-sm fw-medium mb-8 text-secondary-light">직접 입력</p>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="사유를 입력하세요 (선택)"
                  value={reasonModal.reason}
                  onChange={(e) => setReasonModal({ ...reasonModal, reason: e.target.value })}
                  maxLength={200}
                />
                <p className="text-xs text-secondary-light mt-4 mb-0 text-end">{reasonModal.reason.length}/200</p>
              </div>
              <div className="modal-footer border-top px-24 py-16">
                <button
                  type="button"
                  className="btn btn-outline-neutral-500 px-20"
                  onClick={() => setReasonModal({ ...reasonModal, open: false })}
                >
                  취소
                </button>
                <button type="button" className="btn btn-primary-600 px-20" onClick={handleReasonSubmit}>
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
