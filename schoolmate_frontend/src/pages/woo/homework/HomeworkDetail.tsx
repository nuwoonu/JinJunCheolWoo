import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/auth";
import { useAuth } from "../../../contexts/AuthContext";
import DashboardLayout from "../../../components/layout/DashboardLayout";

// [woo] 과제 상세 페이지
// - 교사: 과제 내용 + 제출 현황 목록 + 채점
// - 학생: 과제 내용 + 제출하기 (파일 첨부 가능)

interface Submission {
  id: number;
  studentInfoId: number;
  studentName: string;
  studentNumber: string;
  content: string;
  attachmentUrl: string | null;
  attachmentOriginalName: string | null;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
  status: "SUBMITTED" | "LATE" | "GRADED";
}

// [soojin] 학급 전체 학생 제출 현황 타입
interface StudentWithSubmission {
  studentInfoId: number;
  studentName: string;
  studentNumber: string;
  submitted: boolean;
  submission: Submission | null;
}

interface HomeworkDetail {
  id: number;
  title: string;
  content: string;
  teacherName: string;
  teacherUserId: number;
  classroomName: string;
  classroomId: number;
  status: "OPEN" | "CLOSED" | "GRADED";
  dueDate: string;
  attachmentUrl: string | null;
  attachmentOriginalName: string | null;
  maxScore: number;
  submissionCount: number;
  totalStudentCount: number;
  createDate: string;
  updateDate: string;
  submissions: Submission[] | null;
  mySubmission: Submission | null;
  // [soojin] 학급 전체 학생 목록 (교사용)
  allStudents: StudentWithSubmission[] | null;
}

const STATUS_LABEL: Record<string, { text: string; bg: string; color: string }> = {
  OPEN: { text: "진행중", bg: "var(--success-100)", color: "var(--success-600)" },
  CLOSED: { text: "마감", bg: "var(--danger-100)", color: "var(--danger-600)" },
  GRADED: { text: "채점완료", bg: "var(--primary-100)", color: "var(--primary-600)" },
};

const SUB_STATUS: Record<string, { text: string; bg: string; color: string }> = {
  SUBMITTED: { text: "제출", bg: "var(--success-100)", color: "var(--success-600)" },
  LATE: { text: "지각제출", bg: "var(--warning-100)", color: "var(--warning-600)" },
  GRADED: { text: "채점완료", bg: "var(--primary-100)", color: "var(--primary-600)" },
};

