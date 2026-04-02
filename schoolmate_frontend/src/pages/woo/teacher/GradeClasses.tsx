import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getMyGradeClassrooms } from "@/api/grade";

// [woo] /teacher/grade-classes - 교사 성적 채점 전 학급 선택 페이지
// 담임반 + 담당 학생 학급 합집합 표시, 클릭 시 grade-input으로 이동

interface ClassCard {
  classroomId: number;
  grade: number;
  classNum: number;
  className: string;
  homeroomTeacherName: string | null;
  totalStudents: number;
}

const GRADE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981"];

export default function TeacherGradeClasses() {
  const navigate = useNavigate();

  // [woo] 담임반 + 담당 학생 학급 합집합
  const [classes, setClasses] = useState<ClassCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // [woo] 교사가 접근 가능한 학급 목록 조회 (담임반 + 담당 학생 학급)
    getMyGradeClassrooms()
      .then((res) => setClasses(res.data))
      .catch(() => setError("학급 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // [woo] 학급 카드 클릭 → 성적 입력 페이지로 이동
  const handleClassClick = (cls: ClassCard) => {
    navigate(`/teacher/grade-input/${cls.classroomId}`);
  };

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">성적 채점</h6>
          <div>
            <Link to="/main" className="text-secondary-light hover-text-primary hover-underline">
              홈
            </Link>
            <span className="text-neutral-600"> / 학급 선택</span>
          </div>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">성적 채점</li>
          <li>-</li>
          <li className="fw-medium">학급 선택</li>
        </ul>
      </div>

      {/* 안내 헤더 */}
      <div className="card radius-12 mb-24 border-0" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" }}>
        <div className="card-body p-24 d-flex align-items-center gap-16">
          <div className="w-56-px h-56-px rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
               style={{ background: "rgba(255,255,255,0.2)" }}>
            <iconify-icon icon="mdi:pencil-box-outline" className="text-white text-3xl" />
          </div>
          <div>
            <h5 className="fw-bold text-white mb-4">성적 채점</h5>
            <p className="text-white mb-0" style={{ opacity: 0.85 }}>
              채점할 학급을 선택하세요. (담임반 + 담당 학급)
            </p>
          </div>
        </div>
      </div>

      {/* 학급 카드 목록 */}
      {loading ? (
        <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
      ) : error ? (
        <div className="card radius-12 p-40 text-center">
          <iconify-icon icon="mdi:alert-circle-outline" className="text-4xl text-danger-600 d-block mb-12" />
          <p className="text-secondary-light">{error}</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="card radius-12 p-40 text-center">
          <iconify-icon icon="mdi:school-outline" className="text-4xl text-secondary-light d-block mb-12" />
          <p className="text-secondary-light">해당 학년에 등록된 학급이 없습니다.</p>
        </div>
      ) : (
        <div className="row gy-20">
          {classes.map((cls, idx) => {
            const color = GRADE_COLORS[idx % GRADE_COLORS.length];
            return (
              <div key={cls.classroomId} className="col-xl-3 col-lg-4 col-sm-6">
                {/* [woo] 학급 카드 — 클릭 시 grade-input/:classroomId 이동 */}
                <button
                  type="button"
                  onClick={() => handleClassClick(cls)}
                  className="card radius-12 border-0 w-100 text-start p-0"
                  style={{
                    cursor: "pointer",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${color}44`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                  }}
                >
                  {/* 상단 컬러 배너 */}
                  <div
                    className="radius-12 d-flex align-items-center justify-content-center"
                    style={{ background: color, height: 80, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
                  >
                    <iconify-icon icon="mdi:google-classroom" className="text-white" style={{ fontSize: 40 }} />
                  </div>

                  {/* 학급 정보 */}
                  <div className="p-20">
                    <h5 className="fw-bold mb-4" style={{ color }}>
                      {cls.grade}학년 {cls.classNum}반
                    </h5>
                    <p className="text-secondary-light text-sm mb-4">
                      {cls.homeroomTeacherName ? `담임: ${cls.homeroomTeacherName}` : "담임 미배정"}
                    </p>
                    <p className="text-secondary-light text-sm mb-12">
                      학생 {cls.totalStudents}명
                    </p>
                    <div
                      className="d-flex align-items-center gap-6 fw-medium text-sm"
                      style={{ color }}
                    >
                      <iconify-icon icon="mdi:pencil-outline" />
                      성적 입력
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
