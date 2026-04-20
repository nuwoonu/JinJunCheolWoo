import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/shared/api/authApi";
import { useAuth } from "@/shared/contexts/AuthContext";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

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
        <div className="text-center py-40 text-secondary-light">불러오는 중...</div>
      </DashboardLayout>
    );
  }

  if (!quiz) {
    return (
      <DashboardLayout>
        <div className="text-center py-40 text-secondary-light">퀴즈를 찾을 수 없습니다.</div>
      </DashboardLayout>
    );
  }

  const canTakeQuiz =
    isStudent &&
    quiz.status === "OPEN" &&
    (quiz.maxAttempts == null || (quiz.mySubmissions?.length ?? 0) < quiz.maxAttempts);

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">퀴즈</h6>
          <p className="text-neutral-600 mt-4 mb-0">퀴즈 상세</p>
        </div>
      </div>

      {/* 퀴즈 정보 카드 */}
      <div className="card radius-12 mb-24">
        <div className="card-header d-flex justify-content-between align-items-center py-16 px-24 border-bottom">
          <div>
            <h6 className="mb-4">{quiz.title}</h6>
            <div className="d-flex align-items-center gap-12 text-sm text-secondary-light">
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
          <div className="d-flex align-items-center gap-8">
            <span
              className={`badge ${quiz.status === "OPEN" ? "bg-success-100 text-success-600" : "bg-danger-100 text-danger-600"}`}
            >
              {quiz.status === "OPEN" ? "진행중" : "마감"}
            </span>
            <span className="text-sm text-secondary-light">마감: {quiz.dueDate?.slice(0, 10)}</span>
          </div>
        </div>
        {quiz.description && (
          <div className="card-body p-24">
            <div style={{ whiteSpace: "pre-wrap" }}>{quiz.description}</div>
          </div>
        )}

        {/* [woo] 교사: 상태 변경 + 삭제 */}
        {isTeacher && (
          <div className="card-footer px-24 py-16 border-top d-flex align-items-center gap-8">
            <span className="text-sm fw-semibold me-4">상태 변경:</span>
            {(
              [
                { value: "OPEN", label: "진행중", activeBtn: "btn-success-600", outlineBtn: "btn-outline-success-600" },
                { value: "CLOSED", label: "마감", activeBtn: "btn-danger-600", outlineBtn: "btn-outline-danger-600" },
              ] as const
            ).map((s) => (
              <button
                key={s.value}
                className={`btn btn-sm radius-8 ${quiz.status === s.value ? s.activeBtn : s.outlineBtn}`}
                disabled={quiz.status === s.value}
                onClick={() => handleStatusChange(s.value)}
              >
                {s.label}
              </button>
            ))}
            <div className="ms-auto d-flex gap-8">
              {/* [woo] 퀴즈 수정 버튼 */}
              <button
                className="btn btn-outline-primary-600 btn-sm radius-8"
                onClick={() => navigate(`/quiz/${id}/edit`)}
              >
                수정
              </button>
              <button className="btn btn-outline-danger-600 btn-sm radius-8" onClick={handleDelete}>
                삭제
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========== 학생: 퀴즈 풀기 결과 ========== */}
      {result && (
        <div className="card radius-12 mb-24">
          <div className="card-header py-16 px-24 border-bottom bg-primary-50">
            <h6 className="mb-0">
              제출 완료 - {result.score}/{result.totalPoints}점
              <span className="text-sm text-secondary-light ms-8">({result.attemptNumber}회차)</span>
            </h6>
          </div>
          {quiz.showAnswer && result.answers && (
            <div className="card-body p-24">
              {result.answers.map((a, i) => (
                <div key={i} className={`p-16 mb-12 radius-8 ${a.isCorrect ? "bg-success-50" : "bg-danger-50"}`}>
                  <div className="d-flex align-items-center gap-8 mb-4">
                    <span className="fw-semibold text-sm">문제 {i + 1}</span>
                    <span
                      className={`badge ${a.isCorrect ? "bg-success-100 text-success-600" : "bg-danger-100 text-danger-600"}`}
                    >
                      {a.isCorrect ? "정답" : "오답"}
                    </span>
                    <span className="text-sm text-secondary-light">{a.earnedPoints}점</span>
                  </div>
                  <p className="text-sm mb-0">{a.questionText}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== 학생: 이전 응시 결과 ========== */}
      {isStudent && quiz.mySubmissions && quiz.mySubmissions.length > 0 && !takingQuiz && (
        <div className="card radius-12 mb-24">
          <div className="card-header py-16 px-24 border-bottom">
            <h6 className="mb-0">내 응시 결과</h6>
          </div>
          <div className="card-body p-0">
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
                      <td className="fw-bold text-primary-600">
                        {sub.score}/{sub.totalPoints}
                      </td>
                      <td className="text-secondary-light">{sub.submittedAt?.slice(0, 16).replace("T", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* [woo] 정답공개 활성화 시 최근 응시 회차의 정답/오답 상세 표시 */}
          {quiz.showAnswer && quiz.mySubmissions[0]?.answers && (
            <div className="card-body border-top p-24">
              <p className="fw-semibold text-sm mb-16">{quiz.mySubmissions[0].attemptNumber}회차 답안 확인</p>
              {quiz.mySubmissions[0].answers.map((a, i) => (
                <div key={i} className={`p-16 mb-12 radius-8 ${a.isCorrect ? "bg-success-50" : "bg-danger-50"}`}>
                  <div className="d-flex align-items-center gap-8 mb-4">
                    <span className="fw-semibold text-sm">문제 {i + 1}</span>
                    <span
                      className={`badge ${a.isCorrect ? "bg-success-100 text-success-600" : "bg-danger-100 text-danger-600"}`}
                    >
                      {a.isCorrect ? "정답" : "오답"}
                    </span>
                    <span className="text-sm text-secondary-light">{a.earnedPoints}점</span>
                  </div>
                  <p className="text-sm mb-0">{a.questionText}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== 학생: 퀴즈 풀기 시작 버튼 또는 풀기 화면 ========== */}
      {isStudent && !takingQuiz && !result && canTakeQuiz && (
        <div className="text-center mb-24">
          <button
            className="btn btn-primary-600 radius-8 px-32 py-12"
            onClick={() => {
              setTakingQuiz(true);
              setAnswers({});
              setResult(null);
            }}
          >
            <i className="ri-play-line me-8"></i>
            퀴즈 풀기
            {quiz.maxAttempts && (
              <span className="ms-8 text-sm">
                ({quiz.mySubmissions?.length ?? 0}/{quiz.maxAttempts}회 응시)
              </span>
            )}
          </button>
        </div>
      )}

      {isStudent && !canTakeQuiz && !takingQuiz && !result && (
        <div className="text-center mb-24 text-secondary-light">
          {quiz.status === "CLOSED" ? "마감된 퀴즈입니다." : "최대 응시 횟수를 초과했습니다."}
        </div>
      )}

      {/* ========== 학생: 퀴즈 풀기 화면 ========== */}
      {isStudent && takingQuiz && (
        <div>
          {quiz.questions.map((q) => (
            <div key={q.id} className="card radius-12 mb-16">
              <div className="card-header py-12 px-24 border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-8">
                  <span className="fw-semibold text-sm">문제 {q.questionOrder}</span>
                  <span
                    className={`badge ${q.questionType === "MULTIPLE_CHOICE" ? "bg-primary-100 text-primary-600" : "bg-warning-100 text-warning-600"}`}
                  >
                    {q.questionType === "MULTIPLE_CHOICE" ? "객관식" : "단답형"}
                  </span>
                </div>
                <span className="text-sm text-secondary-light">배점 {q.points}점</span>
              </div>
              <div className="card-body p-24">
                <p className="fw-medium mb-16" style={{ whiteSpace: "pre-wrap" }}>
                  {q.questionText}
                </p>

                {q.questionType === "MULTIPLE_CHOICE" ? (
                  <div>
                    {q.options.map((o) => (
                      <div
                        key={o.id}
                        className={`d-flex align-items-center gap-12 p-12 mb-8 radius-8 border cursor-pointer ${
                          answers[q.id]?.selectedOptionId === o.id
                            ? "border-primary-600 bg-primary-50"
                            : "border-neutral-200 hover-bg-neutral-50"
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => selectOption(q.id, o.id)}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[q.id]?.selectedOptionId === o.id}
                          onChange={() => selectOption(q.id, o.id)}
                          className="form-check-input"
                        />
                        <span className="text-sm">
                          {o.optionOrder}. {o.optionText}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    className="form-control radius-8"
                    placeholder="답을 입력하세요"
                    value={answers[q.id]?.answerText ?? ""}
                    onChange={(e) => setAnswerText(q.id, e.target.value)}
                  />
                )}
              </div>
            </div>
          ))}

          <div className="d-flex justify-content-between mb-24">
            <button className="btn btn-outline-neutral-300 radius-8" onClick={() => setTakingQuiz(false)}>
              취소
            </button>
            <button className="btn btn-primary-600 radius-8 px-32" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "제출 중..." : "제출하기"}
            </button>
          </div>
        </div>
      )}

      {/* ========== 교사: 문제 확인 ========== */}
      {isTeacher && (
        <div className="card radius-12 mb-24">
          <div className="card-header py-16 px-24 border-bottom">
            <h6 className="mb-0">문제 목록 ({quiz.questions.length}문제)</h6>
          </div>
          <div className="card-body p-24">
            {quiz.questions.map((q) => (
              <div key={q.id} className="p-16 mb-12 radius-8 bg-neutral-50">
                <div className="d-flex align-items-center gap-8 mb-8">
                  <span className="fw-semibold">문제 {q.questionOrder}</span>
                  <span
                    className={`badge ${q.questionType === "MULTIPLE_CHOICE" ? "bg-primary-100 text-primary-600" : "bg-warning-100 text-warning-600"}`}
                  >
                    {q.questionType === "MULTIPLE_CHOICE" ? "객관식" : "단답형"}
                  </span>
                  <span className="text-sm text-secondary-light">({q.points}점)</span>
                </div>
                <p className="mb-8" style={{ whiteSpace: "pre-wrap" }}>
                  {q.questionText}
                </p>

                {q.questionType === "MULTIPLE_CHOICE" ? (
                  <div className="ms-16">
                    {q.options.map((o) => (
                      <div key={o.id} className={`text-sm mb-4 ${o.isCorrect ? "fw-bold text-success-600" : ""}`}>
                        {o.optionOrder}. {o.optionText}
                        {o.isCorrect && " ✓ 정답"}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ms-16 text-sm">
                    <span className="fw-bold text-success-600">정답: {q.correctAnswer}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== 교사: 응시 현황 ========== */}
      {isTeacher && quiz.submissions && (
        <div className="card radius-12 mb-24">
          <div className="card-header py-16 px-24 border-bottom">
            <h6 className="mb-0">응시 현황 ({quiz.submissions.length}건)</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table bordered-table mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>번호</th>
                    <th>학생명</th>
                    <th style={{ width: 80 }}>회차</th>
                    <th style={{ width: 120 }}>점수</th>
                    <th style={{ width: 160 }}>제출일</th>
                  </tr>
                </thead>
                <tbody>
                  {quiz.submissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-24 text-secondary-light">
                        응시한 학생이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    quiz.submissions.map((sub) => (
                      <tr key={sub.id}>
                        <td>{sub.studentNumber}</td>
                        <td>{sub.studentName}</td>
                        <td>{sub.attemptNumber}회</td>
                        <td className="fw-bold text-primary-600">
                          {sub.score}/{sub.totalPoints}
                        </td>
                        <td className="text-secondary-light">{sub.submittedAt?.slice(0, 16).replace("T", " ")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
