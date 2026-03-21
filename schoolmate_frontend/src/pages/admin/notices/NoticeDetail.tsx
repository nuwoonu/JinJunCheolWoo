import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';

export default function NoticeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<any>(null);

  useEffect(() => {
    admin.get(`/notices/${id}`).then((r) => setNotice(r.data));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("이 공지사항을 삭제하시겠습니까?")) return;
    await admin.delete(`/notices/${id}`);
    navigate(ADMIN_ROUTES.NOTICES.LIST);
  };

  if (!notice)
    return (
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}>
          <div className="spinner-border" />
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(ADMIN_ROUTES.NOTICES.LIST)}
              style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#6b7280', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              ← 뒤로
            </button>
            <div>
              <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>공지사항 상세</h5>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>공지사항 내용을 확인합니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* Card header: title + meta + action buttons */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {notice.important && (
                <span style={{ padding: '2px 8px', background: '#fef2f2', color: '#dc2626', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>중요</span>
              )}
              <h5 style={{ fontWeight: 700, color: '#111827', margin: 0, fontSize: 18 }}>{notice.title}</h5>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              작성자: <strong style={{ color: '#374151' }}>{notice.writerName}</strong>
              {' · '}작성일: {notice.createDate?.split("T")[0]}
              {' · '}조회수: {notice.viewCount}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => navigate(ADMIN_ROUTES.NOTICES.EDIT(id!))}
              style={{ padding: '4px 12px', background: '#fff', border: '1px solid #25A194', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#25A194', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              style={{ padding: '4px 12px', background: '#fff', border: '1px solid #ef4444', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#ef4444', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              삭제
            </button>
          </div>
        </div>

        {/* Content body */}
        <div style={{ padding: 24 }}>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, color: '#374151', fontSize: '0.95rem', margin: 0 }}>
            {notice.content}
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={() => navigate(ADMIN_ROUTES.NOTICES.LIST)}
            style={{ padding: '9px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}
          >
            목록으로
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
