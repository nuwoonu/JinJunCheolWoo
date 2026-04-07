import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/shared/api/authApi";
import { useAuth } from "@/shared/contexts/AuthContext";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [woo] /student/list - 학생 리스트 (STUDENT, TEACHER, ADMIN 공용)

// ── 채점 모드 상수 ──────────────────────────────────────────
const EXAM_TYPE_OPTIONS = [
  { value: "MIDTERMTEST", label: "중간고사" },
  { value: "FINALTEST", label: "기말고사" },
  { value: "PERFORMANCEASSESSMENT", label: "수행평가" },
];
const YEAR_OPTIONS = [
  { value: "FIRST", label: "1학년" },
  { value: "SECOND", label: "2학년" },
  { value: "THIRD", label: "3학년" },
];
const SEMESTER_OPTIONS = [
  { value: "FIRST", label: "1학기" },
  { value: "FALL", label: "2학기" },
];

// [cheol] 성적 확인 모드 라벨 맵
const EXAM_TYPE_LABEL: Record<string, string> = {
  MIDTERMTEST: "중간고사",
  FINALTEST: "기말고사",
  PERFORMANCEASSESSMENT: "수행평가",
};
const EXAM_TYPE_COLOR: Record<string, string> = {
  MIDTERMTEST: "bg-primary-100 text-primary-600",
  FINALTEST: "bg-danger-100 text-danger-600",
  PERFORMANCEASSESSMENT: "bg-success-100 text-success-600",
};
const YEAR_LABEL: Record<string, string> = {
  FIRST: "1학년", SECOND: "2학년", THIRD: "3학년",
};
const SEMESTER_LABEL: Record<string, string> = {
  FIRST: "1학기", FALL: "2학기",
};
const PAGE_SIZE = 10;

// ── 타입 ────────────────────────────────────────────────────
interface Student {
  id: number;
  studentNumber: number | null;
  fullStudentNumber: string | null;
  studentCode: string | null;
  year: number;
  classNum: number | null;
  userName: string | null;
  userEmail: string | null;
  phone: string | null;
  gender: string | null;
  status: string | null;
}

interface TeacherInfo {
  teacherInfoId: number | null;
  subjectName: string;
  subjectCode: string | null;
}

interface GradeForm {
  testType: string;
  year: string;
  semester: string;
  score: string;
}

// [cheol] 성적 확인 모드용 성적 타입
interface GradeRecord {
  id: number;
  studentId: number | null;
  subjectName: string | null;
  subjectCode: string | null;
  examType: string;
  score: number | null;
  semester: string;
  year: string;
}

