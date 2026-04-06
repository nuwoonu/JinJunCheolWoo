import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ReactQuill, QUILL_MODULES_TEXT, QUILL_FORMATS_TEXT, isQuillEmpty } from "@/shared/types/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import api from "@/shared/api/authApi";
import { useAuth } from "@/shared/contexts/AuthContext";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [soojin] /board/school-notice/:id - 학교 공지 상세 (ClassBoardDetail.tsx 형식으로 UI 통일)

interface Board {
  id: number;
  title: string;
  content: string;
  writerName: string;
  viewCount: number;
  pinned: boolean;
  createDate: string;
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AvatarIcon({ name }: { name: string }) {
  return (
    <div style={{ width: 36, height: 36, fontSize: 14, fontWeight: 700, background: "#10b981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
      {name ? name.charAt(0) : "?"}
    </div>
  );
}

export default function SchoolNoticeDetail() {
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
  // [soojin] StrictMode 이중 실행 방지 - 조회수 POST를 최초 1회만 호출
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

  useEffect(() => {
    document.body.style.overflow = showEditModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
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
        <div style={{ textAlign: "center", paddingTop: 48, paddingBottom: 48, color: "#94a3b8" }}>불러오는 중...</div>
      </DashboardLayout>
    );
  }
  if (!board) return null;

  return (
    <DashboardLayout>
      {/* [soojin] 상단 목록으로 버튼 — 브레드크럼에서 변경 */}
      <div style={{ maxWidth: 860, margin: "0 auto 24px" }}>
        <Link
          to="/board/school-notice"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#374151", textDecoration: "none", padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontWeight: 500 }}
        >
          <i className="ri-arrow-left-line" />
          목록으로
        </Link>
      </div>

      {/* [soojin] 게시글 카드 — ClassBoardDetail 형식 */}
      {/* [soojin] overflow:hidden — card-header border-radius를 카드 radius(12)로 클리핑 */}
      {/* [soojin] minHeight: calc(100vh - 180px) — 헤더(72px)+패딩+버튼영역 제외한 나머지 뷰포트 채움, 내용 많으면 페이지 스크롤 */}
      <div className="card" style={{ maxWidth: 860, margin: "0 auto", borderRadius: 12, overflow: "hidden", minHeight: "calc(100vh - 180px)", border: "1px solid #e2e8f0" }}>
        {/* [soojin] borderBottom 제거 → 아래 구분선으로 대체 */}
        <div className="card-header" style={{ padding: "20px 24px", borderBottom: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: "#dcfce7", color: "#16a34a", display: "inline-block" }}>학교 공지</span>
            {board.pinned && (
              <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: "#fee2e2", color: "#dc2626", display: "inline-block" }}>고정</span>
            )}
          </div>
          <h5 style={{ fontWeight: 700, marginBottom: 0, lineHeight: 1.5 }}>{board.title}</h5>
        </div>
        {/* [soojin] 구분선: margin 0 24px → 본문 패딩값과 동일한 좌우 여백 */}
        <div style={{ height: 1, background: "#e5e7eb", margin: "0 24px" }} />
        {/* [soojin] 작성자/날짜/조회수 섹션 — 헤더에서 분리 */}
        <div style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AvatarIcon name={board.writerName} />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{board.writerName}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{formatDateTime(board.createDate)}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#94a3b8", fontSize: 13, marginLeft: "auto" }}>
              <span><i className="ri-eye-line" style={{ marginRight: 4 }} />{board.viewCount}</span>
            </div>
          </div>
        </div>
        {/* [soojin] 구분선 */}
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

        {/* [soojin] 구분선 */}
        <div style={{ height: 1, background: "#e5e7eb", margin: "0 24px" }} />
        {/* [soojin] 하단 버튼 — 수정/삭제를 헤더에서 하단으로 이동 */}
        <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          {(isAdmin || isTeacher) ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={{ padding: "5px 10px", background: "#fff", border: "1px solid #25A194", borderRadius: 6, fontSize: 13, color: "#25A194", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }} onClick={() => setShowEditModal(true)}>
                <i className="ri-edit-line" />수정
              </button>
              <button type="button" style={{ padding: "5px 10px", background: "#fff", border: "1px solid #ef4444", borderRadius: 6, fontSize: 13, color: "#dc2626", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }} onClick={handleDelete}>
                <i className="ri-delete-bin-line" />삭제
              </button>
            </div>
          ) : <div />}
          <Link to="/board/school-notice" style={{ padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#374151", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <i className="ri-list-unordered" />목록
          </Link>
        </div>
      </div>

      {/* [soojin] 수정 모달 */}
      {showEditModal && (
        <div className="modal fade show" tabIndex={-1} style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 12 }}>
              <div className="modal-header" style={{ padding: "16px 24px" }}>
                <h6 className="modal-title"><i className="ri-edit-line text-primary-600" style={{ marginRight: 8 }} />게시글 수정</h6>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
              </div>
              <div className="modal-body" style={{ padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>제목</label>
                  <input type="text" className="form-control" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>내용</label>
                  <div style={{ minHeight: 320 }}>
                    <ReactQuill theme="snow" value={editForm.content} onChange={(val: string) => setEditForm((f) => ({ ...f, content: val }))} modules={QUILL_MODULES_TEXT} formats={QUILL_FORMATS_TEXT} style={{ height: 280 }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: "16px 24px", gap: 8 }}>
                <button type="button" style={{ padding: "5px 16px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#374151", cursor: "pointer" }} onClick={() => setShowEditModal(false)}>취소</button>
                <button type="button" style={{ padding: "5px 16px", background: "#25A194", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }} onClick={handleEdit} disabled={saving}>{saving ? "저장 중..." : "저장"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
