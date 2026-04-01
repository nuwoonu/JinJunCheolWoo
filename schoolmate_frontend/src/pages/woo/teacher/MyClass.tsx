import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo] /teacher/myclass - 담당 학급 현황 페이지 (Thymeleaf teacher/myclass/index.html 마이그레이션)

interface Student {
  studentId: number;
  name: string;
  studentNumber: number;
  phone?: string;
  email?: string;
}

interface ClassInfo {
  classroomId: number;
  year: number;
  grade: number;
  classNum: number;
  className: string;
  totalStudents: number;
  homeroomTeacherName?: string;
  students: Student[];
}

export default function TeacherMyClass() {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/teacher/myclass")
      .then((res) => {
        const data = res.data;
        if (data.hasClassroom === false) {
          setErrorMessage(data.message ?? "담당 학급이 없습니다.");
        } else {
          setClassInfo(data);
        }
      })
      .catch(() => setErrorMessage("학급 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">나의 학급</h6>
          <p className="text-neutral-600 mt-4 mb-0">학급 현황</p>
        </div>
      </div>

      {loading && <div className="text-center py-48 text-secondary-light">불러오는 중...</div>}

      {/* 학급 없음 */}
      {!loading && errorMessage && (
        <div className="card">
          <div className="card-body text-center py-48">
            <iconify-icon
              icon="mdi:account-group-outline"
              className="text-neutral-400 mb-16"
              style={{ fontSize: 64 }}
            />
            <h5 className="text-neutral-600 mb-8">담당 학급이 없습니다</h5>
            <p className="text-neutral-500 mb-0">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 학급 정보 */}
      {!loading && classInfo && (
        <div className="row gy-4">
          {/* 학급 정보 카드 */}
          <div className="col-xxl-4 col-lg-6">
            <div className="card radius-12 h-100">
              <div className="card-body p-24">
                <div className="d-flex align-items-center gap-16 mb-24">
                  <div className="w-64-px h-64-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center">
                    <iconify-icon icon="mdi:google-classroom" className="text-primary-600 text-3xl" />
                  </div>
                  <div>
                    <h6 className="mb-4">학급 정보</h6>
                    <span className="text-secondary-light">{classInfo.year}학년도</span>
                  </div>
                </div>
                <div className="d-flex flex-column gap-12">
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary-light">학년</span>
                    <span className="fw-semibold">{classInfo.grade}학년</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary-light">반</span>
                    <span className="fw-semibold">{classInfo.classNum}반</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary-light">학급명</span>
                    <span className="fw-semibold">{classInfo.className ?? "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 담임 교사 카드 */}
          <div className="col-xxl-4 col-lg-6">
            <div className="card radius-12 h-100">
              <div className="card-body p-24">
                <div className="d-flex align-items-center gap-16 mb-24">
                  <div className="w-64-px h-64-px bg-success-100 rounded-circle d-flex justify-content-center align-items-center">
                    <iconify-icon icon="mdi:account-tie" className="text-success-600 text-3xl" />
                  </div>
                  <div>
                    <h6 className="mb-4">담임 교사</h6>
                    <span className="text-secondary-light">담당 선생님 정보</span>
                  </div>
                </div>
                <div className="d-flex flex-column gap-12">
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary-light">이름</span>
                    <span className="fw-semibold">{classInfo.homeroomTeacherName ?? "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 학생 수 카드 */}
          <div className="col-xxl-4 col-lg-6">
            <div className="card radius-12 h-100">
              <div className="card-body p-24">
                <div className="d-flex align-items-center gap-16 mb-24">
                  <div className="w-64-px h-64-px bg-warning-100 rounded-circle d-flex justify-content-center align-items-center">
                    <iconify-icon icon="mdi:account-group" className="text-warning-600 text-3xl" />
                  </div>
                  <div>
                    <h6 className="mb-4">학생 현황</h6>
                    <span className="text-secondary-light">총 학생 수</span>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-5xl fw-bold text-primary-600">{classInfo.totalStudents}</span>
                  <span className="text-xl text-secondary-light">명</span>
                </div>
                <div className="mt-16 text-center">
                  <Link to="/teacher/myclass/students" className="btn btn-primary-600 radius-8">
                    <iconify-icon icon="mdi:account-details" className="me-4" />
                    학생 관리
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* [soojin] 학생 목록 미리보기 - TeacherList 동일 패턴 */}
          <div className="col-12">
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              {/* 카드 헤더 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 24px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#111827",
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  학생 목록
                  <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>
                    전체 {classInfo.totalStudents}명
                  </span>
                </span>
                <Link
                  to="/teacher/myclass/students"
                  style={{
                    padding: "5px 12px",
                    background: "#fff",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                    color: "#374151",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  전체 보기
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 14 }} />
                </Link>
              </div>
              {/* 테이블 */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: 80 }} />
                    <col style={{ width: 120 }} />
                    <col style={{ width: 150 }} />
                    <col />
                  </colgroup>
                  <thead>
                    <tr>
                      <th
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#6b7280",
                          background: "#f9fafb",
                          borderBottom: "1px solid #e5e7eb",
                          whiteSpace: "nowrap",
                          textAlign: "left",
                        }}
                      >
                        번호
                      </th>
                      <th
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#6b7280",
                          background: "#f9fafb",
                          borderBottom: "1px solid #e5e7eb",
                          whiteSpace: "nowrap",
                          textAlign: "left",
                        }}
                      >
                        이름
                      </th>
                      <th
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#6b7280",
                          background: "#f9fafb",
                          borderBottom: "1px solid #e5e7eb",
                          whiteSpace: "nowrap",
                          textAlign: "left",
                        }}
                      >
                        연락처
                      </th>
                      <th
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#6b7280",
                          background: "#f9fafb",
                          borderBottom: "1px solid #e5e7eb",
                          whiteSpace: "nowrap",
                          textAlign: "left",
                        }}
                      >
                        이메일
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {classInfo.students.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}
                        >
                          등록된 학생이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      classInfo.students.slice(0, 5).map((s) => (
                        <tr key={s.studentId}>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#6b7280",
                              borderBottom: "1px solid #f3f4f6",
                              verticalAlign: "middle",
                            }}
                          >
                            {s.studentNumber}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#374151",
                              fontWeight: 600,
                              borderBottom: "1px solid #f3f4f6",
                              verticalAlign: "middle",
                            }}
                          >
                            {s.name}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#6b7280",
                              borderBottom: "1px solid #f3f4f6",
                              verticalAlign: "middle",
                            }}
                          >
                            {s.phone ?? "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 13,
                              color: "#6b7280",
                              borderBottom: "1px solid #f3f4f6",
                              verticalAlign: "middle",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {s.email ?? "-"}
                          </td>
                        </tr>
                      ))
                    )}
                    {classInfo.totalStudents > 5 && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{ padding: "10px 16px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}
                        >
                          외 {classInfo.totalStudents - 5}명 더 보기 →
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
