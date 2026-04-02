import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getStudentFinalGrades } from "@/api/grade";

// [woo] 학부모 자녀 성적 조회 페이지

interface Child {
  id: number;
  studentInfoId: number;
  name: string;
  grade?: number;
  classNum?: number;
}

interface Grade {
  id: number;
  subjectName: string;
  examType: string;
  score?: number;
  semester: string;
}

interface FinalGrade {
  id: number;
  subjectName: string;
  semester: string;
  schoolYear: number;
  midtermScore: number | null;
  finalExamScore: number | null;
  homeworkScore: number | null;
  quizScore: number | null;
  totalScore: number | null;
  midtermRatio: number | null;
  finalRatio: number | null;
  homeworkRatio: number | null;
  quizRatio: number | null;
}

const SEMESTER_LABEL: Record<string, string> = { FIRST: "1학기", FALL: "2학기" };
const EXAM_TYPE_LABEL: Record<string, string> = {
  MIDTERMTEST: "중간고사",
  FINALTEST: "기말고사",
  PERFORMANCEASSESSMENT: "수행평가",
};

export default function ParentGrades() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [activeTab, setActiveTab] = useState<"exam" | "final">("exam");

  const [examGrades, setExamGrades] = useState<Grade[]>([]);
  const [finalGrades, setFinalGrades] = useState<FinalGrade[]>([]);
  const [loading, setLoading] = useState(false);

  // 자녀 목록 조회
  useEffect(() => {
    api.get("/dashboard/parent").then((res) => {
      const list: Child[] = res.data?.children ?? [];
      setChildren(list);
      if (list.length > 0) setSelectedChild(list[0]);
    });
  }, []);

  // 자녀 선택 시 시험 성적 로드
  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    api.get(`/grades/student/${selectedChild.studentInfoId}`)
      .then((res) => setExamGrades(res.data))
      .finally(() => setLoading(false));
  }, [selectedChild]);

  // 종합 성적 탭 진입 시 로드
  useEffect(() => {
    if (activeTab === "final" && selectedChild) {
      getStudentFinalGrades(selectedChild.studentInfoId)
        .then((res) => setFinalGrades(res.data))
        .catch(() => setFinalGrades([]));
    }
  }, [activeTab, selectedChild]);

  const fmt = (v: number | null) => (v != null ? v.toFixed(1) : "-");

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">자녀 성적</h6>
          <div>
            <Link to="/parent/dashboard" className="text-secondary-light hover-text-primary hover-underline">
              학부모 홈
            </Link>
            <span className="text-neutral-600"> / 자녀 성적 조회</span>
          </div>
        </div>
      </div>

      {/* 자녀 탭 */}
      {children.length > 1 && (
        <ul className="nav nav-tabs mb-20">
          {children.map((child) => (
            <li key={child.id} className="nav-item">
              <button
                className={`nav-link${selectedChild?.id === child.id ? " active" : ""}`}
                onClick={() => {
                  setSelectedChild(child);
                  setActiveTab("exam");
                  setExamGrades([]);
                  setFinalGrades([]);
                }}
              >
                {child.name}
                {child.grade && child.classNum && (
                  <span className="ms-1 text-secondary-light text-xs">
                    ({child.grade}학년 {child.classNum}반)
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedChild && (
        <>
          {/* 성적 유형 탭 */}
          <ul className="nav nav-tabs mb-20">
            <li className="nav-item">
              <button
                className={`nav-link${activeTab === "exam" ? " active" : ""}`}
                onClick={() => setActiveTab("exam")}
              >
                시험 성적
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link${activeTab === "final" ? " active" : ""}`}
                onClick={() => setActiveTab("final")}
              >
                종합 성적
              </button>
            </li>
          </ul>

          <div className="card radius-12">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
              ) : activeTab === "exam" ? (
                examGrades.length === 0 ? (
                  <div className="text-center py-48 text-secondary-light">등록된 성적이 없습니다.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm align-middle text-center mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-start">과목</th>
                          <th>시험 유형</th>
                          <th>학기</th>
                          <th>점수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examGrades.map((g) => (
                          <tr key={g.id}>
                            <td className="text-start fw-medium">{g.subjectName}</td>
                            <td>{EXAM_TYPE_LABEL[g.examType] ?? g.examType}</td>
                            <td>{SEMESTER_LABEL[g.semester] ?? g.semester}</td>
                            <td className="fw-bold">
                              {g.score != null ? g.score : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                finalGrades.length === 0 ? (
                  <div className="text-center py-48 text-secondary-light">종합 성적이 없습니다.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm align-middle text-center mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-start">과목</th>
                          <th>학기</th>
                          <th>중간고사</th>
                          <th>기말고사</th>
                          <th>과제</th>
                          <th>퀴즈</th>
                          <th className="fw-bold">최종 점수</th>
                          <th>비율</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finalGrades.map((fg) => (
                          <tr key={fg.id}>
                            <td className="text-start fw-medium">{fg.subjectName}</td>
                            <td>{SEMESTER_LABEL[fg.semester] ?? fg.semester}</td>
                            <td>{fmt(fg.midtermScore)}</td>
                            <td>{fmt(fg.finalExamScore)}</td>
                            <td>{fmt(fg.homeworkScore)}</td>
                            <td>{fmt(fg.quizScore)}</td>
                            <td className="fw-bold text-primary-600">{fmt(fg.totalScore)}</td>
                            <td className="text-secondary-light text-xs">
                              {fg.midtermRatio}/{fg.finalRatio}/{fg.homeworkRatio}/{fg.quizRatio}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
