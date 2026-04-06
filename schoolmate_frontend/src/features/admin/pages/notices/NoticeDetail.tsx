import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from '@/shared/components/layout/admin/AdminLayout';
import admin from '@/shared/api/adminApi';
import { ADMIN_ROUTES } from '@/shared/constants/routes';

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
        <div style={{ textAlign: "center", paddingTop: 48, paddingBottom: 48, color: "#94a3b8" }}>불러오는 중...</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      {/* 상단 목록으로 버튼 */}
      <div style={{ maxWidth: 860, margin: "0 auto 24px" }}>
        <Link
          to={ADMIN_ROUTES.NOTICES.LIST}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#374151", textDecoration: "none", padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontWeight: 500 }}
        >
          <i className="ri-arrow-left-line" />
          목록으로
        </Link>
      </div>

      {/* 게시글 카드 */}
      <div className="card" style={{ maxWidth: 860, margin: "0 auto", borderRadius: 12, overflow: "hidden", minHeight: "calc(100vh - 180px)", border: "1px solid #e2e8f0" }}>
        {/* 카드 헤더: 배지 + 제목 */}
        <div className="card-header" style={{ padding: "20px 24px", borderBottom: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: "#dbeafe", color: "#1d4ed8", display: "inline-block" }}>공지사항</span>
            {notice.important && (
              <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: "#fee2e2", color: "#dc2626", display: "inline-block" }}>중요</span>
            )}
          </div>
          <h5 style={{ fontWeight: 700, marginBottom: 0, lineHeight: 1.5 }}>{notice.title}</h5>
        </div>

        {/* 구분선 */}
        <div style={{ height: 1, background: "#e5e7eb", margin: "0 24px" }} />

        {/* 작성자/날짜/조회수 섹션 */}
        <div style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AvatarIcon name={notice.writerName} />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{notice.writerName}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{formatDateTime(notice.createDate)}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#94a3b8", fontSize: 13, marginLeft: "auto" }}>
              <span><i className="ri-eye-line" style={{ marginRight: 4 }} />{notice.viewCount}</span>
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ height: 1, background: "#e5e7eb", margin: "0 24px" }} />

        {/* 본문 */}
        <div className="card-body" style={{ padding: "20px 24px" }}>
          {notice.content?.includes("<") ? (
            <div
              className="ql-editor"
              style={{ fontSize: 15, lineHeight: 2, color: "#334155", minHeight: 120, padding: 0 }}
              dangerouslySetInnerHTML={{ __html: notice.content }}
            />
          ) : (
            <div style={{ fontSize: 15, lineHeight: 2, color: "#334155", whiteSpace: "pre-wrap", minHeight: 120 }}>
              {notice.content}
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div style={{ height: 1, background: "#e5e7eb", margin: "0 24px" }} />

        {/* 하단 버튼 */}
        <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={{ padding: "5px 10px", background: "#fff", border: "1px solid #25A194", borderRadius: 6, fontSize: 13, color: "#25A194", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
              onClick={() => navigate(ADMIN_ROUTES.NOTICES.EDIT(id!))}
            >
              <i className="ri-edit-line" />수정
            </button>
            <button
              type="button"
              style={{ padding: "5px 10px", background: "#fff", border: "1px solid #ef4444", borderRadius: 6, fontSize: 13, color: "#dc2626", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
              onClick={handleDelete}
            >
              <i className="ri-delete-bin-line" />삭제
            </button>
          </div>
          <Link
            to={ADMIN_ROUTES.NOTICES.LIST}
            style={{ padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#374151", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <i className="ri-list-unordered" />목록
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
