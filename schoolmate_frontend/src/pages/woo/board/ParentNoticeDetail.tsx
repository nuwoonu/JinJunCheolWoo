import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ReactQuill, QUILL_MODULES_TEXT, QUILL_FORMATS_TEXT, isQuillEmpty } from "@/shared/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import api from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo] /board/parent-notice/:id - 가정통신문 상세 (개선된 UI)

interface Board {
  id: number;
  title: string;
  content: string;
  writerName: string;
  writerId: number;
  viewCount: number;
  pinned: boolean;
  createDate: string;
  targetClassroomName?: string;
  attachmentUrl?: string;
}

export default function ParentNoticeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "", attachmentUrl: "" });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // [woo] docx 프리뷰 컨테이너 ref
  const docxRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";
  // [woo] StrictMode 이중 실행 방지 - 조회수 POST를 최초 1회만 호출
  const viewedRef = useRef(false);

  // [woo 03/25] 학부모 역할 확인
  const isParent = user?.role === "PARENT";

  useEffect(() => {
    if (!id) return;
    api
      .get(`/board/${id}`)
      .then((res) => {
        setBoard(res.data);
        setEditForm({ title: res.data.title, content: res.data.content, attachmentUrl: res.data.attachmentUrl ?? "" });
        if (!viewedRef.current) {
          viewedRef.current = true;
          api.post(`/board/${id}/view`).catch(() => {});
          // [woo 03/25] 학부모: 상세 진입 시 읽음 처리 (목록 외 직접 접근 대응)
          if (isParent) {
            api.post(`/board/${id}/read`).catch(() => {});
          }
        }
      })
      .catch(() => navigate("/board/parent-notice"))
      .finally(() => setLoading(false));
  }, [id]);

  // [woo] docx 첨부파일 렌더링
  useEffect(() => {
    if (!board?.attachmentUrl || !docxRef.current) return;
    const url = board.attachmentUrl;
    if (!url.match(/\.(docx)$/i)) return;
    // [woo] docx-preview: 렌더 후 컨테이너에 맞게 scale 축소
    import("docx-preview").then(({ renderAsync }) => {
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((buf) => renderAsync(buf, docxRef.current!, undefined, { inWrapper: false }))
        .then(() => {
          if (!docxRef.current) return;
          const container = docxRef.current;
          const section = container.querySelector("section.docx") as HTMLElement;
          if (!section) return;
          // [woo] section 내부 여백 균등화
          section.style.padding = "20px";
          section.style.boxSizing = "border-box";
          // [woo] 테이블/이미지 폭 제한
          container.querySelectorAll("table").forEach((t) => {
            t.style.width = "100%";
            t.style.maxWidth = "100%";
            t.style.tableLayout = "auto";
          });
          container.querySelectorAll("td, th").forEach((c) => {
            (c as HTMLElement).style.removeProperty("width");
          });
          container.querySelectorAll("col").forEach((c) => {
            (c as HTMLElement).style.removeProperty("width");
          });
          container.querySelectorAll("img").forEach((img) => {
            (img as HTMLElement).style.maxWidth = "100%";
            (img as HTMLElement).style.height = "auto";
          });
          // [woo] 원본 A4 폭과 컨테이너 폭 비교 → scale 적용
          const sectionW = section.offsetWidth;
          const containerW = container.clientWidth;
          if (sectionW > containerW) {
            const ratio = containerW / sectionW;
            section.style.transformOrigin = "top left";
            section.style.transform = `scale(${ratio})`;
            container.style.height = `${section.offsetHeight * ratio}px`;
            container.style.overflow = "hidden";
          }
        })
        .catch(() => {});
    });
  }, [board?.attachmentUrl]);

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
      let attachmentUrl = editForm.attachmentUrl;
      // [woo] 새 파일 선택 시 먼저 업로드
      if (editFile) {
        const fd = new FormData();
        fd.append("file", editFile);
        const uploadRes = await api.post("/board/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        attachmentUrl = uploadRes.data.url;
      }
      await api.put(`/board/${id}`, {
        boardType: "PARENT_NOTICE",
        title: editForm.title,
        content: editForm.content,
        attachmentUrl,
      });
      setShowEditModal(false);
      setEditFile(null);
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
      navigate("/board/parent-notice");
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  // [woo] 날짜 포맷
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  // [woo] 파일 확장자 추출
  const getExt = (url: string) => url.split(".").pop()?.toLowerCase() ?? "";

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
      </DashboardLayout>
    );
  }

  if (!board) return null;

  const ext = board.attachmentUrl ? getExt(board.attachmentUrl) : "";

  return (
    <DashboardLayout>
      {/* [woo] 상단 브레드크럼 */}
      <div className="d-flex align-items-center gap-8 mb-24">
        <Link
          to="/board/parent-notice"
          className="w-36-px h-36-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center text-secondary-light"
        >
          <i className="ri-arrow-left-line text-lg" />
        </Link>
        <h5 className="fw-bold mb-0">가정통신문</h5>
      </div>

      {/* [woo] 메인 콘텐츠 카드 */}
      <div className="card border-0 radius-12 shadow-sm">
        {/* 헤더 */}
        <div
          className="card-header bg-white py-24 px-28 border-bottom border-neutral-100"
          style={{ borderRadius: "12px 12px 0 0" }}
        >
          <div className="d-flex align-items-start gap-12 mb-16">
            {board.pinned && (
              <span className="badge bg-danger-100 text-danger-600 text-xs px-10 py-6 rounded-pill flex-shrink-0">
                <i className="ri-pushpin-line me-4" />
                고정
              </span>
            )}
          </div>
          <h4 className="fw-bold mb-16" style={{ lineHeight: 1.5 }}>
            {board.title}
          </h4>
          <div className="d-flex flex-wrap align-items-center gap-16 text-secondary-light text-sm">
            <div className="d-flex align-items-center gap-8">
              <div className="w-32-px h-32-px rounded-circle bg-primary-100 d-flex align-items-center justify-content-center">
                <i className="ri-user-line text-primary-600 text-sm" />
              </div>
              <span className="fw-medium">{board.writerName}</span>
            </div>
            <span className="d-flex align-items-center gap-4">
              <i className="ri-calendar-line" />
              {formatDate(board.createDate)}
            </span>
            <span className="d-flex align-items-center gap-4">
              <i className="ri-eye-line" />
              조회 {board.viewCount}
            </span>
          </div>
        </div>

        {/* [woo] PDF 첨부파일: 가로 맞춤, 여백 최소화 */}
        {ext === "pdf" && board.attachmentUrl && (
          <div style={{ background: "#f5f5f5", overflow: "hidden" }}>
            <iframe
              src={`${board.attachmentUrl}#view=FitH&toolbar=0&navpanes=0`}
              style={{ width: "100%", height: 800, border: "none", display: "block" }}
              title="PDF 미리보기"
            />
          </div>
        )}

        {/* [woo] 본문 (PDF가 아닐 때) */}
        {ext !== "pdf" && (
          <div className="card-body px-28 py-32">
            {board.content.includes("<") ? (
              <div
                className="ql-editor board-content-view"
                ref={(el) => {
                  if (!el) return;
                  // [woo] 인라인 width 제거 — 테이블이 카드 밖으로 넘치는 문제 해결
                  el.querySelectorAll("table").forEach((t) => {
                    t.style.width = "100%";
                    t.style.maxWidth = "100%";
                    t.style.tableLayout = "auto";
                  });
                  el.querySelectorAll("td, th").forEach((c) => {
                    (c as HTMLElement).style.width = "";
                  });
                  el.querySelectorAll("img").forEach((img) => {
                    img.style.maxWidth = "100%";
                    img.style.height = "auto";
                  });
                }}
                style={{ minHeight: 200, lineHeight: 1.8, padding: 0, fontSize: "15px" }}
                dangerouslySetInnerHTML={{ __html: board.content }}
              />
            ) : (
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 2, fontSize: "15px", color: "#333" }}>
                {board.content}
              </div>
            )}

            {/* [woo] DOCX 프리뷰 — 원본 A4 그대로, 넘치면 좌우 스크롤 */}
            {ext === "docx" && board.attachmentUrl && (
              <div className="mt-32 pt-24 border-top border-neutral-100">
                <div
                  ref={docxRef}
                  style={{
                    minHeight: 200,
                    overflowX: "auto",
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* [woo] 파일명 + 다운로드 버튼 — 프리뷰 아래 */}
        {board.attachmentUrl && (
          <div className="px-28 py-16 border-top border-neutral-100 d-flex align-items-center gap-8">
            <i className="ri-attachment-2 text-primary-600" />
            <span className="fw-semibold text-sm">{board.attachmentUrl.split("/").pop()}</span>
            <a
              href={board.attachmentUrl}
              download
              className="btn btn-sm btn-outline-neutral-300 radius-6 ms-auto d-flex align-items-center gap-4"
            >
              <i className="ri-download-line" />
              다운로드
            </a>
          </div>
        )}

        {/* [woo] 하단 */}
        <div
          className="card-footer bg-white py-16 px-28 border-top border-neutral-100 d-flex align-items-center justify-content-between"
          style={{ borderRadius: "0 0 12px 12px" }}
        >
          <Link
            to="/board/parent-notice"
            className="btn btn-outline-neutral-300 radius-8 d-flex align-items-center gap-6"
            style={{ width: "fit-content" }}
          >
            <i className="ri-list-unordered" />
            목록으로
          </Link>
          {/* [woo] 수정/삭제 버튼 - 교사/관리자만 */}
          {(isAdmin || isTeacher) && (
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
          )}
        </div>
      </div>

      {/* [woo] 수정 모달 */}
      {showEditModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">
                  <i className="ri-edit-line me-8 text-primary-600" />
                  가정통신문 수정
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
                <div className="mb-16">
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
                {/* [woo] 첨부파일 */}
                <div className="mt-16">
                  <label className="form-label fw-semibold text-sm">첨부파일 (PDF, DOCX)</label>
                  {editForm.attachmentUrl && !editFile && (
                    <div
                      className="d-flex align-items-center gap-8 mb-8 p-10 radius-6"
                      style={{ background: "#f0faf8", border: "1px solid #c8ede8" }}
                    >
                      <i className="ri-file-line text-success-600" />
                      <span className="text-sm text-dark">{editForm.attachmentUrl.split("/").pop()}</span>
                      <button
                        type="button"
                        className="btn-close ms-auto"
                        style={{ fontSize: 10 }}
                        onClick={() => setEditForm((f) => ({ ...f, attachmentUrl: "" }))}
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.docx,.doc"
                    onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
                  />
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
