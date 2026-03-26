import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import {
  TEACHER_STATUS,
  ROLE_REQUEST_STATUS,
  STATUS_DEFAULT,
} from '@/constants/statusConfig';
import { ADMIN_ROUTES } from '@/constants/routes';

function getStatusBadgeStyle(statusName: string) {
  const key = statusName?.toUpperCase() ?? '';
  if (['TEACHING', 'EMPLOYED', 'ACTIVE'].includes(key))
    return { background: 'rgba(22,163,74,0.1)', color: '#16a34a' };
  if (['LEAVE', 'DISPATCHED'].includes(key))
    return { background: 'rgba(234,179,8,0.1)', color: '#ca8a04' };
  if (['RETIRED', 'SUSPENDED'].includes(key))
    return { background: 'rgba(239,68,68,0.1)', color: '#dc2626' };
  return { background: '#f3f4f6', color: '#6b7280' };
}

function getRoleRequestBadgeStyle(status: string) {
  switch (status) {
    case 'ACTIVE': return { background: 'rgba(22,163,74,0.1)', color: '#16a34a' };
    case 'PENDING': return { background: 'rgba(14,165,233,0.1)', color: '#0284c7' };
    case 'SUSPENDED': return { background: 'rgba(234,179,8,0.1)', color: '#ca8a04' };
    case 'REJECTED': return { background: 'rgba(239,68,68,0.1)', color: '#dc2626' };
    default: return { background: '#f3f4f6', color: '#6b7280' };
  }
}

