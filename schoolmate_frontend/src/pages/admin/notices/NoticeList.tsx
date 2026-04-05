import { useEffect, useRef, useState } from "react";
// [woo] unused: useNavigate 제거
import { Link } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';

// [soojin] any 대신 Spring Boot 페이지 응답 타입 정의
interface NoticeItem {
  id: number;
  title: string;
  important?: boolean;
  writerName?: string;
  createDate?: string;
  viewCount?: number;
}
interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export default function NoticeList() {
  const [page, setPage] = useState<SpringPage<NoticeItem> | null>(null);
  // [soojin] 전체 공지 수 저장 (초기 로드 시 1회만 세팅) - TeacherList 패턴 통일
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const isInitialLoad = useRef(true);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const load = (p = 0) =>
    admin
      .get("/notices", {
        params: { keyword: keyword || undefined, page: p, size: 15 },
      })
      .then((r) => {
        setPage(r.data);
        setCurrentPage(p);
        // [soojin] 최초 로드 시에만 전체 공지 수 저장
        if (isInitialLoad.current) {
          setTotalAll(r.data.totalElements);
          isInitialLoad.current = false;
        }
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
    fontSize: 13,
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
    fontSize: 13,
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  };
  const tdCenterStyle: React.CSSProperties = { ...tdStyle, textAlign: 'center' };

  return (
    <AdminLayout>
      {/* [soojin] 테이블이 화면 높이를 꽉 채우도록 flex column 컨테이너 */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4.5rem - 48px)' }}>
        {/* [soojin] 제목 + 전체 공지 수 인라인 표시 */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h6 style={{ fontWeight: 700, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            공지 목록
            <span style={{ fontSize: 15, fontWeight: 400, color: '#6b7280' }}>전체 {totalAll ?? 0}건</span>
          </h6>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>전체 공지사항을 관리합니다.</p>
        </div>

        {/* [soojin] 컨트롤 바: 검색(좌) + 버튼들(우) 같은 행 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
          <form style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }} onSubmit={search}>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: '8px', color: '#9ca3af', fontSize: '13px', pointerEvents: 'none' }} />
              <input
                style={{ padding: '5px 8px 5px 28px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, minWidth: 200, background: '#fff' }}
                placeholder="제목 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              style={{ padding: '5px 12px', background: '#25A194', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              검색
            </button>
            <button
              type="button"
              style={{ padding: '5px 10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}
              onClick={() => { setKeyword(""); load(0); }}
            >
              초기화
            </button>
            {/* [soojin] 검색 중일 때만 필터 결과 건수 표시 */}
            {keyword && page && (
              <span style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600, color: '#111827' }}>{page.totalElements}건</span> / 전체 {totalAll ?? 0}건
              </span>
            )}
          </form>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              to={ADMIN_ROUTES.NOTICES.CREATE}
              style={{ padding: '5px 12px', background: '#25A194', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              공지 작성
            </Link>
          </div>
        </div>

        {/* [soojin] 카드: flex:1로 남은 공간 꽉 채움 */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* [soojin] overflowX 래퍼 제거, tableLayout auto, colgroup 제거 → 브라우저 자동 컬럼 분배 */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
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
                {list.map((n) => (
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
                    <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
                      공지사항이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* [soojin] 페이지네이션 카드 밖, 우측 정렬, 28×28 정사각형 버튼 */}
        {page && page.totalPages >= 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 0', gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => { if (!page.first) load(currentPage - 1); }}
              disabled={page.first}
              style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: page.first ? 'not-allowed' : 'pointer', color: page.first ? '#d1d5db' : '#374151', fontSize: 12 }}
            >
              ‹
            </button>
            {Array.from({ length: page.totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => load(i)}
                style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${i === currentPage ? '#25A194' : '#e5e7eb'}`, borderRadius: 6, background: i === currentPage ? '#25A194' : '#fff', color: i === currentPage ? '#fff' : '#374151', cursor: 'pointer', fontSize: 12, fontWeight: i === currentPage ? 600 : 400 }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => { if (!page.last) load(currentPage + 1); }}
              disabled={page.last}
              style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: page.last ? 'not-allowed' : 'pointer', color: page.last ? '#d1d5db' : '#374151', fontSize: 12 }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
