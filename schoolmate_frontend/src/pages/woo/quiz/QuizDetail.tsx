import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../../api/auth";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { useAuth } from "../../../contexts/AuthContext";

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
  const location = useLocation();
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
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const autoSubmitTriggeredRef = useRef(false);
  // [soojin] ?start=true 자동 시작이 한 번만 실행되도록 방지 (제출 후 fetchQuiz 재실행 시 중복 방지)
  const autoStartTriggeredRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

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

  // [soojin] ?start=true 파라미터 감지 시 퀴즈 자동 시작 (한 번만 실행)
  useEffect(() => {
    if (!quiz || !isStudent) return;
    if (autoStartTriggeredRef.current) return;
    const params = new URLSearchParams(location.search);
    if (params.get("start") === "true") {
      autoStartTriggeredRef.current = true;
      startQuiz();
    }
  }, [quiz]);

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
  const submittedStudents = allStudents.filter((s) => s.submitted);
  const submittedCount = submittedStudents.length;
  const totalStudentCount = allStudents.length;
  const avgScore =
    submittedCount > 0
      ? Math.round(
          (submittedStudents.reduce(
            (sum, s) =>
              sum +
              (s.latestSubmission ? (s.latestSubmission.score / s.latestSubmission.totalPoints) * 100 : 0),
            0,
          ) /
            submittedCount) *
            10,
        ) / 10
      : 0;

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

  const StatBox = ({
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

  if (isTeacher) {
    return (
      <DashboardLayout>
        <BackButton />

        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "0.75rem",
            border: "1px solid var(--neutral-200)",
            padding: "1.25rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 16 }}>문제 및 정답</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {quiz.questions.map((q) => (
              <div key={q.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>{`문제 ${q.questionOrder}`}</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{`${q.points}점 · ${q.questionType === "MULTIPLE_CHOICE" ? "객관식" : "단답형"}`}</div>
                </div>
                <div style={{ marginBottom: 10, whiteSpace: "pre-wrap" }}>{q.questionText}</div>
                {q.questionType === "MULTIPLE_CHOICE" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {q.options.map((o) => (
                      <div
                        key={o.id}
                        style={{
                          border: `1px solid ${o.isCorrect ? "#86efac" : "#e5e7eb"}`,
                          background: o.isCorrect ? "#f0fdf4" : "#fff",
                          borderRadius: 8,
                          padding: "7px 10px",
                          fontSize: 14,
                        }}
                      >
                        {`${o.optionOrder}. ${o.optionText}`}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ border: "1px solid #86efac", background: "#f0fdf4", borderRadius: 8, padding: "7px 10px", fontSize: 14 }}>
                    정답: {q.correctAnswer}
                  </div>
                )}
                {q.explanation && (
                  <div style={{ marginTop: 8, border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: 8, padding: "7px 10px", fontSize: 13 }}>
                    해설: {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "0.75rem",
            border: "1px solid var(--neutral-200)",
            padding: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: 18 }}>{quiz.title}</div>
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

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            <StatBox label="문제수" value={`${quiz.questions.length}문항`} bg="var(--neutral-50)" color="var(--neutral-700)" />
            <StatBox label="총 점수" value={`${quiz.totalPoints}점`} bg="var(--primary-50)" color="var(--primary-600)" />
            <StatBox
              label="응시횟수"
              value={quiz.maxAttempts != null ? `${quiz.maxAttempts}회` : "무제한"}
              bg="var(--success-50)"
              color="var(--success-600)"
            />
            <StatBox
              label="제한시간"
              value={quiz.timeLimit != null ? `${quiz.timeLimit}분` : "없음"}
              bg="var(--warning-50)"
              color="var(--warning-600)"
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid var(--neutral-200)" }}>
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

        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "0.75rem",
            border: "1px solid var(--neutral-200)",
            padding: "1.25rem",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: 16 }}>응시 통계</div>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <StatBox label="전체 학생" value={`${totalStudentCount}명`} bg="var(--neutral-50)" color="var(--neutral-700)" />
            <StatBox label="응시" value={`${submittedCount}명`} bg="var(--success-50)" color="var(--success-600)" />
            <StatBox label="미응시" value={`${totalStudentCount - submittedCount}명`} bg="var(--danger-50)" color="var(--danger-600)" />
            <StatBox label="평균 점수" value={submittedCount > 0 ? `${avgScore}%` : "-"} bg="var(--primary-50)" color="var(--primary-600)" />
          </div>

          {allStudents.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-secondary-light)", marginBottom: 0 }}>학생 정보가 없습니다.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {allStudents.map((s) => (
                <div key={s.studentInfoId} style={{ border: "1px solid var(--neutral-200)", borderRadius: "0.6rem", padding: "0.75rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.studentName}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary-light)" }}>{s.studentNumber}</div>
                    </div>
                    {s.latestSubmission ? (
                      <button
                        type="button"
                        style={{ border: "1px solid var(--primary-600)", color: "var(--primary-600)", background: "#fff", borderRadius: 8, padding: "4px 10px" }}
                        onClick={() => setExpandedStudentId(expandedStudentId === s.studentInfoId ? null : s.studentInfoId)}
                      >
                        {expandedStudentId === s.studentInfoId ? "접기" : `${s.latestSubmission.score}점 보기`}
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.8125rem", color: "var(--danger-600)", fontWeight: 600 }}>미응시</span>
                    )}
                  </div>
                  {expandedStudentId === s.studentInfoId && s.latestSubmission?.answers && (
                    <div style={{ marginTop: 10 }}>
                      {s.latestSubmission.answers.map((a, idx) => (
                        <div key={idx} style={{ padding: "0.6rem 0.7rem", borderRadius: 8, background: a.isCorrect ? "#f0fdf4" : "#fef2f2", marginBottom: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{`문제 ${idx + 1} · ${a.earnedPoints}점`}</div>
                          <div style={{ fontSize: 13 }}>{a.questionText}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <BackButton />

      {result ? (
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
              퀴즈 목록으로 돌아가기
            </button>
          </div>
        </div>
      ) : (
        <>
          {!takingQuiz && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: "1.2rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ marginBottom: 10, fontSize: 20, fontWeight: 700 }}>{quiz.title}</div>
              <div style={{ color: "#6b7280", marginBottom: 10 }}>
                {quiz.teacherName} | {quiz.classroomName}
                {quiz.week ? ` | ${quiz.week}주차` : ""}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
                <StatBox label="문제수" value={`${quiz.questions.length}문항`} bg="var(--neutral-50)" color="var(--neutral-700)" />
                <StatBox label="총점" value={`${quiz.totalPoints}점`} bg="var(--primary-50)" color="var(--primary-600)" />
                <StatBox label="제한시간" value={quiz.timeLimit != null ? `${quiz.timeLimit}분` : "없음"} bg="var(--warning-50)" color="var(--warning-600)" />
                <StatBox label="응시횟수" value={quiz.maxAttempts != null ? `${quiz.maxAttempts}회` : "무제한"} bg="var(--success-50)" color="var(--success-600)" />
              </div>

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
                  }}
                >
                  퀴즈 시작하기
                </button>
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-secondary-light)" }}>
                  {quiz.status === "CLOSED" ? "마감된 퀴즈입니다." : "최대 응시 횟수를 초과했습니다."}
                </div>
              )}
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
