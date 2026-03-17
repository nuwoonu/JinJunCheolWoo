import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';

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
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await admin.put(`/notices/${id}`, form);
        navigate(ADMIN_ROUTES.NOTICES.DETAIL(id!));
      } else {
        await admin.post("/notices", form);
        navigate(ADMIN_ROUTES.NOTICES.LIST);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="breadcrumb d-flex align-items-center gap-3 mb-24">
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            padding: "4px 10px",
            cursor: "pointer",
            color: "var(--text-secondary-light)",
          }}
        >
          <i className="bi bi-arrow-left" />
        </button>
        <div>
          <h6 className="fw-semibold mb-0">
            {isEdit ? "공지사항 수정" : "신규 공지사항 작성"}
          </h6>
          <p className="text-neutral-600 mt-4 mb-0">
            {isEdit ? "공지사항을 수정합니다." : "새 공지사항을 작성합니다."}
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body p-4">
          <div className="mb-3">
            <label className="form-label fw-bold">제목</label>
            <input
              className="form-control form-control-lg"
              required
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="공지 제목을 입력하세요"
            />
          </div>
          <div className="mb-3">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="isImportant"
                checked={form.isImportant}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isImportant: e.target.checked }))
                }
              />
              <label className="form-check-label fw-bold" htmlFor="isImportant">
                중요 공지로 설정{" "}
                <span className="badge bg-danger ms-1">중요</span>
              </label>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">내용</label>
            <textarea
              className="form-control"
              rows={10}
              required
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value }))
              }
              placeholder="공지 내용을 입력하세요..."
            />
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2 px-24 py-16 border-top border-neutral-200">
          <button
            type="button"
            className="btn btn-secondary px-4 me-2"
            onClick={() => navigate(-1)}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn btn-primary-600 radius-8 px-5"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                저장 중...
              </>
            ) : isEdit ? (
              "수정 완료"
            ) : (
              "등록 완료"
            )}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
