import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactQuill, QUILL_MODULES, QUILL_FORMATS, isQuillEmpty } from "@/shared/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import api from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo] /board/class-diary/:id - 우리반 알림장 상세

interface Board {
  id: number;
  title: string;
  content: string;
  writerName: string;
  writerId: number;
  viewCount: number;
  createDate: string;
  targetClassroomName?: string;
}

export default function ClassDiaryDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";
  const isWriter = board?.writerId === user?.uid;
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/board/${id}`)
      .then((res) => {
        setBoard(res.data);
        setEditForm({ title: res.data.title, content: res.data.content });
        if (!viewedRef.current) {
          viewedRef.current = true;
          api.post(`/board/${id}/view`).catch(() => {});
        }
      })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    document.body.style.overflow = showEditModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showEditModal]);

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
        boardType: "CLASS_DIARY",
        title: editForm.title,
        content: editForm.content,
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
      navigate(-1);
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
      </DashboardLayout>
    );
  }

  if (!board) return null;

  return (
    <DashboardLayout>
      {/* [woo] 상단 네비게이션 */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div className="d-flex align-items-center gap-8">
          <button
            type="button"
            className="w-36-px h-36-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center text-secondary-light border-0"
            onClick={() => navigate(-1)}
          >
            <i className="ri-arrow-left-line text-lg" />
          </button>
          <h5 className="fw-bold mb-0">우리반 알림장</h5>
        </div>
      </div>

      {/* [woo] 상세 카드 */}
      <div className="card radius-12" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="card-header py-20 px-24 border-bottom">
          <h5 className="fw-bold mb-8">{board.title}</h5>
          <div className="d-flex align-items-center gap-16 text-sm text-secondary-light">
            <span>
              <i className="ri-user-line me-4" />
              {board.writerName}
            </span>
            <span>
              <i className="ri-calendar-line me-4" />
              {formatDate(board.createDate)}
            </span>
            <span>
              <i className="ri-eye-line me-4" />
              조회 {board.viewCount}
            </span>
            {board.targetClassroomName && (
              <span>
                <i className="ri-group-line me-4" />
                {board.targetClassroomName}
              </span>
            )}
          </div>
        </div>

        <div className="card-body p-24">
          {/* [woo] HTML 콘텐츠 또는 일반 텍스트 렌더링 */}
          {board.content.includes("<") ? (
            <div
              className="ql-editor"
              style={{ fontSize: 15, lineHeight: 2, color: "#334155", minHeight: 120, padding: 0 }}
              dangerouslySetInnerHTML={{ __html: board.content }}
            />
          ) : (
            <div
              style={{ fontSize: 15, lineHeight: 2, color: "#334155", whiteSpace: "pre-wrap", minHeight: 120 }}
            >
              {board.content}
            </div>
          )}
        </div>
      </div>

      {/* [woo] 하단 버튼: 좌측 수정/삭제, 우측 목록으로 */}
      <div style={{ maxWidth: 900, margin: "16px auto 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {(isAdmin || (isTeacher && isWriter)) ? (
          <div className="d-flex gap-8">
            <button
              type="button"
              className="btn btn-outline-primary-600 radius-8 d-flex align-items-center gap-4"
              onClick={() => setShowEditModal(true)}
            >
              <i className="ri-edit-line" />
              수정
            </button>
            <button
              type="button"
              className="btn btn-outline-danger radius-8 d-flex align-items-center gap-4"
              onClick={handleDelete}
            >
              <i className="ri-delete-bin-line" />
              삭제
            </button>
          </div>
        ) : <div />}
        <button
          type="button"
          className="btn btn-outline-neutral-300 radius-8 d-flex align-items-center gap-6"
          style={{ fontSize: 14 }}
          onClick={() => navigate(-1)}
        >
          <i className="ri-list-unordered" />
          목록으로
        </button>
      </div>

      {/* [woo 03-27] 수정 모달 — ReactQuill 에디터 */}
      {showEditModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">
                  <i className="ri-edit-line me-8 text-primary-600" />
                  알림장 수정
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
                <button type="button" className="btn btn-primary-600 radius-8" onClick={handleEdit} disabled={saving}>
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
