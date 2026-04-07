import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [cheol] /teacher/grade-classes - 교사 성적 채점 전 학급 선택 페이지
// 교사의 담당 학년에 속한 모든 학급을 카드로 표시하고, 클릭 시 해당 학급의 studentlist로 이동

interface ClassCard {
  cid: number;
  grade: number;
  classNum: number;
  teacherName: string | null;
  subjectName?: string;
}

const GRADE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981"];

export default function TeacherGradeClasses() {
  const navigate = useNavigate();

  // [cheol] 교사 담당 과목 정보
  const [subjectName, setSubjectName] = useState<string>("");
  const [classes, setClasses] = useState<ClassCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // [cheol] 교사 과목명 조회 + 분반 배정 학급 목록 병렬 요청
    Promise.all([
      api.get("/dashboard/teacher"),
      api.get("/teacher/class/my-sections"),
    ])
      .then(([dashRes, sectionsRes]) => {
        setSubjectName(dashRes.data.teacherSubject ?? "");
        const sections: ClassCard[] = sectionsRes.data ?? [];
        if (sections.length === 0) {
          setError("분반 배정된 학급이 없습니다. 관리자에게 분반 등록을 요청하세요.");
          return;
        }
        setClasses(sections);
      })
      .catch(() => setError("학급 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // [cheol] 학급 카드 클릭 → 해당 학급 학생리스트로 이동
  const handleClassClick = (cls: ClassCard) => {
    navigate(`/student/list?classroomId=${cls.cid}`);
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
      </div>

      {/* 안내 헤더 */}
      <div
        className="card radius-12 mb-24 border-0"
        style={{ background: "#3b82f6" }}
      >
        <div className="card-body p-24 d-flex align-items-center gap-16">
          <div
            className="w-56-px h-56-px rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <i className="ri-edit-line text-white text-3xl"></i>
          </div>
          <div>
            <h5 className="fw-bold text-white mb-4">
              성적 채점
            </h5>
            <p className="text-white mb-0" style={{ opacity: 0.85 }}>
              {subjectName ? `담당 과목: ${subjectName} | ` : ""}채점할 학급을 선택하세요.
            </p>
          </div>
        </div>
      </div>

      {/* 학급 카드 목록 */}
      {loading ? (
        <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
      ) : error ? (
        <div className="card radius-12 p-40 text-center">
          <i className="ri-error-warning-line text-4xl text-danger-600 d-block mb-12"></i>
          <p className="text-secondary-light">{error}</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="card radius-12 p-40 text-center">
          <i className="ri-building-2-line text-4xl text-secondary-light d-block mb-12"></i>
          <p className="text-secondary-light">해당 학년에 등록된 학급이 없습니다.</p>
        </div>
      ) : (
        <div className="row gy-20">
          {classes.map((cls, idx) => {
            const color = GRADE_COLORS[idx % GRADE_COLORS.length];
            return (
              <div key={cls.cid} className="col-xl-3 col-lg-4 col-sm-6">
                {/* [cheol] 학급 카드 — 클릭 시 studentlist?classroomId=xxx 이동 */}
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
                    <i className="ri-graduation-cap-line text-white" style={{ fontSize: 40 }}></i>
                  </div>

                  {/* 학급 정보 */}
                  <div className="p-20">
                    <h5 className="fw-bold mb-4" style={{ color }}>
                      {cls.grade}학년 {cls.classNum}반
                    </h5>
                    <p className="text-secondary-light text-sm mb-4">
                      {cls.teacherName ? `담임: ${cls.teacherName}` : "담임 미배정"}
                    </p>
                    {cls.subjectName && (
                      <p className="fw-medium text-sm mb-12" style={{ color }}>
                        과목: {cls.subjectName}
                      </p>
                    )}
                    <div
                      className="d-flex align-items-center gap-6 fw-medium text-sm"
                      style={{ color }}
                    >
                      <i className="ri-edit-line"></i>
                      채점하기
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
