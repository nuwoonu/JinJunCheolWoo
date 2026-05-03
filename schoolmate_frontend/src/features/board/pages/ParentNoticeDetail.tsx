import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ReactQuill, QUILL_MODULES_TEXT, QUILL_FORMATS_TEXT, isQuillEmpty } from "@/shared/types/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import api from "@/shared/api/authApi";
import { useAuth } from "@/shared/contexts/AuthContext";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import ParentBackButton from "@/shared/components/ParentBackButton";

// [soojin] /board/parent-notice/:id - 가정통신문 상세 (ClassBoardDetail.tsx 형식으로 UI 통일)

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

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AvatarIcon({ name }: { name: string }) {
  return (
    <div style={{ width: 36, height: 36, fontSize: 14, fontWeight: 700, background: "#f97316", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
      {name ? name.charAt(0) : "?"}
    </div>
  );
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
  // [woo 03/25] 학부모 역할 확인
  const isParent = user?.role === "PARENT";
  // [soojin] StrictMode 이중 실행 방지 - 조회수 POST를 최초 1회만 호출
  const viewedRef = useRef(false);

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

  // [woo] 파일 확장자 추출
  const getExt = (url: string) => url.split(".").pop()?.toLowerCase() ?? "";

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: "center", paddingTop: 48, paddingBottom: 48, color: "#94a3b8" }}>불러오는 중...</div>
      </DashboardLayout>
    );
  }
  if (!board) return null;

  const ext = board.attachmentUrl ? getExt(board.attachmentUrl) : "";

  return (
    <DashboardLayout>
      {/* [soojin] 상단 목록으로 버튼 */}
      <div style={{ maxWidth: 860, margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link
          to="/board/parent-notice"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#374151", textDecoration: "none", padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontWeight: 500 }}
        >
          <i className="ri-arrow-left-line" />
          목록으로
        </Link>
        <ParentBackButton />
      </div>

      {/* [soojin] 게시글 카드 — ClassBoardDetail 형식 */}
      {/* [soojin] overflow:hidden — card-header border-radius를 카드 radius(12)로 클리핑 */}
      {/* [soojin] minHeight: calc(100vh - 180px) — 헤더(72px)+패딩+버튼영역 제외한 나머지 뷰포트 채움, 내용 많으면 페이지 스크롤 */}
      <div className="card" style={{ maxWidth: 860, margin: "0 auto", borderRadius: 12, overflow: "hidden", minHeight: "calc(100vh - 180px)", border: "1px solid #e2e8f0" }}>
        {/* [soojin] borderBottom 제거 → 아래 구분선으로 대체 */}
        <div className="card-header" style={{ padding: "20px 24px", borderBottom: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: "#fef9c3", color: "#ca8a04", display: "inline-block" }}>가정통신문</span>
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

        {/* [woo] PDF 첨부파일: 가로 맞춤, 여백 최소화 */}
        {/* [woo] PDF/HWP/HWPX 첨부파일 미리보기 */}
        {(ext === "pdf" || ext === "hwp" || ext === "hwpx") && board.attachmentUrl && (
          <div style={{ background: "#f5f5f5", overflow: "hidden" }}>
            <iframe
              src={
                ext === "pdf"
                  ? `${board.attachmentUrl}#view=FitH&toolbar=0&navpanes=0`
                  : `https://docs.google.com/viewer?url=${encodeURIComponent("https://schoolmatedeploy.duckdns.org" + board.attachmentUrl)}&embedded=true`
              }
              style={{ width: "100%", height: 800, border: "none", display: "block" }}
              title="파일 미리보기"
            />
          </div>
        )}

        {/* 본문 (미리보기 불가 파일일 때) */}
        {ext !== "pdf" && ext !== "hwp" && ext !== "hwpx" && (
          <div className="card-body" style={{ padding: "20px 24px" }}>
            {board.content.includes("<") ? (
              <div
                className="ql-editor"
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
                style={{ fontSize: 15, lineHeight: 2, color: "#334155", minHeight: 120, padding: 0 }}
                dangerouslySetInnerHTML={{ __html: board.content }}
              />
            ) : (
              <div style={{ fontSize: 15, lineHeight: 2, color: "#334155", whiteSpace: "pre-wrap", minHeight: 120 }}>
                {board.content}
              </div>
            )}
            {/* [woo] DOCX 프리뷰 — 원본 A4 그대로, 넘치면 좌우 스크롤 */}
            {ext === "docx" && board.attachmentUrl && (
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #e5e7eb" }}>
                <div ref={docxRef} style={{ minHeight: 200, overflowX: "auto" }} />
              </div>
            )}
          </div>
        )}

        {/* [soojin] 첨부파일 다운로드 — ClassBoardDetail 첨부파일 UI 형식으로 통일 */}
        {board.attachmentUrl && (
          <>
            <div style={{ height: 1, background: "#e5e7eb", margin: "0 24px" }} />
            <div style={{ padding: "16px 24px" }}>
              <p style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>
                <i className="ri-attachment-line text-primary-600" style={{ marginRight: 6 }} />첨부파일 (1)
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <i className="ri-file-line text-primary-600" style={{ fontSize: 18 }} />
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{board.attachmentUrl.split("/").pop()}</span>
                </div>
                <a href={board.attachmentUrl} download style={{ fontSize: 12, padding: "4px 10px", border: "1px solid #3b82f6", borderRadius: 8, color: "#3b82f6", background: "#fff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <i className="ri-download-line" />다운로드
                </a>
              </div>
            </div>
          </>
        )}

        {/* [soojin] 구분선 */}
        <div style={{ height: 1, background: "#e5e7eb", margin: "0 24px" }} />
        {/* [soojin] 하단 버튼 — 수정/삭제를 footer에서 이동 */}
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
          <Link to="/board/parent-notice" style={{ padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#374151", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
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
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>내용</label>
                  <div style={{ minHeight: 320 }}>
                    <ReactQuill theme="snow" value={editForm.content} onChange={(val: string) => setEditForm((f) => ({ ...f, content: val }))} modules={QUILL_MODULES_TEXT} formats={QUILL_FORMATS_TEXT} style={{ height: 280 }} />
                  </div>
                </div>
                {/* [woo] 첨부파일 */}
                <div style={{ marginTop: 16 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>첨부파일 (PDF, DOCX)</label>
                  {editForm.attachmentUrl && !editFile && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: 10, borderRadius: 6, background: "#f0faf8", border: "1px solid #c8ede8" }}>
                      <i className="ri-file-line text-success-600" />
                      <span style={{ fontSize: 13 }}>{editForm.attachmentUrl.split("/").pop()}</span>
                      <button type="button" className="btn-close ms-auto" style={{ fontSize: 10 }} onClick={() => setEditForm((f) => ({ ...f, attachmentUrl: "" }))} />
                    </div>
                  )}
                  <input type="file" className="form-control" accept=".pdf,.docx,.doc,.hwp,.hwpx" onChange={(e) => setEditFile(e.target.files?.[0] ?? null)} />
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
