import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "@/shared/api/authApi";
import { useAuth } from "@/shared/contexts/AuthContext";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [woo] 과제/퀴즈 통합 목록 페이지
// - /homework → 과제 목록, /quiz → 퀴즈 목록
// - 교사: 내가 출제한 목록 / 학생: 내 학급 목록

// ========== 타입 ==========
interface Homework {
  id: number;
  title: string;
  teacherName: string;
  classroomName: string;
  classroomId: number;
  status: "OPEN" | "CLOSED" | "GRADED";
  dueDate: string;
  hasAttachment: boolean;
  maxScore: number;
  submissionCount: number;
  totalStudentCount: number;
  createDate: string;
  submitted?: boolean;
  score?: number | null;
  feedback?: string | null;
  submissionStatus?: "SUBMITTED" | "LATE" | "GRADED" | null;
}

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  week: number | null;
  teacherName: string;
  subjectName?: string | null;
  classroomName: string;
  classroomId: number;
  status: "OPEN" | "CLOSED";
  dueDate: string;
  questionCount: number;
  totalPoints: number;
  maxAttempts: number | null;
  timeLimit?: number | null;
  showAnswer: boolean;
  createDate: string;
  submissionCount?: number | null;
  totalStudentCount?: number | null;
  averageScore?: number | null;
  myAttemptCount?: number | null;
  myBestScore?: number | null;
}

// [soojin] 뱃지 인라인 스타일 - TeacherList 동일 패턴
const badgeBase: React.CSSProperties = {
  padding: "3px 8px",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  whiteSpace: "nowrap",
};
const HW_BADGE: Record<string, React.CSSProperties> = {
  OPEN: { background: "rgba(22,163,74,0.1)", color: "#16a34a" },
  CLOSED: { background: "rgba(239,68,68,0.1)", color: "#dc2626" },
  GRADED: { background: "rgba(14,165,233,0.1)", color: "#0284c7" },
};
const HW_LABEL: Record<string, string> = { OPEN: "진행중", CLOSED: "마감", GRADED: "채점완료" };
const QZ_BADGE: Record<string, React.CSSProperties> = {
  OPEN: { background: "rgba(22,163,74,0.1)", color: "#16a34a" },
  CLOSED: { background: "rgba(239,68,68,0.1)", color: "#dc2626" },
};
const QZ_LABEL: Record<string, string> = { OPEN: "진행중", CLOSED: "마감" };

// [soojin] th/td 공통 스타일 - TeacherList 동일 패턴
const thSt: React.CSSProperties = {
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 600,
  color: "#6b7280",
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  textAlign: "left",
};
const tdSt: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  color: "#374151",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