const badgeBase: React.CSSProperties = {
  padding: '3px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

export default function TeacherList() {
  const [page, setPage] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("name");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const load = (p = 0) =>
    admin
      .get("/teachers", {
        params: {
          status: status || undefined,
          type,
          keyword: keyword || undefined,
          page: p,
          size: 10,
        },
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
  const toggleAll = (checked: boolean) =>
    setSelected(checked ? list.map((t: any) => t.uid) : []);
  const toggleOne = (uid: string) =>
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid],
    );

  const bulkStatus = async (s: string, label: string) => {
    if (!selected.length) return alert("교사를 선택하세요.");
    if (
      !confirm(
        `선택한 ${selected.length}명을 "${label}" 상태로 변경하시겠습니까?`,
      )
    )
      return;
    await admin.post("/teachers/bulk-status", null, {
      params: { uids: selected, status: s },
    });
    setSelected([]);
    load(currentPage);
  };

  const approveRequest = async (requestId: number) => {
    await admin.post(`/role-requests/${requestId}/approve`);
    load(currentPage);
  };

  const rejectRequest = async (requestId: number) => {
    const reason = window.prompt('거절 사유를 입력하세요.');
    if (reason === null) return;
    await admin.post(`/role-requests/${requestId}/reject`, { reason });
    load(currentPage);
  };

  const uploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await admin.post("/teachers/import-csv", fd);
    } finally {
      setLoading(false);
      load(0);
    }
    e.target.value = "";
  };

  return (
    <AdminLayout>
      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner-border text-light" style={{ width: '3rem', height: '3rem' }} />
            <h5 style={{ color: '#fff', marginTop: 16 }}>교사 데이터를 등록 중입니다...</h5>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>교사 정보 관리</h5>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>교사 계정 및 인사 정보를 관리합니다.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="file"
              ref={csvRef}
              accept=".csv"
              style={{ display: 'none' }}
              onChange={uploadCsv}
            />
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                style={{ padding: '9px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}
                onClick={() => setShowDropdown((v) => !v)}
              >
                선택 상태 변경 ▾
              </button>
              {showDropdown && (
                <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 140, marginTop: 4, overflow: 'hidden' }}>
                  {Object.entries(TEACHER_STATUS).map(([value, { label }]) => (
                    <button
                      key={value}
                      style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: value === 'RETIRED' ? '#ef4444' : '#374151', cursor: 'pointer' }}
                      onClick={() => { bulkStatus(value, label); setShowDropdown(false); }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              style={{ padding: '9px 14px', background: '#fff', border: '1px solid #22c55e', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#16a34a', whiteSpace: 'nowrap' }}
              onClick={() => csvRef.current?.click()}
            >
              CSV 교사 등록
            </button>
            <Link
              to={ADMIN_ROUTES.TEACHERS.CREATE}
              style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #25A194, #1a7a6e)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              신규 교사 등록
            </Link>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>전체 교사 목록</span>
          <form style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }} onSubmit={search}>
            <select
              style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">전체 상태</option>
              {Object.entries(TEACHER_STATUS).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="name">이름</option>
              <option value="email">이메일</option>
              <option value="dept">부서</option>
              <option value="position">직책</option>
              <option value="subject">담당 과목</option>
            </select>
            <input
              style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, minWidth: 150 }}
              placeholder="검색어 입력..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #25A194, #1a7a6e)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }} type="submit">
              검색
            </button>
            <button
              style={{ padding: '9px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}
              type="button"
              onClick={() => { setStatus(""); setType("name"); setKeyword(""); load(0); }}
            >
              초기화
            </button>
          </form>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 50 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 180 }} />
              <col style={{ width: 100 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    style={{ borderColor: '#6b7280' }}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>사번</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>이름</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>이메일</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>부서 / 직책</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>담당 과목</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>재직 상태</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>승인 상태</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'right' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t: any) => (
                <tr key={t.uid}>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', textAlign: 'center', verticalAlign: 'middle' }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      style={{ borderColor: '#6b7280' }}
                      checked={selected.includes(t.uid)}
                      onChange={() => toggleOne(t.uid)}
                    />
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#6b7280', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{t.code}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                    <Link to={ADMIN_ROUTES.TEACHERS.DETAIL(t.uid)} style={{ color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
                      {t.name}
                    </Link>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.email}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                    <span>{t.department}</span>
                    <span style={{ color: '#9ca3af', margin: '0 4px' }}>/</span>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{t.position}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                    <span style={{ padding: '3px 8px', background: '#f3f4f6', color: '#374151', borderRadius: 4, fontSize: 12, whiteSpace: 'nowrap' }}>
                      {t.subject}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                    {(() => {
                      const cfg = TEACHER_STATUS[t.statusName] ?? STATUS_DEFAULT;
                      return (
                        <span style={{ ...badgeBase, ...getStatusBadgeStyle(t.statusName) }}>
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                    {t.roleRequestStatus ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ ...badgeBase, ...getRoleRequestBadgeStyle(t.roleRequestStatus) }}>
                          {(ROLE_REQUEST_STATUS[t.roleRequestStatus] ?? ROLE_REQUEST_STATUS.PENDING).label}
                        </span>
                        {t.roleRequestStatus === 'PENDING' && (
                          <>
                            <button
                              style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}
                              onClick={() => approveRequest(t.roleRequestId)}
                            >승인</button>
                            <button
                              style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}
                              onClick={() => rejectRequest(t.roleRequestId)}
                            >거절</button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: 13 }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle', textAlign: 'right' }}>
                    <Link
                      to={ADMIN_ROUTES.TEACHERS.DETAIL(t.uid)}
                      style={{ padding: '5px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, color: '#374151', textDecoration: 'none', display: 'inline-block' }}
                    >
                      상세보기
                    </Link>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {page && page.totalPages >= 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', borderTop: '1px solid #f3f4f6', gap: 4 }}>
            <button
              onClick={() => load(currentPage - 1)}
              disabled={page.first}
              style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: page.first ? 'not-allowed' : 'pointer', color: page.first ? '#d1d5db' : '#374151', fontSize: 13 }}
            >
              «
            </button>
            {Array.from({ length: page.totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => load(i)}
                style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: i === currentPage ? '#25A194' : '#fff', color: i === currentPage ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13, fontWeight: i === currentPage ? 600 : 400 }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => load(currentPage + 1)}
              disabled={page.last}
              style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: page.last ? 'not-allowed' : 'pointer', color: page.last ? '#d1d5db' : '#374151', fontSize: 13 }}
            >
              »
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
