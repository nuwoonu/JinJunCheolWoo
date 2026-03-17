import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo] /attendance/student - 학생 출결 관리 (TEACHER)
// 담임 반 학생 목록을 보여주고, 교사가 직접 상태를 설정/변경
// "전원출석" 버튼으로 일괄 출석 처리 가능

interface AttendanceRecord {
  id: number;
  studentInfoId: number;
  studentName: string;
  studentNumber: string;
  year: number;
  classNum: number;
  date: string;
  status: string; // PRESENT, ABSENT, LATE, EARLY_LEAVE, NONE(미처리)
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
  const dayOfWeek = DAY_NAMES[new Date(date).getDay()];
  const isToday = date === today;

  // [woo] 개별 학생 출결 상태 변경 (studentInfoId 기반)
  const handleStatusChange = async (studentInfoId: number, status: string) => {
    if (status === "NONE") return; // 미처리 선택은 무시
    try {
      await api.put(`/attendance/student/update?studentInfoId=${studentInfoId}&date=${date}`, { status });
      fetchRecords(date);
      fetchProcessedDays();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || "알 수 없는 오류";
      alert(`출결 변경 실패: ${msg}`);
    }
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
  const totalCount = records.length;

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

      {/* [woo] 상단 통계 카드 */}
      <div className="row gy-4 mb-24">
        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm p-20 h-100" style={{ borderRadius: 12 }}>
            <div className="d-flex align-items-center gap-12">
              <div className="w-48-px h-48-px rounded-circle bg-primary-100 d-flex align-items-center justify-content-center flex-shrink-0">
                <i className="ri-group-line text-primary-600 text-xl" />
              </div>
              <div>
                <p className="text-secondary-light text-sm mb-2">전체 학생</p>
                <h5 className="fw-bold mb-0">
                  {totalCount}
                  <span className="text-sm fw-normal text-secondary-light">명</span>
                </h5>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm p-20 h-100" style={{ borderRadius: 12 }}>
            <div className="d-flex align-items-center gap-12">
              <div className="w-48-px h-48-px rounded-circle bg-success-100 d-flex align-items-center justify-content-center flex-shrink-0">
                <i className="ri-checkbox-circle-line text-success-600 text-xl" />
              </div>
              <div>
                <p className="text-secondary-light text-sm mb-2">출석</p>
                <h5 className="fw-bold mb-0">
                  {presentCount}
                  <span className="text-sm fw-normal text-secondary-light">명</span>
                </h5>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm p-20 h-100" style={{ borderRadius: 12 }}>
            <div className="d-flex align-items-center gap-12">
              <div className="w-48-px h-48-px rounded-circle bg-warning-100 d-flex align-items-center justify-content-center flex-shrink-0">
                <i className="ri-time-line text-warning-600 text-xl" />
              </div>
              <div>
                <p className="text-secondary-light text-sm mb-2">지각 / 결석</p>
                <h5 className="fw-bold mb-0">
                  {lateCount + absentCount}
                  <span className="text-sm fw-normal text-secondary-light">명</span>
                </h5>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm p-20 h-100" style={{ borderRadius: 12 }}>
            <div className="d-flex align-items-center gap-12">
              <div className="w-48-px h-48-px rounded-circle bg-info-100 d-flex align-items-center justify-content-center flex-shrink-0">
                <i className="ri-calendar-check-line text-info-600 text-xl" />
              </div>
              <div>
                <p className="text-secondary-light text-sm mb-2">이번달 처리</p>
                <h5 className="fw-bold mb-0">
                  {processedDays}
                  <span className="text-sm fw-normal text-secondary-light">/{currentDay}일</span>
                </h5>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* [woo] 날짜 선택 + 전원출석 + 미처리 알림 */}
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
            {noneCount > 0 && (
              <span className="text-warning-600 text-sm fw-medium">
                <i className="ri-error-warning-line me-4" />
                미처리 {noneCount}명
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-success-600 d-flex align-items-center gap-8 px-20 py-10"
            onClick={handleAllPresent}
            disabled={loading || records.length === 0}
          >
            <i className="ri-checkbox-multiple-line text-lg" />
            전원출석
          </button>
        </div>
      </div>

      {/* [woo] 출결 테이블 */}
      <div className="card radius-12">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col">학번</th>
                  <th scope="col">이름</th>
                  <th scope="col">학년/반</th>
                  <th scope="col">날짜</th>
                  <th scope="col" className="text-center">
                    현재 상태
                  </th>
                  <th scope="col" className="text-center">
                    변경
                  </th>
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
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-24 text-secondary-light">
                      담당 학생이 없습니다. 관리자에게 담임 배정을 확인하세요.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.studentInfoId}>
                      <td className="fw-medium">{r.studentNumber}</td>
                      <td>{r.studentName}</td>
                      <td className="text-secondary-light">
                        {r.year}학년 {r.classNum}반
                      </td>
                      <td className="text-secondary-light">{r.date}</td>
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
                          onChange={(e) => handleStatusChange(r.studentInfoId, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
