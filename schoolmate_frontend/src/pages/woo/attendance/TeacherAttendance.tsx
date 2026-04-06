import { useEffect, useState } from "react";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo] /attendance/teacher - 교사 출결 관리 (TEACHER, ADMIN)

interface TeacherAttendanceRecord {
  id: number;
  teacherName: string;
  teacherCode?: string;
  department?: string;
  date: string;
  status: string;
  statusDesc?: string;
  reason?: string;
}

const ATTENDANCE_BADGE: Record<string, string> = {
  PRESENT: "bg-success-100 text-success-600",
  ABSENT: "bg-danger-100 text-danger-600",
  LATE: "bg-warning-100 text-warning-600",
  EARLY_LEAVE: "bg-info-100 text-info-600",
  LEAVE: "bg-neutral-100 text-secondary-light",
};

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "출근" },
  { value: "ABSENT", label: "결근" },
  { value: "LATE", label: "지각" },
  { value: "EARLY_LEAVE", label: "조퇴" },
  { value: "LEAVE", label: "휴가" },
];

const today = new Date().toISOString().slice(0, 10);

export default function TeacherAttendance() {
  const [records, setRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(today);

  const fetchRecords = (d = date) => {
    setLoading(true);
    api
      .get(`/attendance/teacher?date=${d}`)
      .then((res) => setRecords(res.data))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.put(`/attendance/teacher/${id}`, { status });
      fetchRecords();
    } catch {
      alert("출결 변경에 실패했습니다.");
    }
  };

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">출결 관리</h6>
          <p className="text-neutral-600 mt-4 mb-0">교사 출결 현황</p>
        </div>
      </div>

      <div className="card radius-12">
        <div className="card-header py-16 px-24 border-bottom">
          <div className="d-flex flex-wrap align-items-center gap-12">
            <div>
              <label className="form-label fw-semibold text-sm mb-4">날짜</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ maxWidth: 160 }}
              />
            </div>
            <div className="mt-auto">
              <button type="button" className="btn btn-primary-600 radius-8" onClick={() => fetchRecords()}>
                <iconify-icon icon="ion:search-outline" className="me-4" />
                조회
              </button>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col">이름</th>
                  <th scope="col">사번</th>
                  <th scope="col">부서</th>
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
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-24 text-secondary-light">
                      출결 기록이 없습니다.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <div className="w-36-px h-36-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                            <iconify-icon icon="mdi:account-tie" className="text-primary-600" />
                          </div>
                          <span className="fw-medium">{r.teacherName}</span>
                        </div>
                      </td>
                      <td className="text-secondary-light">{r.teacherCode ?? "-"}</td>
                      <td className="text-secondary-light">{r.department ?? "-"}</td>
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
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
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
