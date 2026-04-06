import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import api from "@/shared/api/authApi";
import { useAuth } from "@/shared/contexts/AuthContext";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [cheol] /student/myinfo - 학생 본인 정보 (student/student-details.html 구조 그대로)

// ───────────────────────────────────────────────
// 공통 레이블 / 컬러 맵
// ───────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  PENDING: "승인대기",
  ENROLLED: "재학",
  LEAVE_OF_ABSENCE: "휴학",
  DROPOUT: "자퇴",
  EXPELLED: "제적",
  GRADUATED: "졸업",
  TRANSFERRED: "전학",
};
const STATUS_COLOR: Record<string, string> = {
  ENROLLED: "bg-success-100 text-success-600",
  LEAVE_OF_ABSENCE: "bg-warning-100 text-warning-600",
  DROPOUT: "bg-danger-100 text-danger-600",
  EXPELLED: "bg-danger-100 text-danger-600",
  GRADUATED: "bg-primary-100 text-primary-600",
  TRANSFERRED: "bg-info-100 text-info-600",
  PENDING: "bg-neutral-100 text-secondary-light",
};
const GENDER_LABEL: Record<string, string> = { MALE: "남성", FEMALE: "여성" };
const ACHIEVEMENTS_GRADE_LABEL: Record<string, string> = {
  GOLD: "금상",
  SILVER: "은상",
  BRONZE: "동상",
  HONORABLE_MENTION: "장려",
};
const ACHIEVEMENTS_GRADE_COLOR: Record<string, string> = {
  GOLD: "bg-warning-100 text-warning-600",
  SILVER: "bg-neutral-100 text-neutral-600",
  BRONZE: "bg-danger-100 text-danger-600",
  HONORABLE_MENTION: "bg-success-100 text-success-600",
};

// ───────────────────────────────────────────────
// 성적 관련 레이블 / 컬러 맵  (grade.js → TSX 이관)
// ───────────────────────────────────────────────
const YEAR_LABEL: Record<string, string> = {
  FIRST: "1학년",
  SECOND: "2학년",
  THIRD: "3학년",
};
const SEMESTER_LABEL: Record<string, string> = {
  FIRST: "1학기",
  FALL: "2학기",
};
const CATEGORY_LABEL: Record<string, string> = {
  AUTONOMOUS: "자율활동",
  CLUB: "동아리활동",
  VOLUNTEER: "봉사활동",
  CAREER: "진로활동",
};
const CATEGORY_COLOR: Record<string, string> = {
  AUTONOMOUS: "bg-primary-100 text-primary-600",
  CLUB: "bg-success-100 text-success-600",
  VOLUNTEER: "bg-warning-100 text-warning-600",
  CAREER: "bg-info-100 text-info-600",
};

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

/**
 * grade.js → calculateGrade 이관
 * 점수에 따른 등급 반환 (1~6, F)
 */
const calculateGrade = (score: number): string => {
  if (score >= 90) return "1";
  if (score >= 80) return "2";
  if (score >= 70) return "3";
  if (score >= 60) return "4";
  if (score >= 50) return "5";
  if (score >= 40) return "6";
  return "F";
};

/**
 * grade.js → getResult 이관
 * 40점 이상 합격(Pass) / 미만 불합격(Fail)
 */
const getResult = (score: number): "Pass" | "Fail" => (score >= 40 ? "Pass" : "Fail");

// ───────────────────────────────────────────────
// 탭 목록
// ───────────────────────────────────────────────
const TABS = [
  { key: "details", icon: "ri-group-line", label: "세부 정보" },
  { key: "attendance", icon: "ri-mental-health-line", label: "행동 특성 및 종합의견" },
  { key: "awards", icon: "ri-trophy-line", label: "수상경력" },
  { key: "volunteer", icon: "ri-heart-line", label: "봉사활동" },
  { key: "grades", icon: "ri-file-edit-line", label: "성적" },
  { key: "behavior", icon: "ri-book-open-line", label: "세부능력 및 특기사항" },
  { key: "cocurricular", icon: "ri-lightbulb-line", label: "창의적 체험 활동" },
  { key: "dormitory", icon: "ri-building-4-line", label: "기숙사" },
  { key: "library", icon: "ri-book-line", label: "Library" },
];

// ───────────────────────────────────────────────
// 인터페이스 정의
// ───────────────────────────────────────────────
interface Guardian {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
  representative: boolean;
}

interface Award {
  id: number;
  name: string;
  achievementsGrade?: string;
  day?: string;
  organization?: string;
}

interface StudentInfo {
  id: number;
  studentNumber?: number;
  fullStudentNumber?: string;
  studentCode?: string;
  year: number;
  classNum?: number;
  birthDate?: string;
  address?: string;
  addressDetail?: string;
  phone?: string;
  gender?: string;
  status?: string;
  previousSchoolName?: string;
  admissionDate?: string;
  schoolName?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  userUid?: number;
  userName?: string;
  userEmail?: string;
  guardians?: Guardian[];
  awards?: Award[];
}

// grade.js의 Grade 데이터 구조
interface Grade {
  id: number;
  subjectName: string;
  subjectCode?: string;
  examType: string;
  score?: number;
  schoolYear: number;
  semester: number;
  termDisplayName: string;
}

// ───────────────────────────────────────────────
// 공통 UI 컴포넌트
// ───────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="d-flex gap-4">
      <span className="fw-semibold text-sm text-primary-light w-110-px">{label}</span>
      <span className="fw-normal text-sm text-secondary-light">: {value ?? "-"}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="shadow-1 radius-12 bg-base h-100 overflow-hidden">
      <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between">
        <h6 className="text-lg fw-semibold mb-0">{title}</h6>
      </div>
      <div className="card-body p-0">{children}</div>
    </div>
  );
}

