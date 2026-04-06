import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/shared/api/authApi";
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
  // [woo] 최대 점수
  maxScore: number;
  submissionCount: number;
  totalStudentCount: number;
  createDate: string;
  updateDate: string;
  submissions: Submission[] | null;
  mySubmission: Submission | null;
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  OPEN: { text: "진행중", cls: "bg-success-100 text-success-600" },
  CLOSED: { text: "마감", cls: "bg-danger-100 text-danger-600" },
  GRADED: { text: "채점완료", cls: "bg-primary-100 text-primary-600" },
};

const SUB_STATUS: Record<string, { text: string; cls: string }> = {
  SUBMITTED: { text: "제출", cls: "bg-success-100 text-success-600" },
  LATE: { text: "지각제출", cls: "bg-warning-100 text-warning-600" },
  GRADED: { text: "채점완료", cls: "bg-primary-100 text-primary-600" },
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

  // [woo] 토스트 알림
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; key: number } | null>(null);
  const [toastLeaving, setToastLeaving] = useState(false);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastLeaving(false);
    setToast({ message, type, key: Date.now() });
  };
  useEffect(() => {
    if (!toast) return;
    const fadeOut = setTimeout(() => setToastLeaving(true), 2400);
    const remove = setTimeout(() => setToast(null), 3000);
    return () => { clearTimeout(fadeOut); clearTimeout(remove); };
  }, [toast?.key]);

  // [woo] 학생 제출 폼
  const [submitContent, setSubmitContent] = useState("");
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // [woo] 학생 제출 수정 모드
  const [editingSubmission, setEditingSubmission] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

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
      .catch(() => showToast("과제를 불러올 수 없습니다.", "error"))
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

  // [woo] 학생 과제 제출
  const handleSubmit = async () => {
    if (!submitContent.trim() && !submitFile) {
      showToast("내용 또는 파일을 첨부해주세요.", "error");
      return;
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
      showToast("과제가 제출되었습니다.");
      fetchHomework();
    } catch (err: any) {
      showToast(err.response?.data || "제출에 실패했습니다.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // [woo] 학생 제출 수정
  const handleEditSubmit = async () => {
    if (!editContent.trim() && !editFile) {
      showToast("내용 또는 파일을 첨부해주세요.", "error");
      return;
    }
    setEditSubmitting(true);
    try {
      const formData = new FormData();
      const jsonBlob = new Blob([JSON.stringify({ content: editContent })], { type: "application/json" });
      formData.append("data", jsonBlob);
      if (editFile) formData.append("file", editFile);

      await api.put(`/homework/submission/${homework!.mySubmission!.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("제출물이 수정되었습니다.");
      setEditingSubmission(false);
      fetchHomework();
    } catch (err: any) {
      showToast(err.response?.data || "수정에 실패했습니다.", "error");
    } finally {
      setEditSubmitting(false);
    }
  };

  // [woo] 교사 채점
  const handleGrade = async (submissionId: number) => {
    setGrading(true);
    try {
      await api.post(`/homework/submission/${submissionId}/grade`, {
        score: gradeScore ? Number(gradeScore) : null,
        feedback: gradeFeedback || null,
      });
      showToast("채점이 완료되었습니다.");
      setGradeTarget(null);
      setGradeScore("");
      setGradeFeedback("");
      fetchHomework();
    } catch (err: any) {
      showToast(err.response?.data || "채점에 실패했습니다.", "error");
    } finally {
      setGrading(false);
    }
  };

  // [woo] 마감일 수정
  const handleUpdateDueDate = async () => {
    if (!newDueDate) { showToast("마감일을 선택해주세요.", "error"); return; }
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
      showToast("마감일이 수정되었습니다.");
      setEditingDueDate(false);
      fetchHomework();
    } catch (err: any) {
      showToast(err.response?.data || "마감일 수정에 실패했습니다.", "error");
    }
  };

  // [woo] 과제 삭제
  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/homework/${id}`);
      showToast("삭제되었습니다.");
      navigate("/homework");
    } catch {
      showToast("삭제에 실패했습니다.", "error");
    }
  };

  // [woo] 과제 상태 변경 (OPEN / CLOSED / GRADED)
  const handleStatusChange = async (newStatus: string) => {
    const labels: Record<string, string> = { OPEN: "진행중", CLOSED: "마감", GRADED: "채점완료" };
    if (!confirm(`과제 상태를 "${labels[newStatus]}"(으)로 변경하시겠습니까?`)) return;
    try {
      await api.post(`/homework/${id}/status?status=${newStatus}`);
      fetchHomework();
    } catch {
      showToast("상태 변경에 실패했습니다.", "error");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-40 text-secondary-light">불러오는 중...</div>
      </DashboardLayout>
    );
  }

  if (!homework) {
    return (
      <DashboardLayout>
        <div className="text-center py-40 text-secondary-light">과제를 찾을 수 없습니다.</div>
      </DashboardLayout>
    );
  }

  const st = STATUS_LABEL[homework.status] ?? STATUS_LABEL.OPEN;
  const isOverdue = new Date(homework.dueDate) < new Date();

  return (
    <DashboardLayout>
      {/* [woo] 토스트 알림 */}
      <style>{`
        @keyframes _toast-in  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes _toast-out { from { opacity:1; transform:translateY(0); }   to { opacity:0; transform:translateY(8px); } }
        ._hw-toast-enter { animation: _toast-in  0.28s cubic-bezier(.22,1,.36,1) forwards; }
        ._hw-toast-leave { animation: _toast-out 0.35s ease forwards; }
      `}</style>
      {toast && (
        <div
          className={toastLeaving ? "_hw-toast-leave" : "_hw-toast-enter"}
          style={{
            position: "fixed",
            bottom: 36,
            right: 32,
            zIndex: 9999,
            minWidth: 240,
            maxWidth: 360,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px",
            borderRadius: 12,
            boxShadow: "0 8px 28px rgba(0,0,0,0.13)",
            backgroundColor: toast.type === "success" ? "#f0fdf4" : "#fff5f5",
            borderLeft: `4px solid ${toast.type === "success" ? "#22c55e" : "#ef4444"}`,
          }}
        >
          <iconify-icon
            icon={toast.type === "success" ? "mdi:check-circle-outline" : "mdi:alert-circle-outline"}
            style={{ fontSize: 22, color: toast.type === "success" ? "#22c55e" : "#ef4444", flexShrink: 0 }}
          />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{toast.message}</span>
        </div>
      )}
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">과제</h6>
          <p className="text-neutral-600 mt-4 mb-0">과제 상세</p>
        </div>
      </div>

      {/* 과제 내용 카드 */}
      <div className="card radius-12 mb-24">
        <div className="card-header d-flex justify-content-between align-items-center py-16 px-24 border-bottom">
          <div>
            <h6 className="mb-4">{homework.title}</h6>
            <div className="d-flex align-items-center gap-12 text-sm text-secondary-light">
              <span>{homework.teacherName}</span>
              <span>|</span>
              <span>{homework.classroomName}</span>
              <span>|</span>
              <span>{homework.createDate?.slice(0, 10)}</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-8">
            <span className={`badge ${st.cls}`}>{st.text}</span>
            {/* [woo] 교사: 마감일 클릭 시 수정 가능 */}
            {isTeacher && editingDueDate ? (
              <div className="d-flex align-items-center gap-4">
                <input
                  type="date"
                  className="form-control form-control-sm radius-8"
                  style={{ width: 150 }}
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
                <button className="btn btn-sm btn-primary-600 radius-8" onClick={handleUpdateDueDate}>
                  저장
                </button>
                <button
                  className="btn btn-sm btn-outline-neutral-300 radius-8"
                  onClick={() => setEditingDueDate(false)}
                >
                  취소
                </button>
              </div>
            ) : (
              <span
                className={`text-sm ${isOverdue ? "text-danger-600" : "text-secondary-light"} ${isTeacher ? "cursor-pointer" : ""}`}
                style={isTeacher ? { cursor: "pointer" } : undefined}
                onClick={() => {
                  if (isTeacher) {
                    setNewDueDate(homework.dueDate?.slice(0, 10) ?? "");
                    setEditingDueDate(true);
                  }
                }}
                title={isTeacher ? "클릭하여 마감일 수정" : undefined}
              >
                마감: {homework.dueDate?.slice(0, 10)}
                {isTeacher && <iconify-icon icon="mdi:pencil" className="ms-4 text-xs" />}
              </span>
            )}
          </div>
        </div>
        <div className="card-body p-24">
          {/* 과제 본문 */}
          <div className="mb-20" style={{ whiteSpace: "pre-wrap", minHeight: 100 }}>
            {homework.content}
          </div>

          {/* [woo] 교사 첨부파일 (예시/참고 자료) */}
          {homework.attachmentUrl && (
            <div className="p-16 bg-neutral-50 radius-8 mb-20">
              <span className="fw-semibold text-sm d-block mb-8">첨부파일</span>
              <a
                href={`/uploads/homework/${homework.attachmentUrl}`}
                download={homework.attachmentOriginalName ?? homework.attachmentUrl}
                className="text-primary-600 hover-text-primary-700 d-flex align-items-center gap-4"
              >
                <iconify-icon icon="mdi:attachment" />
                {homework.attachmentOriginalName ?? homework.attachmentUrl}
              </a>
            </div>
          )}

          {/* 제출 현황 요약 */}
          <div className="d-flex align-items-center gap-16 text-sm">
            <span className="text-secondary-light">
              제출: <strong>{homework.submissionCount}</strong> / {homework.totalStudentCount}명
            </span>
          </div>

          {/* [woo] 교사 전용: 상태 변경 + 삭제 버튼 */}
          {isTeacher && (
            <div className="d-flex align-items-center gap-8 mt-20">
              <span className="text-sm fw-semibold me-4">상태 변경:</span>
              {(
                [
                  {
                    value: "OPEN",
                    label: "진행중",
                    activeBtn: "btn-success-600",
                    outlineBtn: "btn-outline-success-600",
                  },
                  { value: "CLOSED", label: "마감", activeBtn: "btn-danger-600", outlineBtn: "btn-outline-danger-600" },
                  {
                    value: "GRADED",
                    label: "채점완료",
                    activeBtn: "btn-primary-600",
                    outlineBtn: "btn-outline-primary-600",
                  },
                ] as const
              ).map((s) => {
                const isActive = homework.status === s.value;
                return (
                  <button
                    key={s.value}
                    className={`btn btn-sm radius-8 ${isActive ? s.activeBtn : s.outlineBtn}`}
                    disabled={isActive}
                    onClick={() => handleStatusChange(s.value)}
                  >
                    {s.label}
                  </button>
                );
              })}
              {/* [woo] 과제 수정/삭제 버튼 */}
              <div className="ms-auto d-flex gap-8">
                <button
                  className="btn btn-outline-primary-600 btn-sm radius-8"
                  onClick={() => navigate(`/homework/${id}/edit`)}
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
      </div>

      {/* ========== [woo] 교사 전용: 제출 현황 목록 ========== */}
      {isTeacher && homework.submissions && (
        <div className="card radius-12 mb-24">
          <div className="card-header py-16 px-24 border-bottom">
            <h6 className="mb-0">
              제출 현황 ({homework.submissions.length}/{homework.totalStudentCount})
            </h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table bordered-table mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>번호</th>
                    <th>학생명</th>
                    <th style={{ width: 120 }}>제출일</th>
                    <th style={{ width: 80 }}>상태</th>
                    <th style={{ width: 80 }}>점수</th>
                    <th style={{ width: 100 }}>첨부</th>
                    <th style={{ width: 100 }}>채점</th>
                  </tr>
                </thead>
                <tbody>
                  {homework.submissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-24 text-secondary-light">
                        제출한 학생이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    homework.submissions.map((sub) => {
                      const subSt = SUB_STATUS[sub.status] ?? SUB_STATUS.SUBMITTED;
                      return (
                        <tr key={sub.id}>
                          <td>{sub.studentNumber}</td>
                          <td>{sub.studentName}</td>
                          <td className="text-secondary-light">{sub.submittedAt?.slice(0, 10)}</td>
                          <td>
                            <span className={`badge ${subSt.cls}`}>{subSt.text}</span>
                          </td>
                          <td>{sub.score !== null ? `${sub.score}/${homework.maxScore ?? 100}` : "-"}</td>
                          <td>
                            {sub.attachmentUrl ? (
                              <a
                                href={`/uploads/homework/${sub.attachmentUrl}`}
                                download={sub.attachmentOriginalName ?? sub.attachmentUrl}
                                className="text-primary-600"
                              >
                                <iconify-icon icon="mdi:download" />
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>
                            {sub.status !== "GRADED" ? (
                              <button
                                className="btn btn-sm btn-primary-600 radius-8"
                                onClick={() => {
                                  setGradeTarget(sub.id);
                                  setGradeScore(sub.score?.toString() ?? "");
                                  setGradeFeedback(sub.feedback ?? "");
                                }}
                              >
                                채점
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn-outline-primary-600 radius-8"
                                onClick={() => {
                                  setGradeTarget(sub.id);
                                  setGradeScore(sub.score?.toString() ?? "");
                                  setGradeFeedback(sub.feedback ?? "");
                                }}
                              >
                                수정
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* [woo] 채점 모달 */}
      {gradeTarget !== null && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">채점</h6>
                <button type="button" className="btn-close" onClick={() => setGradeTarget(null)} />
              </div>
              <div className="modal-body p-24">
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">
                    점수 <span className="text-secondary-light fw-normal">(최대 {homework?.maxScore ?? 100}점)</span>
                  </label>
                  <input
                    type="number"
                    className="form-control radius-8"
                    placeholder={`0 ~ ${homework?.maxScore ?? 100}`}
                    max={homework?.maxScore ?? 100}
                    min={0}
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value)}
                  />
                </div>
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">피드백</label>
                  <textarea
                    className="form-control radius-8"
                    rows={4}
                    placeholder="피드백을 입력하세요"
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24 gap-8">
                <button className="btn btn-outline-neutral-300 radius-8" onClick={() => setGradeTarget(null)}>
                  취소
                </button>
                <button
                  className="btn btn-primary-600 radius-8"
                  onClick={() => handleGrade(gradeTarget)}
                  disabled={grading}
                >
                  {grading ? "저장 중..." : "채점 완료"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== [woo] 학생 전용: 제출 영역 ========== */}
      {isStudent && (
        <div className="card radius-12">
          <div className="card-header py-16 px-24 border-bottom">
            <h6 className="mb-0">{homework.mySubmission ? "나의 제출" : "과제 제출"}</h6>
          </div>
          <div className="card-body p-24">
            {homework.mySubmission ? (
              // [woo] 이미 제출한 경우 - 제출 내용 + 채점 결과 표시
              <div>
                {editingSubmission ? (
                  // [woo] 수정 폼
                  <div>
                    <div className="mb-16">
                      <label className="form-label fw-semibold text-sm">제출 내용 수정</label>
                      <textarea
                        className="form-control radius-8"
                        rows={6}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                    </div>
                    <div className="mb-20">
                      <label className="form-label fw-semibold text-sm">
                        첨부파일 교체 <span className="text-secondary-light fw-normal">(선택, 비우면 기존 파일 유지)</span>
                      </label>
                      <input
                        type="file"
                        className="form-control radius-8"
                        onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <div className="d-flex justify-content-end gap-8">
                      <button
                        className="btn btn-outline-neutral-300 radius-8"
                        onClick={() => setEditingSubmission(false)}
                      >
                        취소
                      </button>
                      <button
                        className="btn btn-primary-600 radius-8"
                        onClick={handleEditSubmit}
                        disabled={editSubmitting}
                      >
                        {editSubmitting ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                ) : (
                  // [woo] 제출 내용 보기
                  <>
                    <div className="mb-16">
                      <span className="fw-semibold text-sm d-block mb-8">제출 내용</span>
                      <div className="p-16 bg-neutral-50 radius-8" style={{ whiteSpace: "pre-wrap" }}>
                        {homework.mySubmission.content || "(내용 없음)"}
                      </div>
                    </div>
                    {homework.mySubmission.attachmentUrl && (
                      <div className="mb-16">
                        <span className="fw-semibold text-sm d-block mb-8">첨부파일</span>
                        <a
                          href={`/uploads/homework/${homework.mySubmission.attachmentUrl}`}
                          download={homework.mySubmission.attachmentOriginalName}
                          className="text-primary-600"
                        >
                          <iconify-icon icon="mdi:attachment" className="me-4" />
                          {homework.mySubmission.attachmentOriginalName}
                        </a>
                      </div>
                    )}
                    <div className="d-flex align-items-center gap-16 text-sm">
                      <span>제출일: {homework.mySubmission.submittedAt?.slice(0, 10)}</span>
                      <span>
                        상태:{" "}
                        <span className={`badge ${(SUB_STATUS[homework.mySubmission.status] ?? SUB_STATUS.SUBMITTED).cls}`}>
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
                      {/* [woo] 마감 전 + 미채점인 경우에만 수정 버튼 표시 */}
                      {homework.status !== "CLOSED" && !isOverdue && homework.mySubmission.status !== "GRADED" && (
                        <button
                          className="btn btn-sm btn-outline-primary-600 radius-8 ms-auto"
                          onClick={() => {
                            setEditContent(homework.mySubmission!.content ?? "");
                            setEditFile(null);
                            setEditingSubmission(true);
                          }}
                        >
                          수정
                        </button>
                      )}
                    </div>
                    {homework.mySubmission.feedback && (
                      <div className="mt-16 p-16 bg-primary-50 radius-8">
                        <span className="fw-semibold text-sm d-block mb-4">교사 피드백</span>
                        <div style={{ whiteSpace: "pre-wrap" }}>{homework.mySubmission.feedback}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : homework.status === "CLOSED" ? (
              // [woo] 마감된 과제
              <div className="text-center py-24 text-danger-600">마감된 과제입니다. 제출할 수 없습니다.</div>
            ) : (
              // [woo] 제출 폼
              <div>
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">제출 내용</label>
                  <textarea
                    className="form-control radius-8"
                    rows={6}
                    placeholder="과제 내용을 작성하세요"
                    value={submitContent}
                    onChange={(e) => setSubmitContent(e.target.value)}
                  />
                </div>
                <div className="mb-20">
                  <label className="form-label fw-semibold text-sm">첨부파일</label>
                  <input
                    type="file"
                    className="form-control radius-8"
                    onChange={(e) => setSubmitFile(e.target.files?.[0] ?? null)}
                  />
                  {submitFile && (
                    <div className="mt-8 text-sm text-secondary-light">
                      <iconify-icon icon="mdi:attachment" className="me-4" />
                      {submitFile.name} ({(submitFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
                <div className="d-flex justify-content-end">
                  <button className="btn btn-primary-600 radius-8" onClick={handleSubmit} disabled={submitting}>
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
