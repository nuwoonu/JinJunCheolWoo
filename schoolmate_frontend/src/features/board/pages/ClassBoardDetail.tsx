import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ReactQuill, QUILL_MODULES, QUILL_FORMATS, isQuillEmpty } from "@/shared/types/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import api from "@/shared/api/authApi";
import { useAuth } from "@/shared/contexts/AuthContext";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [soojin] /board/class-board/:id - 학급 게시판 상세 (좋아요/북마크/댓글/태그/첨부파일 UI 포함)

interface Attachment {
  id: number;
  originalName: string;
  storedName: string;
  fileSize: number;
  fileType: string;
}

interface Board {
  id: number;
  title: string;
  content: string;
  writerName: string;
  writerId: number;
  writerRole: string;
  viewCount: number;
  createDate: string;
  targetClassroomName?: string;
  tag?: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  attachmentUrl?: string;
  attachments?: Attachment[];
}

interface Comment {
  id: number;
  writerId: number;
  writerName: string;
  writerRole: string;
  content: string;
  isDeleted: boolean;
  createDate: string;
  replies: Comment[];
}

// [soojin] 역할 → 배지 레이블/색상 매핑
function roleBadge(role: string): { label: string; color: string } {
  switch (role) {
    case "ADMIN":   return { label: "관리자", color: "bg-purple-100 text-purple-700" };
    case "TEACHER": return { label: "교사",   color: "bg-blue-100 text-blue-700" };
    case "STAFF":   return { label: "교직원", color: "bg-cyan-100 text-cyan-700" };
    case "PARENT":  return { label: "학부모", color: "bg-orange-100 text-orange-700" };
    default:        return { label: "학생",   color: "bg-success-100 text-success-600" };
  }
}

// [soojin] 파일 크기를 "245KB" 형태로 포맷
function formatFileSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// [soojin] 작성자 이니셜 아바타
function AvatarIcon({ name }: { name: string }) {
  return (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
      style={{ width: 36, height: 36, fontSize: 14, background: "#6366f1" }}
    >
      {name ? name.charAt(0) : "?"}
    </div>
  );
}

