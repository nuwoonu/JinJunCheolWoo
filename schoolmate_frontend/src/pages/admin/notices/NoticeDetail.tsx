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
        <div className="text-center py-5">
          <div className="spinner-border" />
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="breadcrumb d-flex align-items-center gap-3 mb-24">
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.NOTICES.LIST)}
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
        <h6 className="fw-semibold mb-0">공지사항 상세</h6>
      </div>

      <div className="card">
        <div className="d-flex align-items-start justify-content-between px-20 py-16 border-bottom border-neutral-200">
          <div>
            <h5 className="mb-2 fw-bold">
              {notice.important && (
                <span className="badge bg-danger me-2">중요</span>
              )}
              {notice.title}
            </h5>
            <p className="mb-0 text-muted small">
              작성자: <strong>{notice.writerName}</strong> · 작성일:{" "}
              {notice.createDate?.split("T")[0]} · 조회수: {notice.viewCount}
            </p>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary btn-sm radius-8"
              onClick={() => navigate(ADMIN_ROUTES.NOTICES.EDIT(id!))}
            >
              <i className="bi bi-pencil" /> 수정
            </button>
            <button
              className="btn btn-outline-danger btn-sm radius-8"
              onClick={handleDelete}
            >
              <i className="bi bi-trash" /> 삭제
            </button>
          </div>
        </div>
        <div className="card-body p-24">
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              fontSize: "1rem",
            }}
          >
            {notice.content}
          </pre>
        </div>
        <div className="px-20 py-16 border-top border-neutral-200">
          <button
            className="btn btn-outline-secondary radius-8"
            onClick={() => navigate(ADMIN_ROUTES.NOTICES.LIST)}
          >
            <i className="bi bi-list" /> 목록으로
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
