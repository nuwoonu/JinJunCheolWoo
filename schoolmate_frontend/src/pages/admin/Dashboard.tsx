import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";
import admin from "../../api/adminApi";
import { ADMIN_ROUTES } from "../../constants/routes";
import { useSchool } from "../../context/SchoolContext";

// [joon] 관리자 대시보드

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalStaffs: number;
  pendingParents: number;
}

export default function AdminDashboard() {
  const { selectedSchool } = useSchool();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalStaffs: 0,
    pendingParents: 0,
  });
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    admin
      .get("/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  return (
    <AdminLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">관리자 대시보드</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            {selectedSchool ? (
              <>
                <span className="fw-semibold">{selectedSchool.name}</span>
                <span className="text-muted ms-1 small">
                  ({selectedSchool.schoolKind} · {selectedSchool.officeOfEducation})
                </span>
              </>
            ) : (
              "학교 관리 시스템 현황을 한눈에 확인합니다."
            )}
          </p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted">{today}</span>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-3 col-md-6 mb-24">
          <div className="card">
            <div className="card-body px-24 py-20">
              <div className="d-flex align-items-center gap-16">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#e0f2f1",
                  }}
                >
                  <i
                    className="ri-graduation-cap-line"
                    style={{ color: "#25A194", fontSize: 22 }}
                  />
                </div>
                <div>
                  <p className="text-neutral-600 mb-4" style={{ fontSize: 12 }}>
                    총 학생 수
                  </p>
                  <h6 className="fw-bold mb-0">{stats.totalStudents}명</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-24">
          <div className="card">
            <div className="card-body px-24 py-20">
              <div className="d-flex align-items-center gap-16">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#eff6ff",
                  }}
                >
                  <i
                    className="ri-user-follow-line"
                    style={{ color: "#1d4ed8", fontSize: 22 }}
                  />
                </div>
                <div>
                  <p className="text-neutral-600 mb-4" style={{ fontSize: 12 }}>
                    재직 교직원
                  </p>
                  <h6 className="fw-bold mb-0">
                    {stats.totalTeachers + stats.totalStaffs}명
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-24">
          <div className="card">
            <div className="card-body px-24 py-20">
              <div className="d-flex align-items-center gap-16">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#faf5ff",
                  }}
                >
                  <i
                    className="ri-user-heart-line"
                    style={{ color: "#7c3aed", fontSize: 22 }}
                  />
                </div>
                <div>
                  <p className="text-neutral-600 mb-4" style={{ fontSize: 12 }}>
                    학부모 승인 대기
                  </p>
                  <h6 className="fw-bold mb-0">{stats.pendingParents}건</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-24">
          <div className="card">
            <div className="card-body px-24 py-20">
              <div className="d-flex align-items-center gap-16">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#fffbeb",
                  }}
                >
                  <i
                    className="ri-calendar-line"
                    style={{ color: "#d97706", fontSize: 22 }}
                  />
                </div>
                <div>
                  <p className="text-neutral-600 mb-4" style={{ fontSize: 12 }}>
                    주요 일정
                  </p>
                  <h6 className="fw-bold mb-0">
                    <Link
                      to={ADMIN_ROUTES.MASTER.SCHEDULE}
                      className="text-decoration-none text-dark"
                    >
                      일정 확인 →
                    </Link>
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-2">
        <div className="col-lg-8">
          <div className="card mb-24">
            <div className="d-flex align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
              <h6 className="fw-semibold mb-0">시스템 안내</h6>
            </div>
            <div className="card-body">
              <p>학교 관리 시스템 관리자 페이지에 오신 것을 환영합니다.</p>
              <p className="mb-0 text-muted small">
                * 왼쪽 메뉴를 통해 학급 편성, 교직원 관리 및 학생 DB 관리를
                진행하실 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
