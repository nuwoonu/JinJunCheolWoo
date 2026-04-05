import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/auth";
import DashboardLayout from "../../../components/layout/DashboardLayout";

// [woo] 퀴즈 출제 페이지 (교사 전용)
// - 기본 정보 + 문제 동적 추가 (객관식 / 단답형)

// [woo 03/25] 수업 분반 (과목 + 학급)
interface CourseSectionOption {
  id: number;
  name: string;
  classroomId: number;
}

interface OptionForm {
  optionText: string;
  isCorrect: boolean;
}

interface QuestionForm {
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER";
  points: number;
  correctAnswer: string; // 단답형 정답 (쉼표 구분 복수 정답)
  options: OptionForm[]; // 객관식 선택지
  explanation: string; // [soojin] 해설
}

export default function QuizCreate() {
  const navigate = useNavigate();
  const [courseSections, setCourseSections] = useState<CourseSectionOption[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    week: "",
    courseSectionId: "",
    dueDate: "",
    dueTime: "",
    maxAttempts: "",
    timeLimit: "",
    showAnswer: true,
  });

  const [questions, setQuestions] = useState<QuestionForm[]>([
    {
      questionText: "",
      questionType: "MULTIPLE_CHOICE",
      points: 1,
      correctAnswer: "",
      explanation: "",
      options: [
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
      ],
    },
  ]);

  useEffect(() => {
    api
      .get("/homework/course-sections")
      .then((res) => setCourseSections(res.data))
      .catch(() => {});
  }, []);

  // [woo] 문제 추가
  const addQuestion = (type: "MULTIPLE_CHOICE" | "SHORT_ANSWER") => {
    setQuestions((prev) => [
      ...prev,
      {
        questionText: "",
        questionType: type,
        points: 1,
        correctAnswer: "",
        explanation: "",
        options:
          type === "MULTIPLE_CHOICE"
            ? [
                { optionText: "", isCorrect: false },
                { optionText: "", isCorrect: false },
                { optionText: "", isCorrect: false },
                { optionText: "", isCorrect: false },
              ]
            : [],
      },
    ]);
  };

  // [woo] 문제 삭제
  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return alert("최소 1문제가 필요합니다.");
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // [woo] 문제 내용 수정
  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };

  // [woo] 문제 유형 변경 시 options 초기화
  const changeQuestionType = (idx: number, type: "MULTIPLE_CHOICE" | "SHORT_ANSWER") => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === idx
          ? {
              ...q,
              questionType: type,
              correctAnswer: "",
              options:
                type === "MULTIPLE_CHOICE"
                  ? [
                      { optionText: "", isCorrect: false },
                      { optionText: "", isCorrect: false },
                      { optionText: "", isCorrect: false },
                      { optionText: "", isCorrect: false },
                    ]
                  : [],
            }
          : q,
      ),
    );
  };

  // [woo] 선택지 수정
  const updateOption = (qIdx: number, oIdx: number, field: string, value: any) => {
    setQuestions((prev) =>
      prev.map((q, qi) =>
        qi === qIdx
          ? {
              ...q,
              options: q.options.map((o, oi) => (oi === oIdx ? { ...o, [field]: value } : o)),
            }
          : q,
      ),
    );
  };

  // [woo] 객관식 정답 선택 (라디오 방식)
  const setCorrectOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, qi) =>
        qi === qIdx
          ? {
              ...q,
              options: q.options.map((o, oi) => ({ ...o, isCorrect: oi === oIdx })),
            }
          : q,
      ),
    );
  };

  // [woo] 선택지 추가
  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, qi) =>
        qi === qIdx
          ? {
              ...q,
              options: [...q.options, { optionText: "", isCorrect: false }],
            }
          : q,
      ),
    );
  };

  // [woo] 선택지 삭제 (최소 2개 보장)
  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, qi) => {
        if (qi !== qIdx) return q;
        if (q.options.length <= 2) return q;
        return { ...q, options: q.options.filter((_, oi) => oi !== oIdx) };
      }),
    );
  };

  // [woo] 제출
  const handleSubmit = async () => {
    if (!form.title.trim()) return alert("제목을 입력해주세요.");
    if (!form.courseSectionId) return alert("수업 분반을 선택해주세요.");
    if (!form.dueDate) return alert("마감일을 선택해주세요.");

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return alert(`${i + 1}번 문제 내용을 입력해주세요.`);
      if (q.questionType === "MULTIPLE_CHOICE") {
        if (q.options.some((o) => !o.optionText.trim())) return alert(`${i + 1}번 문제의 선택지를 모두 입력해주세요.`);
        if (!q.options.some((o) => o.isCorrect)) return alert(`${i + 1}번 문제의 정답을 선택해주세요.`);
      } else {
        if (!q.correctAnswer.trim()) return alert(`${i + 1}번 문제의 정답을 입력해주세요.`);
      }
    }

    setSaving(true);
    try {
      const dueDateTimeStr = form.dueDate + "T" + (form.dueTime ? form.dueTime + ":00" : "23:59:59");
      await api.post("/quiz", {
        title: form.title,
        description: form.description || null,
        week: form.week ? Number(form.week) : null,
        courseSectionId: Number(form.courseSectionId),
        dueDate: dueDateTimeStr,
        maxAttempts: form.maxAttempts ? Number(form.maxAttempts) : null,
        timeLimit: form.timeLimit ? Number(form.timeLimit) : null,
        showAnswer: form.showAnswer,
        questions: questions.map((q, i) => ({
          questionText: q.questionText,
          questionOrder: i + 1,
          points: q.points,
          questionType: q.questionType,
          correctAnswer: q.questionType === "SHORT_ANSWER" ? q.correctAnswer : null,
          explanation: q.explanation || null,
          options:
            q.questionType === "MULTIPLE_CHOICE"
              ? q.options.map((o, j) => ({
                  optionText: o.optionText,
                  optionOrder: j + 1,
                  isCorrect: o.isCorrect,
                }))
              : null,
        })),
      });
      alert("퀴즈가 출제되었습니다.");
      navigate("/homework?tab=quiz");
    } catch (err: any) {
      alert(err.response?.data || "퀴즈 출제에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <h6 style={{ fontWeight: 600, marginBottom: 0 }}>퀴즈 출제</h6>
          <p style={{ color: "#6c757d", marginTop: 4, marginBottom: 0 }}>새로운 퀴즈를 생성합니다.</p>
        </div>
      </div>

      {/* 기본 정보 카드 */}
      <div className="card" style={{ borderRadius: 12, marginBottom: 24 }}>
        <div className="card-body" style={{ padding: 24 }}>
          {/* 퀴즈 제목 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 6 }}>퀴즈 제목 *</label>
            <input
              type="text"
              className="form-control"
              style={{ borderRadius: 8 }}
              placeholder="퀴즈 제목을 입력하세요"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* 퀴즈 설명 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 6 }}>퀴즈 설명</label>
            <textarea
              className="form-control"
              style={{ borderRadius: 8 }}
              rows={3}
              placeholder="퀴즈에 대한 간단한 설명을 입력하세요"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* 담당 반 + 주차 */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 6 }}>담당 반 *</label>
              <select
                className="form-select"
                style={{ borderRadius: 8 }}
                value={form.courseSectionId}
                onChange={(e) => setForm((f) => ({ ...f, courseSectionId: e.target.value }))}
              >
                <option value="">담당 반 선택</option>
                {courseSections.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: "0 1 120px" }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 6 }}>주차</label>
              <input
                type="number"
                className="form-control"
                style={{ borderRadius: 8 }}
                placeholder="예: 1"
                min={1}
                value={form.week}
                onChange={(e) => setForm((f) => ({ ...f, week: e.target.value }))}
              />
            </div>
          </div>

          {/* 마감일 + 마감 시간 + 응시 횟수 + 제한시간 + 정답 공개 */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 160px" }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 6 }}>마감일 *</label>
              <input
                type="date"
                className="form-control"
                style={{ borderRadius: 8 }}
                value={form.dueDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 6 }}>마감 시간</label>
              <input
                type="time"
                className="form-control"
                style={{ borderRadius: 8 }}
                value={form.dueTime}
                onChange={(e) => setForm((f) => ({ ...f, dueTime: e.target.value }))}
              />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 6 }}>응시 횟수</label>
              <input
                type="number"
                className="form-control"
                style={{ borderRadius: 8 }}
                placeholder="무제한"
                min={1}
                value={form.maxAttempts}
                onChange={(e) => setForm((f) => ({ ...f, maxAttempts: e.target.value }))}
              />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 6 }}>제한시간(분)</label>
              <input
                type="number"
                className="form-control"
                style={{ borderRadius: 8 }}
                placeholder="제한 없음"
                min={1}
                value={form.timeLimit}
                onChange={(e) => setForm((f) => ({ ...f, timeLimit: e.target.value }))}
              />
            </div>
            <div style={{ paddingBottom: 2 }}>
              <button
                type="button"
                className={`btn btn-sm ${form.showAnswer ? "btn-success" : "btn-outline-secondary"}`}
                style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8 }}
                onClick={() => setForm((f) => ({ ...f, showAnswer: !f.showAnswer }))}
              >
                <i className={`ri-${form.showAnswer ? "eye-line" : "eye-off-line"}`} />
                정답 공개
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 문제 목록 */}
      {questions.map((q, qIdx) => (
        <div key={qIdx} className="card" style={{ borderRadius: 12, marginBottom: 16 }}>
          <div
            className="card-header"
            style={{
              padding: "12px 24px",
              borderBottom: "1px solid #e9ecef",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 16, color: "#000" }}>문제 {qIdx + 1}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <label style={{ fontSize: 14, color: "#6c757d" }}>배점:</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  style={{ width: 70, borderRadius: 8, fontSize: 13 }}
                  min={1}
                  value={q.points}
                  onChange={(e) => updateQuestion(qIdx, "points", Number(e.target.value) || 1)}
                />
              </div>
              <button
                className="btn btn-sm btn-outline-danger"
                style={{ borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 600 }}
                onClick={() => removeQuestion(qIdx)}
              >
                삭제
              </button>
            </div>
          </div>

          <div className="card-body" style={{ padding: 24 }}>
            {/* 문제 유형 토글 버튼 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button
                type="button"
                className={`btn btn-sm ${q.questionType === "MULTIPLE_CHOICE" ? "btn-primary" : "btn-outline-secondary"}`}
                style={{ borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 600 }}
                onClick={() => changeQuestionType(qIdx, "MULTIPLE_CHOICE")}
              >
                객관식
              </button>
              <button
                type="button"
                className={`btn btn-sm ${q.questionType === "SHORT_ANSWER" ? "btn-warning" : "btn-outline-secondary"}`}
                style={{ borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 600 }}
                onClick={() => changeQuestionType(qIdx, "SHORT_ANSWER")}
              >
                단답형
              </button>
            </div>

            {/* 문제 내용 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 6 }}>문제 *</label>
              <textarea
                className="form-control"
                style={{ borderRadius: 8 }}
                rows={3}
                placeholder="문제를 입력하세요"
                value={q.questionText}
                onChange={(e) => updateQuestion(qIdx, "questionText", e.target.value)}
              />
            </div>

            {q.questionType === "MULTIPLE_CHOICE" ? (
              // [woo] 객관식 선택지
              <div>
                <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 2 }}>선택지 *</label>
                <p style={{ fontSize: 12, color: "#6c757d", marginTop: 0, marginBottom: 10 }}>
                  라디오 버튼을 클릭하여 정답을 선택하세요.
                </p>
                {q.options.map((o, oIdx) => (
                  <div key={oIdx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={o.isCorrect}
                      onChange={() => setCorrectOption(qIdx, oIdx)}
                      className="form-check-input"
                      title="정답으로 선택"
                      style={{ marginTop: 0, flexShrink: 0 }}
                    />
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "#f1f3f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {oIdx + 1}
                    </span>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      style={{ borderRadius: 8 }}
                      placeholder={`선택지 ${oIdx + 1}`}
                      value={o.optionText}
                      onChange={(e) => updateOption(qIdx, oIdx, "optionText", e.target.value)}
                    />
                    {q.options.length > 2 && (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        style={{ borderRadius: 8, flexShrink: 0 }}
                        onClick={() => removeOption(qIdx, oIdx)}
                        title="선택지 삭제"
                      >
                        <iconify-icon icon="mdi:close" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="btn btn-sm btn-outline-primary"
                  style={{ borderRadius: 8, marginTop: 8, padding: "5px 12px", fontSize: 13, fontWeight: 600 }}
                  onClick={() => addOption(qIdx)}
                >
                  선택지 추가
                </button>
              </div>
            ) : (
              // [woo] 단답형 정답 입력
              <div>
                <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 0 }}>정답 *</label>
                <p style={{ fontSize: 12, color: "#6c757d", marginTop: 0, marginBottom: 4 }}>
                  대소문자 구분 없이 채점됩니다. 쉼표로 구분하면 복수 정답을 허용합니다.
                </p>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: 8 }}
                  placeholder="정답을 입력하세요 (복수 정답은 쉼표로 구분, 예: 르네상스,Renaissance)"
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(qIdx, "correctAnswer", e.target.value)}
                />
              </div>
            )}

            {/* [soojin] 해설 입력 */}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 4 }}>해설 (선택사항)</label>
              <textarea
                className="form-control"
                style={{ borderRadius: 8 }}
                rows={3}
                placeholder="문제 해설을 입력하세요"
                value={q.explanation}
                onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      {/* 문제 추가 버튼 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          className="btn btn-outline-primary"
          style={{ borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 600 }}
          onClick={() => addQuestion("MULTIPLE_CHOICE")}
        >
          문제 추가
        </button>
      </div>

      {/* 제출 버튼 */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 24 }}>
        <button
          type="button"
          style={{
            background: "#fff",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            padding: "5px 12px",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
          onClick={() => navigate("/homework?tab=quiz")}
        >
          취소
        </button>
        <button
          type="button"
          style={{
            background: "#25A194",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "5px 12px",
            fontWeight: 600,
            fontSize: 13,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={handleSubmit}
          disabled={saving}
        >
          <iconify-icon icon="mdi:clipboard-list-outline" />
          {saving ? "저장 중..." : "퀴즈 출제"}
        </button>
      </div>
    </DashboardLayout>
  );
}
