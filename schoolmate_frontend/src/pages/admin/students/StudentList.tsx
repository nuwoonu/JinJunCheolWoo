import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import { STUDENT_STATUS } from '@/constants/statusConfig';
import { ADMIN_ROUTES } from '@/constants/routes';

// [joon] 학생 목록
const STATUSES = Object.entries(STUDENT_STATUS).map(([value, cfg], i) => ({
  value,
  label: cfg.label,
  danger: i >= 2, // DROPOUT, EXPELLED, GRADUATED, TRANSFERRED
}));

function formatClass(raw: string | null | undefined) {
  if (!raw || raw === "-") return "-";
  // 백엔드 형식: "2026년 1학년 1반" (이미 변환된 경우) 또는 "2026년 1-1-1" (레거시)
  const legacy = raw.match(/^(\d+)년\s*(\d+)-(\d+)(?:-\d+)?$/);
  if (legacy) return `${legacy[1]}년 ${legacy[2]}학년 ${legacy[3]}반`;
  return raw;
}

function studentStatusBadge(statusName: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    ENROLLED:         { bg: 'rgba(22,163,74,0.1)',   color: '#16a34a', label: '재학' },
    LEAVE_OF_ABSENCE: { bg: 'rgba(234,179,8,0.1)',   color: '#a16207', label: '휴학' },
    DROPOUT:          { bg: 'rgba(239,68,68,0.1)',    color: '#dc2626', label: '자퇴' },
    EXPELLED:         { bg: 'rgba(239,68,68,0.1)',    color: '#dc2626', label: '제적' },
    GRADUATED:        { bg: 'rgba(99,102,241,0.1)',   color: '#4f46e5', label: '졸업' },
    TRANSFERRED:      { bg: 'rgba(107,114,128,0.1)',  color: '#6b7280', label: '전학' },
  };
  const cfg = map[statusName] ?? { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: statusName ?? '-' };
  return (
    <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function roleRequestBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    ACTIVE:    { bg: 'rgba(22,163,74,0.1)',   color: '#16a34a', label: '활성'    },
    PENDING:   { bg: 'rgba(14,165,233,0.1)',  color: '#0284c7', label: '승인대기' },
    REJECTED:  { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626', label: '거절됨'  },
    SUSPENDED: { bg: 'rgba(234,179,8,0.1)',   color: '#a16207', label: '정지됨'  },
  };
  const cfg = map[status] ?? { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: status };
  return (
    <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

const pgBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({
  padding: '5px 10px',
  border: `1px solid ${active ? '#25A194' : '#d1d5db'}`,
  borderRadius: 6,
  background: active ? '#25A194' : '#fff',
  color: active ? '#fff' : '#374151',
  fontSize: 13,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.4 : 1,
});

export default function StudentList() {
  const navigate = useNavigate();
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
      .get("/students", {
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

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? (page?.content ?? []).map((s: any) => s.uid) : []);
  const toggleOne = (uid: string) =>
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid],
    );

  const bulkStatus = async (s: string, label: string) => {
    if (!selected.length) return alert("학생을 선택하세요.");
    if (
      !confirm(
        `선택한 ${selected.length}명을 "${label}" 상태로 변경하시겠습니까?`,
      )
    )
      return;
    await admin.post("/students/bulk-status", null, {
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
      await admin.post("/students/import-csv", fd);
    } finally {
      setLoading(false);
      load(0);
    }
    e.target.value = "";
  };

  const list = page?.content ?? [];

  return (
    <AdminLayout>
      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner-border text-light" style={{ width: '3rem', height: '3rem' }} />
            <h5 style={{ color: '#fff', marginTop: 16 }}>데이터 처리 중입니다...</h5>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>학생 정보 관리</h5>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>학생 계정 및 학적 정보를 관리합니다.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="file" ref={csvRef} accept=".csv" style={{ display: 'none' }} onChange={uploadCsv} />
            {/* 선택 상태 변경 드롭다운 */}
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
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: s.danger ? '#dc2626' : '#374151' }}
                      onClick={() => { bulkStatus(s.value, s.label); setShowDropdown(false); }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              style={{ padding: '9px 14px', background: '#fff', border: '1px solid #22c55e', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#16a34a', whiteSpace: 'nowrap' }}
              onClick={() => csvRef.current?.click()}
            >
              CSV 등록
            </button>
            <Link
              to={ADMIN_ROUTES.STUDENTS.CREATE}
              style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #25A194, #1a7a6e)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-block' }}
            >
              + 신규 학생 등록
            </Link>
          </div>
        </div>
      </div>

      {/* 카드 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* 검색 바 */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>전체 학생 목록</span>
          <form style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} onSubmit={search}>
            <select
              style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, color: '#374151', maxWidth: 120 }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">전체 상태</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, color: '#374151', maxWidth: 120 }}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="name">이름</option>
              <option value="email">이메일</option>
              <option value="idNum">학번</option>
            </select>
            <input
              style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, minWidth: 150 }}
              placeholder="검색어 입력..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit" style={{ padding: '7px 14px', background: 'linear-gradient(135deg, #25A194, #1a7a6e)', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              검색
            </button>
            <button
              type="button"
              style={{ padding: '7px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#374151' }}
              onClick={() => { setStatus(""); setType("name"); setKeyword(""); load(0); }}
            >
              초기화
            </button>
          </form>
        </div>

        {/* 테이블 */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 50 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 110 }} />
              <col />
              <col style={{ width: 160 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 100 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    style={{ borderColor: '#6b7280' }}
                    onChange={(e) => toggleAll(e.target.checked)}
                    checked={selected.length > 0 && selected.length === list.length}
                  />
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>학번</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>이름</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>계정 (이메일)</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>최근 소속 정보</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>학적 상태</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' }}>승인 상태</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'right' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s: any) => (
                <tr key={s.uid} style={{ background: '#fff' }}>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', textAlign: 'center', verticalAlign: 'middle' }}>
                    <input
                      type="checkbox"
                      style={{ borderColor: '#6b7280' }}
                      checked={selected.includes(s.uid)}
                      onChange={() => toggleOne(s.uid)}
                    />
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#6b7280', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{s.code ?? "-"}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                    <Link to={ADMIN_ROUTES.STUDENTS.DETAIL(s.uid)} style={{ color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
                      {s.name}
                    </Link>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{s.email}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{formatClass(s.latestClass)}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                    {studentStatusBadge(s.statusName)}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                    {s.roleRequestStatus ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {roleRequestBadge(s.roleRequestStatus)}
                        {s.roleRequestStatus === 'PENDING' && (
                          <>
                            <button
                              style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}
                              onClick={() => approveRequest(s.roleRequestId)}
                            >승인</button>
                            <button
                              style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}
                              onClick={() => rejectRequest(s.roleRequestId)}
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
                      to={ADMIN_ROUTES.STUDENTS.DETAIL(s.uid)}
                      style={{ padding: '5px 12px', border: '1px solid #25A194', borderRadius: 6, fontSize: 13, color: '#25A194', textDecoration: 'none', fontWeight: 500 }}
                    >
                      상세보기
                    </Link>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {page && page.totalPages >= 1 && (
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: 4 }}>
            <button style={pgBtn(false, page.first)} disabled={page.first} onClick={() => load(currentPage - 1)}>&laquo;</button>
            {Array.from({ length: page.totalPages }, (_, i) => (
              <button key={i} style={pgBtn(i === currentPage, false)} onClick={() => load(i)}>{i + 1}</button>
            ))}
            <button style={pgBtn(false, page.last)} disabled={page.last} onClick={() => load(currentPage + 1)}>&raquo;</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