export default function ClassBoardDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "", tag: "" });
  const [saving, setSaving] = useState(false);

  // [soojin] 댓글 상태
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; writerName: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";
  const isWriter = board?.writerId === user?.uid;
  const viewedRef = useRef(false);

  // [soojin] 게시글 + 댓글 초기 로딩
  useEffect(() => {
    if (!id) return;
    api
      .get(`/board/${id}`)
      .then((res) => {
        setBoard(res.data);
        setEditForm({ title: res.data.title, content: res.data.content, tag: res.data.tag || "" });
        if (!viewedRef.current) {
          viewedRef.current = true;
          api.post(`/board/${id}/view`).catch(() => {});
        }
      })
      .catch(() => navigate("/board/class-board"))
      .finally(() => setLoading(false));

    api.get(`/board/${id}/comments`).then((res) => setComments(res.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    document.body.style.overflow = showEditModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showEditModal]);

  // [soojin] 좋아요 토글 — 낙관적 UI 업데이트 후 서버 응답으로 보정
  const handleLike = async () => {
    if (!board) return;
    const prev = { likeCount: board.likeCount, isLiked: board.isLiked };
    setBoard((b) => b ? { ...b, likeCount: b.isLiked ? b.likeCount - 1 : b.likeCount + 1, isLiked: !b.isLiked } : b);
    try {
      const res = await api.post(`/board/${id}/like`);
      setBoard((b) => b ? { ...b, likeCount: res.data.likeCount, isLiked: res.data.liked } : b);
    } catch {
      setBoard((b) => b ? { ...b, ...prev } : b);
    }
  };

  // [soojin] 북마크 토글 — 낙관적 UI 업데이트
  const handleBookmark = async () => {
    if (!board) return;
    const prevBookmarked = board.isBookmarked;
    setBoard((b) => b ? { ...b, isBookmarked: !b.isBookmarked } : b);
    try {
      const res = await api.post(`/board/${id}/bookmark`);
      setBoard((b) => b ? { ...b, isBookmarked: res.data.bookmarked } : b);
    } catch {
      setBoard((b) => b ? { ...b, isBookmarked: prevBookmarked } : b);
    }
  };

  // [soojin] 공유 — 현재 URL 클립보드 복사
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert("링크가 복사되었습니다."))
      .catch(() => {});
  };

  // [soojin] 댓글/대댓글 작성
  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/board/${id}/comments`, {
        content: newComment.trim(),
        parentId: replyTo?.id ?? null,
      });
      setNewComment("");
      setReplyTo(null);
      const res = await api.get(`/board/${id}/comments`);
      setComments(res.data);
      setBoard((b) => b ? { ...b, commentCount: b.commentCount + 1 } : b);
    } catch {
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // [soojin] 댓글 soft delete
  const handleCommentDelete = async (commentId: number) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/board/${id}/comments/${commentId}`);
      const res = await api.get(`/board/${id}/comments`);
      setComments(res.data);
      setBoard((b) => b ? { ...b, commentCount: Math.max(0, b.commentCount - 1) } : b);
    } catch {
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  const handleEdit = async () => {
    if (!editForm.title.trim()) { alert("제목을 입력해주세요."); return; }
    if (isQuillEmpty(editForm.content)) { alert("내용을 입력해주세요."); return; }
    setSaving(true);
    try {
      await api.put(`/board/${id}`, {
        boardType: "CLASS_BOARD",
        title: editForm.title,
        content: editForm.content,
        tag: editForm.tag || null,
      });
      setShowEditModal(false);
      const res = await api.get(`/board/${id}`);
      setBoard(res.data);
    } catch {
      alert("수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/board/${id}`);
      navigate("/board/class-board");
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  // [soojin] 단일 댓글 렌더링 (재귀 — isReply=true면 대댓글 스타일)
  const renderComment = (comment: Comment, isReply = false) => {
    const badge = roleBadge(comment.writerRole);
    const canDelete = user?.uid === comment.writerId || isAdmin || isTeacher;
    return (
      <div key={comment.id} style={{ marginBottom: 16, paddingLeft: isReply ? 44 : 0 }}>
        <div className="d-flex gap-10">
          <AvatarIcon name={comment.writerName} />
          <div style={{ flex: 1 }}>
            <div className="d-flex align-items-center gap-8 mb-4 flex-wrap">
              <span className="fw-semibold" style={{ fontSize: 14 }}>{comment.writerName}</span>
              <span
                className={`px-6 py-1 rounded fw-medium ${badge.color}`}
                style={{ fontSize: 11 }}
              >
                {badge.label}
              </span>
              <span className="text-secondary-light" style={{ fontSize: 12 }}>
                {formatDateTime(comment.createDate)}
              </span>
            </div>
            <p
              className="mb-6"
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: comment.isDeleted ? "#94a3b8" : "#334155",
                fontStyle: comment.isDeleted ? "italic" : "normal",
                margin: 0,
              }}
            >
              {comment.content}
            </p>
            <div className="d-flex align-items-center gap-12 mt-4">
              {!isReply && (
                <button
                  type="button"
                  className="d-flex align-items-center gap-4 text-secondary-light"
                  style={{ fontSize: 12, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  onClick={() =>
                    setReplyTo(replyTo?.id === comment.id ? null : { id: comment.id, writerName: comment.writerName })
                  }
                >
                  <i className="ri-reply-line" />
                  답글
                </button>
              )}
              {canDelete && !comment.isDeleted && (
                <button
                  type="button"
                  className="d-flex align-items-center gap-4 text-danger"
                  style={{ fontSize: 12, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  onClick={() => handleCommentDelete(comment.id)}
                >
                  <i className="ri-delete-bin-line" />
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 대댓글 목록 */}
        {comment.replies?.map((reply) => renderComment(reply, true))}

        {/* [soojin] 대댓글 입력창 — 해당 댓글에 답글 선택 시 표시 */}
        {replyTo?.id === comment.id && (
          <div className="d-flex gap-8 mt-8" style={{ paddingLeft: 44 }}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder={`${replyTo.writerName}님께 답글 작성...`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(); }
              }}
              style={{ fontSize: 13 }}
            />
            <button
              type="button"
              className="btn btn-primary-600 btn-sm radius-8 flex-shrink-0"
              onClick={handleCommentSubmit}
              disabled={submitting}
            >
              등록
            </button>
            <button
              type="button"
              className="btn btn-outline-neutral-300 btn-sm radius-8 flex-shrink-0"
              onClick={() => { setReplyTo(null); setNewComment(""); }}
            >
              취소
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
      </DashboardLayout>
    );
  }
  if (!board) return null;

  const writerBadge = roleBadge(board.writerRole);

  // [soojin] 첨부파일: 신규 attachments 배열 우선, 없으면 기존 attachmentUrl 폴백
  const attachments: { name: string; url: string; size?: number }[] =
    board.attachments && board.attachments.length > 0
      ? board.attachments.map((a) => ({
          name: a.originalName,
          url: `/api/board/file/${a.storedName}`,
          size: a.fileSize,
        }))
      : board.attachmentUrl
      ? [{ name: board.attachmentUrl.split("/").pop() || "첨부파일", url: board.attachmentUrl }]
      : [];

  return (
    <DashboardLayout>
      {/* 상단 네비게이션 */}
      <div className="d-flex align-items-center gap-8 mb-24">
        <Link
          to="/board/class-board"
          className="w-36-px h-36-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center text-secondary-light"
        >
          <i className="ri-arrow-left-line text-lg" />
        </Link>
        <h5 className="fw-bold mb-0">학급 게시판</h5>
      </div>

      {/* 게시글 카드 */}
      <div className="card radius-12" style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* 헤더 */}
        <div className="card-header py-20 px-24 border-bottom">
          {/* [soojin] 게시판 타입 + 태그 배지 */}
          <div className="d-flex align-items-center gap-8 mb-10">
            <span className="badge bg-primary-100 text-primary-600 fw-medium" style={{ fontSize: 12 }}>
              학급 게시판
            </span>
            {board.tag && (
              <span className="badge bg-warning-100 text-warning-600 fw-medium" style={{ fontSize: 12 }}>
                {board.tag}
              </span>
            )}
          </div>
          <h5 className="fw-bold mb-12" style={{ lineHeight: 1.5 }}>{board.title}</h5>
          {/* [soojin] 작성자 아바타 + 이름 + 역할 배지 + 날짜 + 통계 */}
          <div className="d-flex align-items-center gap-12 flex-wrap">
            <div className="d-flex align-items-center gap-8">
              <AvatarIcon name={board.writerName} />
              <span className="fw-semibold" style={{ fontSize: 14 }}>{board.writerName}</span>
              <span
                className={`px-8 py-1 rounded fw-medium ${writerBadge.color}`}
                style={{ fontSize: 11 }}
              >
                {writerBadge.label}
              </span>
            </div>
            <span className="text-secondary-light" style={{ fontSize: 13 }}>
              {formatDate(board.createDate)}
            </span>
            <div className="d-flex align-items-center gap-12 text-secondary-light ms-auto" style={{ fontSize: 13 }}>
              <span><i className="ri-eye-line me-4" />조회 {board.viewCount}</span>
              <span><i className="ri-heart-line me-4" />좋아요 {board.likeCount}</span>
              <span><i className="ri-chat-3-line me-4" />댓글 {board.commentCount}</span>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="card-body px-24 py-20">
          {board.content.includes("<") ? (
            <div
              className="ql-editor"
              style={{ fontSize: 15, lineHeight: 2, color: "#334155", minHeight: 120, padding: 0 }}
              dangerouslySetInnerHTML={{ __html: board.content }}
            />
          ) : (
            <div style={{ fontSize: 15, lineHeight: 2, color: "#334155", whiteSpace: "pre-wrap", minHeight: 120 }}>
              {board.content}
            </div>
          )}
        </div>

        {/* [soojin] 첨부파일 영역 */}
        {attachments.length > 0 && (
          <div className="px-24 py-16 border-top">
            <p className="fw-semibold mb-10" style={{ fontSize: 14 }}>
              <i className="ri-attachment-line me-6 text-primary-600" />
              첨부파일 ({attachments.length})
            </p>
            <div className="d-flex flex-column gap-8">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="d-flex align-items-center justify-content-between px-14 py-10 radius-8"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                  <div className="d-flex align-items-center gap-10">
                    <i className="ri-file-line text-primary-600" style={{ fontSize: 18 }} />
                    <div>
                      <p className="fw-medium mb-0" style={{ fontSize: 13 }}>{file.name}</p>
                      {file.size != null && (
                        <p className="text-secondary-light mb-0" style={{ fontSize: 11 }}>
                          {formatFileSize(file.size)}
                        </p>
                      )}
                    </div>
                  </div>
                  <a
                    href={file.url}
                    download={file.name}
                    className="btn btn-outline-primary-600 btn-sm radius-8 d-flex align-items-center gap-4"
                    style={{ fontSize: 12 }}
                  >
                    <i className="ri-download-line" />
                    다운로드
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* [soojin] 수정/삭제 + 좋아요/북마크/공유/목록 버튼 */}
        <div className="px-24 py-16 border-top d-flex align-items-center justify-content-between flex-wrap gap-8">
          {(isAdmin || isTeacher || isWriter) ? (
            <div className="d-flex gap-8">
              <button
                type="button"
                className="btn btn-outline-primary-600 btn-sm radius-8 d-flex align-items-center gap-4"
                onClick={() => setShowEditModal(true)}
              >
                <i className="ri-edit-line" />수정
              </button>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm radius-8 d-flex align-items-center gap-4"
                onClick={handleDelete}
              >
                <i className="ri-delete-bin-line" />삭제
              </button>
            </div>
          ) : <div />}

          <div className="d-flex align-items-center gap-8 flex-wrap">
            <button
              type="button"
              onClick={handleLike}
              className={`btn btn-sm radius-8 d-flex align-items-center gap-6 ${board.isLiked ? "btn-danger" : "btn-outline-neutral-300"}`}
              style={{ fontSize: 13, minWidth: 90 }}
            >
              <i className={board.isLiked ? "ri-heart-fill" : "ri-heart-line"} />
              좋아요 {board.likeCount}
            </button>
            <button
              type="button"
              onClick={handleBookmark}
              className={`btn btn-sm radius-8 d-flex align-items-center gap-6 ${board.isBookmarked ? "btn-warning" : "btn-outline-neutral-300"}`}
              style={{ fontSize: 13 }}
            >
              <i className={board.isBookmarked ? "ri-bookmark-fill" : "ri-bookmark-line"} />
              북마크
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="btn btn-outline-neutral-300 btn-sm radius-8 d-flex align-items-center gap-6"
              style={{ fontSize: 13 }}
            >
              <i className="ri-share-forward-line" />
              공유
            </button>
            <Link
              to="/board/class-board"
              className="btn btn-outline-neutral-300 btn-sm radius-8 d-flex align-items-center gap-6"
              style={{ fontSize: 13 }}
            >
              <i className="ri-list-unordered" />
              목록
            </Link>
          </div>
        </div>
      </div>

      {/* [soojin] 댓글 섹션 */}
      <div className="card radius-12" style={{ maxWidth: 860, margin: "16px auto 0" }}>
        <div className="card-body px-24 py-20">
          <h6 className="fw-bold mb-16 d-flex align-items-center gap-8">
            <i className="ri-chat-3-line text-primary-600" />
            댓글 {board.commentCount}
          </h6>

          {/* [soojin] 최상위 댓글 입력창 (대댓글 입력 중이 아닐 때) */}
          {!replyTo && (
            <div className="d-flex gap-8 mb-24 align-items-flex-end">
              <textarea
                className="form-control"
                rows={2}
                placeholder="댓글을 입력하세요..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ fontSize: 14, resize: "none" }}
              />
              <button
                type="button"
                className="btn btn-primary-600 radius-8 flex-shrink-0 d-flex align-items-center gap-4"
                style={{ fontSize: 13, height: 40, whiteSpace: "nowrap" }}
                onClick={handleCommentSubmit}
                disabled={submitting || !newComment.trim()}
              >
                <i className="ri-send-plane-line" />
                댓글 작성
              </button>
            </div>
          )}

          {/* [soojin] 댓글 목록 */}
          {comments.length === 0 ? (
            <p className="text-secondary-light text-center py-20" style={{ fontSize: 14 }}>
              첫 댓글을 남겨보세요.
            </p>
          ) : (
            <div>{comments.map((c) => renderComment(c))}</div>
          )}
        </div>
      </div>

      {/* [soojin] 수정 모달 */}
      {showEditModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">
                  <i className="ri-edit-line me-8 text-primary-600" />게시글 수정
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
              </div>
              <div className="modal-body p-24">
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">제목</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                {/* [soojin] 태그 선택 */}
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">태그</label>
                  <select
                    className="form-select"
                    value={editForm.tag}
                    onChange={(e) => setEditForm((f) => ({ ...f, tag: e.target.value }))}
                  >
                    <option value="">태그 없음</option>
                    <option value="공지">공지</option>
                    <option value="질문">질문</option>
                    <option value="모임">모임</option>
                    <option value="유머">유머</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="form-label fw-semibold text-sm">내용</label>
                  <div style={{ minHeight: 250 }}>
                    <ReactQuill
                      theme="snow"
                      value={editForm.content}
                      onChange={(val: string) => setEditForm((f) => ({ ...f, content: val }))}
                      modules={QUILL_MODULES}
                      formats={QUILL_FORMATS}
                      style={{ height: 220 }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24 gap-8">
                <button
                  type="button"
                  className="btn btn-outline-neutral-300 radius-8"
                  onClick={() => setShowEditModal(false)}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="btn btn-primary-600 radius-8"
                  onClick={handleEdit}
                  disabled={saving}
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
