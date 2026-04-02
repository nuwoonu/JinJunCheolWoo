import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/api/auth";
import {
  getSubjectList,
  getClassGrades,
  inputGrade,
  getGradeRatio,
  setGradeRatio,
  calculateFinalGrades,
  getClassFinalGrades,
} from "@/api/grade";

// [woo] 교사 성적 입력 페이지 - 중간/기말 입력, 비율 설정, 최종 성적 확인

interface Student {
  studentId: number;
  studentName: string;
  attendanceNum: number | null;
}

interface GradeEntry {
  id?: number;
  studentId: number;
  testType: "MIDTERMTEST" | "FINALTEST";
  score: number | null;
}

interface Subject {
  id: number;
  code: string;
  name: string;
}

interface GradeRatio {
  id?: number;
  midtermRatio: number;
  finalRatio: number;
  homeworkRatio: number;
  quizRatio: number;
}

interface FinalGradeRow {
  studentId: number;
  studentName: string;
  midtermScore: number | null;
  finalExamScore: number | null;
  homeworkScore: number | null;
  quizScore: number | null;
  totalScore: number | null;
}

const SEMESTER_OPTIONS = [
  { value: "FIRST", label: "1학기" },
  { value: "FALL", label: "2학기" },
];

const CURRENT_YEAR = new Date().getFullYear();

