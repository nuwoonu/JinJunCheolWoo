import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../../components/layout/AdminLayout";
import admin from "../../../api/adminApi";
import { ADMIN_ROUTES } from '../../../constants/routes';

// [joon] 관리자 대시보드

// 1. 상태 관리를 위한 TypeScript 인터페이스 정의
interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalStaffs: number;
  pendingParents: number;
}

export default function AdminDashboard() {
  // 2. useState에 제네릭 타입 적용
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalStaffs: 0,
    pendingParents: 0,
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    admin
      .get("/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  // 3. 백그라운드 비동기 처리에 맞춘 동기화 함수
  const handleSync = async () => {
    if (
      !window.confirm(
        "학교 정보(NEIS) 동기화를 시작하시겠습니까?\n(데이터가 많아 완료까지 몇 분 정도 소요될 수 있습니다.)",
      )
    ) {
      return;
    }

    setIsSyncing(true);
    try {
      // url 매핑: 컨트롤러의 SchoolmateUrls.ADMIN_SCHOOLS + "/sync"
      const response = await admin.post("/schools/sync");
      alert(response.data); // 백엔드의 성공 메시지 출력
    } catch (error: any) {
      // 409 Conflict (이미 실행 중) 처리
      if (error.response && error.response.status === 409) {
        alert("⚠️ " + error.response.data); // "이미 동기화 작업이 백그라운드에서 실행 중입니다..."
      } else {
        console.error("동기화 요청 실패:", error);
        alert("❌ 동기화 요청 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSyncing(false); // 요청이 서버에 전달되었으므로 바로 로딩 해제
    }
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">📊 관리자 대시보드</h2>
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted">{today}</span>
          {/* 동기화 버튼 */}
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              <i className="bi bi-arrow-repeat me-2"></i>
            )}
            {isSyncing ? "요청 중..." : "학교 정보 동기화 (NEIS)"}
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-0 border-start border-primary border-4 shadow h-100 py-2">
            <div className="card-body">
              <div className="text-xs fw-bold text-primary text-uppercase mb-1">
                총 학생 수
              </div>
              <div className="h5 mb-0 fw-bold text-gray-800">
                {stats.totalStudents}명
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-0 border-start border-success border-4 shadow h-100 py-2">
            <div className="card-body">
              <div className="text-xs fw-bold text-success text-uppercase mb-1">
                재직 교직원
              </div>
              <div className="h5 mb-0 fw-bold">
                {stats.totalTeachers + stats.totalStaffs}명
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-0 border-start border-warning border-4 shadow h-100 py-2">
            <div className="card-body">
              <div className="text-xs fw-bold text-warning text-uppercase mb-1">
                학부모 승인 대기
              </div>
              <div className="h5 mb-0 fw-bold">{stats.pendingParents}건</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-0 border-start border-info border-4 shadow h-100 py-2">
            <div className="card-body">
              <div className="text-xs fw-bold text-info text-uppercase mb-1">
                주요 일정
              </div>
              <div className="h5 mb-0 fw-bold">
                <Link
                  to={ADMIN_ROUTES.MASTER.SCHEDULE}
                  className="text-decoration-none text-dark"
                >
                  일정 확인 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-2">
        <div className="col-lg-8">
          <div className="card shadow mb-4 border-0">
            <div className="card-header py-3 d-flex align-items-center justify-content-between bg-white">
              <h6 className="m-0 fw-bold text-primary">시스템 안내</h6>
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
