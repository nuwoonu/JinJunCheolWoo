import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/auth";
import { useAuth } from "../../../contexts/AuthContext";
import DashboardLayout from "../../../components/layout/DashboardLayout";

// [woo] 퀴즈 상세 페이지
// - 교사: 문제 확인 + 학생별 응시 결과
// - 학생: 퀴즈 풀기 + 결과 확인

interface QuizOption {
  id: number;
  optionText: string;
  optionOrder: number;
  isCorrect: boolean | null;
}

interface QuizQuestion {
  id: number;
  questionText: string;
  questionOrder: number;
  points: number;
  questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER";
  correctAnswer: string | null;
  options: QuizOption[];
}

interface QuizAnswer {
  questionId: number;
  questionText: string;
  selectedOptionId: number | null;
  answerText: string | null;
  isCorrect: boolean;
  earnedPoints: number;
}

interface QuizSubmission {
  id: number;
  studentInfoId: number;
  studentName: string;
  studentNumber: string;
  score: number;
  totalPoints: number;
  attemptNumber: number;
  submittedAt: string;
  answers: QuizAnswer[] | null;
}

interface QuizDetailData {
  id: number;
  title: string;
  description: string | null;
  week: number | null;
  teacherName: string;
  teacherUserId: number;
  classroomName: string;
  classroomId: number;
  status: "OPEN" | "CLOSED";
  dueDate: string;
  totalPoints: number;
  maxAttempts: number | null;
  showAnswer: boolean;
  createDate: string;
  // [soojin] 전체 학생 수 - 미응시 인원 계산용
  totalStudentCount?: number;
  questions: QuizQuestion[];
  submissions: QuizSubmission[] | null;
  mySubmissions: QuizSubmission[] | null;
}

