import { useEffect, useState } from "react";
// [woo] unused: useNavigate 제거
import { Link } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';

export default function NoticeList() {
  const [page, setPage] = useState<any>(null);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const load = (p = 0, kw = keyword) =>
    admin
      .get("/notices", {
        params: { keyword: kw || undefined, page: p, size: 15 },
      })
      .then((r) => {
        setPage(r.data);
        setCurrentPage(p);
      });

  useEffect(() => {
    load();
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    load(0);
  };
  const list = page?.content ?? [];

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
    textAlign: 'left',
  };
  const thCenterStyle: React.CSSProperties = { ...thStyle, textAlign: 'center' };
  const tdStyle: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: 14,
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  };
  const tdCenterStyle: React.CSSProperties = { ...tdStyle, textAlign: 'center' };

  return (
    <AdminLayout>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>공지사항 관리</h5>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>전체 공지사항을 관리합니다.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              to={ADMIN_ROUTES.NOTICES.CREATE}
              style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #25A194, #1a7a6e)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              ✏️ 공지 작성
            </Link>
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* Search bar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>공지사항 목록</span>
          <form onSubmit={search} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="form-control"
              style={{ width: 280, fontSize: 14 }}
              placeholder="제목 검색..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button
              type="submit"
              style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #25A194, #1a7a6e)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              검색
            </button>
            <button
              type="button"
              style={{ padding: '9px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}
              onClick={() => { setKeyword(""); load(0, ""); }}
            >
              초기화
            </button>
          </form>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 80 }} />
              <col />
              <col style={{ width: 120 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 80 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thCenterStyle}>No</th>
                <th style={thStyle}>제목</th>
                <th style={thCenterStyle}>작성자</th>
                <th style={thCenterStyle}>작성일</th>
                <th style={thCenterStyle}>조회</th>
              </tr>
            </thead>
            <tbody>
              {list.map((n: any) => (
                <tr key={n.id}>
                  <td style={tdCenterStyle}>
                    {n.important ? (
                      <span style={{ padding: '2px 8px', background: '#fef2f2', color: '#dc2626', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>중요</span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: 13 }}>{n.id}</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <Link
                      to={ADMIN_ROUTES.NOTICES.DETAIL(n.id)}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#1d4ed8', fontWeight: 500, fontSize: 14, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textDecoration: 'none', display: 'block' }}
                    >
                      {n.title}
                    </Link>
                  </td>
                  <td style={{ ...tdCenterStyle, color: '#6b7280' }}>{n.writerName}</td>
                  <td style={{ ...tdCenterStyle, color: '#6b7280' }}>{n.createDate?.split("T")[0]}</td>
                  <td style={{ ...tdCenterStyle, color: '#6b7280' }}>{n.viewCount}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '40px 16px', color: '#9ca3af' }}>
                    공지사항이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {page && page.totalPages >= 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', borderTop: '1px solid #f3f4f6', gap: 4 }}>
            <button
              onClick={() => { if (!page.first) load(currentPage - 1); }}
              disabled={page.first}
              style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', fontSize: 13, cursor: page.first ? 'default' : 'pointer', color: page.first ? '#d1d5db' : '#374151' }}
            >
              &laquo;
            </button>
            {Array.from({ length: page.totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => load(i)}
                style={{ padding: '6px 12px', border: `1px solid ${i === currentPage ? '#25A194' : '#e5e7eb'}`, borderRadius: 6, fontSize: 13, cursor: 'pointer', background: i === currentPage ? '#25A194' : '#fff', color: i === currentPage ? '#fff' : '#374151', fontWeight: i === currentPage ? 600 : 400 }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => { if (!page.last) load(currentPage + 1); }}
              disabled={page.last}
              style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', fontSize: 13, cursor: page.last ? 'default' : 'pointer', color: page.last ? '#d1d5db' : '#374151' }}
            >
              &raquo;
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
