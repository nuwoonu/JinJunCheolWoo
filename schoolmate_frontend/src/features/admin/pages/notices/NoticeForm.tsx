import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactQuill, QUILL_MODULES_TEXT, QUILL_FORMATS_TEXT, isQuillEmpty } from "@/shared/types/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import AdminLayout from '@/shared/components/layout/admin/AdminLayout';
import admin from '@/shared/api/adminApi';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import { useAdminMsg, apiErrMsg } from '@/shared/hooks/useAdminMsg';

export default function NoticeForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    title: "",
    isImportant: false,
    content: "",
  });
  const [saving, setSaving] = useState(false);
  const { error, setError } = useAdminMsg();

  useEffect(() => {
    if (isEdit) {
      admin.get(`/notices/${id}`).then((r) => {
        const d = r.data;
        setForm({
          title: d.title ?? "",
          isImportant: d.important ?? false,
          content: d.content ?? "",
        });
      });
    }
  }, [id, isEdit]); // [soojin] isEdit 의존성 추가 — isEdit 변경 시에도 재조회 필요

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || isQuillEmpty(form.content)) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await admin.put(`/notices/${id}`, form);
        navigate(ADMIN_ROUTES.NOTICES.DETAIL(id!));
      } else {
        await admin.post("/notices", form);
        navigate(ADMIN_ROUTES.NOTICES.LIST);
      }
    } catch (err: unknown) {
      setError(apiErrMsg(err, "저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout error={error}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>
          {isEdit ? "공지사항 수정" : "신규 공지사항 작성"}
        </h6>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
          {isEdit ? "공지사항을 수정합니다." : "새 공지사항을 작성합니다."}
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ marginTop: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#6b7280", fontSize: 13 }}
        >
          ← 목록으로
        </button>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ padding: 24 }}>
            {/* Title */}
            <div className="mb-16">
              <label className="form-label fw-semibold text-sm">제목 *</label>
              <input
                type="text"
                className="form-control"
                placeholder="제목을 입력하세요"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Content */}
            <div className="mb-16">
              <label className="form-label fw-semibold text-sm">내용 *</label>
              <div style={{ minHeight: 280 }}>
                <ReactQuill
                  theme="snow"
                  value={form.content}
                  onChange={(val: string) => setForm((f) => ({ ...f, content: val }))}
                  modules={QUILL_MODULES_TEXT}
                  formats={QUILL_FORMATS_TEXT}
                  placeholder="내용을 입력하세요"
                  style={{ height: 250 }}
                />
              </div>
            </div>

            {/* Important checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 30 }}>
              <input
                type="checkbox"
                id="isImportant"
                checked={form.isImportant}
                onChange={(e) => setForm((f) => ({ ...f, isImportant: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#25A194", appearance: "auto", WebkitAppearance: "auto", opacity: 1 }}
              />
              <label htmlFor="isImportant" style={{ fontSize: 13, fontWeight: 500, color: "#374151", cursor: "pointer", marginBottom: 0 }}>
                중요 공지로 설정
              </label>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24, paddingTop: 16, borderTop: "1px solid #e5e7eb", padding: "16px 24px" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, padding: "5px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ background: saving ? "#9ca3af" : "#25A194", color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontWeight: 600, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "저장 중..." : isEdit ? "수정 완료" : "등록 완료"}
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