// ── 컴포넌트 ─────────────────────────────────────────────────
export default function StudentList() {
  const { user } = useAuth();
  const isTeacher = user?.role === "TEACHER";

  const [searchParams] = useSearchParams();
  const classroomId = searchParams.get("classroomId");
  // [cheol] mode=view 이면 성적 확인 모드, 기본값은 채점 모드
  const isViewMode = searchParams.get("mode") === "view";

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  // 교사 정보 (채점 모드에서만 사용)
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo>({
    teacherInfoId: null,
    subjectName: "",
    subjectCode: null,
  });

  // 교사 담당 과목 점수 맵 (studentId → score) — 채점 모드
  const [scoreMap, setScoreMap] = useState<Record<number, number>>({});

  // 채점 모달 상태
  const [gradingStudent, setGradingStudent] = useState<Student | null>(null);
  const [gradeForm, setGradeForm] = useState<GradeForm>({
    testType: "MIDTERMTEST",
    year: "FIRST",
    semester: "FIRST",
    score: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // [cheol] 성적 확인 모달 상태
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [studentGrades, setStudentGrades] = useState<GradeRecord[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);

  // 학생 목록 로드
  useEffect(() => {
    const url = classroomId ? `/students?classroomId=${classroomId}` : "/students";
    api
      .get(url)
      .then((res) => setStudents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classroomId]);

  // 교사 과목 정보 로드 (채점 모드 전용)
  useEffect(() => {
    if (!isTeacher || isViewMode) return;
    api
      .get("/dashboard/teacher")
      .then((res) => {
        const info: TeacherInfo = {
          teacherInfoId: res.data.teacherInfoId ?? null,
          subjectName: res.data.teacherSubject ?? "",
          subjectCode: res.data.teacherSubjectCode ?? null,
        };
        setTeacherInfo(info);
        if (info.teacherInfoId && info.subjectCode) {
          return api.get(`/grades/subject/${encodeURIComponent(info.subjectCode)}`);
        }
      })
      .then((res) => {
        if (!res) return;
        const map: Record<number, number> = {};
        (res.data as { studentId: number; score: number }[]).forEach((g) => {
          if (g.studentId != null && g.score != null) {
            map[g.studentId] = g.score;
          }
        });
        setScoreMap(map);
      })
      .catch(() => {});
  }, [isTeacher, isViewMode]);

  // [cheol] 성적 확인 모달 열기 — 해당 학생의 전 과목 성적 조회
  const openViewGrades = (s: Student) => {
    setViewingStudent(s);
    setStudentGrades([]);
    setGradesLoading(true);
    api
      .get(`/grades/student/${s.id}`)
      .then((res) => setStudentGrades(res.data ?? []))
      .catch(() => setStudentGrades([]))
      .finally(() => setGradesLoading(false));
  };

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = viewingStudent ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [viewingStudent]);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.userName?.toLowerCase().includes(q) ||
      s.fullStudentNumber?.toLowerCase().includes(q) ||
      s.userEmail?.toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleStudents = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(0);
  }, [search, classroomId, isViewMode]);

  useEffect(() => {
    const maxPage = Math.max(0, totalPages - 1);
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [currentPage, totalPages]);

  const openGrading = (s: Student) => {
    setGradingStudent(s);
    setGradeForm({ testType: "MIDTERMTEST", year: "FIRST", semester: "FIRST", score: "" });
    setSubmitResult(null);
  };

  const handleGradeSubmit = async () => {
    if (!gradingStudent || !teacherInfo.teacherInfoId || !teacherInfo.subjectCode) {
      setSubmitResult({ ok: false, msg: "교사 과목 정보를 불러오지 못했습니다." });
      return;
    }
    const scoreNum = parseFloat(gradeForm.score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setSubmitResult({ ok: false, msg: "점수는 0~100 사이여야 합니다." });
      return;
    }
    setSubmitting(true);
    setSubmitResult(null);
    try {
      await api.post(
        `/teacher/class/${teacherInfo.teacherInfoId}/students/grade?year=${new Date().getFullYear()}`,
        {
          studentId: gradingStudent.id,
          subjectCode: teacherInfo.subjectCode,
          testType: gradeForm.testType,
          semester: gradeForm.semester,
          year: gradeForm.year,
          score: scoreNum,
        },
      );
      setSubmitResult({ ok: true, msg: "채점이 완료되었습니다." });
      setScoreMap((prev) => ({ ...prev, [gradingStudent.id]: scoreNum }));
    } catch (e: any) {
      setSubmitResult({
        ok: false,
        msg: e?.response?.data?.message ?? e?.response?.data ?? "채점 중 오류가 발생했습니다.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // [cheol] 성적 시험유형별 그룹화 (성적 확인 모달용)
  const groupedGrades = studentGrades.reduce<Record<string, GradeRecord[]>>((acc, g) => {
    const key = EXAM_TYPE_LABEL[g.examType] ?? g.examType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      {/* [soojin] 학교 공지 페이지와 동일한 상단/컨트롤/카드/페이지네이션 구조 */}
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 4.5rem - 48px)" }}>
        <div style={{ marginBottom: 16, flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4, display: "flex", alignItems: "baseline", gap: 8 }}>
              {isViewMode ? "학생 성적 목록" : "학생 목록"}
              <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>전체 {students.length}건</span>
            </h5>
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
              {isViewMode ? "학생별 전 과목 성적을 확인합니다." : "학급 학생 목록과 기본 정보를 확인합니다."}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
          <form
            style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
            onSubmit={(e) => { e.preventDefault(); setCurrentPage(0); }}
          >
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <i className="ri-search-line" style={{ position: "absolute", left: 8, color: "#9ca3af", fontSize: 13, pointerEvents: "none" }} />
              <input
                style={{ padding: "5px 8px 5px 28px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, minWidth: 220, background: "#fff" }}
                placeholder="이름, 학번, 이메일 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              style={{ padding: "5px 12px", background: "#25A194", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
              type="submit"
            >
              검색
            </button>
            <button
              style={{ padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, cursor: "pointer", color: "#374151", whiteSpace: "nowrap" }}
              type="button"
              onClick={() => setSearch("")}
            >
              초기화
            </button>
            {search && (
              <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 600, color: "#111827" }}>{filtered.length}건</span> / 전체 {students.length}건
              </span>
            )}
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isTeacher && !isViewMode && teacherInfo.subjectName && (
              <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: "rgba(37,161,148,0.1)", color: "#0f766e" }}>
                담당 과목: {teacherInfo.subjectName}
              </span>
            )}
            {isViewMode && (
              <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: "rgba(34,197,94,0.1)", color: "#15803d" }}>
                전 과목 성적 조회 모드
              </span>
            )}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", minHeight: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "16%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr>
                  {["학번", "이름", "학년/반", "연락처", "이메일", isTeacher && !isViewMode ? "점수" : "성별", isTeacher ? (isViewMode ? "성적 확인" : "채점") : "상세"].map((h, i) => (
                    <th
                      key={`${h}-${i}`}
                      style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#6b7280", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", textAlign: i >= 5 ? "center" : "left", whiteSpace: "nowrap" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                      불러오는 중...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                      등록된 학생이 없습니다.
                    </td>
                  </tr>
                ) : (
                  visibleStudents.map((s) => (
                    <tr key={s.id}>
                      <td style={{ padding: "14px 16px", fontSize: 13, borderBottom: "1px solid #f3f4f6", color: "#374151", whiteSpace: "nowrap" }}>
                        {s.fullStudentNumber ?? s.studentCode ?? "-"}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e0f2f1", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <i className="ri-user-line" style={{ color: "#0f766e" }} />
                          </div>
                          <span style={{ fontWeight: 500 }}>{s.userName ?? "-"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                        {s.year && s.classNum ? `${s.year}학년 ${s.classNum}반` : "-"}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.phone ?? "-"}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f3f4f6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.userEmail ?? "-"}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f3f4f6", textAlign: "center", whiteSpace: "nowrap" }}>
                        {isTeacher && !isViewMode ? (
                          scoreMap[s.id] != null ? (
                            <span className={`fw-bold ${scoreMap[s.id] >= 90 ? "text-success-600" : scoreMap[s.id] >= 70 ? "text-primary-600" : "text-danger-600"}`}>
                              {scoreMap[s.id]}점
                            </span>
                          ) : (
                            "-"
                          )
                        ) : (
                          s.gender === "MALE" ? "남" : s.gender === "FEMALE" ? "여" : "-"
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, borderBottom: "1px solid #f3f4f6", textAlign: "center", whiteSpace: "nowrap" }}>
                        {isTeacher ? (
                          isViewMode ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-success-600 radius-4"
                              onClick={() => openViewGrades(s)}
                            >
                              <i className="ri-bar-chart-line"></i> 성적 확인
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary-600 radius-4"
                              onClick={() => openGrading(s)}
                            >
                              <i className="ri-edit-line"></i> 채점
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary-600 radius-4"
                            onClick={() => {}}
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 0}
              style={{ width: 28, height: 28, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage === 0 ? "not-allowed" : "pointer", color: currentPage === 0 ? "#d1d5db" : "#374151", fontSize: 12 }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                style={{ width: 28, height: 28, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1px solid ${i === currentPage ? "#25A194" : "#e5e7eb"}`, borderRadius: 6, background: i === currentPage ? "#25A194" : "#fff", color: i === currentPage ? "#fff" : "#374151", cursor: "pointer", fontSize: 12, fontWeight: i === currentPage ? 600 : 400 }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage >= totalPages - 1}
              style={{ width: 28, height: 28, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer", color: currentPage >= totalPages - 1 ? "#d1d5db" : "#374151", fontSize: 12 }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* ── [cheol] 성적 확인 모달 (mode=view 전용) ── */}
      {isViewMode && viewingStudent && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">
                  전 과목 성적 — {viewingStudent.userName ?? "-"}
                  <span className="text-secondary-light fw-normal text-sm ms-8">
                    ({viewingStudent.fullStudentNumber ?? viewingStudent.studentCode ?? "-"})
                  </span>
                </h6>
                <button type="button" className="btn-close" onClick={() => setViewingStudent(null)} />
              </div>
              <div className="modal-body p-24" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                {gradesLoading ? (
                  <div className="text-center py-24 text-secondary-light">불러오는 중...</div>
                ) : studentGrades.length === 0 ? (
                  <div className="text-center py-24 text-secondary-light">
                    <i className="ri-file-search-line text-3xl d-block mb-8"></i>
                    등록된 성적이 없습니다.
                  </div>
                ) : (
                  // [cheol] 과목별 그룹 출력
                  Object.entries(groupedGrades).map(([examTypeLabel, grades]) => {
                    const examType = grades[0]?.examType;
                    const avg = grades.filter((g) => g.score != null).length > 0
                      ? (grades.filter((g) => g.score != null).reduce((s, g) => s + (g.score ?? 0), 0) / grades.filter((g) => g.score != null).length).toFixed(1)
                      : "-";
                    return (
                      <div key={examTypeLabel} className="mb-20">
                        <div className="d-flex justify-content-between align-items-center py-8 mb-8"
                             style={{ borderLeft: "4px solid #3b82f6", paddingLeft: 12 }}>
                          <span className={`badge px-10 py-4 radius-4 fw-bold text-sm ${EXAM_TYPE_COLOR[examType] ?? "bg-neutral-100 text-secondary-light"}`}>
                            {examTypeLabel}
                          </span>
                          <span className="text-xs text-secondary-light">평균: <strong>{avg}</strong>점</span>
                        </div>
                        <div className="table-responsive">
                          <table className="table bordered-table mb-0 text-sm">
                            <thead>
                              <tr>
                                <th>과목</th>
                                <th>학년</th>
                                <th>학기</th>
                                <th className="text-center">점수</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grades.map((g) => (
                                <tr key={g.id}>
                                  <td className="fw-medium">{g.subjectName ?? g.subjectCode ?? "-"}</td>
                                  <td className="text-secondary-light">{YEAR_LABEL[g.year] ?? g.year}</td>
                                  <td className="text-secondary-light">{SEMESTER_LABEL[g.semester] ?? g.semester}</td>
                                  <td className="text-center">
                                    {g.score != null ? (
                                      <span className={`fw-bold ${g.score >= 90 ? "text-success-600" : g.score >= 70 ? "text-primary-600" : "text-danger-600"}`}>
                                        {g.score}점
                                      </span>
                                    ) : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="modal-footer border-top py-16 px-24">
                <button
                  type="button"
                  className="btn btn-outline-neutral-300 radius-8"
                  onClick={() => setViewingStudent(null)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 채점 모달 (교사 채점 모드 전용) ── */}
      {isTeacher && !isViewMode && gradingStudent && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">
                  성적 채점 — {gradingStudent.userName ?? "-"}
                  <span className="text-secondary-light fw-normal text-sm ms-8">
                    ({gradingStudent.fullStudentNumber ?? gradingStudent.studentCode ?? "-"})
                  </span>
                </h6>
                <button type="button" className="btn-close" onClick={() => setGradingStudent(null)} />
              </div>
              <div className="modal-body p-24">
                <div className="d-flex flex-column gap-16">
                  <div>
                    <label className="form-label fw-medium text-sm mb-6">담당 과목</label>
                    <input
                      type="text"
                      className="form-control"
                      value={teacherInfo.subjectName || "과목 정보 없음"}
                      readOnly
                      style={{ background: "#f8fafc" }}
                    />
                  </div>
                  <div>
                    <label className="form-label fw-medium text-sm mb-6">시험 종류</label>
                    <select
                      className="form-select"
                      value={gradeForm.testType}
                      onChange={(e) => setGradeForm((f) => ({ ...f, testType: e.target.value }))}
                    >
                      {EXAM_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-12">
                    <div className="col-6">
                      <label className="form-label fw-medium text-sm mb-6">학년</label>
                      <select
                        className="form-select"
                        value={gradeForm.year}
                        onChange={(e) => setGradeForm((f) => ({ ...f, year: e.target.value }))}
                      >
                        {YEAR_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-medium text-sm mb-6">학기</label>
                      <select
                        className="form-select"
                        value={gradeForm.semester}
                        onChange={(e) => setGradeForm((f) => ({ ...f, semester: e.target.value }))}
                      >
                        {SEMESTER_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label fw-medium text-sm mb-6">점수 (0 ~ 100)</label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      max={100}
                      placeholder="점수 입력"
                      value={gradeForm.score}
                      onChange={(e) => setGradeForm((f) => ({ ...f, score: e.target.value }))}
                    />
                  </div>
                  {submitResult && (
                    <div className={`alert ${submitResult.ok ? "alert-success" : "alert-danger"} py-10 px-14 mb-0`}>
                      {submitResult.msg}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24 d-flex gap-8">
                <button
                  type="button"
                  className="btn btn-primary-600 radius-8"
                  onClick={handleGradeSubmit}
                  disabled={submitting || !teacherInfo.subjectCode}
                >
                  {submitting ? "저장 중..." : "채점 저장"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-neutral-300 radius-8"
                  onClick={() => setGradingStudent(null)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
