import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";
import admin from "../../api/adminApi";
import { ADMIN_ROUTES } from "../../constants/routes";

// [joon] 관리자 대시보드

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalStaffs: number;
  pendingParents: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalStaffs: 0,
    pendingParents: 0,
  });
  const [syncRunning, setSyncRunning] = useState<boolean>(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const checkSyncStatus = () => {
    admin
      .get("/schools/sync/status")
      .then((r) => setSyncRunning(r.data.syncing ?? false))
      .catch(() => {});
  };

  useEffect(() => {
    admin
      .get("/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(() => {});

    // 컴포넌트 마운트 시 현재 동기화 상태 즉시 확인
    checkSyncStatus();

    // 3초마다 상태 폴링
    pollRef.current = setInterval(checkSyncStatus, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleSync = async () => {
    if (
      !window.confirm(
        "학교 정보(NEIS) 동기화를 시작하시겠습니까?\n(데이터가 많아 완료까지 몇 분 정도 소요될 수 있습니다.)",
      )
    ) {
      return;
    }

    try {
      await admin.post("/schools/sync");
      // 시작 직후 상태 반영
      checkSyncStatus();
    } catch (error: any) {
      if (error.response?.status !== 409) {
        alert("동기화 요청 중 오류가 발생했습니다.");
      }
      // 409는 이미 실행 중 — 폴링이 버튼 상태를 알아서 반영
    }
  };

  return (
    <AdminLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">관리자 대시보드</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            학교 관리 시스템 현황을 한눈에 확인합니다.
          </p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted">{today}</span>
          {/* 동기화 버튼 */}
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={handleSync}
            disabled={syncRunning}
          >
            <i className="bi bi-arrow-repeat me-2"></i>
            {syncRunning ? "동기화 진행 중..." : "학교 정보 동기화 (NEIS)"}
          </button>
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
