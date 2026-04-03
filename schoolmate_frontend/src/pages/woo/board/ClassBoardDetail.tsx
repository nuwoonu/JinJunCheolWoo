import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ReactQuill, QUILL_MODULES, QUILL_FORMATS, isQuillEmpty } from "@/shared/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import api from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

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
function roleBadge(role: string): { label: string; bg: string; color: string } {
  switch (role) {
    case "ADMIN":   return { label: "관리자", bg: "#f3e8ff", color: "#7c3aed" };
    case "TEACHER": return { label: "교사",   bg: "#dbeafe", color: "#1d4ed8" };
    case "STAFF":   return { label: "교직원", bg: "#cffafe", color: "#0e7490" };
    case "PARENT":  return { label: "학부모", bg: "#ffedd5", color: "#c2410c" };
    default:        return { label: "학생",   bg: "#dcfce7", color: "#16a34a" };
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
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

// [soojin] 작성자 이니셜 아바타
function AvatarIcon({ name }: { name: string }) {
  return (
    <div
      style={{ width: 36, height: 36, fontSize: 14, fontWeight: 700, background: "#6366f1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}
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

    api
      .get(`/board/${id}/comments`)
      .then((res) => setComments(res.data))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    document.body.style.overflow = showEditModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showEditModal]);

  // [soojin] 좋아요 토글 — 낙관적 UI 업데이트 후 서버 응답으로 보정
  const handleLike = async () => {
    if (!board) return;
    const prev = { likeCount: board.likeCount, isLiked: board.isLiked };
    setBoard((b) => (b ? { ...b, likeCount: b.isLiked ? b.likeCount - 1 : b.likeCount + 1, isLiked: !b.isLiked } : b));
    try {
      const res = await api.post(`/board/${id}/like`);
      setBoard((b) => (b ? { ...b, likeCount: res.data.likeCount, isLiked: res.data.liked } : b));
    } catch {
      setBoard((b) => (b ? { ...b, ...prev } : b));
    }
  };

  // [soojin] 북마크 토글 — 낙관적 UI 업데이트
  const handleBookmark = async () => {
    if (!board) return;
    const prevBookmarked = board.isBookmarked;
    setBoard((b) => (b ? { ...b, isBookmarked: !b.isBookmarked } : b));
    try {
      const res = await api.post(`/board/${id}/bookmark`);
      setBoard((b) => (b ? { ...b, isBookmarked: res.data.bookmarked } : b));
    } catch {
      setBoard((b) => (b ? { ...b, isBookmarked: prevBookmarked } : b));
    }
  };

  // [soojin] 공유 — 현재 URL 클립보드 복사
  const handleShare = () => {
    navigator.clipboard
      .writeText(window.location.href)
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
      setBoard((b) => (b ? { ...b, commentCount: b.commentCount + 1 } : b));
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
      setBoard((b) => (b ? { ...b, commentCount: Math.max(0, b.commentCount - 1) } : b));
    } catch {
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  const handleEdit = async () => {
    if (!editForm.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (isQuillEmpty(editForm.content)) {
      alert("내용을 입력해주세요.");
      return;
    }
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
        <div style={{ display: "flex", gap: 10 }}>
          <AvatarIcon name={comment.writerName} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {comment.writerName}
                </span>
                <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: badge.bg, color: badge.color, fontWeight: 500 }}>
                  {badge.label}
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                {formatDateTime(comment.createDate)}
              </span>
            </div>
            <p
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
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              {!isReply && (
                <button
                  type="button"
                  style={{
                    fontSize: 12,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "#9ca3af",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
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
                  style={{
                    fontSize: 12,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "#ef4444",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
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
          <div style={{ display: "flex", gap: 8, marginTop: 8, paddingLeft: 44 }}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder={`${replyTo.writerName}님께 답글 작성...`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCommentSubmit();
                }
              }}
              style={{ fontSize: 13 }}
            />
            <button
              type="button"
              style={{
                padding: "4px 10px",
                background: "#25A194",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onClick={handleCommentSubmit}
              disabled={submitting}
            >
              등록
            </button>
            <button
              type="button"
              style={{
                padding: "4px 10px",
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                color: "#374151",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onClick={() => {
                setReplyTo(null);
                setNewComment("");
              }}
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
        <div style={{ textAlign: "center", paddingTop: 48, paddingBottom: 48, color: "#94a3b8" }}>불러오는 중...</div>
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
      <div style={{ maxWidth: 860, margin: "0 auto 24px" }}>
        <Link
          to="/board/class-board"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            color: "#374151",
            textDecoration: "none",
            padding: "5px 10px",
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontWeight: 500,
          }}
        >
          <i className="ri-arrow-left-line" />
          목록으로
        </Link>
      </div>

      {/* 게시글 카드 */}
      {/* [soojin] overflow:hidden — Bootstrap card-header 자체 border-radius를 카드 radius(12)로 클리핑해 상하 둥근모양 통일 */}
      <div className="card" style={{ maxWidth: 860, margin: "0 auto", borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        {/* [soojin] 헤더 — 태그+제목만 */}
        {/* [soojin] borderBottom 제거 → 아래 패딩 구분선으로 대체 */}
        <div className="card-header" style={{ padding: "20px 24px", borderBottom: "none" }}>
          {/* [soojin] 게시판 타입 + 태그 배지 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: "#dbeafe", color: "#3b82f6", display: "inline-block" }}>
              학급 게시판
            </span>
            {board.tag && (
              <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: "#fef9c3", color: "#ca8a04", display: "inline-block" }}>
                {board.tag}
              </span>
            )}
          </div>
          <h5 style={{ fontWeight: 700, marginBottom: 0, lineHeight: 1.5 }}>
            {board.title}
          </h5>
        </div>
        {/* [soojin] 구분선: margin 0 24px → 본문 패딩값과 동일한 좌우 여백 */}
        <div style={{ height: 1, background: "#e5e7eb", margin: "0 24px" }} />
        {/* [soojin] 작성자 섹션 — 제목 헤더와 분리된 별도 행 (패딩/구분선 일관성) */}
        {/* [soojin] borderBottom 제거 → 아래 패딩 구분선으로 대체 */}
        <div style={{ padding: "16px 24px" }}>
          {/* [soojin] 작성자 아바타 + 이름 + 역할 배지 + 날짜시간 + 통계 */}
          <div style={{ display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AvatarIcon name={board.writerName} />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {board.writerName}
                  </span>
                  <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 4, background: writerBadge.bg, color: writerBadge.color, fontWeight: 500 }}>
                    {writerBadge.label}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  {formatDateTime(board.createDate)}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#94a3b8", fontSize: 13, marginLeft: "auto" }}>
              <span>
                <i className="ri-eye-line" style={{ marginRight: 4 }} />
                {board.viewCount}
              </span>
              <span>
                <i className="ri-heart-line" style={{ marginRight: 4 }} />
                {board.likeCount}
              </span>
              <span>
                <i className="ri-chat-3-line" style={{ marginRight: 4 }} />
                {board.commentCount}
              </span>
            </div>
          </div>
        </div>

        {/* [soojin] 구분선: margin 0 24px → 본문 패딩값과 동일한 좌우 여백 */}
        <div style={{ height: 1, background: "#e5e7eb", margin: "0 24px" }} />
        {/* 본문 */}
        <div className="card-body" style={{ padding: "20px 24px" }}>
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
          <>
          {/* [soojin] 구분선: margin 0 24px → 본문 패딩값과 동일한 좌우 여백 */}
          <div style={{ height: 1, background: "#e5e7eb", margin: "0 24px" }} />
          {/* [soojin] borderTop 제거 → 위 패딩 구분선으로 대체 */}
          <div style={{ padding: "16px 24px" }}>
            <p style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>
              <i className="ri-attachment-line text-primary-600" style={{ marginRight: 6 }} />
              첨부파일 ({attachments.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <i className="ri-file-line text-primary-600" style={{ fontSize: 18 }} />
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: 0, fontSize: 13 }}>
                        {file.name}
                      </p>
                      {file.size != null && (
                        <p style={{ color: "#94a3b8", marginBottom: 0, fontSize: 11 }}>
                          {formatFileSize(file.size)}
                        </p>
                      )}
                    </div>
                  </div>
                  <a
                    href={file.url}
                    download={file.name}
                    style={{ fontSize: 12, padding: "4px 10px", border: "1px solid #3b82f6", borderRadius: 8, color: "#3b82f6", background: "#fff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    <i className="ri-download-line" />
                    다운로드
                  </a>
                </div>
              ))}
            </div>
          </div>
          </>
        )}

        {/* [soojin] 수정/삭제 + 좋아요/북마크/공유/목록 버튼 */}
        {/* [soojin] 구분선: margin 0 24px → 본문 패딩값과 동일한 좌우 여백 */}
        <div style={{ height: 1, background: "#e5e7eb", margin: "0 24px" }} />
        {/* [soojin] borderTop 제거 → 위 패딩 구분선으로 대체 */}
        <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          {isAdmin || isTeacher || isWriter ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                style={{
                  padding: "5px 10px",
                  background: "#fff",
                  border: "1px solid #25A194",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#25A194",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
                onClick={() => setShowEditModal(true)}
              >
                <i className="ri-edit-line" />
                수정
              </button>
              <button
                type="button"
                style={{
                  padding: "5px 10px",
                  background: "#fff",
                  border: "1px solid #ef4444",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#dc2626",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
                onClick={handleDelete}
              >
                <i className="ri-delete-bin-line" />
                삭제
              </button>
            </div>
          ) : (
            <div />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleLike}
              style={{
                padding: "5px 10px",
                background: board.isLiked ? "#ef4444" : "#fff",
                border: board.isLiked ? "none" : "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                color: board.isLiked ? "#fff" : "#374151",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                minWidth: 90,
              }}
            >
              <i className={board.isLiked ? "ri-heart-fill" : "ri-heart-line"} />
              좋아요 {board.likeCount}
            </button>
            <button
              type="button"
              onClick={handleBookmark}
              style={{
                padding: "5px 10px",
                background: board.isBookmarked ? "#f59e0b" : "#fff",
                border: board.isBookmarked ? "none" : "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                color: board.isBookmarked ? "#fff" : "#374151",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <i className={board.isBookmarked ? "ri-bookmark-fill" : "ri-bookmark-line"} />
              북마크
            </button>
            <button
              type="button"
              onClick={handleShare}
              style={{
                padding: "5px 10px",
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                color: "#374151",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <i className="ri-share-forward-line" />
              공유
            </button>
            <Link
              to="/board/class-board"
              style={{
                padding: "5px 10px",
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                color: "#374151",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <i className="ri-list-unordered" />
              목록
            </Link>
          </div>
        </div>
      </div>

      {/* [soojin] 댓글 섹션 */}
      <div className="card" style={{ maxWidth: 860, margin: "16px auto 0", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <div className="card-body" style={{ padding: "20px 24px" }}>
          <h6 style={{ fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ri-chat-3-line text-primary-600" />
            댓글 {board.commentCount}
          </h6>

          {/* [soojin] 최상위 댓글 입력창 (대댓글 입력 중이 아닐 때) */}
          {/* [soojin] 댓글 작성 버튼을 textarea 하단 우측으로 이동 */}
          {!replyTo && (
            <div style={{ marginBottom: 24 }}>
              <textarea
                className="form-control"
                rows={2}
                placeholder="댓글을 입력하세요..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ fontSize: 14, resize: "none" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="button"
                  style={{
                    padding: "5px 12px",
                    background: "#25A194",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    whiteSpace: "nowrap",
                  }}
                  onClick={handleCommentSubmit}
                  disabled={submitting || !newComment.trim()}
                >
                  <i className="ri-send-plane-line" />
                  댓글 작성
                </button>
              </div>
            </div>
          )}

          {/* [soojin] 댓글 목록 */}
          {comments.length === 0 ? (
            <p style={{ color: "#94a3b8", textAlign: "center", paddingTop: 20, paddingBottom: 20, fontSize: 14 }}>
              첫 댓글을 남겨보세요.
            </p>
          ) : (
            <div>{comments.map((c) => renderComment(c))}</div>
          )}
        </div>
      </div>

      {/* [soojin] 수정 모달 */}
      {showEditModal && (
        <div className="modal fade show" tabIndex={-1} style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 12 }}>
              <div className="modal-header" style={{ padding: "16px 24px" }}>
                <h6 className="modal-title">
                  <i className="ri-edit-line text-primary-600" style={{ marginRight: 8 }} />
                  게시글 수정
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
              </div>
              <div className="modal-body" style={{ padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>제목</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                {/* [soojin] 태그 선택 */}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>태그</label>
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
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>내용</label>
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
              <div className="modal-footer" style={{ padding: "16px 24px", gap: 8 }}>
                <button
                  type="button"
                  style={{
                    padding: "5px 16px",
                    background: "#fff",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                    color: "#374151",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowEditModal(false)}
                >
                  취소
                </button>
                <button
                  type="button"
                  style={{
                    padding: "5px 16px",
                    background: "#25A194",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                  }}
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
