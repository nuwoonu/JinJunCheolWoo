import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [cheol] /teacher/ability-classes - 세부능력 입력 전 학급 선택 페이지

interface ClassCard {
  cid: number;
  grade: number;
  classNum: number;
  teacherName: string | null;
  subjectName?: string;
}

const GRADE_COLORS = ["#10b981", "#8b5cf6", "#f59e0b"];

export default function AbilityClasses() {
  const navigate = useNavigate();
  const [subjectName, setSubjectName] = useState<string>("");
  const [classes, setClasses] = useState<ClassCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.get("/dashboard/teacher"), api.get("/teacher/class/my-sections")])
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

  const handleClassClick = (cls: ClassCard) => {
    navigate(`/teacher/ability-students?classroomId=${cls.cid}`);
  };

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학생 세부능력</h6>
          <div>
            <Link to="/main" className="text-secondary-light hover-text-primary hover-underline">
              홈
            </Link>
            <span className="text-neutral-600"> / 학급 선택</span>
          </div>
        </div>
      </div>

      <div
        className="card radius-12 mb-24 border-0"
        style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
      >
        <div className="card-body p-24 d-flex align-items-center gap-16">
          <div
            className="w-56-px h-56-px rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <i className="ri-edit-line text-white text-3xl"></i>
          </div>
          <div>
            <h5 className="fw-bold text-white mb-4">학생 세부능력 및 특기사항(분반)</h5>
            <p className="text-white mb-0" style={{ opacity: 0.85 }}>
              {subjectName ? `담당 과목: ${subjectName} | ` : ""}입력할 학급을 선택하세요.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
      ) : error ? (
        <div className="card radius-12 p-40 text-center">
          <i className="ri-error-warning-line text-4xl text-danger-600 d-block mb-12"></i>
          <p className="text-secondary-light">{error}</p>
        </div>
      ) : (
        <div className="row gy-20">
          {classes.map((cls, idx) => {
            const color = GRADE_COLORS[idx % GRADE_COLORS.length];
            return (
              <div key={cls.cid} className="col-xl-3 col-lg-4 col-sm-6">
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
                  <div
                    className="radius-12 d-flex align-items-center justify-content-center"
                    style={{ background: color, height: 80, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
                  >
                    <i className="ri-graduation-cap-line text-white" style={{ fontSize: 40 }}></i>
                  </div>
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
                    <div className="d-flex align-items-center gap-6 fw-medium text-sm" style={{ color }}>
                      <i className="ri-edit-line"></i>
                      세부능력 입력
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
