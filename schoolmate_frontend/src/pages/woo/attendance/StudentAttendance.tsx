import { useEffect, useState, useCallback } from "react";
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
  const [myGrade, setMyGrade] = useState<number | null>(null);
  const [myClassNum, setMyClassNum] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processedDays, setProcessedDays] = useState(0);
  const [currentDay, setCurrentDay] = useState(0);
  const [searchName, setSearchName] = useState("");
  // [woo] 상태 필터 (카드 클릭 시 해당 상태 학생만 표시, null이면 전체)
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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
    return () => { document.body.style.overflow = ""; };
  }, [reasonModal.open]);

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
      "01-28": "설날 연휴", "01-29": "설날", "01-30": "설날 연휴",
      "05-05": "부처님 오신 날", "05-06": "대체공휴일 (어린이날)",
      "10-05": "추석 연휴", "10-06": "추석", "10-07": "추석 연휴", "10-08": "대체공휴일 (추석)",
    },
    2026: {
      "02-16": "설날 연휴", "02-17": "설날", "02-18": "설날 연휴",
      "03-02": "대체공휴일 (삼일절)",
      "05-24": "부처님 오신 날", "05-25": "대체공휴일 (부처님 오신 날)",
      "09-24": "추석 연휴", "09-25": "추석", "09-26": "추석 연휴",
    },
    2027: {
      "02-05": "설날 연휴", "02-06": "설날", "02-07": "설날 연휴", "02-08": "대체공휴일 (설날)",
      "05-13": "부처님 오신 날",
      "10-14": "추석 연휴", "10-15": "추석", "10-16": "추석 연휴",
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

  return (
    <DashboardLayout>
      {/* [woo] 상단 헤더 - 타이틀 + 학급 뱃지 */}
      <div className="card border-0 shadow-sm p-24 mb-24" style={{ borderRadius: 12 }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-16">
          <div className="d-flex align-items-center gap-16">
            <div className="w-56-px h-56-px rounded-circle bg-primary-600 d-flex align-items-center justify-content-center flex-shrink-0">
              <i className="ri-calendar-check-line text-white text-2xl" />
            </div>
            <div>
              <h5 className="fw-bold mb-4">출결 관리</h5>
              <p className="text-secondary-light text-sm mb-0">
                {myGrade && myClassNum
                  ? `${myGrade}학년 ${myClassNum}반 학생 출결 현황을 관리합니다`
                  : "담당 학생 출결 현황을 관리합니다"}
              </p>
            </div>
          </div>
          <ul className="d-flex align-items-center gap-2 mb-0">
            <li className="fw-medium">
              <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary text-sm">
                <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />홈
              </Link>
            </li>
            <li className="text-secondary-light">-</li>
            <li className="fw-medium text-sm text-primary-600">출결 관리</li>
          </ul>
        </div>
      </div>

      {/* [woo] 상단 통계 카드 - 클릭하면 해당 상태 학생만 필터링 */}
      <div className="row gy-4 mb-24">
        {([
          { key: null, label: "전체", count: totalCount, icon: "ri-group-line", bg: "bg-primary-100", text: "text-primary-600", border: "border-primary-600" },
          { key: "PRESENT", label: "출석", count: presentCount, icon: "ri-checkbox-circle-line", bg: "bg-success-100", text: "text-success-600", border: "border-success-600" },
          { key: "ABSENT", label: "결석", count: absentCount, icon: "ri-close-circle-line", bg: "bg-danger-100", text: "text-danger-600", border: "border-danger-600" },
          { key: "LATE", label: "지각", count: lateCount, icon: "ri-time-line", bg: "bg-warning-100", text: "text-warning-600", border: "border-warning-600" },
          { key: "EARLY_LEAVE", label: "조퇴", count: earlyLeaveCount, icon: "ri-logout-box-r-line", bg: "bg-info-100", text: "text-info-600", border: "border-info-600" },
          { key: "SICK", label: "병결", count: sickCount, icon: "ri-hospital-line", bg: "bg-lilac-100", text: "text-lilac-600", border: "border-lilac-600" },
        ] as const).map((card) => (
          <div key={card.label} className="col-xl-2 col-sm-4 col-6">
            <button
              type="button"
              className={`card shadow-sm p-16 h-100 w-100 text-start ${
                statusFilter === card.key ? `border-2 ${card.border}` : "border-0"
              }`}
              style={{
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.15s ease",
                outline: statusFilter === card.key ? "none" : undefined,
                boxShadow: statusFilter === card.key ? `0 0 0 2px var(--bs-${card.text.replace("text-", "").replace("-600", "")}, currentColor)` : undefined,
              }}
              onClick={() => setStatusFilter(statusFilter === card.key ? null : card.key)}
            >
              <div className="d-flex align-items-center gap-10">
                <div className={`w-40-px h-40-px rounded-circle ${card.bg} d-flex align-items-center justify-content-center flex-shrink-0`}>
                  <i className={`${card.icon} ${card.text} text-lg`} />
                </div>
                <div>
                  <p className="text-secondary-light text-xs mb-2">{card.label}</p>
                  <h6 className="fw-bold mb-0">{card.count}<span className="text-xs fw-normal text-secondary-light">명</span></h6>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* [woo] 날짜 선택 + 전원출석 + 미처리 알림 + 검색 */}
      <div className="card border-0 shadow-sm p-20 mb-24" style={{ borderRadius: 12 }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-16">
          <div className="d-flex flex-wrap align-items-center gap-16">
            {/* [woo] 날짜 네비게이션: 이전일 / 캘린더 + 요일 / 다음일 / 오늘 */}
            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-outline-neutral-500 px-10 py-6"
                onClick={() => shiftDate(-1)}
                title="이전일"
              >
                <i className="ri-arrow-left-s-line text-lg" />
              </button>
              <div className="d-flex align-items-center gap-8">
                <input
                  type="date"
                  className="form-control fw-medium"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  style={{ maxWidth: 170 }}
                />
                <span
                  className={`badge px-10 py-6 radius-4 fw-bold text-sm ${
                    dayOfWeek === "토"
                      ? "bg-primary-100 text-primary-600"
                      : dayOfWeek === "일"
                        ? "bg-danger-100 text-danger-600"
                        : "bg-neutral-100 text-secondary-light"
                  }`}
                >
                  ({dayOfWeek})
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-neutral-500 px-10 py-6"
                onClick={() => shiftDate(1)}
                title="다음일"
              >
                <i className="ri-arrow-right-s-line text-lg" />
              </button>
              {!isToday && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary-600 px-12 py-6 fw-medium text-sm"
                  onClick={goToday}
                >
                  오늘
                </button>
              )}
            </div>
            {/* [woo] 미처리 경고 + 이번달 처리 현황 */}
            <div className="d-flex align-items-center gap-12">
              {noneCount > 0 && (
                <span className="text-warning-600 text-sm fw-medium">
                  <i className="ri-error-warning-line me-4" />
                  미처리 {noneCount}명
                </span>
              )}
              <span className="text-secondary-light text-sm">
                <i className="ri-calendar-check-line me-4" />
                이번달 {processedDays}/{currentDay}일 처리
              </span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-12">
            {/* [woo] 학생 이름 검색 */}
            <div className="d-flex align-items-center gap-8">
              <i className="ri-search-line text-secondary-light" />
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="이름 검색"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{ maxWidth: 120 }}
              />
            </div>
            <button
              type="button"
              className="btn btn-success-600 d-flex align-items-center gap-8 px-20 py-10"
              onClick={handleAllPresent}
              disabled={loading || records.length === 0 || isHoliday}
            >
              <i className="ri-checkbox-multiple-line text-lg" />
              전원출석
            </button>
          </div>
        </div>
      </div>

      {/* [woo] 휴일 안내 배너 (주말 + 공휴일) */}
      {isHoliday && (
        <div className="card border-0 mb-24 p-20" style={{ borderRadius: 12, background: "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)" }}>
          <div className="d-flex align-items-center gap-12">
            <i className="ri-calendar-close-line text-primary-600 text-2xl" />
            <div>
              <p className="fw-semibold mb-2 text-primary-600">오늘은 {holidayLabel}, 휴일입니다</p>
              <p className="text-sm text-secondary-light mb-0">휴일에는 출결 처리가 필요하지 않습니다. 이전 날짜 조회는 가능합니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* [woo] 출결 테이블 */}
      <div className="card radius-12">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col" style={{ width: 60 }}>번호</th>
                  <th scope="col">학번</th>
                  <th scope="col">이름</th>
                  <th scope="col" className="text-center">현재 상태</th>
                  <th scope="col" className="text-center" style={{ width: 120 }}>변경</th>
                  <th scope="col">사유</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-24 text-secondary-light">
                      불러오는 중...
                    </td>
                  </tr>
                ) : errorMsg ? (
                  <tr>
                    <td colSpan={6} className="text-center py-24 text-danger-600">
                      {errorMsg}
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-24 text-secondary-light">
                      {searchName.trim() ? "검색 결과가 없습니다." : "담당 학생이 없습니다. 관리자에게 담임 배정을 확인하세요."}
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
                      <td className="text-secondary-light text-center">{idx + 1}</td>
                      <td className="fw-medium">{r.studentNumber}</td>
                      <td>{r.studentName}</td>
                      <td className="text-center">
                        <span
                          className={`badge px-10 py-4 radius-4 text-xs fw-medium ${ATTENDANCE_BADGE[r.status] ?? "bg-neutral-100 text-secondary-light"}`}
                        >
                          {r.statusDesc ?? r.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <select
                          className="form-select form-select-sm"
                          style={{ maxWidth: 100 }}
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
                      <td className="text-secondary-light text-sm">
                        {r.reason ? (
                          <span title={r.reason}>
                            <i className="ri-chat-3-line me-4 text-primary-600" />
                            {r.reason.length > 15 ? r.reason.slice(0, 15) + "..." : r.reason}
                          </span>
                        ) : (
                          r.status !== "PRESENT" && r.status !== "NONE" ? (
                            <button
                              type="button"
                              className="btn btn-sm text-primary-600 p-0"
                              onClick={() => setReasonModal({
                                open: true,
                                studentInfoId: r.studentInfoId,
                                studentName: r.studentName,
                                newStatus: r.status,
                                reason: "",
                              })}
                            >
                              <i className="ri-edit-line me-4" />사유 입력
                            </button>
                          ) : (
                            <span className="text-neutral-300">-</span>
                          )
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

      {/* [woo] 사유 입력 모달 */}
      {reasonModal.open && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setReasonModal({ ...reasonModal, open: false })}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title fw-bold">
                  {reasonModal.studentName} - {STATUS_OPTIONS.find(o => o.value === reasonModal.newStatus)?.label} 사유
                </h6>
                <button type="button" className="btn-close" onClick={() => setReasonModal({ ...reasonModal, open: false })} />
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
                        reasonModal.reason === r
                          ? "btn-primary-600 text-white"
                          : "btn-outline-neutral-500"
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
                <button
                  type="button"
                  className="btn btn-primary-600 px-20"
                  onClick={handleReasonSubmit}
                >
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
