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
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#6b7280', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              ← 뒤로
            </button>
            <div>
              <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                {isEdit ? "공지사항 수정" : "신규 공지사항 작성"}
              </h5>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                {isEdit ? "공지사항을 수정합니다." : "새 공지사항을 작성합니다."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ padding: 24 }}>
            {/* Title */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                제목
              </label>
              <input
                className="form-control form-control-lg"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="공지 제목을 입력하세요"
              />
            </div>

            {/* Important checkbox */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="isImportant"
                  checked={form.isImportant}
                  onChange={(e) => setForm((f) => ({ ...f, isImportant: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label
                  htmlFor="isImportant"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', marginBottom: 0 }}
                >
                  중요 공지로 설정
                  <span style={{ padding: '2px 8px', background: '#fef2f2', color: '#dc2626', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>중요</span>
                </label>
              </div>
            </div>

            {/* Content */}
            <div style={{ marginBottom: 4 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                내용
              </label>
              <textarea
                className="form-control"
                rows={10}
                required
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="공지 내용을 입력하세요..."
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
            <button
              type="button"
              style={{ padding: '9px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}
              onClick={() => navigate(-1)}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '9px 18px', background: saving ? '#9ca3af' : 'linear-gradient(135deg, #25A194, #1a7a6e)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {saving ? "저장 중..." : isEdit ? "수정 완료" : "등록 완료"}
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
