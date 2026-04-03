import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ReactQuill, QUILL_MODULES, QUILL_FORMATS, isQuillEmpty } from "@/shared/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import api from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [soojin] /board/class-board/write - 학급 게시판 작성 (교사/학생/관리자)
// 태그 선택 + 다중 파일 업로드 지원

// [soojin] 고정 태그 목록 및 색상 정의
const BOARD_TAGS = ["질문", "모임", "유머", "공지"] as const;
const TAG_COLORS: Record<string, { bg: string; color: string; selectedBg: string }> = {
  질문: { bg: "#eff6ff", color: "#3b82f6", selectedBg: "#3b82f6" },
  모임: { bg: "#f0fdf4", color: "#16a34a", selectedBg: "#16a34a" },
  유머: { bg: "#fefce8", color: "#ca8a04", selectedBg: "#ca8a04" },
  공지: { bg: "#fef2f2", color: "#ef4444", selectedBg: "#ef4444" },
};

interface UploadedFile {
  originalName: string;
  storedName: string;
  fileSize: number;
  fileType: string;
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function ClassBoardWrite() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  // [soojin] 업로드된 파일 목록 (originalName, storedName, fileSize, fileType)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const isTeacher = user?.role === "TEACHER";
  const isAdmin = user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";

  useEffect(() => {
    if (!isTeacher && !isAdmin && !isStudent) {
      navigate("/board/class-board");
    }
  }, [isTeacher, isAdmin, isStudent]);

  // [soojin] 파일 선택 시 업로드 처리 (다중 파일, 기존 목록에 추가)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const results: UploadedFile[] = [];
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const res = await api.post("/board/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        results.push({
          originalName: file.name,
          storedName: res.data.filename,
          fileSize: file.size,
          fileType: file.type,
        });
      }
      setUploadedFiles((prev) => [...prev, ...results]);
    } catch {
      alert("파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      // [soojin] 같은 파일 재선택 가능하도록 input 초기화
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // [soojin] 업로드된 파일 목록에서 제거
  const handleRemoveFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { alert("제목을 입력해주세요."); return; }
    if (isQuillEmpty(content)) { alert("내용을 입력해주세요."); return; }
    setSaving(true);
    try {
      await api.post("/board", {
        boardType: "CLASS_BOARD",
        title,
        content,
        tag: selectedTag,
        // [soojin] 다중 첨부파일 목록 전달
        attachmentFiles: uploadedFiles.length > 0 ? uploadedFiles : null,
      });
      navigate("/board/class-board");
    } catch {
      alert("게시글 작성에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      {/* 상단 헤더 */}
      <div className="d-flex align-items-center gap-8 mb-24">
        <Link
          to="/board/class-board"
          className="w-36-px h-36-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center text-secondary-light"
        >
          <i className="ri-arrow-left-line text-lg" />
        </Link>
        <h5 className="fw-bold mb-0">학급 게시판 작성</h5>
      </div>

      {/* 작성 폼 */}
      <div className="card radius-12" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="card-body p-24">

          {/* [soojin] 태그 선택 배지 (선택사항) */}
          <div className="mb-20">
            <label className="form-label fw-semibold text-sm">
              태그 <span style={{ fontWeight: 400, color: "#9ca3af" }}>(선택사항)</span>
            </label>
            <div className="d-flex gap-8 flex-wrap">
              {BOARD_TAGS.map((tag) => {
                const colors = TAG_COLORS[tag];
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 700,
                      border: `2px solid ${isSelected ? colors.selectedBg : colors.bg}`,
                      background: isSelected ? colors.selectedBg : colors.bg,
                      color: isSelected ? "#fff" : colors.color,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 제목 */}
          <div className="mb-20">
            <label className="form-label fw-semibold text-sm">제목 *</label>
            <input
              type="text"
              className="form-control"
              placeholder="게시글 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: 15, padding: "10px 14px" }}
            />
          </div>

          {/* WYSIWYG 에디터 */}
          <div className="mb-20">
            <label className="form-label fw-semibold text-sm">내용 *</label>
            <div style={{ minHeight: 300 }}>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="게시글 내용을 입력하세요"
                style={{ height: 280 }}
              />
            </div>
          </div>

          {/* [soojin] 다중 파일 업로드 */}
          <div className="mb-20" style={{ marginTop: 60 }}>
            <label className="form-label fw-semibold text-sm">
              첨부파일 <span style={{ fontWeight: 400, color: "#9ca3af" }}>(선택사항)</span>
            </label>

            {/* 업로드된 파일 목록 */}
            {uploadedFiles.length > 0 && (
              <div className="d-flex flex-column gap-8 mb-10">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="d-flex align-items-center justify-content-between px-14 py-10 radius-8"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                  >
                    <div className="d-flex align-items-center gap-10">
                      <i className="ri-file-line text-primary-600" style={{ fontSize: 16 }} />
                      <div>
                        <p className="fw-medium mb-0" style={{ fontSize: 13 }}>{file.originalName}</p>
                        <p className="text-secondary-light mb-0" style={{ fontSize: 11 }}>{formatFileSize(file.fileSize)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger radius-8 d-flex align-items-center gap-4"
                      style={{ fontSize: 12 }}
                      onClick={() => handleRemoveFile(idx)}
                    >
                      <i className="ri-close-line" />제거
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* [soojin] 파일 선택 버튼 (교사만 업로드 가능 — 백엔드에서도 권한 체크) */}
            {(isTeacher || isAdmin) && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="btn btn-outline-neutral-300 radius-8 d-flex align-items-center gap-6"
                  style={{ fontSize: 13 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <i className="ri-upload-line" />
                  {uploading ? "업로드 중..." : "파일 선택"}
                </button>
              </>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="d-flex justify-content-end gap-8">
            <button
              type="button"
              className="btn btn-outline-neutral-300 radius-8 px-20"
              onClick={() => navigate("/board/class-board")}
            >
              취소
            </button>
            <button
              type="button"
              className="btn btn-primary-600 radius-8 px-20 d-flex align-items-center gap-6"
              onClick={handleSubmit}
              disabled={saving || uploading}
            >
              {saving ? "저장 중..." : <><i className="ri-check-line" />등록</>}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