export default function HomeworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? "";
  const isTeacher = role === "TEACHER" || role === "ADMIN";
  const isStudent = role === "STUDENT";

  const [homework, setHomework] = useState<HomeworkDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // [woo] 학생 제출 폼
  const [submitContent, setSubmitContent] = useState("");
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // [woo] 교사 채점 폼
  const [gradeTarget, setGradeTarget] = useState<number | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [grading, setGrading] = useState(false);

  // [woo] 교사 마감일 수정
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [newDueDate, setNewDueDate] = useState("");

  const fetchHomework = () => {
    setLoading(true);
    api
      .get(`/homework/${id}`)
      .then((res) => setHomework(res.data))
      .catch(() => alert("과제를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHomework();
  }, [id]);

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = gradeTarget !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [gradeTarget]);

  const handleSubmit = async () => {
    if (!submitContent.trim() && !submitFile) {
      return alert("내용 또는 파일을 첨부해주세요.");
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      const jsonBlob = new Blob([JSON.stringify({ content: submitContent })], { type: "application/json" });
      formData.append("data", jsonBlob);
      if (submitFile) formData.append("file", submitFile);

      await api.post(`/homework/${id}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("과제가 제출되었습니다.");
      fetchHomework();
    } catch (err: any) {
      alert(err.response?.data || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async (submissionId: number) => {
    setGrading(true);
    try {
      await api.post(`/homework/submission/${submissionId}/grade`, {
        score: gradeScore ? Number(gradeScore) : null,
        feedback: gradeFeedback || null,
      });
      alert("채점이 완료되었습니다.");
      setGradeTarget(null);
      setGradeScore("");
      setGradeFeedback("");
      fetchHomework();
    } catch (err: any) {
      alert(err.response?.data || "채점에 실패했습니다.");
    } finally {
      setGrading(false);
    }
  };

  const handleUpdateDueDate = async () => {
    if (!newDueDate) return alert("마감일을 선택해주세요.");
    try {
      const formData = new FormData();
      const jsonBlob = new Blob(
        [
          JSON.stringify({
            title: homework!.title,
            content: homework!.content,
            classroomId: homework!.classroomId,
            dueDate: newDueDate + "T23:59:59",
            maxScore: homework!.maxScore,
          }),
        ],
        { type: "application/json" },
      );
      formData.append("data", jsonBlob);

      await api.put(`/homework/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("마감일이 수정되었습니다.");
      setEditingDueDate(false);
      fetchHomework();
    } catch (err: any) {
      alert(err.response?.data || "마감일 수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/homework/${id}`);
      alert("삭제되었습니다.");
      navigate("/homework");
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const labels: Record<string, string> = { OPEN: "진행중", CLOSED: "마감", GRADED: "채점완료" };
    if (!confirm(`과제 상태를 "${labels[newStatus]}"(으)로 변경하시겠습니까?`)) return;
    try {
      await api.post(`/homework/${id}/status?status=${newStatus}`);
      fetchHomework();
    } catch {
      alert("상태 변경에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-secondary-light)" }}>
          불러오는 중...
        </div>
      </DashboardLayout>
    );
  }

  if (!homework) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-secondary-light)" }}>
          과제를 찾을 수 없습니다.
        </div>
      </DashboardLayout>
    );
  }

  const st = STATUS_LABEL[homework.status] ?? STATUS_LABEL.OPEN;
  const isOverdue = new Date(homework.dueDate) < new Date();
  const allStudents = homework.allStudents ?? [];
  const submittedCount = allStudents.filter((s) => s.submitted).length;

  // ========== 목록으로 버튼 (공통) ==========
  const BackButton = () => (
    <button
      onClick={() => navigate("/homework")}
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
      ← 과제 목록으로
    </button>
  );

  return (
    <DashboardLayout>
      <BackButton />

      {/* ── 과제 정보 카드 ── */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "0.75rem",
          border: "1px solid var(--neutral-200)",
          marginBottom: "1.5rem",
          overflow: "hidden",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--neutral-200)",
          }}
        >
          <div style={{ flexGrow: 1, marginRight: "1rem" }}>
            <h6 style={{ marginBottom: "0.375rem" }}>{homework.title}</h6>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text-secondary-light)" }}>
              <span>{homework.teacherName}</span>
              <span>|</span>
              <span>{homework.classroomName}</span>
              <span>|</span>
              <span>{homework.createDate?.slice(0, 10)}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexShrink: 0 }}>
            <span
              style={{
                padding: "0.2rem 0.625rem",
                borderRadius: "0.375rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                backgroundColor: st.bg,
                color: st.color,
              }}
            >
              {st.text}
            </span>
            {/* 마감일 */}
            {isTeacher && editingDueDate ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <input
                  type="date"
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--neutral-300)",
                    fontSize: "0.875rem",
                    width: 150,
                  }}
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
                <button
                  style={{
                    padding: "0.25rem 0.625rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    backgroundColor: "var(--primary-600)",
                    color: "#fff",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                  }}
                  onClick={handleUpdateDueDate}
                >
                  저장
                </button>
                <button
                  style={{
                    padding: "0.25rem 0.625rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--neutral-300)",
                    background: "none",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    color: "var(--neutral-600)",
                  }}
                  onClick={() => setEditingDueDate(false)}
                >
                  취소
                </button>
              </div>
            ) : (
              <span
                style={{
                  fontSize: "0.875rem",
                  color: isOverdue ? "var(--danger-600)" : "var(--text-secondary-light)",
                  cursor: isTeacher ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
                onClick={() => {
                  if (isTeacher) {
                    setNewDueDate(homework.dueDate?.slice(0, 10) ?? "");
                    setEditingDueDate(true);
                  }
                }}
                title={isTeacher ? "클릭하여 마감일 수정" : undefined}
              >
                {isOverdue ? "기한 지남" : `마감: ${homework.dueDate?.slice(0, 10)}`}
                {isTeacher && <iconify-icon icon="mdi:pencil" style={{ fontSize: "0.875rem" }} />}
              </span>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div style={{ padding: "1.5rem" }}>
          <div style={{ whiteSpace: "pre-wrap", minHeight: 80, color: "var(--neutral-800)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
            {homework.content}
          </div>

          {/* 교사 첨부파일 */}
          {homework.attachmentUrl && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--neutral-50)",
                borderRadius: "0.5rem",
                marginBottom: "1.25rem",
                border: "1px solid var(--neutral-200)",
              }}
            >
              <span style={{ fontSize: "0.875rem", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>첨부파일</span>
              <a
                href={homework.attachmentUrl}
                download={homework.attachmentOriginalName ?? homework.attachmentUrl}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  color: "var(--primary-600)",
                  fontSize: "0.875rem",
                  textDecoration: "none",
                }}
              >
                <iconify-icon icon="mdi:attachment" />
                {homework.attachmentOriginalName ?? homework.attachmentUrl}
              </a>
            </div>
          )}

          {/* 교사 전용: 상태 변경 + 수정/삭제 */}
          {isTeacher && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "1rem", borderTop: "1px solid var(--neutral-100)" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, marginRight: "0.25rem" }}>상태 변경:</span>
              {(
                [
                  { value: "OPEN", label: "진행중", color: "var(--success-600)" },
                  { value: "CLOSED", label: "마감", color: "var(--danger-600)" },
                  { value: "GRADED", label: "채점완료", color: "var(--primary-600)" },
                ] as const
              ).map((s) => {
                const isActive = homework.status === s.value;
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
                      border: `1px solid ${s.color}`,
                      backgroundColor: isActive ? s.color : "transparent",
                      color: isActive ? "#fff" : s.color,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
              <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                <button
                  style={{
                    padding: "0.3rem 0.875rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--primary-600)",
                    background: "none",
                    color: "var(--primary-600)",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/homework/${id}/edit`)}
                >
                  수정
                </button>
                <button
                  style={{
                    padding: "0.3rem 0.875rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--danger-600)",
                    background: "none",
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
          )}
        </div>
      </div>

      {/* ── 교사 전용: 제출 통계 + 학생 목록 ── */}
      {isTeacher && (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "0.75rem",
            border: "1px solid var(--neutral-200)",
            marginBottom: "1.5rem",
            overflow: "hidden",
          }}
        >
          {/* 제출 통계 */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--neutral-200)" }}>
            <h6 style={{ fontWeight: 600, marginBottom: "1rem" }}>제출 현황</h6>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{ flex: 1 }}>
                <div style={{ padding: "1rem", borderRadius: "0.5rem", backgroundColor: "var(--success-50)", textAlign: "center" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: "0.375rem" }}>제출</p>
                  <p style={{ fontWeight: 700, color: "var(--success-600)", fontSize: "1rem", marginBottom: 0 }}>{submittedCount}명</p>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ padding: "1rem", borderRadius: "0.5rem", backgroundColor: "var(--danger-50)", textAlign: "center" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: "0.375rem" }}>미제출</p>
                  <p style={{ fontWeight: 700, color: "var(--danger-600)", fontSize: "1rem", marginBottom: 0 }}>
                    {allStudents.length - submittedCount}명
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 학생 목록 */}
          <div style={{ padding: "1.25rem 1.5rem" }}>
            <h6 style={{ fontWeight: 600, marginBottom: "0.75rem" }}>학생별 제출 결과</h6>
            {allStudents.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-secondary-light)", padding: "1.5rem 0", marginBottom: 0 }}>
                학생 정보가 없습니다.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {allStudents.map((s) => {
                  const sub = s.submission;
                  const subSt = sub ? (SUB_STATUS[sub.status] ?? SUB_STATUS.SUBMITTED) : null;
                  return (
                    <div
                      key={s.studentInfoId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0.875rem 1rem",
                        borderRadius: "0.75rem",
                        border: "1px solid var(--neutral-200)",
                        gap: "0.75rem",
                      }}
                    >
                      {/* 아바타 */}
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

                      {/* 학생 정보 */}
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.125rem" }}>
                          <span style={{ fontWeight: 600, color: "var(--neutral-700)" }}>{s.studentName}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)" }}>{s.studentNumber}</span>
                        </div>
                        {sub && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)" }}>
                            {sub.submittedAt?.slice(0, 16).replace("T", " ")}
                          </div>
                        )}
                      </div>

                      {/* 점수 */}
                      <div style={{ textAlign: "right", marginRight: "0.5rem" }}>
                        {sub && sub.score !== null ? (
                          <>
                            <p style={{ fontWeight: 700, color: "var(--primary-600)", fontSize: "1.125rem", marginBottom: 0 }}>
                              {sub.score}점
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary-light)", marginBottom: 0 }}>
                              {homework.maxScore ?? 100}점 만점
                            </p>
                          </>
                        ) : (
                          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary-light)" }}>-</span>
                        )}
                      </div>

                      {/* 상태 badge 또는 채점 버튼 */}
                      {s.submitted && sub ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                          <span
                            style={{
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.375rem",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              backgroundColor: subSt?.bg,
                              color: subSt?.color,
                            }}
                          >
                            {subSt?.text}
                          </span>
                          {/* 첨부파일 */}
                          {sub.attachmentUrl && (
                            <a
                              href={sub.attachmentUrl}
                              download={sub.attachmentOriginalName ?? sub.attachmentUrl}
                              style={{ color: "var(--primary-600)", display: "flex", alignItems: "center" }}
                            >
                              <iconify-icon icon="mdi:download" style={{ fontSize: "1.125rem" }} />
                            </a>
                          )}
                          <button
                            style={{
                              padding: "0.3rem 0.75rem",
                              borderRadius: "0.5rem",
                              border: sub.status === "GRADED" ? "1px solid var(--primary-600)" : "none",
                              backgroundColor: sub.status === "GRADED" ? "transparent" : "var(--primary-600)",
                              color: sub.status === "GRADED" ? "var(--primary-600)" : "#fff",
                              fontSize: "0.8125rem",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setGradeTarget(sub.id);
                              setGradeScore(sub.score?.toString() ?? "");
                              setGradeFeedback(sub.feedback ?? "");
                            }}
                          >
                            {sub.status === "GRADED" ? "수정" : "채점"}
                          </button>
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
                          미제출
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 채점 모달 ── */}
      {gradeTarget !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "0.75rem",
              width: "100%",
              maxWidth: 480,
              margin: "1rem",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--neutral-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h6 style={{ margin: 0 }}>채점</h6>
              <button
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "var(--neutral-500)", lineHeight: 1 }}
                onClick={() => setGradeTarget(null)}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  점수{" "}
                  <span style={{ fontWeight: 400, color: "var(--text-secondary-light)" }}>
                    (최대 {homework?.maxScore ?? 100}점)
                  </span>
                </label>
                <input
                  type="number"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--neutral-300)",
                    fontSize: "0.875rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  placeholder={`0 ~ ${homework?.maxScore ?? 100}`}
                  max={homework?.maxScore ?? 100}
                  min={0}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem" }}>피드백</label>
                <textarea
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--neutral-300)",
                    fontSize: "0.875rem",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                  rows={4}
                  placeholder="피드백을 입력하세요"
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                />
              </div>
            </div>
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--neutral-200)", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--neutral-300)",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  color: "var(--neutral-600)",
                }}
                onClick={() => setGradeTarget(null)}
              >
                취소
              </button>
              <button
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  backgroundColor: "var(--primary-600)",
                  color: "#fff",
                  cursor: grading ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  opacity: grading ? 0.7 : 1,
                }}
                onClick={() => handleGrade(gradeTarget)}
                disabled={grading}
              >
                {grading ? "저장 중..." : "채점 완료"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 학생 전용: 제출 영역 ── */}
      {isStudent && (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "0.75rem",
            border: "1px solid var(--neutral-200)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--neutral-200)" }}>
            <h6 style={{ margin: 0 }}>{homework.mySubmission ? "나의 제출" : "과제 제출"}</h6>
          </div>
          <div style={{ padding: "1.5rem" }}>
            {homework.mySubmission ? (
              // 이미 제출한 경우
              <div>
                <div style={{ marginBottom: "1rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem", display: "block", marginBottom: "0.5rem" }}>제출 내용</span>
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor: "var(--neutral-50)",
                      borderRadius: "0.5rem",
                      whiteSpace: "pre-wrap",
                      border: "1px solid var(--neutral-200)",
                      fontSize: "0.875rem",
                      color: "var(--neutral-800)",
                    }}
                  >
                    {homework.mySubmission.content || "(내용 없음)"}
                  </div>
                </div>

                {homework.mySubmission.attachmentUrl && (
                  <div style={{ marginBottom: "1rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", display: "block", marginBottom: "0.5rem" }}>첨부파일</span>
                    <a
                      href={homework.mySubmission.attachmentUrl}
                      download={homework.mySubmission.attachmentOriginalName}
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "var(--primary-600)", fontSize: "0.875rem" }}
                    >
                      <iconify-icon icon="mdi:attachment" />
                      {homework.mySubmission.attachmentOriginalName}
                    </a>
                  </div>
                )}

                <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", flexWrap: "wrap" }}>
                  <span style={{ color: "var(--text-secondary-light)" }}>
                    제출일: {homework.mySubmission.submittedAt?.slice(0, 10)}
                  </span>
                  <span>
                    상태:{" "}
                    <span
                      style={{
                        padding: "0.15rem 0.4rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: (SUB_STATUS[homework.mySubmission.status] ?? SUB_STATUS.SUBMITTED).bg,
                        color: (SUB_STATUS[homework.mySubmission.status] ?? SUB_STATUS.SUBMITTED).color,
                      }}
                    >
                      {(SUB_STATUS[homework.mySubmission.status] ?? SUB_STATUS.SUBMITTED).text}
                    </span>
                  </span>
                  {homework.mySubmission.score !== null && (
                    <span>
                      점수:{" "}
                      <strong>
                        {homework.mySubmission.score}/{homework.maxScore ?? 100}
                      </strong>
                    </span>
                  )}
                </div>

                {homework.mySubmission.feedback && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "1rem",
                      backgroundColor: "var(--primary-50)",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--primary-100)",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>교사 피드백</span>
                    <div style={{ whiteSpace: "pre-wrap", fontSize: "0.875rem", color: "var(--neutral-800)" }}>
                      {homework.mySubmission.feedback}
                    </div>
                  </div>
                )}
              </div>
            ) : homework.status === "CLOSED" ? (
              <div
                style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--danger-600)", fontSize: "0.9375rem" }}
              >
                마감된 과제입니다. 제출할 수 없습니다.
              </div>
            ) : (
              // 제출 폼
              <div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem" }}>제출 내용</label>
                  <textarea
                    style={{
                      width: "100%",
                      padding: "0.75rem 0.875rem",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--neutral-300)",
                      fontSize: "0.875rem",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                    rows={6}
                    placeholder="과제 내용을 작성하세요"
                    value={submitContent}
                    onChange={(e) => setSubmitContent(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem" }}>첨부파일</label>
                  <input
                    type="file"
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--neutral-300)",
                      fontSize: "0.875rem",
                      boxSizing: "border-box",
                    }}
                    onChange={(e) => setSubmitFile(e.target.files?.[0] ?? null)}
                  />
                  {submitFile && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary-light)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <iconify-icon icon="mdi:attachment" />
                      {submitFile.name} ({(submitFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    style={{
                      padding: "0.625rem 1.5rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      backgroundColor: "var(--primary-600)",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.7 : 1,
                    }}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "제출 중..." : "제출하기"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
