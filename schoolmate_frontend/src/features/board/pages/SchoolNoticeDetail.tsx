import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ReactQuill, QUILL_MODULES_TEXT, QUILL_FORMATS_TEXT, isQuillEmpty } from "@/shared/types/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import api from "@/shared/api/authApi";
import { useAuth } from "@/shared/contexts/AuthContext";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [woo] /board/school-notice/:id - 학교 공지 상세 (Thymeleaf school-notice/detail.html 마이그레이션)

interface Board {
  id: number;
  title: string;
  content: string;
  writerName: string;
  viewCount: number;
  pinned: boolean;
  createDate: string;
}

export default function SchoolNoticeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  // [woo] 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  // [woo] StrictMode 이중 실행 방지 - 조회수 POST를 최초 1회만 호출
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
      .catch(() => navigate("/board/school-notice"))
      .finally(() => setLoading(false));
  }, [id]);

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showEditModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showEditModal]);

  const handleEdit = async () => {
    if (!editForm.title.trim() || isQuillEmpty(editForm.content)) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/board/${id}`, {
        boardType: "SCHOOL_NOTICE",
        title: editForm.title,
        content: editForm.content,
      });
      setShowEditModal(false);
      // 수정 후 다시 불러오기
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
      navigate("/board/school-notice");
    } catch {
      alert("삭제에 실패했습니다.");
    }
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
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">게시판</h6>
          <p className="text-neutral-600 mt-4 mb-0">학교 공지</p>
        </div>
      </div>

      <div className="card radius-12">
        <div className="card-header py-16 px-24 border-bottom">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              {board.pinned && <span className="badge bg-danger-100 text-danger-600 mb-8 d-inline-block">공지</span>}
              <h5 className="mb-8">{board.title}</h5>
              <div className="d-flex gap-16 text-secondary-light text-sm">
                <span>
                  <iconify-icon icon="mdi:account" className="me-4" />
                  {board.writerName}
                </span>
                <span>
                  <iconify-icon icon="mdi:calendar" className="me-4" />
                  {board.createDate?.slice(0, 16).replace("T", " ")}
                </span>
                <span>
                  <iconify-icon icon="mdi:eye" className="me-4" />
                  {board.viewCount}
                </span>
              </div>
            </div>
            {/* [woo] ADMIN만 수정/삭제 버튼 표시 */}
            {isAdmin && (
              <div className="d-flex gap-8">
                <button
                  type="button"
                  className="btn btn-outline-primary-600 radius-8"
                  onClick={() => setShowEditModal(true)}
                >
                  <iconify-icon icon="mdi:pencil" className="me-4" />
                  수정
                </button>
                <button type="button" className="btn btn-outline-danger radius-8" onClick={handleDelete}>
                  <iconify-icon icon="mdi:delete" className="me-4" />
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="card-body p-24">
          {/* [woo] HTML(에디터 작성) 또는 일반 텍스트 렌더링 */}
          {board.content.includes("<") ? (
            <div
              className="ql-editor"
              style={{ minHeight: 300, lineHeight: 1.8, padding: 0 }}
              dangerouslySetInnerHTML={{ __html: board.content }}
            />
          ) : (
            <div style={{ minHeight: 300, whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{board.content}</div>
          )}
        </div>
        <div className="card-footer py-16 px-24 border-top">
          <Link to="/board/school-notice" className="btn btn-secondary-600 radius-8">
            <i className="ri-list-unordered me-4" />
            목록으로
          </Link>
        </div>
      </div>

      {/* [woo] 수정 모달 - React state 제어 */}
      {showEditModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">게시물 수정</h6>
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
                {/* [woo] WYSIWYG 에디터 적용 */}
                <div>
                  <label className="form-label fw-semibold text-sm">내용</label>
                  <div style={{ minHeight: 320 }}>
                    <ReactQuill
                      theme="snow"
                      value={editForm.content}
                      onChange={(val: string) => setEditForm((f) => ({ ...f, content: val }))}
                      modules={QUILL_MODULES_TEXT}
                      formats={QUILL_FORMATS_TEXT}
                      placeholder="내용을 입력하세요"
                      style={{ height: 280 }}
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