// ───────────────────────────────────────────────
// 성적 Pass/Fail 배지  (grade.js → getResultBadge 이관)
// ───────────────────────────────────────────────
function ResultBadge({ score }: { score: number }) {
  const result = getResult(score);
  return result === "Pass" ? (
    <span className="badge bg-success-100 text-success-600 px-10 py-4 radius-4 fw-medium text-xs">Pass</span>
  ) : (
    <span className="badge bg-danger-100 text-danger-600 px-10 py-4 radius-4 fw-medium text-xs">Fail</span>
  );
}

// ───────────────────────────────────────────────
// 성적 탭 컴포넌트
// (grade.js renderAllGrades / renderGradeTable + Grades.tsx 필터 구조 통합)
// ───────────────────────────────────────────────
interface GradesTabProps {
  studentInfoId: number;
}

function GradesTab({ studentInfoId }: GradesTabProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>("ALL");
  const [filterSemester, setFilterSemester] = useState<string>("ALL");

  // grade.js의 getGradesByStudent → React useEffect로 이관
  useEffect(() => {
    api
      .get(`/grades/student/${studentInfoId}`)
      .then((res) => setGrades(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentInfoId]);

  // 필터 적용
  const filtered = grades.filter((g) => {
    if (filterYear !== "ALL" && String(g.schoolYear) !== filterYear) return false;
    if (filterSemester !== "ALL" && String(g.semester) !== filterSemester) return false;
    return true;
  });

  // 요약 통계 계산
  const scoredGrades = filtered.filter((g) => g.score != null);
  const avgScore =
    scoredGrades.length > 0
      ? (scoredGrades.reduce((sum, g) => sum + (g.score ?? 0), 0) / scoredGrades.length).toFixed(1)
      : "-";
  const subjectCount = new Set(filtered.map((g) => g.subjectName)).size;

  // 학년도/학기별 그룹핑 — key 형식: "2026_1"
  const grouped = filtered.reduce<Record<string, Grade[]>>((acc, g) => {
    const key = `${g.schoolYear}_${g.semester}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const [ay, as_] = a.split("_").map(Number);
    const [by, bs] = b.split("_").map(Number);
    return ay !== by ? ay - by : as_ - bs;
  });

  const gradeYears = Array.from(new Set(grades.map((g) => g.schoolYear))).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="text-center py-48 text-secondary-light">
        <i className="ri-loader-4-line text-3xl d-block mb-12" />
        성적을 불러오는 중...
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-16">
      {/* 요약 카드 (grade.js updateTableFooter → 상단 요약으로 이관) */}
      <div className="row gy-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-20 text-center" style={{ borderRadius: 12 }}>
            <div className="w-48-px h-48-px rounded-circle bg-primary-100 d-flex align-items-center justify-content-center mx-auto mb-12">
              <i className="ri-bar-chart-line text-primary-600 text-xl" />
            </div>
            <h4 className="fw-bold mb-4">{filtered.length}</h4>
            <p className="text-secondary-light text-sm mb-0">조회된 성적 수</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-20 text-center" style={{ borderRadius: 12 }}>
            <div className="w-48-px h-48-px rounded-circle bg-success-100 d-flex align-items-center justify-content-center mx-auto mb-12">
              <i className="ri-star-line text-success-600 text-xl" />
            </div>
            <h4 className="fw-bold mb-4">{avgScore}</h4>
            <p className="text-secondary-light text-sm mb-0">평균 점수</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-20 text-center" style={{ borderRadius: 12 }}>
            <div className="w-48-px h-48-px rounded-circle bg-warning-100 d-flex align-items-center justify-content-center mx-auto mb-12">
              <i className="ri-book-open-line text-warning-main text-xl" />
            </div>
            <h4 className="fw-bold mb-4">{subjectCount}</h4>
            <p className="text-secondary-light text-sm mb-0">과목 수</p>
          </div>
        </div>
      </div>

      {/* 필터 + 테이블 */}
      <div className="shadow-1 radius-12 bg-base overflow-hidden">
        {/* 필터 헤더 */}
        <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-12">
          <h6 className="mb-0 fw-semibold">성적 목록</h6>
          <div className="d-flex gap-12 align-items-center flex-wrap">
            <select
              className="form-select form-select-sm"
              style={{ width: 130 }}
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="ALL">전체 학년도</option>
              {gradeYears.map((y) => (
                <option key={y} value={String(y)}>
                  {y}학년도
                </option>
              ))}
            </select>
            <select
              className="form-select form-select-sm"
              style={{ width: 110 }}
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
            >
              <option value="ALL">전체 학기</option>
              <option value="1">1학기</option>
              <option value="2">2학기</option>
            </select>
          </div>
        </div>

        <div className="card-body p-0">
          {filtered.length === 0 ? (
            // grade.js → showNoDataMessage 이관
            <div className="text-center py-48 text-secondary-light">
              <i className="ri-file-search-line text-4xl d-block mb-12" />
              등록된 성적이 없습니다.
            </div>
          ) : (
            // grade.js → renderAllGrades / renderGradeTable 이관
            // 학년/학기 그룹별 테이블 렌더링
            sortedKeys.map((key) => {
              const items = grouped[key];
              const [yearKey, semKey] = key.split("_");
              const groupLabel = items[0]?.termDisplayName ?? `${yearKey}학년도 ${semKey}학기`;

              // grade.js → updateTableFooter 이관: 그룹 푸터 통계
              const scoredItems = items.filter((i) => i.score != null);
              const groupTotal = scoredItems.reduce((s, i) => s + (i.score ?? 0), 0);
              const groupAvg = scoredItems.length > 0 ? (groupTotal / scoredItems.length).toFixed(1) : "-";
              const overallGrade = scoredItems.length > 0 ? calculateGrade(groupTotal / scoredItems.length) : "-";
              const overallResult = scoredItems.length > 0 ? getResult(groupTotal / scoredItems.length) : "-";

              return (
                <div key={key}>
                  {/* 학년/학기 구분 헤더 */}
                  <div className="px-24 py-12 bg-neutral-50 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-sm">{groupLabel}</span>
                    <span className="text-xs text-secondary-light">
                      평균: <strong>{groupAvg}</strong>점
                    </span>
                  </div>

                  {/* 성적 테이블 (grade.js renderGradeTable 구조 이관) */}
                  <div className="table-responsive">
                    <table className="table bordered-table mb-0">
                      <thead>
                        <tr>
                          <th>과목명</th>
                          <th>과목코드</th>
                          <th>시험 유형</th>
                          <th className="text-center">점수</th>
                          <th className="text-center">등급</th>
                          <th className="text-center">결과</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((g) => (
                          <tr key={g.id}>
                            <td className="fw-medium">{g.subjectName}</td>
                            <td className="text-secondary-light">{g.subjectCode ?? "-"}</td>
                            <td>
                              <span
                                className={`badge px-10 py-4 radius-4 fw-medium text-xs ${
                                  EXAM_TYPE_COLOR[g.examType] ?? "bg-neutral-100 text-secondary-light"
                                }`}
                              >
                                {EXAM_TYPE_LABEL[g.examType] ?? g.examType}
                              </span>
                            </td>
                            <td className="text-center">
                              {g.score != null ? (
                                <span
                                  className={`fw-bold ${
                                    g.score >= 90
                                      ? "text-success-600"
                                      : g.score >= 70
                                        ? "text-primary-600"
                                        : "text-danger-600"
                                  }`}
                                >
                                  {g.score}점
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="text-center fw-medium">{g.score != null ? calculateGrade(g.score) : "-"}</td>
                            <td className="text-center">{g.score != null ? <ResultBadge score={g.score} /> : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                      {/* grade.js → updateTableFooter 이관 */}
                      <tfoot>
                        <tr className="bg-neutral-50 text-sm fw-semibold">
                          <td colSpan={3}>합계</td>
                          <td className="text-center">{scoredItems.length * 100}</td>
                          <td></td>
                          <td className="text-center">총점: {groupTotal}</td>
                          <td className="text-center">등급: {overallGrade}</td>
                          <td className="text-center">결과: {overallResult}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// 행동 특성 및 종합의견 탭 컴포넌트
// ───────────────────────────────────────────────
interface BehaviorRecord {
  id: number;
  schoolYear: number;
  semester: number;
  specialNotes?: string;
}

interface CocurricularActivity {
  id: number;
  academicTermId: number;
  schoolYear: number;
  termDisplayName: string;
  category: string;
  specifics?: string;
}

function BehaviorRecordsTab({ studentInfoId }: { studentInfoId: number }) {
  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>("ALL");
  const [filterSemester, setFilterSemester] = useState<string>("ALL");

  useEffect(() => {
    api
      .get(`/behavior-records/student/${studentInfoId}`)
      .then((res) => setRecords(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentInfoId]);

  const filtered = records.filter((r) => {
    if (filterYear !== "ALL" && String(r.schoolYear) !== filterYear) return false;
    if (filterSemester !== "ALL" && String(r.semester) !== filterSemester) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) =>
    a.schoolYear !== b.schoolYear ? a.schoolYear - b.schoolYear : a.semester - b.semester,
  );

  const existingYears = Array.from(new Set(records.map((r) => r.schoolYear))).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="text-center py-48 text-secondary-light">
        <i className="ri-loader-4-line text-3xl d-block mb-12" />
        행동 특성 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-16">
      {/* 필터 헤더 */}
      <div className="shadow-1 radius-12 bg-base overflow-hidden">
        <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-12">
          <h6 className="mb-0 fw-semibold">행동 특성 및 종합의견</h6>
          <div className="d-flex gap-12 align-items-center flex-wrap">
            <select
              className="form-select form-select-sm"
              style={{ width: 130 }}
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="ALL">전체 학년도</option>
              {existingYears.map((y) => (
                <option key={y} value={String(y)}>
                  {y}학년도
                </option>
              ))}
            </select>
            <select
              className="form-select form-select-sm"
              style={{ width: 110 }}
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
            >
              <option value="ALL">전체 학기</option>
              <option value="1">1학기</option>
              <option value="2">2학기</option>
            </select>
          </div>
        </div>

        <div className="card-body p-0">
          {sorted.length === 0 ? (
            <div className="text-center py-48 text-secondary-light">
              <i className="ri-file-search-line text-4xl d-block mb-12" />
              등록된 특기사항 기록이 없습니다.
            </div>
          ) : (
            sorted.map((r) => {
              const yearLabel = `${r.schoolYear}학년도`;
              const semLabel = `${r.semester}학기`;
              return (
                <div key={r.id} className="border-bottom">
                  <div className="px-24 py-12 bg-neutral-50 d-flex align-items-center">
                    <span className="fw-bold text-sm">
                      {yearLabel} {semLabel}
                    </span>
                  </div>
                  <div className="p-24">
                    <p className="text-secondary-light mb-0" style={{ whiteSpace: "pre-wrap" }}>
                      {r.specialNotes ?? "-"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// 창의적 체험 활동 탭 컴포넌트
// ───────────────────────────────────────────────
const CATEGORY_ORDER = ["AUTONOMOUS", "CLUB", "VOLUNTEER", "CAREER"];

// ───────────────────────────────────────────────
// 세부능력 및 특기사항 탭 컴포넌트
// ───────────────────────────────────────────────
interface StudentAbility {
  id: number;
  subjectName: string;
  subjectCode: string;
  termDisplayName: string;
  schoolYear: number;
  semester: number;
  content: string;
}

function StudentAbilityTab({ studentInfoId }: { studentInfoId: number }) {
  const [abilities, setAbilities] = useState<StudentAbility[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<number | "ALL">("ALL");

  useEffect(() => {
    api
      .get(`/student-abilities/student/${studentInfoId}`)
      .then((res) => setAbilities(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentInfoId]);

  // 존재하는 학년도 목록 (오름차순)
  const years = Array.from(new Set(abilities.map((a) => a.schoolYear))).sort((a, b) => a - b);

  const filtered = abilities.filter((a) => filterYear === "ALL" || a.schoolYear === filterYear);

  if (loading) {
    return (
      <div className="text-center py-48 text-secondary-light">
        <i className="ri-loader-4-line text-3xl d-block mb-12" />
        세부능력 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-16">
      <div className="shadow-1 radius-12 bg-base overflow-hidden">
        <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-12">
          <h6 className="mb-0 fw-semibold">세부능력 및 특기사항</h6>
          <div className="d-flex gap-12 align-items-center flex-wrap">
            {/* 학년도 필터 */}
            <div className="d-flex gap-6 flex-wrap">
              <button
                type="button"
                className={`btn btn-sm radius-8 ${filterYear === "ALL" ? "btn-primary-600" : "btn-outline-primary-600"}`}
                onClick={() => setFilterYear("ALL")}
              >
                전체
              </button>
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={`btn btn-sm radius-8 ${filterYear === y ? "btn-primary-600" : "btn-outline-primary-600"}`}
                  onClick={() => setFilterYear(y)}
                >
                  {y}학년도
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-48 text-secondary-light">
              <i className="ri-file-search-line text-4xl d-block mb-12" />
              등록된 세부능력 기록이 없습니다.
            </div>
          ) : (
            filtered.map((a) => (
              <div key={a.id} className="border-bottom">
                <div className="px-24 py-12 bg-neutral-50 d-flex align-items-center gap-12">
                  <span className="badge bg-primary-100 text-primary-600 px-10 py-4 radius-4 text-xs fw-medium">
                    {a.schoolYear}학년도
                  </span>
                  <span
                    className="fw-semibold text-sm px-10 py-4 radius-4"
                    style={{
                      background: "var(--primary-200, #bfdbfe)",
                      color: "var(--primary-700, #1d4ed8)",
                    }}
                  >
                    {a.subjectName}
                  </span>
                </div>
                <div className="p-24">
                  <p className="text-secondary-light mb-0" style={{ whiteSpace: "pre-wrap" }}>
                    {a.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// 창의적 체험 활동 탭 컴포넌트
// ───────────────────────────────────────────────
function CocurricularActivitiesTab({ studentInfoId }: { studentInfoId: number }) {
  const [activities, setActivities] = useState<CocurricularActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>("ALL");

  useEffect(() => {
    api
      .get(`/cocurricular-activities/student/${studentInfoId}`)
      .then((res) => setActivities(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentInfoId]);

  // 학년도 기준 그룹핑
  const schoolYears = Array.from(new Set(activities.map((a) => a.schoolYear))).sort((a, b) => a - b);
  const grouped = schoolYears
    .filter((y) => filterYear === "ALL" || String(y) === filterYear)
    .map((y) => ({
      schoolYear: y,
      items: activities.filter((a) => a.schoolYear === y),
    }))
    .filter((g) => g.items.length > 0);

  if (loading) {
    return (
      <div className="text-center py-48 text-secondary-light">
        <i className="ri-loader-4-line text-3xl d-block mb-12" />
        창의적 체험 활동 정보를 불러오는 중...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="shadow-1 radius-12 bg-base p-40 text-center text-secondary-light">
        <i className="ri-lightbulb-line text-3xl mb-12 d-block" />
        등록된 창의적 체험 활동 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="shadow-1 radius-12 bg-base overflow-hidden">
      <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between flex-wrap gap-12">
        <h6 className="text-lg fw-semibold mb-0">창의적 체험 활동 상황</h6>
        <div className="d-flex gap-8 flex-wrap">
          <button
            type="button"
            className={`btn btn-sm radius-8 ${filterYear === "ALL" ? "btn-primary-600" : "btn-outline-primary-600"}`}
            onClick={() => setFilterYear("ALL")}
          >
            전체
          </button>
          {schoolYears.map((y) => (
            <button
              key={y}
              type="button"
              className={`btn btn-sm radius-8 ${filterYear === String(y) ? "btn-primary-600" : "btn-outline-primary-600"}`}
              onClick={() => setFilterYear(String(y))}
            >
              {y}학년도
            </button>
          ))}
        </div>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table bordered-table mb-0">
            <thead>
              <tr>
                <th className="text-center" style={{ width: 140 }}>
                  학기
                </th>
                <th className="text-center" style={{ width: 120 }}>
                  영역
                </th>
                <th>특기사항</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((group) => {
                const categoryItems = CATEGORY_ORDER.map((cat) => group.items.find((a) => a.category === cat)).filter(
                  Boolean,
                ) as CocurricularActivity[];

                return categoryItems.map((item, idx) => (
                  <tr key={item.id}>
                    {idx === 0 && (
                      <td className="text-center fw-bold align-middle" rowSpan={categoryItems.length}>
                        {group.schoolYear}학년도
                      </td>
                    )}
                    <td className="text-center align-middle">
                      <span
                        className={`badge px-10 py-4 radius-4 fw-medium text-xs ${
                          CATEGORY_COLOR[item.category] ?? "bg-neutral-100 text-secondary-light"
                        }`}
                      >
                        {CATEGORY_LABEL[item.category] ?? item.category}
                      </span>
                    </td>
                    <td className="text-secondary-light" style={{ whiteSpace: "pre-wrap", minWidth: 300 }}>
                      {item.specifics ?? "-"}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// 기숙사 탭 컴포넌트
// ───────────────────────────────────────────────
interface DormitoryInfo {
  id: number;
  building: string;
  floor: number;
  roomNumber: string;
  bedNumber: string;
  roomType: string;
  roomTypeDescription: string;
  studentNames: string[];
  isEmpty: boolean;
  occupiedCount: number;
  fullAddress: string;
}

function DormitoryTab({ studentInfoId }: { studentInfoId: number }) {
  const [dormitory, setDormitory] = useState<DormitoryInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/dormitories/students/${studentInfoId}`)
      .then((res) => {
        setDormitory(res.status === 204 || !res.data ? null : res.data);
      })
      .catch(() => setDormitory(null))
      .finally(() => setLoading(false));
  }, [studentInfoId]);

  if (loading) {
    return (
      <div className="text-center py-48 text-secondary-light">
        <i className="ri-loader-4-line text-3xl d-block mb-12" />
        기숙사 정보를 불러오는 중...
      </div>
    );
  }

  if (!dormitory) {
    return (
      <div className="shadow-1 radius-12 bg-base p-40 text-center text-secondary-light">
        <i className="ri-building-4-line text-3xl mb-12 d-block" />
        배정된 기숙사가 없습니다.
      </div>
    );
  }

  return (
    <SectionCard title="기숙사 정보">
      <div className="p-24">
        <div className="row gy-4">
          <div className="col-sm-4">
            <h6 className="text-md mb-2 fw-medium">기숙사명</h6>
            <span className="text-secondary-light">{dormitory.building}</span>
          </div>
          <div className="col-sm-4">
            <h6 className="text-md mb-2 fw-medium">층</h6>
            <span className="text-secondary-light">{dormitory.floor}층</span>
          </div>
          <div className="col-sm-4">
            <h6 className="text-md mb-2 fw-medium">호실</h6>
            <span className="text-secondary-light">{dormitory.roomNumber}호</span>
          </div>
          <div className="col-sm-4">
            <h6 className="text-md mb-2 fw-medium">침대 번호</h6>
            <span className="text-secondary-light">{dormitory.bedNumber}</span>
          </div>
          <div className="col-sm-4">
            <h6 className="text-md mb-2 fw-medium">방 유형</h6>
            <span className="text-secondary-light">{dormitory.roomTypeDescription}</span>
          </div>
          <div className="col-sm-4">
            <h6 className="text-md mb-2 fw-medium">전체 주소</h6>
            <span className="text-secondary-light">{dormitory.fullAddress}</span>
          </div>
          {dormitory.studentNames && dormitory.studentNames.length > 0 && (
            <div className="col-sm-12">
              <h6 className="text-md mb-2 fw-medium">같은 방 학생</h6>
              <span className="text-secondary-light">{dormitory.studentNames.join(", ")}</span>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

// ───────────────────────────────────────────────
// 진로희망 섹션 컴포넌트 (세부 정보 탭 내)
// ───────────────────────────────────────────────
interface CareerAspirationItem {
  schoolYear: number;
  semester: number;
  specialtyOrInterest?: string;
  studentDesiredJob?: string;
  parentDesiredJob?: string;
}

function CareerAspirationSection({ studentInfoId }: { studentInfoId: number }) {
  const [items, setItems] = useState<CareerAspirationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/career-aspirations/students/${studentInfoId}`)
      .then((res) => setItems(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentInfoId]);

  // 학년도별 그룹핑 — 2학기 우선, 없으면 1학기
  const years = Array.from(new Set(items.map((i) => i.schoolYear))).sort((a, b) => a - b);
  const grouped = years
    .map((y) => {
      const yearItems = items.filter((i) => i.schoolYear === y);
      const record = yearItems.find((i) => i.semester === 2) ?? yearItems[0] ?? null;
      return { yearKey: y, record };
    })
    .filter((g) => g.record !== null);

  if (loading) {
    return <div className="p-20 text-secondary-light text-sm">불러오는 중...</div>;
  }

  if (grouped.length === 0) {
    return <div className="p-20 text-secondary-light text-sm">등록된 진로희망이 없습니다.</div>;
  }

  return (
    <div className="table-responsive">
      <table className="table mb-0" style={{ borderCollapse: "collapse", textAlign: "center", fontSize: 13 }}>
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="align-middle"
              style={{ border: "1px solid #d1d5db", background: "#f0f4ff", width: 60, padding: "8px 12px" }}
            >
              학 년
            </th>
            <th
              rowSpan={2}
              className="align-middle"
              style={{ border: "1px solid #d1d5db", background: "#f0f4ff", padding: "8px 16px" }}
            >
              특기 또는 흥미
            </th>
            <th
              colSpan={2}
              style={{
                border: "1px solid #d1d5db",
                background: "#f0f4ff",
                padding: "8px 12px",
                letterSpacing: "0.2em",
              }}
            >
              진 로 희 망
            </th>
          </tr>
          <tr>
            <th style={{ border: "1px solid #d1d5db", background: "#f0f4ff", padding: "8px 16px", width: 140 }}>
              학생
            </th>
            <th style={{ border: "1px solid #d1d5db", background: "#f0f4ff", padding: "8px 16px", width: 140 }}>
              학부모
            </th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(({ yearKey, record }) => (
            <tr key={yearKey}>
              <td style={{ border: "1px solid #d1d5db", padding: "10px 12px", fontWeight: 600 }}>{yearKey}</td>
              <td style={{ border: "1px solid #d1d5db", padding: "10px 16px", color: "#374151" }}>
                {record!.specialtyOrInterest ?? "-"}
              </td>
              <td style={{ border: "1px solid #d1d5db", padding: "10px 16px", color: "#374151" }}>
                {record!.studentDesiredJob ?? "-"}
              </td>
              <td style={{ border: "1px solid #d1d5db", padding: "10px 16px", color: "#374151" }}>
                {record!.parentDesiredJob ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───────────────────────────────────────────────
// 봉사활동 탭 컴포넌트
// ───────────────────────────────────────────────
interface VolunteerActivity {
  id: number;
  schoolYear: number;
  startDate: string;
  endDate?: string;
  organizer: string;
  activityContent: string;
  hours: number;
  cumulativeHours: number;
}

function VolunteerActivityTab({ studentInfoId }: { studentInfoId: number }) {
  const [activities, setActivities] = useState<VolunteerActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/volunteer-activities/student/${studentInfoId}`)
      .then((res) => setActivities(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentInfoId]);

  const volunteerYears = Array.from(new Set(activities.map((a) => a.schoolYear))).sort((a, b) => a - b);
  const grouped = volunteerYears.map((y) => ({
    yearKey: y,
    items: activities.filter((a) => a.schoolYear === y),
  }));

  const formatDate = (date: string) => date.replace(/-/g, ".") + ".";
  const formatPeriod = (start: string, end?: string) => {
    if (!end || start === end) return formatDate(start);
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  if (loading) {
    return (
      <div className="text-center py-48 text-secondary-light">
        <i className="ri-loader-4-line text-3xl d-block mb-12" />
        봉사활동 정보를 불러오는 중...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="shadow-1 radius-12 bg-base p-40 text-center text-secondary-light">
        <i className="ri-heart-line text-3xl mb-12 d-block" />
        등록된 봉사활동 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="shadow-1 radius-12 bg-base overflow-hidden">
      <div className="card-header border-bottom bg-base py-16 px-24">
        <h6 className="text-lg fw-semibold mb-0">봉사 활동 실적</h6>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table bordered-table mb-0">
            <thead>
              <tr>
                <th className="text-center" style={{ width: 80 }}>
                  학년
                </th>
                <th className="text-center" style={{ width: 160 }}>
                  일자 또는 기간
                </th>
                <th className="text-center" style={{ width: 180 }}>
                  장소 또는 주관기관명
                </th>
                <th>활동 내용</th>
                <th className="text-center" style={{ width: 70 }}>
                  시간
                </th>
                <th className="text-center" style={{ width: 90 }}>
                  누계시간
                </th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((group) =>
                group.items.map((item, idx) => (
                  <tr key={item.id}>
                    {idx === 0 && (
                      <td className="text-center fw-bold align-middle" rowSpan={group.items.length}>
                        {group.yearKey}학년도
                      </td>
                    )}
                    <td className="text-center align-middle" style={{ fontSize: 13 }}>
                      {formatPeriod(item.startDate, item.endDate)}
                    </td>
                    <td className="align-middle" style={{ fontSize: 13 }}>
                      {item.organizer}
                    </td>
                    <td className="align-middle" style={{ fontSize: 13 }}>
                      {item.activityContent}
                    </td>
                    <td className="text-center align-middle fw-medium">{item.hours}</td>
                    <td className="text-center align-middle fw-medium">{item.cumulativeHours}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// 메인 컴포넌트
// ───────────────────────────────────────────────
export default function StudentMyInfo() {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", birthDate: "", address: "", gender: "" });
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    if (!student) return;
    setEditForm({
      name: student.userName ?? "",
      phone: student.phone ?? "",
      birthDate: student.birthDate?.slice(0, 10) ?? "",
      address: student.address ?? "",
      gender: student.gender ?? "",
    });
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await api.put(`/students/${user.uid}`, {
        name: editForm.name || null,
        phone: editForm.phone || null,
        birthDate: editForm.birthDate || null,
        address: editForm.address || null,
        gender: editForm.gender || null,
      });
      const res = await api.get(`/students/${user.uid}`);
      setStudent(res.data);
      setIsEditing(false);
    } catch {
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([api.get(`/students/${user.uid}`), api.get("/dashboard/student")])
      .then(([studentRes, dashRes]) => {
        setStudent(studentRes.data);
        if (dashRes.data?.profileImageUrl) setProfileImageUrl(dashRes.data.profileImageUrl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.uid]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-80 text-secondary-light">불러오는 중...</div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="card border-0 p-80 text-center">
          <i className="ri-user-search-line text-5xl text-neutral-300 mb-16" />
          <h5 className="text-secondary-light">학생 정보를 불러올 수 없습니다.</h5>
        </div>
      </DashboardLayout>
    );
  }

  const statusLabel = student.status ? (STATUS_LABEL[student.status] ?? student.status) : "재학";
  const statusClass = student.status
    ? (STATUS_COLOR[student.status] ?? "bg-neutral-100 text-secondary-light")
    : "bg-success-100 text-success-600";

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">학생</h1>
          <div>
            <Link to="/student/dashboard" className="text-secondary-light hover-text-primary hover-underline">
              학생 대시보드{" "}
            </Link>
            <span className="text-secondary-light">/ 학생 세부사항 </span>
          </div>
        </div>
      </div>

      {/* 프로필 카드 (상단) */}
      <div className="card h-100 mb-16">
        <div className="card-body p-24">
          <div className="d-flex gap-32 flex-md-row flex-column">
            {/* 왼쪽: 아바타 + 이름 + 학번 + 버튼 */}
            <div className="max-w-300-px w-100 text-center">
              <figure className="mb-24 w-120-px h-120-px mx-auto rounded-circle overflow-hidden bg-neutral-100 d-flex align-items-center justify-content-center">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="프로필" className="w-100 h-100 object-fit-cover" />
                ) : (
                  <span className="text-neutral-400" style={{ fontSize: 48 }}>
                    <i className="ri-user-3-line" />
                  </span>
                )}
              </figure>
              <h2 className="h6 text-primary-light mb-16 fw-semibold">{student.userName ?? "-"}</h2>
              <p className="mb-0">
                학번:{" "}
                <span className="text-primary-600 fw-semibold">
                  {student.studentCode ?? student.fullStudentNumber ?? "-"}
                </span>
              </p>
              <p className="mb-0">
                번 번호: <span className="text-primary-light fw-semibold">{student.studentNumber ?? "-"}</span>
              </p>
              <div className="mt-32 d-flex gap-16 w-100">
                {!isEditing ? (
                  <button
                    type="button"
                    className="btn btn-primary-600 border fw-medium border-primary-600 text-md d-flex justify-content-center align-items-center gap-8 flex-grow-1 px-12 py-8 radius-8"
                    onClick={startEdit}
                  >
                    <span className="d-flex text-lg">
                      <i className="ri-edit-line" />
                    </span>
                    수정
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary-600 border fw-medium border-primary-600 text-md d-flex justify-content-center align-items-center gap-8 flex-grow-1 px-12 py-8 radius-8"
                      onClick={saveEdit}
                      disabled={saving}
                    >
                      <span className="d-flex text-lg">
                        <i className="ri-save-line" />
                      </span>
                      {saving ? "저장 중..." : "저장"}
                    </button>
                    <button
                      type="button"
                      className="btn border fw-medium border-neutral-200 text-md d-flex justify-content-center align-items-center gap-8 flex-grow-1 px-12 py-8 radius-8"
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                    >
                      취소
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 구분선 */}
            <div>
              <span className="h-100 w-1-px bg-neutral-200 d-block" />
            </div>

            {/* 오른쪽: 개인정보 */}
            <div className="flex-grow-1">
              <div className="pb-16 border-bottom d-flex align-items-center justify-content-between gap-20">
                <h3 className="h6 text-primary-light text-lg mb-0 fw-semibold">개인정보</h3>
                <span className={`px-16 py-4 radius-4 fw-medium text-sm ${statusClass}`}>{statusLabel}</span>
              </div>
              {!isEditing ? (
                <div className="mt-16 d-flex flex-column gap-8">
                  <InfoRow label="학번" value={student.fullStudentNumber ?? student.studentCode} />
                  <InfoRow label="학년" value={student.year ? `${student.year}학년` : undefined} />
                  <InfoRow label="반" value={student.classNum ? `${student.classNum}반` : undefined} />
                  <InfoRow
                    label="성별"
                    value={student.gender ? (GENDER_LABEL[student.gender] ?? student.gender) : undefined}
                  />
                  <InfoRow label="생년월일" value={student.birthDate?.slice(0, 10)} />
                  <InfoRow label="주소" value={student.address} />
                  <InfoRow label="연락처" value={student.phone} />
                  <InfoRow label="이메일" value={student.userEmail} />
                </div>
              ) : (
                <div className="mt-16 d-flex flex-column gap-12">
                  {/* 읽기 전용 */}
                  <InfoRow label="학번" value={student.fullStudentNumber ?? student.studentCode} />
                  <InfoRow label="학년" value={student.year ? `${student.year}학년` : undefined} />
                  <InfoRow label="반" value={student.classNum ? `${student.classNum}반` : undefined} />
                  <InfoRow label="이메일" value={student.userEmail} />
                  {/* 수정 가능 */}
                  <div className="d-flex align-items-center gap-4">
                    <span className="fw-semibold text-sm text-primary-light w-110-px flex-shrink-0">이름</span>
                    <input
                      className="form-control form-control-sm"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <span className="fw-semibold text-sm text-primary-light w-110-px flex-shrink-0">성별</span>
                    <select
                      className="form-select form-select-sm"
                      value={editForm.gender}
                      onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                    >
                      <option value="">선택</option>
                      <option value="MALE">남성</option>
                      <option value="FEMALE">여성</option>
                    </select>
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <span className="fw-semibold text-sm text-primary-light w-110-px flex-shrink-0">생년월일</span>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={editForm.birthDate}
                      onChange={(e) => setEditForm((f) => ({ ...f, birthDate: e.target.value }))}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <span className="fw-semibold text-sm text-primary-light w-110-px flex-shrink-0">주소</span>
                    <input
                      className="form-control form-control-sm"
                      value={editForm.address}
                      onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <span className="fw-semibold text-sm text-primary-light w-110-px flex-shrink-0">연락처</span>
                    <input
                      className="form-control form-control-sm"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="my-16">
        <ul className="nav nav-pills bordered-tab mb-3" role="tablist">
          {TABS.map((tab) => (
            <li key={tab.key} className="nav-item" role="presentation">
              <button
                className={`nav-link d-flex align-items-center gap-8 text-secondary-light fw-medium text-sm text-hover-primary-600 text-capitalize bg-transparent px-20 py-12${activeTab === tab.key ? " active" : ""}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="d-flex tab-icon line-height-1 text-md">
                  <i className={tab.icon} />
                </span>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="tab-content">
          {/* Student Details 탭 */}
          {activeTab === "details" && (
            <div className="row gy-4">
              {/* 보호자 정보 (col-12) */}
              <div className="col-12">
                <SectionCard title="보호자 정보">
                  {student.guardians && student.guardians.length > 0 ? (
                    student.guardians.map((g, i) => (
                      <div key={g.id ?? i} className="bg-hover-neutral-50 p-20">
                        <div className="row g-4">
                          <div className="col-sm-4">
                            <div className="d-flex align-items-center gap-12">
                              <figure className="w-48-px h-48-px rounded-circle overflow-hidden mb-0 bg-neutral-100 d-flex align-items-center justify-content-center flex-shrink-0">
                                <i className="ri-user-line text-neutral-400 text-xl" />
                              </figure>
                              <div>
                                <h6 className="text-md mb-2 fw-medium flex-grow-1">{g.name}</h6>
                                <span>
                                  {g.relationship ?? "-"}
                                  {g.representative && (
                                    <span className="ms-6 badge bg-primary-100 text-primary-600 text-xs px-6 py-2 radius-4">
                                      주보호자
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-4">
                            <h6 className="text-md mb-2 fw-medium">연락처</h6>
                            <span>{g.phone ?? "-"}</span>
                          </div>
                          <div className="col-sm-4">
                            <h6 className="text-md mb-2 fw-medium">이메일</h6>
                            <span>{g.email ?? "-"}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-20 text-secondary-light text-sm">등록된 보호자가 없습니다.</div>
                  )}
                </SectionCard>
              </div>

              {/* 학적 사항 (col-md-6) */}
              <div className="col-md-6">
                <SectionCard title="학적 사항">
                  <div className="p-20">
                    <div className="row gy-4">
                      <div className="col-sm-6">
                        <h6 className="text-md mb-2 fw-medium">학적 상태</h6>
                        <span className={`badge px-10 py-4 radius-4 fw-medium text-xs ${STATUS_COLOR[student.status ?? ""] ?? "bg-neutral-100 text-secondary-light"}`}>
                          {STATUS_LABEL[student.status ?? ""] ?? "-"}
                        </span>
                      </div>
                      <div className="col-sm-6">
                        <h6 className="text-md mb-2 fw-medium">입학일</h6>
                        <span className="text-secondary-light">{student.admissionDate ? student.admissionDate.slice(0, 10) : "-"}</span>
                      </div>
                      <div className="col-sm-12">
                        <h6 className="text-md mb-2 fw-medium">이전 학교명</h6>
                        <span className="text-secondary-light">{student.previousSchoolName ?? "-"}</span>
                      </div>
                      <div className="col-sm-12">
                        <h6 className="text-md mb-2 fw-medium">재학 중인 학교명</h6>
                        <span className="text-secondary-light">{student.schoolName ?? "-"}</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* 진로희망 (col-12) */}
              <div className="col-12">
                <SectionCard title="진로희망">
                  <CareerAspirationSection studentInfoId={student.id} />
                </SectionCard>
              </div>

              {/* 계좌 정보 (col-md-6) */}
              <div className="col-md-6">
                <SectionCard title="계좌 정보">
                  <div className="p-20">
                    <div className="row gy-4">
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">은행명</h6>
                        <span className="text-secondary-light">-</span>
                      </div>
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">지점</h6>
                        <span className="text-secondary-light">-</span>
                      </div>
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">계좌번호</h6>
                        <span className="text-secondary-light">-</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* 의료 기록 (col-md-6) */}
              <div className="col-md-6">
                <SectionCard title="의료 기록">
                  <div className="p-20">
                    <div className="row gy-4">
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">혈액형</h6>
                        <span className="text-secondary-light">{student.bloodGroup ?? "-"}</span>
                      </div>
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">신장(cm)</h6>
                        <span className="text-secondary-light">{student.height ?? "-"}</span>
                      </div>
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">체중(kg)</h6>
                        <span className="text-secondary-light">{student.weight ?? "-"}</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {/* 수상경력 탭 */}
          {activeTab === "awards" && (
            <div className="shadow-1 radius-12 bg-base overflow-hidden">
              <div className="card-header border-bottom bg-base py-16 px-24">
                <h6 className="text-lg fw-semibold mb-0">수상 이력</h6>
              </div>
              {student.awards && student.awards.length > 0 ? (
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table bordered-table mb-0">
                      <thead>
                        <tr>
                          <th>수상명</th>
                          <th>수상일</th>
                          <th>수상 기관</th>
                          <th>등급</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.awards.map((a, i) => (
                          <tr key={a.id ?? i}>
                            <td className="fw-medium">{a.name}</td>
                            <td className="text-secondary-light">{a.day?.slice(0, 10) ?? "-"}</td>
                            <td className="text-secondary-light">{a.organization ?? "-"}</td>
                            <td>
                              {a.achievementsGrade ? (
                                <span
                                  className={`badge px-10 py-4 radius-4 fw-medium text-xs ${ACHIEVEMENTS_GRADE_COLOR[a.achievementsGrade] ?? "bg-neutral-100 text-secondary-light"}`}
                                >
                                  {ACHIEVEMENTS_GRADE_LABEL[a.achievementsGrade] ?? a.achievementsGrade}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-20 text-secondary-light text-sm">등록된 수상 이력이 없습니다.</div>
              )}
            </div>
          )}

          {/* 성적 탭 — grade.js + Grades.tsx 통합 구현 */}
          {activeTab === "grades" && <GradesTab studentInfoId={student.id} />}

          {/* 행동 특성 및 종합의견 탭 */}
          {activeTab === "attendance" && <BehaviorRecordsTab studentInfoId={student.id} />}

          {/* 세부능력 및 특기사항 탭 */}
          {activeTab === "behavior" && <StudentAbilityTab studentInfoId={student.id} />}

          {/* 창의적 체험 활동 탭 */}
          {activeTab === "cocurricular" && <CocurricularActivitiesTab studentInfoId={student.id} />}

          {/* 기숙사 탭 */}
          {activeTab === "dormitory" && <DormitoryTab studentInfoId={student.id} />}

          {/* 봉사활동 탭 */}
          {activeTab === "volunteer" && <VolunteerActivityTab studentInfoId={student.id} />}

          {/* 준비 중 탭 */}
          {["library"].includes(activeTab) && (
            <div className="shadow-1 radius-12 bg-base p-40 text-center text-secondary-light">
              <i className="ri-tools-line text-3xl mb-12 d-block" />
              준비 중입니다.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
