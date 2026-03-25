import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/auth";
import DashboardLayout from "../../../components/layout/DashboardLayout";

// [woo] /attendance/parent - 학부모 자녀 출결 현황 조회
// 자녀 선택 없이 바로 출결 기록 표시, 다자녀 시 탭 전환
// 월별 선택, 출석률 표시, 결석/지각 행 강조 포함

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

// [woo] 월 옵션 생성 (올해 1월 ~ 현재 월)
function getMonthOptions() {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth();
  const options = [];
  for (let m = 0; m <= currentMonth; m++) {
    options.push({
      value: m,
      label: `${year}년 ${m + 1}월`,
      startDate: new Date(year, m, 1).toISOString().slice(0, 10),
      endDate: new Date(year, m + 1, 0).toISOString().slice(0, 10),
    });
  }
  return options.reverse(); // [woo] 최신 월이 위에
}

// [woo] 출석률 계산
function calcAttendanceRate(statusCounts: Record<string, number>, totalDays: number) {
  if (totalDays === 0) return 0;
  const present = statusCounts["PRESENT"] ?? 0;
  return Math.round((present / totalDays) * 100);
}

export default function ParentAttendance() {
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value ?? 0);
  const [summaries, setSummaries] = useState<ChildSummary[]>([]);
  const [records, setRecords] = useState<ChildRecord[]>([]);
  const [activeChildIdx, setActiveChildIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // [woo] 현재 선택된 월의 날짜 범위
  const currentMonthOption = monthOptions.find((m) => m.value === selectedMonth) ?? monthOptions[0];
  const startDate = currentMonthOption?.startDate ?? "";
  const endDate = currentMonthOption?.endDate ?? "";

  // [woo] 현재 활성 자녀
  const activeChild = summaries[activeChildIdx] ?? null;

  // [woo] 자녀 출결 상세 기록 조회
  const fetchRecords = (child: ChildSummary) => {
    setRecordsLoading(true);
    api
      .get(`/attendance/parent/children/${child.studentInfoId}?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => setRecords(res.data))
      .catch(() => setRecords([]))
      .finally(() => setRecordsLoading(false));
  };

  // [woo] 월 변경 시 요약 + 첫 번째 자녀 상세 자동 조회
  useEffect(() => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setRecords([]);
    api
      .get(`/attendance/parent/summary?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => {
        const data = res.data ?? [];
        setSummaries(data);
        // [woo] 첫 번째 자녀 상세 기록 자동 로드
        if (data.length > 0) {
          const idx = activeChildIdx < data.length ? activeChildIdx : 0;
          setActiveChildIdx(idx);
          fetchRecords(data[idx]);
        }
      })
      .catch(() => setSummaries([]))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  // [woo] 자녀 탭 전환
  const handleTabChange = (idx: number) => {
    setActiveChildIdx(idx);
    if (summaries[idx]) {
      fetchRecords(summaries[idx]);
    }
  };

  return (
    <DashboardLayout>
      {/* [woo] 브레드크럼 */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <ul className="d-flex align-items-center gap-2 mb-0">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary text-sm">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />홈
            </Link>
          </li>
          <li className="text-secondary-light">-</li>
          <li className="fw-medium text-sm text-primary-600">출결 현황</li>
        </ul>
      </div>

      {/* [woo] 상단 헤더 + 월 선택 */}
      <div className="card border-0 shadow-sm p-24 mb-24" style={{ borderRadius: 12 }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-16">
          <div className="d-flex align-items-center gap-16">
            <div className="w-56-px h-56-px rounded-circle bg-primary-600 d-flex align-items-center justify-content-center flex-shrink-0">
              <i className="ri-parent-line text-white text-2xl" />
            </div>
            <div>
              <h5 className="fw-bold mb-4">자녀 출결 현황</h5>
              <p className="text-secondary-light text-sm mb-0">자녀의 출결 요약 및 상세 기록을 확인합니다</p>
            </div>
          </div>
          {/* [woo] 월 선택 드롭다운 */}
          <select
            className="form-select form-select-sm fw-medium"
            style={{ maxWidth: 160 }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
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
          {/* [woo] 다자녀일 때 탭 표시 */}
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

          {/* [woo] 출결 요약 카드 (활성 자녀) */}
          {activeChild && (
            <div className="card radius-12 border-0 shadow-sm mb-24">
              <div className="card-body">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-16">
                  {/* [woo] 자녀 정보 */}
                  <div className="d-flex align-items-center gap-12">
                    <div className="w-48-px h-48-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                      <iconify-icon icon="mdi:account-school" className="text-primary-600 text-2xl" />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-2">{activeChild.childName}</h6>
                      <span className="text-secondary-light text-sm">
                        {activeChild.grade}학년 {activeChild.classNum}반 ({activeChild.studentNumber})
                      </span>
                    </div>
                  </div>

                  {/* [woo] 상태별 카운트 + 출석률 */}
                  <div className="d-flex align-items-center gap-20">
                    <div className="d-flex flex-wrap gap-36">
                      {Object.entries(activeChild.statusCounts).map(([status, count]) => (
                        <div key={status} className="text-center">
                          <span
                            className={`badge px-10 py-4 radius-4 text-xs fw-medium ${
                              STATUS_BADGE[status] ?? "bg-neutral-100 text-secondary-light"
                            }`}
                          >
                            {STATUS_LABELS[status] ?? status}
                          </span>
                          <div className="fw-semibold mt-4">{count}</div>
                        </div>
                      ))}
                    </div>
                    {/* [woo] 출석률 */}
                    <div className="text-center" style={{ minWidth: 60 }}>
                      {(() => {
                        const rate = calcAttendanceRate(activeChild.statusCounts, activeChild.totalDays);
                        return (
                          <>
                            <div
                              className={`fw-bold text-xl ${
                                rate >= 90 ? "text-success-600" : rate >= 70 ? "text-warning-600" : "text-danger-600"
                              }`}
                            >
                              {rate}%
                            </div>
                            <span className="text-xs text-secondary-light">출석률</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* [woo] 출결 기록 테이블 — 바로 표시 */}
          <div className="card radius-12">
            <div className="card-header py-16 px-24 border-bottom d-flex align-items-center justify-content-between">
              <h6 className="fw-semibold mb-0">{activeChild?.childName} 출결 기록</h6>
              <span className="text-sm text-secondary-light">
                {currentMonthOption?.label} | 총 {activeChild?.totalDays ?? 0}일
              </span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table bordered-table mb-0">
                  <thead>
                    <tr>
                      <th scope="col">날짜</th>
                      <th scope="col">요일</th>
                      <th scope="col" className="text-center">
                        상태
                      </th>
                      <th scope="col">출석 시간</th>
                      <th scope="col">사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordsLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-24 text-secondary-light">
                          불러오는 중...
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-24 text-secondary-light">
                          이 달의 출결 기록이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      records.map((r) => {
                        const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
                        const day = dayNames[new Date(r.attendanceDate).getDay()];
                        const isIssue = r.status === "ABSENT" || r.status === "SICK";
                        return (
                          <tr key={r.id} style={isIssue ? { backgroundColor: "rgba(239, 68, 68, 0.04)" } : undefined}>
                            <td>{r.attendanceDate}</td>
                            <td>
                              <span
                                className={`text-sm ${day === "토" ? "text-primary-600" : day === "일" ? "text-danger-600" : "text-secondary-light"}`}
                              >
                                ({day})
                              </span>
                            </td>
                            <td className="text-center">
                              <span
                                className={`badge px-10 py-4 radius-4 text-xs fw-medium ${
                                  STATUS_BADGE[r.status] ?? "bg-neutral-100 text-secondary-light"
                                }`}
                              >
                                {r.statusDesc ?? r.status}
                              </span>
                            </td>
                            <td className="text-secondary-light">
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
                            <td className="text-secondary-light">{r.reason ?? "-"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