export default function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? "";
  const isTeacher = role === "TEACHER" || role === "ADMIN";
  const isStudent = role === "STUDENT";

  const [quiz, setQuiz] = useState<QuizDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  // [woo] 학생: 답안 입력 상태
  const [answers, setAnswers] = useState<Record<number, { selectedOptionId?: number; answerText?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  // [woo] 학생: 제출 완료 후 결과 표시
  const [result, setResult] = useState<QuizSubmission | null>(null);
  // [woo] 학생: 퀴즈 풀기 모드
  const [takingQuiz, setTakingQuiz] = useState(false);
  // [soojin] 교사: 학생별 답안 펼치기 토글 - 학생 카드 클릭 시 답안 상세 표시
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

  const fetchQuiz = () => {
    setLoading(true);
    api
      .get(`/quiz/${id}`)
      .then((res) => setQuiz(res.data))
      .catch(() => alert("퀴즈를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  // [woo] 학생 답안 선택
  const selectOption = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { selectedOptionId: optionId } }));
  };

  const setAnswerText = (questionId: number, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { answerText: text } }));
  };

  // [woo] 퀴즈 제출
  const handleSubmit = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      if (!confirm(`${unanswered.length}문제가 미답입니다. 제출하시겠습니까?`)) return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/quiz/${id}/submit`, {
        answers: quiz.questions.map((q) => ({
          questionId: q.id,
          selectedOptionId: answers[q.id]?.selectedOptionId ?? null,
          answerText: answers[q.id]?.answerText ?? null,
        })),
      });
      setResult(res.data);
      setTakingQuiz(false);
      fetchQuiz();
    } catch (err: any) {
      alert(err.response?.data || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // [woo] 퀴즈 삭제
  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/quiz/${id}`);
      alert("삭제되었습니다.");
      navigate("/homework?tab=quiz");
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  // [woo] 퀴즈 상태 변경
  const handleStatusChange = async (newStatus: string) => {
    const labels: Record<string, string> = { OPEN: "진행중", CLOSED: "마감" };
    if (!confirm(`상태를 "${labels[newStatus]}"(으)로 변경하시겠습니까?`)) return;
    try {
      await api.post(`/quiz/${id}/status?status=${newStatus}`);
      fetchQuiz();
    } catch {
      alert("상태 변경에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: "center", paddingBlock: "2.5rem", color: "var(--text-secondary-light)" }}>불러오는 중...</div>
      </DashboardLayout>
    );
  }

  if (!quiz) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: "center", paddingBlock: "2.5rem", color: "var(--text-secondary-light)" }}>퀴즈를 찾을 수 없습니다.</div>
      </DashboardLayout>
    );
  }

  const canTakeQuiz =
    isStudent &&
    quiz.status === "OPEN" &&
    (quiz.maxAttempts == null || (quiz.mySubmissions?.length ?? 0) < quiz.maxAttempts);

  // [soojin] 교사 뷰 통계 계산 - 학생별 최신 응시 기준
  const latestSubmissionByStudent = quiz.submissions
    ? Object.values(
        quiz.submissions.reduce((acc, sub) => {
          const key = sub.studentInfoId;
          if (!acc[key] || sub.attemptNumber > acc[key].attemptNumber) {
            acc[key] = sub;
          }
          return acc;
        }, {} as Record<number, QuizSubmission>)
      )
    : [];

  const submittedCount = latestSubmissionByStudent.length;
  const avgScore =
    submittedCount > 0
      ? Math.round(
          (latestSubmissionByStudent.reduce((sum, s) => sum + (s.score / s.totalPoints) * 100, 0) / submittedCount) * 10
        ) / 10
      : 0;

  // [soojin] 교사 뷰 전면 수정 - 스크린샷 디자인 반영
  if (isTeacher) {
    return (
      <DashboardLayout>
        {/* [soojin] 브레드크럼 제거 → 목록으로 버튼으로 교체 */}
        <button
          onClick={() => navigate("/homework?tab=quiz")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            marginBottom: "1.5rem",
            padding: "0.375rem 0.875rem",
            border: "1px solid var(--neutral-200)",
            borderRadius: "0.5rem",
            background: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
            color: "var(--neutral-700)",
          }}
        >
          ← 퀴즈 목록으로
        </button>

        {/* [soojin] 그룹 1: 퀴즈 정보 + 문제 및 정답 */}
        <div
          className="card"
          style={{
            borderRadius: "0.75rem",
            padding: "1rem",
            marginBottom: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            boxShadow: "none",
          }}
        >
          {/* 퀴즈 정보 카드 */}
          <div className="card" style={{ borderRadius: "0.75rem", border: "1px solid var(--neutral-200)", boxShadow: "none" }}>
            <div className="card-body" style={{ padding: "1.5rem" }}>
              {/* 제목 + 수정/삭제 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ flexGrow: 1, marginRight: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span
                      className="badge"
                      style={{
                        paddingInline: "0.625rem",
                        paddingBlock: "0.25rem",
                        borderRadius: "0.375rem",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        backgroundColor: quiz.status === "OPEN" ? "var(--success-100)" : "var(--danger-100)",
                        color: quiz.status === "OPEN" ? "var(--success-600)" : "var(--danger-600)",
                      }}
                    >
                      {quiz.status === "OPEN" ? "진행중" : "마감"}
                    </span>
                  </div>
                  <h5 style={{ fontWeight: 700, marginBottom: "0.375rem" }}>{quiz.title}</h5>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary-light)", marginBottom: 0 }}>
                    {quiz.teacherName} | {quiz.classroomName}
                    {quiz.week ? ` | ${quiz.week}주차` : ""} | {quiz.createDate?.slice(0, 10)}
                  </p>
                  {quiz.description && (
                    <p style={{ fontSize: "0.875rem", color: "var(--neutral-600)", marginTop: "0.5rem", marginBottom: 0, whiteSpace: "pre-wrap" }}>
                      {quiz.description}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    className="btn btn-outline-primary-600 btn-sm"
                    style={{ borderRadius: "0.5rem" }}
                    onClick={() => navigate(`/quiz/${id}/edit`)}
                  >
                    수정
                  </button>
                  <button className="btn btn-outline-danger-600 btn-sm" style={{ borderRadius: "0.5rem" }} onClick={handleDelete}>
                    삭제
                  </button>
                </div>
              </div>

              {/* 퀴즈 메타 정보 4개 박스 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div style={{ flex: "1 1 calc(25% - 0.5625rem)", minWidth: 0 }}>
                  <div style={{ padding: "1rem", borderRadius: "0.5rem", backgroundColor: "var(--neutral-50)", textAlign: "center" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: "0.375rem" }}>문제수</p>
                    <p style={{ fontWeight: 700, color: "var(--neutral-700)", fontSize: "1rem", marginBottom: 0 }}>{quiz.questions.length}문항</p>
                  </div>
                </div>
                <div style={{ flex: "1 1 calc(25% - 0.5625rem)", minWidth: 0 }}>
                  <div style={{ padding: "1rem", borderRadius: "0.5rem", backgroundColor: "var(--primary-50)", textAlign: "center" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: "0.375rem" }}>총 점수</p>
                    <p style={{ fontWeight: 700, color: "var(--primary-600)", fontSize: "1rem", marginBottom: 0 }}>{quiz.totalPoints}점</p>
                  </div>
                </div>
                <div style={{ flex: "1 1 calc(25% - 0.5625rem)", minWidth: 0 }}>
                  <div style={{ padding: "1rem", borderRadius: "0.5rem", backgroundColor: "var(--success-50)", textAlign: "center" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: "0.375rem" }}>응시횟수</p>
                    <p style={{ fontWeight: 700, color: "var(--success-600)", fontSize: "1rem", marginBottom: 0 }}>
                      {quiz.maxAttempts != null ? `${quiz.maxAttempts}회` : "무제한"}
                    </p>
                  </div>
                </div>
                <div style={{ flex: "1 1 calc(25% - 0.5625rem)", minWidth: 0 }}>
                  <div style={{ padding: "1rem", borderRadius: "0.5rem", backgroundColor: "var(--danger-50)", textAlign: "center" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: "0.375rem" }}>마감</p>
                    <p style={{ fontWeight: 700, color: "var(--danger-600)", fontSize: "1rem", marginBottom: 0 }}>
                      {quiz.dueDate?.slice(0, 10).replace(/-/g, ".")}
                    </p>
                  </div>
                </div>
              </div>

              {/* 상태 변경 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "1rem", borderTop: "1px solid var(--neutral-200)" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, marginRight: "0.25rem" }}>상태 변경:</span>
                {(
                  [
                    { value: "OPEN", label: "진행중", activeBtn: "btn-success-600", outlineBtn: "btn-outline-success-600" },
                    { value: "CLOSED", label: "마감", activeBtn: "btn-danger-600", outlineBtn: "btn-outline-danger-600" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.value}
                    className={`btn btn-sm ${quiz.status === s.value ? s.activeBtn : s.outlineBtn}`}
                    style={{ borderRadius: "0.5rem" }}
                    disabled={quiz.status === s.value}
                    onClick={() => handleStatusChange(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* [soojin] 문제 및 정답 - 각 문제를 개별 카드로 */}
          <div>
            <h6 style={{ fontWeight: 600, marginBottom: "0.75rem" }}>문제 및 정답 ({quiz.questions.length}문항)</h6>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {quiz.questions.map((q) => (
                <div key={q.id} className="card" style={{ borderRadius: "0.75rem", border: "1px solid var(--neutral-200)", boxShadow: "none" }}>
                  <div className="card-body" style={{ padding: "1.25rem" }}>
                    {/* 문제 헤더 */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 700, color: "var(--neutral-700)" }}>문제 {q.questionOrder}</span>
                        <span
                          className="badge"
                          style={{
                            paddingInline: "0.625rem",
                            paddingBlock: "0.25rem",
                            borderRadius: "0.375rem",
                            fontSize: "0.75rem",
                            backgroundColor: q.questionType === "MULTIPLE_CHOICE" ? "var(--primary-100)" : "var(--warning-100)",
                            color: q.questionType === "MULTIPLE_CHOICE" ? "var(--primary-600)" : "var(--warning-600)",
                          }}
                        >
                          {q.questionType === "MULTIPLE_CHOICE" ? "객관식" : "단답형"}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)" }}>{q.points}점</span>
                      </div>
                      {/* [soojin] 문제별 수정/삭제 버튼 - 현재 퀴즈 수정 페이지로 이동, 개별 문제 API 연동 시 교체 예정 */}
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                          className="btn"
                          style={{ padding: 0, fontSize: "0.875rem", color: "var(--primary-600)", background: "none", border: "none" }}
                          onClick={() => navigate(`/quiz/${id}/edit`)}
                        >
                          수정
                        </button>
                        <button
                          className="btn"
                          style={{ padding: 0, fontSize: "0.875rem", color: "var(--danger-600)", background: "none", border: "none" }}
                          onClick={() => navigate(`/quiz/${id}/edit`)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {/* 문제 텍스트 */}
                    <p style={{ marginBottom: "1rem", color: "var(--neutral-700)", whiteSpace: "pre-wrap" }}>
                      {q.questionText}
                    </p>

                    {/* 보기 또는 정답 */}
                    {q.questionType === "MULTIPLE_CHOICE" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {q.options.map((o) => (
                          <div
                            key={o.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              padding: "0.75rem",
                              borderRadius: "0.5rem",
                              border: `1px solid ${o.isCorrect ? "var(--success-600)" : "var(--neutral-200)"}`,
                              backgroundColor: o.isCorrect ? "var(--success-50)" : undefined,
                            }}
                          >
                            <span style={{ width: 18, flexShrink: 0, display: "flex", alignItems: "center" }}>
                              {o.isCorrect ? (
                                <iconify-icon icon="mdi:check-circle" className="text-success-600" style={{ fontSize: 18 }} />
                              ) : null}
                            </span>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: o.isCorrect ? 600 : undefined,
                                color: o.isCorrect ? "var(--success-600)" : "var(--neutral-700)",
                              }}
                            >
                              {o.optionOrder}. {o.optionText}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: "0.75rem", borderRadius: "0.5rem", backgroundColor: "var(--success-50)", border: "1px solid var(--success-200)" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--success-600)" }}>정답: {q.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* [soojin] 그룹 2: 응시 통계 + 학생별 응시 결과 */}
        <div
          className="card"
          style={{
            borderRadius: "0.75rem",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            boxShadow: "none",
          }}
        >
          {/* [soojin] 응시 통계 - 전체학생 | 완료 | 미응시 | 평균점수 4개로 수정 */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ padding: "1rem", borderRadius: "0.5rem", backgroundColor: "var(--neutral-50)", textAlign: "center" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: "0.375rem" }}>전체 학생</p>
                <p style={{ fontWeight: 700, color: "var(--neutral-700)", fontSize: "1rem", marginBottom: 0 }}>
                  {quiz.totalStudentCount != null ? `${quiz.totalStudentCount}명` : "-"}
                </p>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ padding: "1rem", borderRadius: "0.5rem", backgroundColor: "var(--success-50)", textAlign: "center" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: "0.375rem" }}>완료</p>
                <p style={{ fontWeight: 700, color: "var(--success-600)", fontSize: "1rem", marginBottom: 0 }}>{submittedCount}명</p>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ padding: "1rem", borderRadius: "0.5rem", backgroundColor: "var(--danger-50)", textAlign: "center" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: "0.375rem" }}>미응시</p>
                {/* [soojin] TODO: totalStudentCount API 연동 후 실제 미응시 인원 계산 */}
                <p style={{ fontWeight: 700, color: "var(--danger-600)", fontSize: "1rem", marginBottom: 0 }}>
                  {quiz.totalStudentCount != null ? `${quiz.totalStudentCount - submittedCount}명` : "-"}
                </p>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ padding: "1rem", borderRadius: "0.5rem", backgroundColor: "var(--primary-50)", textAlign: "center" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: "0.375rem" }}>평균 점수</p>
                <p style={{ fontWeight: 700, color: "var(--primary-600)", fontSize: "1rem", marginBottom: 0 }}>
                  {submittedCount > 0 ? `${avgScore}점` : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* 학생별 응시 결과 */}
          <div className="card" style={{ borderRadius: "0.75rem", border: "1px solid var(--neutral-200)", boxShadow: "none" }}>
            <div className="card-header" style={{ paddingBlock: "1rem", paddingInline: "1.5rem", borderBottom: "1px solid var(--neutral-200)" }}>
              <h6 style={{ marginBottom: 0 }}>학생별 응시 결과</h6>
            </div>
            <div className="card-body" style={{ padding: "1.5rem" }}>
              {latestSubmissionByStudent.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-secondary-light)", paddingBlock: "1.5rem", marginBottom: 0 }}>응시한 학생이 없습니다.</p>
              ) : (
                latestSubmissionByStudent.map((sub) => (
                  <div key={sub.id} style={{ marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", padding: "1rem", borderRadius: "0.75rem", border: "1px solid var(--neutral-200)" }}>
                      {/* 아바타 */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "0.5rem",
                          backgroundColor: "var(--primary-100)",
                          color: "var(--primary-600)",
                          fontWeight: 700,
                          marginRight: "1rem",
                          flexShrink: 0,
                          width: 40,
                          height: 40,
                          fontSize: 13,
                        }}
                      >
                        {sub.studentNumber?.slice(-2) ?? "?"}
                      </div>

                      {/* 학생 정보 */}
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.125rem" }}>
                          <span style={{ fontWeight: 600, color: "var(--neutral-700)" }}>{sub.studentName}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)" }}>{sub.studentNumber}</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)" }}>
                          {sub.submittedAt?.slice(0, 16).replace("T", " ")} · {sub.attemptNumber}회차
                        </div>
                      </div>

                      {/* 점수 */}
                      <div style={{ textAlign: "right", marginRight: "1rem" }}>
                        <p style={{ fontWeight: 700, color: "var(--primary-600)", fontSize: "1.25rem", marginBottom: 0 }}>{sub.score}점</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: 0 }}>{sub.totalPoints}점 만점</p>
                      </div>

                      {/* 답안 보기 버튼 */}
                      <button
                        className="btn btn-outline-primary-600 btn-sm"
                        style={{ borderRadius: "0.5rem", flexShrink: 0 }}
                        onClick={() =>
                          setExpandedStudentId(expandedStudentId === sub.studentInfoId ? null : sub.studentInfoId)
                        }
                      >
                        {expandedStudentId === sub.studentInfoId ? "접기" : "답안 보기"}
                      </button>
                    </div>

                    {/* 답안 상세 펼치기 */}
                    {expandedStudentId === sub.studentInfoId && sub.answers && (
                      <div style={{ padding: "1rem", marginTop: "0.25rem", borderRadius: "0.5rem", backgroundColor: "var(--neutral-50)", border: "1px solid var(--neutral-200)" }}>
                        {sub.answers.map((a, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "0.75rem",
                              marginBottom: "0.5rem",
                              borderRadius: "0.5rem",
                              backgroundColor: a.isCorrect ? "var(--success-50)" : "var(--danger-50)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                              <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>문제 {idx + 1}</span>
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: a.isCorrect ? "var(--success-100)" : "var(--danger-100)",
                                  color: a.isCorrect ? "var(--success-600)" : "var(--danger-600)",
                                }}
                              >
                                {a.isCorrect ? "정답" : "오답"}
                              </span>
                              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary-light)" }}>{a.earnedPoints}점</span>
                            </div>
                            <p style={{ fontSize: "0.875rem", marginBottom: 0, color: "var(--neutral-700)" }}>{a.questionText}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ========== 학생 뷰 ==========
  return (
    <DashboardLayout>
      {/* [soojin] 브레드크럼 제거 → 목록으로 버튼으로 교체 */}
      <button
        onClick={() => navigate("/homework?tab=quiz")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          marginBottom: "1.5rem",
          padding: "0.375rem 0.875rem",
          border: "1px solid var(--neutral-200)",
          borderRadius: "0.5rem",
          background: "none",
          cursor: "pointer",
          fontSize: "0.875rem",
          color: "var(--neutral-700)",
        }}
      >
        ← 퀴즈 목록으로
      </button>

      {/* 퀴즈 정보 카드 */}
      <div className="card" style={{ borderRadius: "0.75rem", marginBottom: "1.5rem", border: "1px solid var(--neutral-200)", boxShadow: "none" }}>
        <div
          className="card-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBlock: "1rem", paddingInline: "1.5rem", borderBottom: "1px solid var(--neutral-200)" }}
        >
          <div>
            <h6 style={{ marginBottom: "0.25rem" }}>{quiz.title}</h6>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.875rem", color: "var(--text-secondary-light)" }}>
              <span>{quiz.teacherName}</span>
              <span>|</span>
              <span>{quiz.classroomName}</span>
              {quiz.week && (
                <>
                  <span>|</span>
                  <span>{quiz.week}주차</span>
                </>
              )}
              <span>|</span>
              <span>
                {quiz.questions.length}문제 / {quiz.totalPoints}점
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              className="badge"
              style={{
                backgroundColor: quiz.status === "OPEN" ? "var(--success-100)" : "var(--danger-100)",
                color: quiz.status === "OPEN" ? "var(--success-600)" : "var(--danger-600)",
              }}
            >
              {quiz.status === "OPEN" ? "진행중" : "마감"}
            </span>
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary-light)" }}>마감: {quiz.dueDate?.slice(0, 10)}</span>
          </div>
        </div>
        {quiz.description && (
          <div className="card-body" style={{ padding: "1.5rem" }}>
            <div style={{ whiteSpace: "pre-wrap" }}>{quiz.description}</div>
          </div>
        )}
      </div>

      {/* ========== 학생: 퀴즈 풀기 결과 ========== */}
      {result && (
        <div className="card" style={{ borderRadius: "0.75rem", marginBottom: "1.5rem", border: "1px solid var(--neutral-200)", boxShadow: "none" }}>
          <div className="card-header" style={{ paddingBlock: "1rem", paddingInline: "1.5rem", borderBottom: "1px solid var(--neutral-200)", backgroundColor: "var(--primary-50)" }}>
            <h6 style={{ marginBottom: 0 }}>
              제출 완료 - {result.score}/{result.totalPoints}점
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary-light)", marginLeft: "0.5rem" }}>({result.attemptNumber}회차)</span>
            </h6>
          </div>
          {quiz.showAnswer && result.answers && (
            <div className="card-body" style={{ padding: "1.5rem" }}>
              {result.answers.map((a, i) => (
                <div
                  key={i}
                  style={{
                    padding: "1rem",
                    marginBottom: "0.75rem",
                    borderRadius: "0.5rem",
                    backgroundColor: a.isCorrect ? "var(--success-50)" : "var(--danger-50)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>문제 {i + 1}</span>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: a.isCorrect ? "var(--success-100)" : "var(--danger-100)",
                        color: a.isCorrect ? "var(--success-600)" : "var(--danger-600)",
                      }}
                    >
                      {a.isCorrect ? "정답" : "오답"}
                    </span>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary-light)" }}>{a.earnedPoints}점</span>
                  </div>
                  <p style={{ fontSize: "0.875rem", marginBottom: 0 }}>{a.questionText}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== 학생: 이전 응시 결과 ========== */}
      {isStudent && quiz.mySubmissions && quiz.mySubmissions.length > 0 && !takingQuiz && (
        <div className="card" style={{ borderRadius: "0.75rem", marginBottom: "1.5rem", border: "1px solid var(--neutral-200)", boxShadow: "none" }}>
          <div className="card-header" style={{ paddingBlock: "1rem", paddingInline: "1.5rem", borderBottom: "1px solid var(--neutral-200)" }}>
            <h6 style={{ marginBottom: 0 }}>내 응시 결과</h6>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="table bordered-table mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>회차</th>
                    <th style={{ width: 120 }}>점수</th>
                    <th>제출일</th>
                  </tr>
                </thead>
                <tbody>
                  {quiz.mySubmissions.map((sub) => (
                    <tr key={sub.id}>
                      <td>{sub.attemptNumber}회</td>
                      <td style={{ fontWeight: 700, color: "var(--primary-600)" }}>
                        {sub.score}/{sub.totalPoints}
                      </td>
                      <td style={{ color: "var(--text-secondary-light)" }}>{sub.submittedAt?.slice(0, 16).replace("T", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* [woo] 정답공개 활성화 시 최근 응시 회차의 정답/오답 상세 표시 */}
          {quiz.showAnswer && quiz.mySubmissions[0]?.answers && (
            <div className="card-body" style={{ borderTop: "1px solid var(--neutral-200)", padding: "1.5rem" }}>
              <p style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "1rem" }}>{quiz.mySubmissions[0].attemptNumber}회차 답안 확인</p>
              {quiz.mySubmissions[0].answers.map((a, i) => (
                <div
                  key={i}
                  style={{
                    padding: "1rem",
                    marginBottom: "0.75rem",
                    borderRadius: "0.5rem",
                    backgroundColor: a.isCorrect ? "var(--success-50)" : "var(--danger-50)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>문제 {i + 1}</span>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: a.isCorrect ? "var(--success-100)" : "var(--danger-100)",
                        color: a.isCorrect ? "var(--success-600)" : "var(--danger-600)",
                      }}
                    >
                      {a.isCorrect ? "정답" : "오답"}
                    </span>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary-light)" }}>{a.earnedPoints}점</span>
                  </div>
                  <p style={{ fontSize: "0.875rem", marginBottom: 0 }}>{a.questionText}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== 학생: 퀴즈 풀기 시작 버튼 ========== */}
      {isStudent && !takingQuiz && !result && canTakeQuiz && (
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <button
            className="btn btn-primary-600"
            style={{ borderRadius: "0.5rem", paddingInline: "2rem", paddingBlock: "0.75rem" }}
            onClick={() => {
              setTakingQuiz(true);
              setAnswers({});
              setResult(null);
            }}
          >
            <iconify-icon icon="mdi:play" style={{ marginRight: "0.5rem" }} />
            퀴즈 풀기
            {quiz.maxAttempts && (
              <span style={{ marginLeft: "0.5rem", fontSize: "0.875rem" }}>
                ({quiz.mySubmissions?.length ?? 0}/{quiz.maxAttempts}회 응시)
              </span>
            )}
          </button>
        </div>
      )}

      {isStudent && !canTakeQuiz && !takingQuiz && !result && (
        <div style={{ textAlign: "center", marginBottom: "1.5rem", color: "var(--text-secondary-light)" }}>
          {quiz.status === "CLOSED" ? "마감된 퀴즈입니다." : "최대 응시 횟수를 초과했습니다."}
        </div>
      )}

      {/* ========== 학생: 퀴즈 풀기 화면 ========== */}
      {isStudent && takingQuiz && (
        <div>
          {quiz.questions.map((q) => (
            <div key={q.id} className="card" style={{ borderRadius: "0.75rem", marginBottom: "1rem", border: "1px solid var(--neutral-200)", boxShadow: "none" }}>
              <div
                className="card-header"
                style={{ paddingBlock: "0.75rem", paddingInline: "1.5rem", borderBottom: "1px solid var(--neutral-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>문제 {q.questionOrder}</span>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: q.questionType === "MULTIPLE_CHOICE" ? "var(--primary-100)" : "var(--warning-100)",
                      color: q.questionType === "MULTIPLE_CHOICE" ? "var(--primary-600)" : "var(--warning-600)",
                    }}
                  >
                    {q.questionType === "MULTIPLE_CHOICE" ? "객관식" : "단답형"}
                  </span>
                </div>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary-light)" }}>배점 {q.points}점</span>
              </div>
              <div className="card-body" style={{ padding: "1.5rem" }}>
                <p style={{ fontWeight: 500, marginBottom: "1rem", whiteSpace: "pre-wrap" }}>
                  {q.questionText}
                </p>

                {q.questionType === "MULTIPLE_CHOICE" ? (
                  <div>
                    {q.options.map((o) => (
                      <div
                        key={o.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.75rem",
                          marginBottom: "0.5rem",
                          borderRadius: "0.5rem",
                          border: `1px solid ${answers[q.id]?.selectedOptionId === o.id ? "var(--primary-600)" : "var(--neutral-200)"}`,
                          backgroundColor: answers[q.id]?.selectedOptionId === o.id ? "var(--primary-50)" : undefined,
                          cursor: "pointer",
                        }}
                        onClick={() => selectOption(q.id, o.id)}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[q.id]?.selectedOptionId === o.id}
                          onChange={() => selectOption(q.id, o.id)}
                          className="form-check-input"
                        />
                        <span style={{ fontSize: "0.875rem" }}>
                          {o.optionOrder}. {o.optionText}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    style={{ borderRadius: "0.5rem" }}
                    placeholder="답을 입력하세요"
                    value={answers[q.id]?.answerText ?? ""}
                    onChange={(e) => setAnswerText(q.id, e.target.value)}
                  />
                )}
              </div>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <button className="btn btn-outline-neutral-300" style={{ borderRadius: "0.5rem" }} onClick={() => setTakingQuiz(false)}>
              취소
            </button>
            <button className="btn btn-primary-600" style={{ borderRadius: "0.5rem", paddingInline: "2rem" }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? "제출 중..." : "제출하기"}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
