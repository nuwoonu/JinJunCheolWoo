import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/shared/api/authApi";
import { useAuth } from "@/shared/contexts/AuthContext";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

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
  explanation: string | null;
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

interface StudentWithSubmission {
  studentInfoId: number;
  studentName: string;
  studentNumber: string;
  submitted: boolean;
  latestSubmission: QuizSubmission | null;
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
  timeLimit: number | null;
  showAnswer: boolean;
  createDate: string;
  questions: QuizQuestion[];
  submissions: QuizSubmission[] | null;
  mySubmissions: QuizSubmission[] | null;
  allStudents: StudentWithSubmission[] | null;
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

  const [answers, setAnswers] = useState<Record<number, { selectedOptionId?: number; answerText?: string }>>({});
  const answersRef = useRef(answers);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmission | null>(null);
  const [takingQuiz, setTakingQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const autoSubmitTriggeredRef = useRef(false);
  // [woo] 정답/해설 상세 뷰 토글
  const [showAnswerDetail, setShowAnswerDetail] = useState(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const fetchQuiz = () => {
    setLoading(true);
    api
      .get(`/quiz/${id}`)
      .then((res) => {
        const data: QuizDetailData = res.data;
        setQuiz(data);
        // [woo] 학생 재방문: 기제출 이력 있으면 result 초기화 (같은 세션 내 result 덮어쓰기 방지)
        if (role === "STUDENT" && data.mySubmissions && data.mySubmissions.length > 0) {
          setResult((prev) => prev ?? data.mySubmissions![0]);
        }
      })
      .catch(() => alert("퀴즈를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const selectOption = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOptionId: optionId,
      },
    }));
  };

