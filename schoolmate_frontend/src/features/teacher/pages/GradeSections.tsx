import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getMyCourseSections, getTerms } from "@/api/grade";
import type { CourseSectionDTO, TermDTO } from "@/api/grade";

// [woo] 교사 성적 입력 - 분반 목록 페이지
// /teacher/grades

export default function GradeSections() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<CourseSectionDTO[]>([]);
  const [terms, setTerms] = useState<TermDTO[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTerms()
      .then((res) => {
        setTerms(res.data);
        const active = res.data.find((t) => t.active);
        if (active) setSelectedTermId(active.termId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedTermId === undefined) return;
    setLoading(true);
    getMyCourseSections(selectedTermId)
      // [woo] 지필평가 입력은 본인 담당 분반만 (담임 열람 전용 분반 제외)
      .then((res) => setSections(res.data.filter((s) => !s.homeroomAccess)))
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, [selectedTermId]);

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">평가</h6>
          <p className="text-neutral-600 mt-4 mb-0">성적 입력</p>
        </div>
      </div>

      {/* 학기 선택 */}
      <div className="d-flex align-items-center gap-12 mb-24">
        <label className="fw-semibold text-sm text-nowrap">학기 선택</label>
        <select
          className="form-select radius-8"
          style={{ maxWidth: 260 }}
          value={selectedTermId ?? ""}
          onChange={(e) => setSelectedTermId(Number(e.target.value))}
        >
          {terms.map((t) => (
            <option key={t.termId} value={t.termId}>
              {t.displayName} {t.active ? "(현재)" : ""}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-40">
          <div className="spinner-border text-primary" />
        </div>
      ) : sections.length === 0 ? (
        <div className="card radius-12 p-24 text-center text-neutral-500">
          배정된 분반이 없습니다.
        </div>
      ) : (
        <div className="row g-16">
          {sections.map((s) => (
            <div key={s.courseSectionId} className="col-md-6 col-lg-4">
              <div
                className="card radius-12 h-100 cursor-pointer border hover-border-primary-600 transition-2"
                onClick={() =>
                  navigate(`/teacher/grades/section/${s.courseSectionId}`)
                }
                style={{ cursor: "pointer" }}
              >
                <div className="card-body p-20">
                  <h6 className="fw-semibold mb-8">{s.subjectName}</h6>
                  <p className="text-neutral-500 text-sm mb-4">
                    {s.className}
                  </p>
                  <span className="badge bg-primary-50 text-primary-600 text-xs">
                    {s.schoolYear}학년도 {s.semester}학기
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
