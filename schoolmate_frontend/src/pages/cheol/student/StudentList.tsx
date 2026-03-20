import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

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
          return api.get(
            `/teacher/grades/subject/${encodeURIComponent(info.subjectCode)}?teacherId=${info.teacherInfoId}`,
          );
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
      .get(`/teacher/grades/student/${s.id}`)
      .then((res) => setStudentGrades(res.data ?? []))
      .catch(() => setStudentGrades([]))
      .finally(() => setGradesLoading(false));
  };

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.userName?.toLowerCase().includes(q) ||
      s.fullStudentNumber?.toLowerCase().includes(q) ||
      s.userEmail?.toLowerCase().includes(q)
    );
  });

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
      await api.post(`/teacher/grades?teacherId=${teacherInfo.teacherInfoId}`, {
        studentId: gradingStudent.id,
        subjectCode: teacherInfo.subjectCode,
        testType: gradeForm.testType,
        semester: gradeForm.semester,
        year: gradeForm.year,
        score: scoreNum,
      });
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

  // [cheol] 성적 과목별 그룹화 (성적 확인 모달용)
  const groupedGrades = studentGrades.reduce<Record<string, GradeRecord[]>>((acc, g) => {
    const key = g.subjectName ?? g.subjectCode ?? "기타";
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">{isViewMode ? "성적 결과" : "학생"}</h6>
          <div>
            {isViewMode ? (
              <span className="text-neutral-600">자기 반 전 과목 성적 확인</span>
            ) : (
              <>
                <Link to="/teacher/grade-classes" className="text-secondary-light hover-text-primary hover-underline">
                  학급 선택
                </Link>
                <span className="text-neutral-600"> / 학생 리스트</span>
              </>
            )}
          </div>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">{isViewMode ? "성적 결과" : "학생 리스트"}</li>
        </ul>
      </div>

      <div className="card radius-12">
        <div className="card-header py-16 px-24 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-12">
          <div className="d-flex align-items-center gap-12">
            <h6 className="mb-0">{isViewMode ? "학생 성적 목록" : "학생 목록"}</h6>
            {/* [cheol] 채점 모드: 담당 과목 배지 표시 */}
            {isTeacher && !isViewMode && teacherInfo.subjectName && (
              <span className="badge bg-primary-100 text-primary-600 px-10 py-4 radius-4 text-sm">
                담당 과목: {teacherInfo.subjectName}
              </span>
            )}
            {/* [cheol] 성적 확인 모드: 안내 배지 */}
            {isViewMode && (
              <span className="badge bg-success-100 text-success-600 px-10 py-4 radius-4 text-sm">
                전 과목 성적 조회 모드
              </span>
            )}
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="이름, 학번, 이메일 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col">학번</th>
                  <th scope="col">이름</th>
                  <th scope="col">학년/반</th>
                  <th scope="col">연락처</th>
                  <th scope="col">이메일</th>
                  <th scope="col" className="text-center">
                    {/* [cheol] 모드에 따라 컬럼 헤더 변경 */}
                    {isTeacher && !isViewMode ? "점수" : "성별"}
                  </th>
                  <th scope="col" className="text-center">
                    {isTeacher ? (isViewMode ? "성적 확인" : "채점") : "상세"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-24 text-secondary-light">
                      불러오는 중...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-24 text-secondary-light">
                      등록된 학생이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id}>
                      <td className="fw-medium">{s.fullStudentNumber ?? s.studentCode ?? "-"}</td>
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <div className="w-36-px h-36-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                            <iconify-icon icon="mdi:account" className="text-primary-600" />
                          </div>
                          <span className="fw-medium">{s.userName ?? "-"}</span>
                        </div>
                      </td>
                      <td className="text-secondary-light">
                        {s.year && s.classNum ? `${s.year}학년 ${s.classNum}반` : "-"}
                      </td>
                      <td className="text-secondary-light">{s.phone ?? "-"}</td>
                      <td className="text-secondary-light">{s.userEmail ?? "-"}</td>
                      <td className="text-center">
                        {/* [cheol] 채점 모드: 담당 과목 점수 표시 / 성적 확인 모드: 성별 표시 */}
                        {isTeacher && !isViewMode ? (
                          scoreMap[s.id] != null ? (
                            <span className={`fw-bold ${scoreMap[s.id] >= 90 ? "text-success-600" : scoreMap[s.id] >= 70 ? "text-primary-600" : "text-danger-600"}`}>
                              {scoreMap[s.id]}점
                            </span>
                          ) : (
                            <span className="text-secondary-light">-</span>
                          )
                        ) : (
                          <span className="text-secondary-light">
                            {s.gender === "MALE" ? "남" : s.gender === "FEMALE" ? "여" : "-"}
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        {isTeacher ? (
                          isViewMode ? (
                            // [cheol] 성적 확인 모드: 전 과목 성적 보기 버튼
                            <button
                              type="button"
                              className="btn btn-sm btn-success-600 radius-4"
                              onClick={() => openViewGrades(s)}
                            >
                              <iconify-icon icon="mdi:chart-bar" /> 성적 확인
                            </button>
                          ) : (
                            // 채점 모드: 채점 버튼
                            <button
                              type="button"
                              className="btn btn-sm btn-primary-600 radius-4"
                              onClick={() => openGrading(s)}
                            >
                              <iconify-icon icon="mdi:pencil-outline" /> 채점
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary-600 radius-4"
                            onClick={() => {}}
                          >
                            <iconify-icon icon="mdi:eye-outline" />
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
                    <iconify-icon icon="mdi:file-search-outline" className="text-3xl d-block mb-8" />
                    등록된 성적이 없습니다.
                  </div>
                ) : (
                  // [cheol] 과목별 그룹 출력
                  Object.entries(groupedGrades).map(([subjectName, grades]) => {
                    const avg = grades.filter((g) => g.score != null).length > 0
                      ? (grades.filter((g) => g.score != null).reduce((s, g) => s + (g.score ?? 0), 0) / grades.filter((g) => g.score != null).length).toFixed(1)
                      : "-";
                    return (
                      <div key={subjectName} className="mb-20">
                        <div className="d-flex justify-content-between align-items-center px-4 py-8 mb-8"
                             style={{ borderLeft: "4px solid #3b82f6", paddingLeft: 12 }}>
                          <span className="fw-bold text-sm">{subjectName}</span>
                          <span className="text-xs text-secondary-light">평균: <strong>{avg}</strong>점</span>
                        </div>
                        <div className="table-responsive">
                          <table className="table bordered-table mb-0 text-sm">
                            <thead>
                              <tr>
                                <th>시험 유형</th>
                                <th>학년</th>
                                <th>학기</th>
                                <th className="text-center">점수</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grades.map((g) => (
                                <tr key={g.id}>
                                  <td>
                                    <span className={`badge px-8 py-4 radius-4 fw-medium text-xs ${EXAM_TYPE_COLOR[g.examType] ?? "bg-neutral-100 text-secondary-light"}`}>
                                      {EXAM_TYPE_LABEL[g.examType] ?? g.examType}
                                    </span>
                                  </td>
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