export default function HomeworkList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const role = user?.role ?? "";
  const isTeacher = role === "TEACHER";
  const isStudent = role === "STUDENT";

  // [soojin] URL 경로로 탭 결정: /quiz → 퀴즈 전용, /homework → 과제 전용
  const activeTab = pathname === "/quiz" ? "quiz" : "homework";

  const [totalAll, setTotalAll] = useState<number | null>(null);
  const isInitialLoad = useRef(true);
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [revealedStudentScores, setRevealedStudentScores] = useState<Set<number>>(new Set());

  const toggleStudentScore = (hwId: number) => {
    setRevealedStudentScores((prev) => {
      const next = new Set(prev);
      if (next.has(hwId)) next.delete(hwId);
      else next.add(hwId);
      return next;
    });
  };

  // [soojin] ovStatus/ovKeyword: reset 시 state 업데이트 전 API 호출 대응
  const load = (p = 0, ovStatus?: string, ovKeyword?: string) => {
    const s = ovStatus !== undefined ? ovStatus : status;
    const k = ovKeyword !== undefined ? ovKeyword : keyword;
    setLoading(true);
    const endpoint =
      activeTab === "homework"
        ? isTeacher
          ? "/homework/teacher"
          : "/homework/student"
        : isTeacher
          ? "/quiz/teacher"
          : "/quiz/student";
    const params =
      activeTab === "homework"
        ? { page: p, size: 10, status: s || undefined, keyword: k || undefined }
        : { page: 0, size: 200, status: s || undefined, keyword: k || undefined };
    api
      .get(endpoint, { params })
      .then((res) => {
        if (activeTab === "homework") setHomeworks(res.data.content);
        else setQuizzes(res.data.content);
        if (activeTab === "homework") setTotalPages(res.data.totalPages ?? 1);
        setTotalElements(res.data.totalElements ?? 0);
        if (activeTab === "homework") setCurrentPage(res.data.currentPage ?? p);
        if (isInitialLoad.current) {
          setTotalAll(res.data.totalElements);
          isInitialLoad.current = false;
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    isInitialLoad.current = true;
    setTotalAll(null);
    setStatus("");
    setKeyword("");
    load(0, "", "");
  }, [activeTab]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    load(0);
  };
  const reset = () => {
    setStatus("");
    setKeyword("");
    load(0, "", "");
  };
  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();
  const formatDateTime = (date: string) => {
    if (!date) return "-";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
  };
  const getDday = (dueDate: string) => {
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return "-";
    const now = new Date();
    const oneDay = 1000 * 60 * 60 * 24;
    const diff = Math.ceil((due.getTime() - now.getTime()) / oneDay);
    if (diff < 0) return `D+${Math.abs(diff)}`;
    return `D-${diff}`;
  };
  const getPercent = (value: number, total: number) => {
    if (!total || total <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
  };
  const splitTeacherName = (teacherName: string) => {
    const m = teacherName?.match(/^(.+?)\[(.+)\]$/);
    if (!m) return { teacher: teacherName, subject: null as string | null };
    return { teacher: m[1], subject: m[2] };
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/quiz/${quizId}`);
      load(0);
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const teacherQuizStats = {
    total: totalAll ?? totalElements ?? quizzes.length,
    openCount: quizzes.filter((q) => q.status === "OPEN").length,
    closedCount: quizzes.filter((q) => q.status === "CLOSED").length,
    completedCount: quizzes.filter((q) => {
      const total = q.totalStudentCount ?? 0;
      const submitted = q.submissionCount ?? 0;
      return total > 0 && submitted >= total;
    }).length,
  };
  const completedQuizzes = quizzes.filter((q) => (q.myAttemptCount ?? 0) > 0);
  const studentQuizStats = {
    total: totalAll ?? totalElements ?? quizzes.length,
    unattempted: quizzes.filter((q) => (q.myAttemptCount ?? 0) === 0).length,
    completed: completedQuizzes.length,
    avgScore:
      completedQuizzes.length > 0
        ? Math.round(
            completedQuizzes.reduce((sum, q) => sum + getPercent(q.myBestScore ?? 0, q.totalPoints), 0) /
              completedQuizzes.length,
          )
        : 0,
  };

  const statusOptions =
    activeTab === "homework"
      ? [
          { v: "OPEN", l: "진행중" },
          { v: "CLOSED", l: "마감" },
          { v: "GRADED", l: "채점완료" },
        ]
      : [
          { v: "OPEN", l: "진행중" },
          { v: "CLOSED", l: "마감" },
        ];

  const selSt: React.CSSProperties = {
    padding: "5px 24px 5px 8px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    background: "#fff",
    appearance: "none",
    WebkitAppearance: "none",
    cursor: "pointer",
  };

  return (
    <DashboardLayout>
      {/* [soojin] 화면 꽉 채우기 - TeacherList 동일 패턴 */}
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 4.5rem - 48px)" }}>
        {/* [soojin] 제목 - 퀴즈탭: "퀴즈 관리" 스타일, 과제탭: 기존 스타일 유지 */}
        <div style={{ marginBottom: 12, flexShrink: 0 }}>
          {activeTab === "quiz" ? (
            <>
              {isTeacher ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 24, color: "#111827", marginBottom: 4 }}>퀴즈 관리</div>
                  <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 12px 0" }}>퀴즈 출제 및 응시 현황 관리</p>
                  <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: 0 }} />
                </>
              ) : (
                <div style={{ fontWeight: 700, fontSize: 24, color: "#111827", marginBottom: 4 }}>퀴즈 목록</div>
              )}
            </>
          ) : (
            <>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 20,
                  lineHeight: 1.3,
                  color: "#111827",
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                과제 목록
                <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>전체 {totalAll ?? 0}건</span>
              </div>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
                {isTeacher ? "출제한 과제 목록입니다." : "과제 목록입니다."}
              </p>
            </>
          )}
        </div>

        {/* [soojin] 탭 - 클릭 시 전용 라우트로 이동 */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: 12, flexShrink: 0 }}>
          {(["homework", "quiz"] as const).map((tab) => (
            <button
              key={tab}
              style={{
                padding: "8px 20px",
                fontSize: 14,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? "#25A194" : "#6b7280",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid #25A194" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: -1,
              }}
              onClick={() => navigate(tab === "homework" ? "/homework" : "/quiz")}
            >
              <i
                className={tab === "homework" ? "ri-draft-line" : "ri-question-answer-line"}
                style={{ marginRight: 4 }}
              />
              {tab === "homework" ? "과제" : "퀴즈"}
            </button>
          ))}
        </div>

        {/* [soojin] 퀴즈 통계: 카드 그리드 → 가로 구분선 스타일 */}
        {activeTab === "quiz" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid #e5e7eb",
              marginBottom: 12,
              flexShrink: 0,
            }}
          >
            {isTeacher ? (
              <>
                {[
                  { label: "전체 퀴즈", value: teacherQuizStats.total, color: "#111827" },
                  { label: "진행중", value: teacherQuizStats.openCount, color: "#16a34a" },
                  { label: "완료", value: teacherQuizStats.completedCount, color: "#1d4ed8" },
                  { label: "마감", value: teacherQuizStats.closedCount, color: "#374151" },
                ].map((stat, idx) => (
                  <Fragment key={stat.label}>
                    {idx > 0 && (
                      <div style={{ width: 1, height: 36, background: "#e5e7eb", margin: "0 20px", flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 60, textAlign: "center" }}>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>{stat.label}</div>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</span>
                        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>개</span>
                      </div>
                    </div>
                  </Fragment>
                ))}
              </>
            ) : (
              <>
                {[
                  { label: "전체 퀴즈", value: `${studentQuizStats.total}`, color: "#111827" },
                  { label: "미응시", value: `${studentQuizStats.unattempted}`, color: "#c2410c" },
                  { label: "완료", value: `${studentQuizStats.completed}`, color: "#16a34a" },
                  { label: "평균 점수", value: `${studentQuizStats.avgScore}%`, color: "#1d4ed8" },
                ].map((stat, idx) => (
                  <Fragment key={stat.label}>
                    {idx > 0 && (
                      <div style={{ width: 1, height: 36, background: "#e5e7eb", margin: "0 20px", flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 60, textAlign: "center" }}>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>{stat.label}</div>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</span>
                        {!stat.value.includes("%") && (
                          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>개</span>
                        )}
                      </div>
                    </div>
                  </Fragment>
                ))}
              </>
            )}
          </div>
        )}

        {/* [soojin] 필터/검색 - 퀴즈탭: 큰 검색창 + pill 드롭다운, 과제탭: 기존 스타일 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            gap: 12,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          {activeTab === "quiz" ? (
            <form style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }} onSubmit={search}>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                <select
                  style={{
                    padding: "9px 24px 9px 8px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                    background: "#fff",
                    appearance: "none",
                    WebkitAppearance: "none",
                    cursor: "pointer",
                    fontWeight: 500,
                    color: "#374151",
                    minWidth: 100,
                  }}
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); load(0, e.target.value, keyword); }}
                >
                  <option value="">전체 상태</option>
                  {statusOptions.map((o) => (
                    <option key={o.v} value={o.v}>{o.l}</option>
                  ))}
                </select>
                <i
                  className="ri-arrow-down-s-line"
                  style={{ position: "absolute", right: 4, pointerEvents: "none", fontSize: 16, color: "#6b7280" }}
                />
              </div>
              <div style={{ position: "relative", display: "flex", alignItems: "center", flex: 1 }}>
                <i
                  className="bi bi-search"
                  style={{ position: "absolute", left: 8, color: "#9ca3af", fontSize: 13, pointerEvents: "none" }}
                />
                <input
                  style={{
                    padding: "9px 8px 9px 28px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                    width: "100%",
                    background: "#fff",
                  }}
                  placeholder={isTeacher ? "퀴즈 제목, 학년, 반으로 검색..." : "퀴즈 제목, 과목으로 검색..."}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </form>
          ) : (
            <form style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }} onSubmit={search}>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                <select style={selSt} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">모든 상태</option>
                  {statusOptions.map((o) => (
                    <option key={o.v} value={o.v}>{o.l}</option>
                  ))}
                </select>
                <i
                  className="ri-arrow-down-s-line"
                  style={{ position: "absolute", right: 4, pointerEvents: "none", fontSize: 16, color: "#6b7280" }}
                />
              </div>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                <i
                  className="bi bi-search"
                  style={{ position: "absolute", left: 8, color: "#9ca3af", fontSize: 13, pointerEvents: "none" }}
                />
                <input
                  style={{
                    padding: "5px 8px 5px 28px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                    minWidth: 150,
                    background: "#fff",
                  }}
                  placeholder="제목 검색"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: "5px 12px",
                  background: "#25A194",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                검색
              </button>
              <button
                type="button"
                onClick={reset}
                style={{
                  padding: "5px 10px",
                  background: "#fff",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: "pointer",
                  color: "#374151",
                  whiteSpace: "nowrap",
                }}
              >
                초기화
              </button>
              {(status || keyword) && (
                <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: 600, color: "#111827" }}>{totalElements}건</span> / 전체 {totalAll ?? 0}건
                </span>
              )}
            </form>
          )}
          {isTeacher && (
            <button
              type="button"
              style={{
                padding: "5px 12px",
                background: "#25A194",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onClick={() => navigate(activeTab === "homework" ? "/homework/create" : "/quiz/create")}
            >
              + {activeTab === "homework" ? "과제 출제" : "퀴즈 출제"}
            </button>
          )}
        </div>

        {/* [soojin] 콘텐츠 래퍼: 과제는 테이블 박스 유지, 퀴즈는 카드 독립 표시 */}
        <div
          style={
            activeTab === "homework"
              ? {
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                }
              : {
                  background: "transparent",
                  border: "none",
                  overflow: "visible",
                  flex: 1,
                  display: "block",
                  minHeight: 0,
                }
          }
        >
          <div
            style={
              activeTab === "homework"
                ? { flex: 1, overflowX: "auto", overflowY: "auto", minHeight: 0 }
                : { overflow: "visible" }
            }
          >
            {/* ===== 과제 테이블 ===== */}
            {activeTab === "homework" && (
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: 55 }} />
                  <col style={{ width: 240 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 110 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={thSt}>번호</th>
                    <th style={thSt}>제목</th>
                    <th style={thSt}>{isTeacher ? "학급" : "출제 교사"}</th>
                    <th style={thSt}>마감일</th>
                    <th style={thSt}>상태</th>
                    <th style={thSt}>{isTeacher ? "제출 현황" : "제출 여부"}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ ...tdSt, textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
                        불러오는 중...
                      </td>
                    </tr>
                  ) : homeworks.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ ...tdSt, textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
                        등록된 과제가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    homeworks.map((hw, i) => {
                      const isGraded = hw.status === "GRADED";
                      const isStudentRevealed = isStudent && revealedStudentScores.has(hw.id);
                      return (
                        <Fragment key={hw.id}>
                          <tr>
                            <td style={tdSt}>{totalElements - currentPage * 10 - i}</td>
                            <td style={{ ...tdSt, overflow: "hidden", textOverflow: "ellipsis" }}>
                              <Link
                                to={`/homework/${hw.id}`}
                                style={{ color: "#1d4ed8", fontWeight: 600, textDecoration: "none", fontSize: 13 }}
                              >
                                {hw.title}
                                {hw.hasAttachment && (
                                  <i className="ri-attachment-2" style={{ marginLeft: 4, color: "#9ca3af" }} />
                                )}
                              </Link>
                            </td>
                            <td style={{ ...tdSt, color: "#6b7280" }}>
                              {isTeacher ? hw.classroomName : hw.teacherName}
                            </td>
                            <td style={{ ...tdSt, color: isOverdue(hw.dueDate) ? "#dc2626" : "#6b7280" }}>
                              {hw.dueDate?.slice(0, 10)}
                            </td>
                            <td style={tdSt}>
                              {isGraded && isStudent ? (
                                <span
                                  style={{ ...badgeBase, ...HW_BADGE[hw.status], cursor: "pointer" }}
                                  onClick={() => toggleStudentScore(hw.id)}
                                  title="클릭하여 점수 확인"
                                >
                                  {isStudentRevealed ? HW_LABEL[hw.status] : `${HW_LABEL[hw.status]} (점수확인)`}
                                </span>
                              ) : (
                                <span style={{ ...badgeBase, ...(HW_BADGE[hw.status] ?? HW_BADGE.OPEN) }}>
                                  {HW_LABEL[hw.status] ?? "진행중"}
                                </span>
                              )}
                            </td>
                            <td style={tdSt}>
                              {isTeacher ? (
                                <span style={{ color: "#6b7280" }}>
                                  {hw.submissionCount}/{hw.totalStudentCount}
                                </span>
                              ) : hw.submitted ? (
                                <span style={{ ...badgeBase, background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>
                                  제출완료
                                </span>
                              ) : (
                                <span style={{ ...badgeBase, background: "rgba(234,179,8,0.1)", color: "#ca8a04" }}>
                                  미제출
                                </span>
                              )}
                            </td>
                          </tr>
                          {isStudentRevealed && hw.submissionStatus === "GRADED" && (
                            <tr key={`${hw.id}-myscore`}>
                              <td colSpan={6} style={{ padding: 0 }}>
                                <div
                                  style={{
                                    padding: "12px 16px",
                                    background: "#f9fafb",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                  }}
                                >
                                  <span style={{ fontWeight: 600, fontSize: 13 }}>내 점수:</span>
                                  <span style={{ fontWeight: 700, color: "#25A194", fontSize: 15 }}>
                                    {hw.score !== null && hw.score !== undefined
                                      ? `${hw.score}/${hw.maxScore ?? 100}`
                                      : "-"}
                                  </span>
                                  {hw.feedback && (
                                    <>
                                      <span style={{ color: "#9ca3af" }}>|</span>
                                      <span style={{ fontSize: 13 }}>
                                        <span style={{ fontWeight: 600 }}>피드백:</span> {hw.feedback}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* ===== 퀴즈 카드 ===== */}
            {activeTab === "quiz" && (
              <div>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>불러오는 중...</div>
                ) : quizzes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
                    등록된 퀴즈가 없습니다.
                  </div>
                ) : (
                  <div
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 14 }}
                  >
                    {quizzes.map((q) => {
                      const teacherInfo = splitTeacherName(q.teacherName);
                      const subjectName = q.subjectName ?? teacherInfo.subject ?? "-";
                      const submissionCount = q.submissionCount ?? 0;
                      const totalStudentCount = q.totalStudentCount ?? 0;
                      const submissionPercent = getPercent(submissionCount, totalStudentCount);
                      const averageScore = Math.round((q.averageScore ?? 0) * 10) / 10;
                      const attempted = (q.myAttemptCount ?? 0) > 0;
                      const myScore = q.myBestScore ?? 0;
                      const myPercent = getPercent(myScore, q.totalPoints);
                      const dday = getDday(q.dueDate);
                      const ddayValue = Number(dday.replace(/[^0-9-]/g, ""));
                      const urgent = !attempted && /^D-\d+$/.test(dday) && ddayValue <= 2;

                      return (
                        <div
                          key={q.id}
                          style={{ border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", padding: 16, display: "flex", flexDirection: "column" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 8,
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <span
                                  style={{
                                    margin: 0,
                                    fontWeight: 700,
                                    fontSize: 18,
                                    color: "#111827",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {q.title}
                                </span>
                                {isStudent ? (
                                  <span
                                    style={{
                                      ...badgeBase,
                                      borderRadius: 999,
                                      background: attempted ? "rgba(34,197,94,0.15)" : "rgba(249,115,22,0.12)",
                                      color: attempted ? "#16a34a" : "#ea580c",
                                    }}
                                  >
                                    {attempted ? "완료" : "미응시"}
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      ...badgeBase,
                                      borderRadius: 999,
                                      ...(QZ_BADGE[q.status] ?? QZ_BADGE.OPEN),
                                    }}
                                  >
                                    {QZ_LABEL[q.status] ?? "진행중"}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: !isTeacher && q.description ? 4 : 0 }}>
                                  <span>
                                    <i className="ri-book-open-line" style={{ marginRight: 4 }} />
                                    {subjectName}
                                  </span>
                                  <span>
                                    <i className="ri-user-3-line" style={{ marginRight: 4 }} />
                                    {teacherInfo.teacher}
                                  </span>
                                </div>
                                {!isTeacher && q.description && (
                                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {q.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            {isTeacher && (
                              <div style={{ display: "flex", gap: 10, color: "#2563eb" }}>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/quiz/${q.id}/edit`)}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: "#2563eb",
                                  }}
                                  title="수정"
                                >
                                  <i className="ri-pencil-line" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuiz(q.id)}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: "#ef4444",
                                  }}
                                  title="삭제"
                                >
                                  <i className="ri-delete-bin-line" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                              gap: 8,
                              margin: "10px 0 12px",
                            }}
                          >
                            <div
                              style={{
                                background: "#eff6ff",
                                border: "1px solid #dbeafe",
                                borderRadius: 10,
                                padding: "10px 12px",
                              }}
                            >
                              <div style={{ fontSize: 12, color: "#2563eb", marginBottom: 4 }}>문항수</div>
                              <div style={{ fontSize: 24, fontWeight: 700, color: "#1e3a8a" }}>
                                {q.questionCount}문항
                              </div>
                            </div>
                            <div
                              style={{
                                background: "#f5f3ff",
                                border: "1px solid #e9d5ff",
                                borderRadius: 10,
                                padding: "10px 12px",
                              }}
                            >
                              <div style={{ fontSize: 12, color: "#7c3aed", marginBottom: 4 }}>배점</div>
                              <div style={{ fontSize: 24, fontWeight: 700, color: "#5b21b6" }}>{q.totalPoints}점</div>
                            </div>
                            <div
                              style={{
                                background: "#fffbeb",
                                border: "1px solid #fde68a",
                                borderRadius: 10,
                                padding: "10px 12px",
                              }}
                            >
                              <div style={{ fontSize: 12, color: "#c2410c", marginBottom: 4 }}>제한시간</div>
                              <div style={{ fontSize: 24, fontWeight: 700, color: "#9a3412" }}>
                                {q.timeLimit != null ? `${q.timeLimit}분` : "없음"}
                              </div>
                            </div>
                          </div>

                          {isTeacher ? (
                            <>
                              <div
                                style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, marginBottom: 10 }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 12,
                                    color: "#6b7280",
                                    marginBottom: 8,
                                  }}
                                >
                                  <span>응시 현황</span>
                                  <span>
                                    {submissionCount} / {totalStudentCount}명
                                  </span>
                                </div>
                                <div
                                  style={{ height: 8, borderRadius: 999, background: "#f3f4f6", overflow: "hidden" }}
                                >
                                  <div
                                    style={{ width: `${submissionPercent}%`, height: "100%", background: "#25A194" }}
                                  />
                                </div>
                                <div
                                  style={{
                                    marginTop: 8,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 12,
                                  }}
                                >
                                  <span style={{ color: "#25A194", fontWeight: 600 }}>{submissionPercent}% 완료</span>
                                  <span style={{ color: "#2563eb", fontWeight: 600 }}>평균 {averageScore}%</span>
                                </div>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  fontSize: 13,
                                  color: "#6b7280",
                                }}
                              >
                                <span>
                                  <i className="ri-calendar-line" style={{ marginRight: 4 }} />
                                  마감: {formatDateTime(q.dueDate)}
                                </span>
                                <button
                                  type="button"
                                  style={{
                                    border: "none",
                                    borderRadius: 999,
                                    background: "#25A194",
                                    color: "#fff",
                                    padding: "6px 12px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                  onClick={() => navigate(`/quiz/${q.id}`)}
                                >
                                  <i className="ri-eye-line" style={{ marginRight: 4 }} />
                                  상세보기
                                </button>
                              </div>
                            </>
                          ) : (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                              {attempted ? (
                                <div
                                  style={{
                                    border: "1px solid #bbf7d0",
                                    background: "#f0fdf4",
                                    borderRadius: 10,
                                    padding: "12px 14px",
                                    marginBottom: 12,
                                    minHeight: 90,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: 12, color: "#15803d", marginBottom: 4 }}>내 점수</div>
                                    <div style={{ fontSize: 28, fontWeight: 700, color: "#166534" }}>
                                      {myScore}점 / {q.totalPoints}점
                                    </div>
                                    <div style={{ fontSize: 12, color: "#15803d" }}>정답률: {myPercent}%</div>
                                  </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 12, color: "#166534" }}>소요시간</div>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 10,
                                    padding: "12px 14px",
                                    marginBottom: 12,
                                    minHeight: 90,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-end",
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>마감일</div>
                                    <div style={{ marginTop: 4, fontSize: 17, fontWeight: 700, color: "#1f2937" }}>
                                      {formatDateTime(q.dueDate)}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 39,
                                      fontWeight: 500,
                                      color: /^D-\d+$/.test(dday) ? "#ea580c" : "#6b7280",
                                      lineHeight: 1,
                                    }}
                                  >
                                    {dday}
                                  </div>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => navigate(attempted ? `/quiz/${q.id}` : `/quiz/${q.id}?start=true`)}
                                style={{
                                  width: "100%",
                                  border: "none",
                                  borderRadius: 10,
                                  padding: "10px 14px",
                                  fontSize: 14,
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  background: attempted ? "#f3f4f6" : "#25A194",
                                  color: attempted ? "#374151" : "#fff",
                                  textAlign: "center",
                                  marginTop: "auto",
                                }}
                              >
                                <i
                                  className={attempted ? "ri-refresh-line" : "ri-graduation-cap-line"}
                                  style={{ marginRight: 6 }}
                                />
                                {attempted ? "결과 확인하기" : "퀴즈 시작하기"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* [soojin] 과제 탭 페이지네이션 */}
        {activeTab === "homework" && totalPages >= 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => load(currentPage - 1)}
              disabled={currentPage === 0}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
                cursor: currentPage === 0 ? "not-allowed" : "pointer",
                color: currentPage === 0 ? "#d1d5db" : "#374151",
                fontSize: 12,
              }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => load(i)}
                style={{
                  width: 28,
                  height: 28,
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${i === currentPage ? "#25A194" : "#e5e7eb"}`,
                  borderRadius: 6,
                  background: i === currentPage ? "#25A194" : "#fff",
                  color: i === currentPage ? "#fff" : "#374151",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: i === currentPage ? 600 : 400,
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => load(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
                cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer",
                color: currentPage >= totalPages - 1 ? "#d1d5db" : "#374151",
                fontSize: 12,
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