export default function GradeInput() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const cid = Number(classroomId);

  const [activeTab, setActiveTab] = useState<"grades" | "ratio" | "final">("grades");

  // 필터
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [semester, setSemester] = useState<string>("FIRST");
  const [schoolYear, setSchoolYear] = useState<number>(CURRENT_YEAR);
  const [classroomName, setClassroomName] = useState<string>("");

  // 학생 목록 & 성적 데이터
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeMap, setGradeMap] = useState<Map<string, GradeEntry>>(new Map());
  const [loadingGrades, setLoadingGrades] = useState(false);

  // 비율
  const [ratio, setRatio] = useState<GradeRatio>({ midtermRatio: 25, finalRatio: 25, homeworkRatio: 25, quizRatio: 25 });
  const [ratioSaving, setRatioSaving] = useState(false);

  // 최종 성적
  const [finalGrades, setFinalGrades] = useState<FinalGradeRow[]>([]);
  const [calculating, setCalculating] = useState(false);

  // 저장 상태 (셀별)
  const [savingCell, setSavingCell] = useState<string | null>(null);

  // 학급 이름 조회
  useEffect(() => {
    api.get(`/teacher/class/${cid}/info`).then((res) => {
      setClassroomName(res.data?.className ?? `학급 #${cid}`);
    }).catch(() => {});
  }, [cid]);

  // 과목 목록 조회
  useEffect(() => {
    getSubjectList().then((res) => {
      setSubjects(res.data);
      if (res.data.length > 0) setSelectedSubjectId(res.data[0].id);
    });
  }, []);

  // 학생 목록 조회 (학급 기준)
  useEffect(() => {
    api.get(`/teacher/myclass/students?classroomId=${cid}&year=${schoolYear}`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.students ?? []);
        setStudents(list.map((s: any) => ({
          studentId: s.studentId,
          studentName: s.name,
          attendanceNum: s.studentNumber ?? s.attendanceNum,
        })));
      })
      .catch(() => setStudents([]));
  }, [cid, schoolYear]);

  // 성적 데이터 로드
  const loadGrades = useCallback(() => {
    if (!selectedSubjectId) return;
    setLoadingGrades(true);
    getClassGrades(cid, selectedSubjectId, semester, schoolYear)
      .then((res) => {
        const map = new Map<string, GradeEntry>();
        res.data.forEach((g: any) => {
          const key = `${g.studentId}-${g.testType}`;
          map.set(key, { id: g.id, studentId: g.studentId, testType: g.testType, score: g.score });
        });
        setGradeMap(map);
      })
      .finally(() => setLoadingGrades(false));
  }, [cid, selectedSubjectId, semester, schoolYear]);

  useEffect(() => { loadGrades(); }, [loadGrades]);

  // 비율 로드
  useEffect(() => {
    if (!selectedSubjectId) return;
    getGradeRatio(cid, selectedSubjectId, semester, schoolYear)
      .then((res) => {
        if (res.data && res.data.exists !== false) {
          setRatio({
            midtermRatio: res.data.midtermRatio,
            finalRatio: res.data.finalRatio,
            homeworkRatio: res.data.homeworkRatio,
            quizRatio: res.data.quizRatio,
          });
        }
      })
      .catch(() => {});
  }, [cid, selectedSubjectId, semester, schoolYear]);

  // 성적 셀 blur 시 저장
  const handleScoreBlur = async (
    studentId: number,
    testType: "MIDTERMTEST" | "FINALTEST",
    value: string
  ) => {
    if (!selectedSubjectId) return;
    const score = value === "" ? null : Number(value);
    if (score !== null && (score < 0 || score > 100)) return;

    const key = `${studentId}-${testType}`;
    setSavingCell(key);
    try {
      if (score === null) return;
      await inputGrade({
        classroomId: cid,
        studentId,
        subjectId: selectedSubjectId,
        testType,
        semester,
        schoolYear,
        score,
      });
      setGradeMap((prev) => {
        const next = new Map(prev);
        next.set(key, { ...next.get(key), studentId, testType, score });
        return next;
      });
    } finally {
      setSavingCell(null);
    }
  };

  // 비율 합계
  const ratioTotal = ratio.midtermRatio + ratio.finalRatio + ratio.homeworkRatio + ratio.quizRatio;

  // 비율 저장
  const handleSaveRatio = async () => {
    if (!selectedSubjectId || ratioTotal !== 100) return;
    setRatioSaving(true);
    try {
      await setGradeRatio({
        classroomId: cid,
        subjectId: selectedSubjectId,
        semester,
        schoolYear,
        ...ratio,
      });
      alert("비율이 저장되었습니다.");
    } finally {
      setRatioSaving(false);
    }
  };

  // 최종 성적 계산
  const handleCalculate = async () => {
    if (!selectedSubjectId) return;
    setCalculating(true);
    try {
      await calculateFinalGrades({ classroomId: cid, subjectId: selectedSubjectId, semester, schoolYear });
      const res = await getClassFinalGrades(cid, selectedSubjectId, semester, schoolYear);
      setFinalGrades(res.data);
      setActiveTab("final");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "최종 성적 계산 실패. 비율 설정을 먼저 해주세요.");
    } finally {
      setCalculating(false);
    }
  };

  // 최종 성적 탭 진입 시 로드
  useEffect(() => {
    if (activeTab === "final" && selectedSubjectId) {
      getClassFinalGrades(cid, selectedSubjectId, semester, schoolYear)
        .then((res) => setFinalGrades(res.data))
        .catch(() => setFinalGrades([]));
    }
  }, [activeTab, cid, selectedSubjectId, semester, schoolYear]);

  const fmt = (v: number | null) => v != null ? v.toFixed(1) : "-";

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">성적 입력</h6>
          <div>
            <Link to="/teacher/grade-classes" className="text-secondary-light hover-text-primary hover-underline">
              학급 선택
            </Link>
            <span className="text-neutral-600"> / {classroomName || `학급 #${cid}`}</span>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="card radius-12 mb-20 p-20">
        <div className="d-flex flex-wrap gap-16 align-items-center">
          <div>
            <label className="form-label text-sm fw-semibold mb-4">과목</label>
            <select
              className="form-select form-select-sm"
              value={selectedSubjectId ?? ""}
              onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label text-sm fw-semibold mb-4">학기</label>
            <select
              className="form-select form-select-sm"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              {SEMESTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label text-sm fw-semibold mb-4">학년도</label>
            <select
              className="form-select form-select-sm"
              value={schoolYear}
              onChange={(e) => setSchoolYear(Number(e.target.value))}
            >
              {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR + 1].map((y) => (
                <option key={y} value={y}>{y}년도</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="card radius-12">
        <div className="card-header border-bottom">
          <ul className="nav nav-tabs card-header-tabs">
            {(["grades", "ratio", "final"] as const).map((tab) => (
              <li key={tab} className="nav-item">
                <button
                  className={`nav-link${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "grades" ? "성적 입력" : tab === "ratio" ? "비율 설정" : "최종 성적"}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-body p-20">
          {/* === 성적 입력 탭 === */}
          {activeTab === "grades" && (
            <>
              {loadingGrades ? (
                <div className="text-center py-40 text-secondary-light">불러오는 중...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-40 text-secondary-light">학생이 없습니다.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-sm align-middle text-center">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 60 }}>번호</th>
                        <th className="text-start">학생명</th>
                        <th style={{ width: 140 }}>중간고사</th>
                        <th style={{ width: 140 }}>기말고사</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => {
                        const midKey = `${s.studentId}-MIDTERMTEST`;
                        const finalKey = `${s.studentId}-FINALTEST`;
                        const midScore = gradeMap.get(midKey)?.score;
                        const finalScore = gradeMap.get(finalKey)?.score;
                        return (
                          <tr key={s.studentId}>
                            <td className="text-secondary-light">{s.attendanceNum ?? "-"}</td>
                            <td className="text-start fw-medium">{s.studentName}</td>
                            <td>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                className="form-control form-control-sm text-center"
                                defaultValue={midScore ?? ""}
                                onBlur={(e) => handleScoreBlur(s.studentId, "MIDTERMTEST", e.target.value)}
                                disabled={savingCell === midKey}
                                style={{ maxWidth: 100, margin: "0 auto" }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                className="form-control form-control-sm text-center"
                                defaultValue={finalScore ?? ""}
                                onBlur={(e) => handleScoreBlur(s.studentId, "FINALTEST", e.target.value)}
                                disabled={savingCell === finalKey}
                                style={{ maxWidth: 100, margin: "0 auto" }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-secondary-light text-xs mt-12">
                * 과제/퀴즈 점수는 각각 과제·퀴즈 시스템에서 입력됩니다.
                셀을 벗어나면 자동 저장됩니다.
              </p>
            </>
          )}

          {/* === 비율 설정 탭 === */}
          {activeTab === "ratio" && (
            <div style={{ maxWidth: 400 }}>
              {(["midtermRatio", "finalRatio", "homeworkRatio", "quizRatio"] as const).map((key) => {
                const labels: Record<string, string> = {
                  midtermRatio: "중간고사",
                  finalRatio: "기말고사",
                  homeworkRatio: "과제",
                  quizRatio: "퀴즈",
                };
                return (
                  <div key={key} className="d-flex align-items-center gap-12 mb-16">
                    <label className="form-label mb-0 fw-semibold" style={{ minWidth: 80 }}>
                      {labels[key]}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="form-control form-control-sm text-center"
                      style={{ width: 80 }}
                      value={ratio[key]}
                      onChange={(e) =>
                        setRatio((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                      }
                    />
                    <span className="text-secondary-light">%</span>
                  </div>
                );
              })}
              <div className="d-flex align-items-center gap-12 mb-24">
                <span className="fw-bold" style={{ minWidth: 80 }}>합계</span>
                <span
                  className={`fw-bold fs-5 ${ratioTotal === 100 ? "text-success-600" : "text-danger-600"}`}
                >
                  {ratioTotal}%
                </span>
                {ratioTotal !== 100 && (
                  <span className="text-danger-600 text-xs">합계가 100이어야 합니다</span>
                )}
              </div>
              <div className="d-flex gap-12">
                <button
                  className="btn btn-primary-600"
                  onClick={handleSaveRatio}
                  disabled={ratioSaving || ratioTotal !== 100}
                >
                  {ratioSaving ? "저장 중..." : "비율 저장"}
                </button>
                <button
                  className="btn btn-success-600"
                  onClick={handleCalculate}
                  disabled={calculating || ratioTotal !== 100}
                >
                  {calculating ? "계산 중..." : "최종 성적 계산 실행"}
                </button>
              </div>
            </div>
          )}

          {/* === 최종 성적 탭 === */}
          {activeTab === "final" && (
            <>
              <div className="d-flex justify-content-end mb-12">
                <button
                  className="btn btn-sm btn-success-600"
                  onClick={handleCalculate}
                  disabled={calculating}
                >
                  {calculating ? "계산 중..." : "재계산"}
                </button>
              </div>
              {finalGrades.length === 0 ? (
                <div className="text-center py-40 text-secondary-light">
                  최종 성적이 없습니다. 비율 설정 후 계산을 실행해 주세요.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-sm align-middle text-center">
                    <thead className="table-light">
                      <tr>
                        <th className="text-start">학생명</th>
                        <th>중간고사</th>
                        <th>기말고사</th>
                        <th>과제</th>
                        <th>퀴즈</th>
                        <th className="fw-bold">최종 점수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finalGrades.map((fg) => (
                        <tr key={fg.studentId}>
                          <td className="text-start fw-medium">{fg.studentName}</td>
                          <td>{fmt(fg.midtermScore)}</td>
                          <td>{fmt(fg.finalExamScore)}</td>
                          <td>{fmt(fg.homeworkScore)}</td>
                          <td>{fmt(fg.quizScore)}</td>
                          <td className="fw-bold text-primary-600">{fmt(fg.totalScore)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