  const setAnswerText = (questionId: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answerText: text,
      },
    }));
  };

  const isAnswered = (q: QuizQuestion) => {
    const answer = answersRef.current[q.id];
    if (!answer) return false;
    if (q.questionType === "MULTIPLE_CHOICE") return answer.selectedOptionId != null;
    return !!answer.answerText?.trim();
  };

  const submitQuiz = async (forceSubmit = false) => {
    if (!quiz || submitting) return;

    const unansweredCount = quiz.questions.filter((q) => !isAnswered(q)).length;
    if (!forceSubmit && unansweredCount > 0) {
      if (!confirm(`${unansweredCount}문제가 미답입니다. 제출하시겠습니까?`)) return;
    }

    setSubmitting(true);
    try {
      const latestAnswers = answersRef.current;
      const res = await api.post(`/quiz/${id}/submit`, {
        answers: quiz.questions.map((q) => ({
          questionId: q.id,
          selectedOptionId: latestAnswers[q.id]?.selectedOptionId ?? null,
          answerText: latestAnswers[q.id]?.answerText ?? null,
        })),
      });

      setResult(res.data);
      setTakingQuiz(false);
      if (quizStartTime != null) {
        const sec = Math.max(1, Math.floor((Date.now() - quizStartTime) / 1000));
        setElapsedSeconds(sec);
      }
      fetchQuiz();
    } catch (err: any) {
      alert(err.response?.data || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!takingQuiz || !quiz || quiz.timeLimit == null) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          window.clearInterval(timer);
          if (!autoSubmitTriggeredRef.current) {
            autoSubmitTriggeredRef.current = true;
            alert("제한 시간이 종료되어 자동 제출됩니다.");
            void submitQuiz(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [takingQuiz, quiz?.timeLimit]);

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/quiz/${id}`);
      alert("삭제되었습니다.");
      navigate("/quiz");
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

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

  const formatTime = (seconds: number) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const formatElapsed = (seconds: number) => {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${mm}분 ${ss}초`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-secondary-light)" }}>불러오는 중...</div>
      </DashboardLayout>
    );
  }

  if (!quiz) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-secondary-light)" }}>퀴즈를 찾을 수 없습니다.</div>
      </DashboardLayout>
    );
  }

  const canTakeQuiz =
    isStudent &&
    quiz.status === "OPEN" &&
    (quiz.maxAttempts == null || (quiz.mySubmissions?.length ?? 0) < quiz.maxAttempts);

  const allStudents = quiz.allStudents ?? [];
  const submittedCount = allStudents.filter((s) => s.submitted).length;
  const totalStudentCount = allStudents.length;
  const unsubmittedCount = totalStudentCount - submittedCount;
  const avgScore =
    submittedCount > 0
      ? Math.round(
          (allStudents.reduce(
            (sum, s) =>
              sum +
              (s.submitted && s.latestSubmission ? (s.latestSubmission.score / s.latestSubmission.totalPoints) * 100 : 0),
            0,
          ) /
            submittedCount) *
            10,
        ) / 10
      : 0;
  const dueDateLabel = quiz.dueDate ? quiz.dueDate.slice(0, 10) : "-";
  const quizInfoStatsCards = [
    {
      key: "questions",
      label: "문제수",
      value: `${quiz.questions.length}문항`,
      icon: "ri-file-list-3-line",
      borderColor: "#dbeafe",
      background: "#eff6ff",
      iconBackground: "rgba(37,99,235,0.12)",
      iconColor: "#2563eb",
      valueColor: "#1e40af",
    },
    {
      key: "points",
      label: "총 점수",
      value: `${quiz.totalPoints}점`,
      icon: "ri-medal-2-line",
      borderColor: "#fde68a",
      background: "#fffbeb",
      iconBackground: "rgba(217,119,6,0.14)",
      iconColor: "#d97706",
      valueColor: "#b45309",
    },
    {
      key: "attempts",
      label: "응시횟수",
      value: quiz.maxAttempts != null ? `${quiz.maxAttempts}회` : "무제한",
      icon: "ri-repeat-line",
      borderColor: "#bbf7d0",
      background: "#f0fdf4",
      iconBackground: "rgba(22,163,74,0.12)",
      iconColor: "#16a34a",
      valueColor: "#15803d",
    },
    {
      key: "timeLimit",
      label: "제한시간",
      value: quiz.timeLimit != null ? `${quiz.timeLimit}분` : "없음",
      icon: "ri-timer-line",
      borderColor: "#fecaca",
      background: "#fff7ed",
      iconBackground: "rgba(239,68,68,0.12)",
      iconColor: "#dc2626",
      valueColor: "#dc2626",
    },
  ];
  const participationStatsCards = [
    {
      key: "classroom",
      label: "학급",
      value: quiz.classroomName || "-",
      icon: "ri-community-line",
      borderColor: "#bfdbfe",
      background: "#eff6ff",
      iconBackground: "rgba(37,99,235,0.12)",
      iconColor: "#2563eb",
      valueColor: "#1e40af",
    },
    {
      key: "total",
      label: "전체 학생 수",
      value: `${totalStudentCount}명`,
      icon: "ri-group-line",
      borderColor: "#ddd6fe",
      background: "#f5f3ff",
      iconBackground: "rgba(124,58,237,0.12)",
      iconColor: "#7c3aed",
      valueColor: "#6d28d9",
    },
    {
      key: "dueDate",
      label: "마감일",
      value: dueDateLabel,
      icon: "ri-calendar-event-line",
      borderColor: "#fde68a",
      background: "#fffbeb",
      iconBackground: "rgba(217,119,6,0.14)",
      iconColor: "#d97706",
      valueColor: "#b45309",
    },
    {
      key: "unsubmitted",
      label: "미응시",
      value: `${unsubmittedCount}명`,
      icon: "ri-time-line",
      borderColor: "#fecaca",
      background: "#fff7ed",
      iconBackground: "rgba(239,68,68,0.12)",
      iconColor: "#dc2626",
      valueColor: "#dc2626",
    },
    {
      key: "avgScore",
      label: "평균 점수",
      value: submittedCount > 0 ? `${avgScore}%` : "-",
      icon: "ri-bar-chart-box-line",
      borderColor: "#bfdbfe",
      background: "#eff6ff",
      iconBackground: "rgba(37,99,235,0.12)",
      iconColor: "#2563eb",
      valueColor: "#1d4ed8",
    },
  ];

  const totalQuestions = quiz.questions.length;
  const answeredCount = quiz.questions.filter((q) => isAnswered(q)).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const currentQuestion = takingQuiz ? quiz.questions[currentQuestionIndex] : null;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex >= Math.max(0, totalQuestions - 1);

  const startQuiz = () => {
    setTakingQuiz(true);
    setCurrentQuestionIndex(0);
    setResult(null);
    setShowAnswerDetail(false);
    setAnswers({});
    setQuizStartTime(Date.now());
    setElapsedSeconds(0);
    setRemainingSeconds(quiz.timeLimit != null ? quiz.timeLimit * 60 : null);
    autoSubmitTriggeredRef.current = false;
  };

  const scorePercent = result ? Math.round((result.score / Math.max(1, result.totalPoints)) * 100) : 0;

  const BackButton = () => (
    <button
      onClick={() => navigate("/quiz")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        marginBottom: "1rem",
        padding: "0.375rem 0.875rem",
        border: "1px solid var(--neutral-200)",
        borderRadius: "0.5rem",
        background: "#fff",
        cursor: "pointer",
        fontSize: "0.875rem",
        color: "var(--neutral-700)",
      }}
    >
      ← 퀴즈 목록으로
    </button>
  );

  const _StatBox = ({
    label,
    value,
    bg,
    color,
  }: {
    label: string;
    value: string;
    bg: string;
    color: string;
  }) => (
    <div style={{ flex: "1 1 0", minWidth: 0 }}>
      <div style={{ padding: "1rem", borderRadius: "0.5rem", backgroundColor: bg, textAlign: "center" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: "0.375rem" }}>{label}</p>
        <p style={{ fontWeight: 700, color, fontSize: "1rem", marginBottom: 0 }}>{value}</p>
      </div>
    </div>
  );

  // [woo] myAnswers: 학생 정답 화면에서 내 답 표시용 (없으면 교사 뷰 기본 동작)
  const QuestionAnswerSection = ({ myAnswers }: { myAnswers?: QuizAnswer[] }) => (
    <>
      <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 16, color: "#111827" }}>문제 및 정답</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {quiz.questions.map((q) => {
          const myAnswer = myAnswers?.find((a) => a.questionId === q.id);
          const myShortAnswer = myAnswer;
          return (
            <div key={q.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, color: "#111827" }}>{`문제 ${q.questionOrder}`}</div>
                <div style={{ fontSize: 13, color: "#111827" }}>{`${q.points}점 · ${q.questionType === "MULTIPLE_CHOICE" ? "객관식" : "단답형"}`}</div>
              </div>
              <div style={{ marginBottom: 10, whiteSpace: "pre-wrap", color: "#111827" }}>{q.questionText}</div>
              {q.questionType === "MULTIPLE_CHOICE" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {q.options.map((o) => {
                    const isMySelection = myAnswer?.selectedOptionId === o.id;
                    const isMyWrong = isMySelection && myAnswer?.isCorrect === false;
                    return (
                      <div
                        key={o.id}
                        style={{
                          border: `1px solid ${o.isCorrect ? "#86efac" : isMyWrong ? "#fca5a5" : "#e5e7eb"}`,
                          background: o.isCorrect ? "#f0fdf4" : isMyWrong ? "#fff1f2" : "#fff",
                          borderRadius: 8,
                          padding: "7px 10px",
                          fontSize: 14,
                          color: "#111827",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span>{`${o.optionOrder}. ${o.optionText}`}</span>
                        {isMyWrong && (
                          <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, marginLeft: 4 }}>내 답</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div style={{ border: "1px solid #86efac", background: "#f0fdf4", borderRadius: 8, padding: "7px 10px", fontSize: 14, color: "#111827" }}>
                    정답: {q.correctAnswer}
                  </div>
                  {myShortAnswer?.answerText && (
                    <div
                      style={{
                        marginTop: 6,
                        border: `1px solid ${myShortAnswer.isCorrect ? "#86efac" : "#fca5a5"}`,
                        background: myShortAnswer.isCorrect ? "#f0fdf4" : "#fff1f2",
                        borderRadius: 8,
                        padding: "7px 10px",
                        fontSize: 14,
                        color: "#111827",
                      }}
                    >
                      내 답: {myShortAnswer.answerText}
                    </div>
                  )}
                </>
              )}
              {q.explanation && (
                <div style={{ marginTop: 8, border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: "#111827" }}>
                  해설: {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  if (isTeacher) {
    return (
      <DashboardLayout>
        <BackButton />

        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "0.75rem",
            border: "1px solid var(--neutral-200)",
            overflow: "hidden",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ padding: "1.5rem 1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: 18, color: "#111827" }}>{quiz.title}</div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary-light)", marginBottom: 0 }}>
                  {quiz.teacherName} | {quiz.classroomName}
                  {quiz.week ? ` | ${quiz.week}주차` : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  style={{
                    padding: "0.375rem 0.875rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--primary-600)",
                    background: "#fff",
                    color: "var(--primary-600)",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/quiz/${id}/edit`)}
                >
                  수정
                </button>
                <button
                  style={{
                    padding: "0.375rem 0.875rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--danger-600)",
                    background: "#fff",
                    color: "var(--danger-600)",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                  onClick={handleDelete}
                >
                  삭제
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              {quizInfoStatsCards.map((card) => (
                <div
                  key={card.key}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    borderRadius: "0.75rem",
                    border: `1px solid ${card.borderColor}`,
                    background: card.background,
                    boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: card.iconBackground,
                        color: card.iconColor,
                        fontSize: 14,
                      }}
                    >
                      <i className={card.icon} />
                    </span>
                    <p style={{ fontSize: "0.75rem", color: "#111827", marginBottom: 0, fontWeight: 600 }}>{card.label}</p>
                  </div>
                  <p style={{ fontWeight: 700, color: card.valueColor, fontSize: "1.25rem", lineHeight: 1.1, marginBottom: 0 }}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "1rem", borderTop: "1px solid var(--neutral-200)" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, marginRight: "0.25rem" }}>상태 변경:</span>
              {(
                [
                  { value: "OPEN", label: "진행중", activeColor: "var(--success-600)", activeBg: "var(--success-600)" },
                  { value: "CLOSED", label: "마감", activeColor: "var(--danger-600)", activeBg: "var(--danger-600)" },
                ] as const
              ).map((s) => {
                const isActive = quiz.status === s.value;
                return (
                  <button
                    key={s.value}
                    disabled={isActive}
                    onClick={() => handleStatusChange(s.value)}
                    style={{
                      padding: "0.3rem 0.875rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      cursor: isActive ? "default" : "pointer",
                      border: `1px solid ${s.activeBg}`,
                      backgroundColor: isActive ? s.activeBg : "transparent",
                      color: isActive ? "#fff" : s.activeColor,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ padding: "1.75rem 1.75rem", borderTop: "1px solid var(--neutral-200)" }}>
            <QuestionAnswerSection />
          </div>

          <div style={{ padding: "1.75rem 1.75rem", borderTop: "1px solid var(--neutral-200)" }}>
            <div style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: 16, color: "#111827" }}>응시 통계</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.35fr repeat(4, minmax(0, 1fr))",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              {participationStatsCards.map((card) => (
                <div
                  key={card.key}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    borderRadius: "0.75rem",
                    border: `1px solid ${card.borderColor}`,
                    background: card.background,
                    boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: card.iconBackground,
                        color: card.iconColor,
                        fontSize: 14,
                      }}
                    >
                      <i className={card.icon} />
                    </span>
                    <p style={{ fontSize: "0.75rem", color: "#111827", marginBottom: 0, fontWeight: 600 }}>{card.label}</p>
                  </div>
                  <p style={{ fontWeight: 700, color: card.valueColor, fontSize: "1.25rem", lineHeight: 1.1, marginBottom: 0 }}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {allStudents.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-secondary-light)", marginBottom: 0 }}>학생 정보가 없습니다.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {allStudents.map((s) => {
                  const latest = s.latestSubmission;
                  const hasSubmission = !!latest;
                  return (
                    <div
                      key={s.studentInfoId}
                      style={{
                        border: "1px solid var(--neutral-200)",
                        borderRadius: "0.75rem",
                        padding: "0.875rem 1rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "0.5rem",
                            backgroundColor: s.submitted ? "var(--primary-100)" : "var(--neutral-100)",
                            color: s.submitted ? "var(--primary-600)" : "var(--neutral-400)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            flexShrink: 0,
                          }}
                        >
                          {s.studentNumber?.slice(-2) ?? "?"}
                        </div>

                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.125rem" }}>
                            <span style={{ fontWeight: 600, color: "var(--neutral-700)" }}>{s.studentName}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)" }}>{s.studentNumber}</span>
                          </div>
                          {hasSubmission && (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)" }}>
                              {latest.submittedAt?.slice(0, 16).replace("T", " ")}
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: "right", marginRight: "0.5rem" }}>
                          {hasSubmission ? (
                            <>
                              <p style={{ fontWeight: 700, color: "var(--primary-600)", fontSize: "1.125rem", marginBottom: 0 }}>{latest.score}점</p>
                              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: 0 }}>{latest.totalPoints}점 만점</p>
                            </>
                          ) : (
                            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary-light)" }}>-</span>
                          )}
                        </div>

                        {hasSubmission ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                            <span
                              style={{
                                padding: "0.2rem 0.5rem",
                                borderRadius: "0.375rem",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                backgroundColor: "var(--success-50)",
                                color: "var(--success-600)",
                              }}
                            >
                              응시완료
                            </span>
                          </div>
                        ) : (
                          <span
                            style={{
                              padding: "0.2rem 0.625rem",
                              borderRadius: "0.375rem",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              border: "1px solid var(--danger-300)",
                              color: "var(--danger-600)",
                              backgroundColor: "var(--danger-50)",
                              flexShrink: 0,
                            }}
                          >
                            미응시
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* [woo] 정답 상세 뷰: 교사 스타일, 응시 통계/수정/삭제 제외 */}
      {result && showAnswerDetail ? (
        <div>
          <button
            onClick={() => setShowAnswerDetail(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              marginBottom: "1rem",
              padding: "0.375rem 0.875rem",
              border: "1px solid var(--neutral-200)",
              borderRadius: "0.5rem",
              background: "#fff",
              cursor: "pointer",
              fontSize: "0.875rem",
              color: "var(--neutral-700)",
            }}
          >
            ← 결과로 돌아가기
          </button>

          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "0.75rem",
              border: "1px solid var(--neutral-200)",
              overflow: "hidden",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: 18, color: "#111827" }}>{quiz.title}</div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary-light)", marginBottom: 0 }}>
                  {quiz.teacherName} | {quiz.classroomName}
                  {quiz.week ? ` | ${quiz.week}주차` : ""}
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "0.75rem" }}>
                {quizInfoStatsCards.map((card) => (
                  <div
                    key={`answer-${card.key}`}
                    style={{
                      width: "100%",
                      padding: "0.875rem 1rem",
                      borderRadius: "0.75rem",
                      border: `1px solid ${card.borderColor}`,
                      background: card.background,
                      boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: card.iconBackground,
                          color: card.iconColor,
                          fontSize: 14,
                        }}
                      >
                        <i className={card.icon} />
                      </span>
                      <p style={{ fontSize: "0.75rem", color: "#111827", marginBottom: 0, fontWeight: 600 }}>{card.label}</p>
                    </div>
                    <p style={{ fontWeight: 700, color: card.valueColor, fontSize: "1.25rem", lineHeight: 1.1, marginBottom: 0 }}>{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "1.75rem 1.75rem", borderTop: "1px solid var(--neutral-200)" }}>
              <QuestionAnswerSection myAnswers={result.answers ?? undefined} />
            </div>
          </div>
        </div>
      ) : result ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 130px)" }}>
          <div
            style={{
              maxWidth: 520,
              width: "100%",
              borderRadius: 18,
              border: "1px solid #d1d5db",
              background: "#fff",
              padding: "1.5rem",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "#fff7ed",
                  margin: "0 auto 0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ea580c",
                  fontSize: 34,
                }}
              >
                <i className="ri-check-line" />
              </div>
              <div style={{ marginBottom: 6, fontWeight: 800, fontSize: 28, color: "#111827" }}>제출 완료!</div>
              <p style={{ marginBottom: 0, color: "#111827", fontSize: 15 }}>퀴즈가 성공적으로 제출되었습니다.</p>
            </div>

            <div style={{ border: "2px solid #bfdbfe", borderRadius: 14, background: "#eff6ff", padding: "1.2rem", textAlign: "center", marginBottom: "1.5rem" }}>
              <p style={{ color: "#2563eb", fontWeight: 700, marginBottom: 6, fontSize: 13 }}>내 점수</p>
              <p style={{ marginBottom: 6, color: "#1e3a8a", fontSize: 46, fontWeight: 800 }}>{result.score}점</p>
              <p style={{ marginBottom: 0, color: "#2563eb", fontWeight: 700, fontSize: 18 }}>
                {result.totalPoints}점 만점 중 ({scorePercent}%)
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: "1.5rem" }}>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "0.75rem", background: "#f9fafb", textAlign: "center" }}>
                <div style={{ color: "#6b7280", marginBottom: 4, fontSize: 13 }}>소요 시간</div>
                <div style={{ fontWeight: 800, fontSize: 26, color: "#111827" }}>{formatElapsed(elapsedSeconds)}</div>
              </div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "0.75rem", background: "#f9fafb", textAlign: "center" }}>
                <div style={{ color: "#6b7280", marginBottom: 4, fontSize: 13 }}>정답률</div>
                <div style={{ fontWeight: 800, fontSize: 26, color: "#111827" }}>{scorePercent}%</div>
              </div>
            </div>

            {/* [woo] 버튼 행: 정답/해설 보기 + 목록으로 돌아가기 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: quiz.showAnswer && result.answers != null && result.answers.length > 0 ? "1fr 1fr" : "1fr",
                gap: "0.75rem",
              }}
            >
              {quiz.showAnswer && result.answers != null && result.answers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAnswerDetail(true)}
                  style={{
                    width: "100%",
                    border: "1px solid #25A194",
                    borderRadius: 12,
                    background: "#fff",
                    color: "#25A194",
                    padding: "12px 16px",
                    fontWeight: 500,
                    fontSize: 16,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  정답/해설 보기
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/quiz")}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 12,
                  background: "#25A194",
                  color: "#fff",
                  padding: "12px 16px",
                  fontWeight: 500,
                  fontSize: 16,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                목록으로
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {!takingQuiz && (
            <div
              style={{
                minHeight: "calc(100vh - 130px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 560,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "1.5rem",
                }}
              >
                <div style={{ marginBottom: 10, fontSize: 20, fontWeight: 700, color: "#111827" }}>{quiz.title}</div>
                <div style={{ color: "#6b7280", marginBottom: 10 }}>
                  {quiz.teacherName} | {quiz.classroomName}
                  {quiz.week ? ` | ${quiz.week}주차` : ""}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
                  {quizInfoStatsCards.map((card) => (
                    <div
                      key={`student-${card.key}`}
                      style={{
                        width: "100%",
                        padding: "0.875rem 1rem",
                        borderRadius: "0.75rem",
                        border: `1px solid ${card.borderColor}`,
                        background: card.background,
                        boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: card.iconBackground,
                            color: card.iconColor,
                            fontSize: 14,
                          }}
                        >
                          <i className={card.icon} />
                        </span>
                        <p style={{ fontSize: "0.75rem", color: "#111827", marginBottom: 0, fontWeight: 600 }}>{card.label}</p>
                      </div>
                      <p style={{ fontWeight: 700, color: card.valueColor, fontSize: "1.25rem", lineHeight: 1.1, marginBottom: 0 }}>
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  {canTakeQuiz ? (
                    <button
                      type="button"
                      onClick={startQuiz}
                      style={{
                        width: "100%",
                        border: "none",
                        borderRadius: 10,
                        background: "#25A194",
                        color: "#fff",
                        padding: "10px 12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                      }}
                    >
                      퀴즈 시작하기
                    </button>
                  ) : (
                    <div
                      style={{
                        border: "1px solid #d1d5db",
                        borderRadius: 10,
                        background: "#f9fafb",
                        color: "#6b7280",
                        padding: "10px 12px",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                      }}
                    >
                      {quiz.status === "CLOSED" ? "마감된 퀴즈입니다." : "최대 응시 횟수를 초과했습니다."}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate("/quiz")}
                    style={{
                      width: "100%",
                      border: "1px solid #374151",
                      borderRadius: 10,
                      background: "#374151",
                      color: "#fff",
                      padding: "10px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    퀴즈 목록으로
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* [soojin] 퀴즈 진행 화면 - 상단 진행 바 + 카드 내 번호 네비게이션 */}
          {takingQuiz && (
            <div style={{ margin: "-24px", minHeight: "100vh" }}>
              {/* [soojin] 상단 진행 바 */}
              <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 24px 0" }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{`문제 ${currentQuestionIndex + 1} / ${totalQuestions}`}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {quiz.timeLimit != null && remainingSeconds != null && (
                        <span style={{ fontWeight: 800, fontSize: 14, color: remainingSeconds <= 300 ? "#dc2626" : "#25A194" }}>
                          남은 시간: {formatTime(remainingSeconds)}
                        </span>
                      )}
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#25A194" }}>{progressPercent}% 완료</span>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
                    <div style={{ width: `${progressPercent}%`, height: "100%", background: "#25A194" }} />
                  </div>
                </div>
              </div>

              {/* 카드 */}
              <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 40px" }}>
                {currentQuestion ? (
                  <div style={{ border: "1px solid #d1d5db", borderRadius: 16, background: "#fff", padding: "1.75rem" }}>
                    {/* 문제 헤더 */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>문제 {currentQuestion.questionOrder}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ padding: "4px 10px", borderRadius: 8, background: "#f5f3ff", color: "#7c3aed", fontWeight: 700 }}>{currentQuestion.points}점</span>
                        <span style={{ padding: "4px 10px", borderRadius: 8, background: "#f3f4f6", color: "#374151", fontWeight: 700 }}>
                          {currentQuestion.questionType === "MULTIPLE_CHOICE" ? "객관식" : "단답형"}
                        </span>
                      </div>
                    </div>

                    {/* 문제 텍스트 */}
                    <p style={{ fontSize: 16, marginBottom: 20, whiteSpace: "pre-wrap", color: "#111827", fontWeight: 600 }}>{currentQuestion.questionText}</p>

                    {/* 보기 */}
                    {currentQuestion.questionType === "MULTIPLE_CHOICE" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {currentQuestion.options.map((o) => {
                          const selected = answers[currentQuestion.id]?.selectedOptionId === o.id;
                          return (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => selectOption(currentQuestion.id, o.id)}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                borderRadius: 10,
                                border: `1px solid ${selected ? "#25A194" : "#d1d5db"}`,
                                background: selected ? "#ecfeff" : "#fff",
                                padding: "12px 16px",
                                cursor: "pointer",
                              }}
                            >
                              <span
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: "50%",
                                  background: selected ? "#25A194" : "#f3f4f6",
                                  color: selected ? "#fff" : "#4b5563",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 700,
                                  flexShrink: 0,
                                  fontSize: 14,
                                }}
                              >
                                {o.optionOrder}
                              </span>
                              <span style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>{o.optionText}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <textarea
                        rows={4}
                        style={{
                          width: "100%",
                          padding: "0.75rem 0.9rem",
                          borderRadius: "0.6rem",
                          border: "1px solid #d1d5db",
                          fontSize: "0.9375rem",
                          resize: "vertical",
                          boxSizing: "border-box",
                        }}
                        placeholder="답안을 입력하세요"
                        value={answers[currentQuestion.id]?.answerText ?? ""}
                        onChange={(e) => setAnswerText(currentQuestion.id, e.target.value)}
                      />
                    )}

                    {/* 카드 내 네비게이션 */}
                    <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={isFirstQuestion}
                        style={{
                          padding: "8px 18px",
                          borderRadius: 8,
                          border: "1px solid #d1d5db",
                          background: "#fff",
                          color: isFirstQuestion ? "#9ca3af" : "#374151",
                          cursor: isFirstQuestion ? "not-allowed" : "pointer",
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        이전 문제
                      </button>

                      <div style={{ display: "flex", gap: 6 }}>
                        {Array.from({ length: totalQuestions }, (_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCurrentQuestionIndex(i)}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              border: "none",
                              background: i === currentQuestionIndex ? "#25A194" : "#e5e7eb",
                              color: i === currentQuestionIndex ? "#fff" : "#374151",
                              fontWeight: 700,
                              fontSize: 13,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      {!isLastQuestion ? (
                        <button
                          type="button"
                          onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                          style={{
                            padding: "8px 18px",
                            borderRadius: 8,
                            border: "none",
                            background: "#25A194",
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          다음 문제
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void submitQuiz(false)}
                          disabled={submitting}
                          style={{
                            padding: "8px 18px",
                            borderRadius: 8,
                            border: "none",
                            background: "#2563eb",
                            color: "#fff",
                            cursor: submitting ? "not-allowed" : "pointer",
                            opacity: submitting ? 0.7 : 1,
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          {submitting ? "제출 중..." : "제출하기"}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ border: "1px solid #d1d5db", borderRadius: 16, background: "#fff", padding: "1.75rem", textAlign: "center", color: "#6b7280" }}>
                    문제가 없습니다.
                  </div>
                )}

                {/* 미답 경고 - 카드 밖 */}
                {unansweredCount > 0 && (
                  <div style={{ marginTop: 12, border: "1px solid #fdba74", background: "#fff7ed", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <i className="ri-error-warning-line" style={{ color: "#c2410c", fontSize: 16, marginTop: 1, flexShrink: 0 }} />
                    <div>
                      <div style={{ color: "#c2410c", fontWeight: 700, marginBottom: 2, fontSize: 14 }}>아직 풀지 않은 문제가 있습니다</div>
                      <div style={{ color: "#c2410c", fontSize: 13 }}>모든 문제를 풀고 제출하는 것을 권장합니다. ({unansweredCount}개 문제 남음)</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

    </DashboardLayout>
  );
}
