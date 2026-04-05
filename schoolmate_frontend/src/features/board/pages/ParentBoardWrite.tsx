import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ReactQuill, QUILL_MODULES, QUILL_FORMATS, isQuillEmpty } from "@/shared/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import api from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [soojin] /board/parent/write - 학부모 게시판 작성 (ClassBoardWrite.tsx 형식)
// PARENT, TEACHER, ADMIN 작성 가능 / 파일 첨부 전체 허용

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

export default function ParentBoardWrite() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const isParent = user?.role === "PARENT";
  const isTeacher = user?.role === "TEACHER";
  const isAdmin = user?.role === "ADMIN";

  // [soojin] 학부모: 선택된 자녀 uid
  const selectedChildId = isParent ? sessionStorage.getItem("selectedChildId") : null;

  useEffect(() => {
    if (!["PARENT", "TEACHER", "ADMIN"].includes(user?.role ?? "")) {
      navigate("/board/parent");
    }
  }, [user?.role]);

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
        results.push({ originalName: file.name, storedName: res.data.filename, fileSize: file.size, fileType: file.type });
      }
      setUploadedFiles((prev) => [...prev, ...results]);
    } catch {
      alert("파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { alert("제목을 입력해주세요."); return; }
    if (isQuillEmpty(content)) { alert("내용을 입력해주세요."); return; }
    setSaving(true);
    try {
      await api.post("/board", {
        boardType: "PARENT_BOARD",
        title,
        content,
        tag: selectedTag,
        attachmentFiles: uploadedFiles.length > 0 ? uploadedFiles : null,
        // [soojin] 학부모 사용자인 경우 선택된 자녀 uid 전달
        ...(selectedChildId ? { studentUserUid: Number(selectedChildId) } : {}),
      });
      navigate("/board/parent");
    } catch {
      alert("게시글 작성에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: "0 auto 24px" }}>
        <Link
          to="/board/parent"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#374151", textDecoration: "none", padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontWeight: 500 }}
        >
          <i className="ri-arrow-left-line" />
          목록으로
        </Link>
      </div>

      <div className="card" style={{ maxWidth: 900, margin: "0 auto", borderRadius: 12 }}>
        <div className="card-body" style={{ padding: 24 }}>
          {/* 태그 선택 */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
              태그 <span style={{ fontWeight: 400, color: "#9ca3af" }}>(선택사항)</span>
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {BOARD_TAGS.map((tag) => {
                const colors = TAG_COLORS[tag];
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    style={{ padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, border: `2px solid ${isSelected ? colors.selectedBg : colors.bg}`, background: isSelected ? colors.selectedBg : colors.bg, color: isSelected ? "#fff" : colors.color, cursor: "pointer", transition: "all 0.15s" }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 제목 */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>제목 *</label>
            <input
              type="text"
              className="form-control"
              placeholder="게시글 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: 15, padding: "10px 14px" }}
            />
          </div>

          {/* 에디터 */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>내용 *</label>
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

          {/* 파일 첨부 — PARENT, TEACHER, ADMIN 모두 업로드 가능 */}
          <div style={{ marginBottom: 20, marginTop: 60 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
              첨부파일 <span style={{ fontWeight: 400, color: "#9ca3af" }}>(선택사항)</span>
            </label>
            {uploadedFiles.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <i className="ri-file-line text-primary-600" style={{ fontSize: 16 }} />
                      <div>
                        <p style={{ fontWeight: 500, marginBottom: 0, fontSize: 13 }}>{file.originalName}</p>
                        <p style={{ color: "#94a3b8", marginBottom: 0, fontSize: 11 }}>{formatFileSize(file.fileSize)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{ padding: "3px 8px", background: "#fff", border: "1px solid #ef4444", borderRadius: 6, fontSize: 12, color: "#dc2626", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                      onClick={() => handleRemoveFile(idx)}
                    >
                      <i className="ri-close-line" />제거
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* [soojin] PARENT, TEACHER, ADMIN 모두 파일 업로드 가능 */}
            {(isParent || isTeacher || isAdmin) && (
              <>
                <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />
                <button
                  type="button"
                  style={{ padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#374151", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
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
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              style={{ padding: "5px 20px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#374151", cursor: "pointer" }}
              onClick={() => navigate("/board/parent")}
            >
              취소
            </button>
            <button
              type="button"
              style={{ padding: "5px 20px", background: "#25A194", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
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
