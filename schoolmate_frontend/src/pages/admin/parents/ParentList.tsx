import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import ParentAdminLayout from '@/components/layout/admin/ParentAdminLayout';
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';

const RR_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: "활성",     color: "#16a34a", bg: "rgba(22,163,74,0.1)"   },
  PENDING:   { label: "승인대기", color: "#0ea5e9", bg: "rgba(14,165,233,0.1)"  },
  SUSPENDED: { label: "정지됨",  color: "#d97706", bg: "rgba(217,119,6,0.1)"   },
  REJECTED:  { label: "거절됨",  color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
};

// [soojin] ServiceNoticeList 스타일로 통일
const th: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  fontWeight: 600,
  color: "#6b7280",
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  textAlign: "left",
};

const td: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: 13,
  color: "#374151",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

export default function ParentList() {
  const [page, setPage] = useState<any>(null);
  const [status] = useState("");
  const [type, setType] = useState("name");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rrCounts, setRrCounts] = useState<Record<string, number>>({});
  // [soojin] 검색과 무관한 진짜 전체 명 수 — 초기 로드 시에만 세팅
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const isInitialLoad = useRef(true);
  const csvRef = useRef<HTMLInputElement>(null);

  const load = (p = 0) =>
    admin
      .get("/parents", {
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
        if (isInitialLoad.current) {
          setTotalAll(r.data.totalElements);
          isInitialLoad.current = false;
        }
      });

  useEffect(() => {
    load();
    admin
      .get("/role-requests/counts?role=PARENT")
      .then((r) => setRrCounts(r.data))
      .catch(() => {});
  }, []);

  const search = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    load(0);
  };
  const list = page?.content ?? [];

  const approveRequest = async (requestId: number) => {
    await admin.post(`/role-requests/${requestId}/approve`);
    load(currentPage);
    admin.get("/role-requests/counts?role=PARENT").then((r) => setRrCounts(r.data)).catch(() => {});
  };

  const rejectRequest = async (requestId: number) => {
    const reason = window.prompt('거절 사유를 입력하세요.');
    if (reason === null) return;
    await admin.post(`/role-requests/${requestId}/reject`, { reason });
    load(currentPage);
    admin.get("/role-requests/counts?role=PARENT").then((r) => setRrCounts(r.data)).catch(() => {});
  };

  const uploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await admin.post("/parents/import-csv", fd);
      await load(0);
    } catch (err: any) {
      alert(`등록 실패: ${err.response?.data ?? err.message}`);
    } finally {
      setLoading(false);
    }
    e.target.value = "";
  };

  const totalRR = (rrCounts.ACTIVE ?? 0) + (rrCounts.PENDING ?? 0) + (rrCounts.SUSPENDED ?? 0) + (rrCounts.REJECTED ?? 0);

  return (
    <ParentAdminLayout requireSchool={false}>
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 9999 }}
        >
          <div className="text-center">
            <div className="spinner-border text-light" style={{ width: "3rem", height: "3rem" }} />
            <h5 className="text-white mt-3">학부모 데이터를 등록 중입니다...</h5>
          </div>
        </div>
      )}

      {/* [soojin] 헤더 — ServiceNoticeList 스타일로 통일 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
        <div>
          <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            학부모 정보 관리
            <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>전체 {totalAll?.toLocaleString() ?? 0}명</span>
          </h5>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>학부모 계정 및 자녀 연동 정보를 관리합니다.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="file" ref={csvRef} accept=".csv" style={{ display: 'none' }} onChange={uploadCsv} />
          <button
            onClick={() => csvRef.current?.click()}
            style={{ padding: '5px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-file-earmark-spreadsheet" style={{ marginRight: 4 }} />CSV 등록
          </button>
          <Link
            to={ADMIN_ROUTES.PARENTS.CREATE}
            style={{ padding: '5px 12px', background: '#25A194', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-person-plus-fill" style={{ marginRight: 4 }} />신규 학부모 등록
          </Link>
        </div>
      </div>

      {/* 본문: 좌측 통계 + 우측 목록 */}
      <div className="row g-24 align-items-start">

        {/* ── 좌측 통계 패널 (학부모 현황) — 유지 ── */}
        <div className="col-lg-3">
          <div className="card" style={{ borderTop: "3px solid #6366f1", marginBottom: 24 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h6 className="fw-semibold mb-1" style={{ fontSize: 14 }}>학부모 현황</h6>
              <p className="text-secondary-light mb-0" style={{ fontSize: 12 }}>
                전체{" "}
                <span className="fw-semibold text-primary-light">
                  {page?.totalElements?.toLocaleString() ?? "-"}
                </span>
                명
              </p>
            </div>
            <div className="card-body" style={{ padding: "16px 20px" }}>
              <p className="text-secondary-light mb-12" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                계정 승인 현황
              </p>
              {Object.entries(RR_BADGE).map(([key, cfg]) => (
                <div key={key} className="d-flex align-items-center justify-content-between mb-10">
                  <div className="d-flex align-items-center" style={{ gap: 8 }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--text-primary-light)" }}>{cfg.label}</span>
                  </div>
                  <span className="fw-semibold" style={{ fontSize: 13, color: cfg.color, background: cfg.bg, padding: "1px 8px", borderRadius: 12 }}>
                    {(rrCounts[key] ?? 0).toLocaleString()}
                  </span>
                </div>
              ))}
              {totalRR > 0 && (
                <>
                  <hr className="my-12" style={{ borderColor: "var(--border-color)" }} />
                  <div className="d-flex align-items-center justify-content-between">
                    <span style={{ fontSize: 12, color: "var(--text-secondary-light)" }}>승인 계정 비율</span>
                    <span className="fw-semibold" style={{ fontSize: 13, color: "#16a34a" }}>
                      {Math.round(((rrCounts.ACTIVE ?? 0) / totalRR) * 100)}%
                    </span>
                  </div>
                  <div className="mt-8" style={{ height: 6, borderRadius: 3, background: "var(--neutral-100)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.round(((rrCounts.ACTIVE ?? 0) / totalRR) * 100)}%`,
                        background: "#16a34a",
                        borderRadius: 3,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── 우측 목록 테이블 ── */}
        <div className="col-lg-9">

          {/* [soojin] 컨트롤 바 — ServiceNoticeList 스타일 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <form onSubmit={search} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{ padding: '5px 28px 5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', color: '#374151', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
                >
                  <option value="">전체</option>
                  <option value="name">이름</option>
                  <option value="childName">자녀 이름</option>
                  <option value="phone">연락처</option>
                  <option value="email">이메일</option>
                </select>
                <i className="bi bi-chevron-down" style={{ position: 'absolute', right: '8px', color: '#9ca3af', fontSize: '12px', pointerEvents: 'none' }} />
              </div>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: '8px', color: '#9ca3af', fontSize: '13px', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="검색어 입력"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  style={{ padding: '5px 8px 5px 28px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, minWidth: 180, background: '#fff' }}
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
                onClick={() => { setType('name'); setKeyword(''); load(0); }}
                style={{ padding: '5px 10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}
              >
                초기화
              </button>
            </form>
          </div>

          {/* [soojin] 테이블 카드 — ServiceNoticeList 카드 스타일 */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: 100 }} />
                  <col />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 70 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 90 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ ...th, paddingLeft: 24 }}>이름</th>
                    <th style={th}>이메일</th>
                    <th style={th}>연락처</th>
                    <th style={{ ...th, textAlign: 'center' }}>자녀 수</th>
                    <th style={th}>승인 상태</th>
                    <th style={{ ...th, textAlign: 'right', paddingRight: 24 }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ ...td, paddingLeft: 24, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Link to={ADMIN_ROUTES.PARENTS.DETAIL(p.id)} style={{ color: '#1d4ed8', textDecoration: 'none' }}>
                          {p.name}
                        </Link>
                      </td>
                      <td style={{ ...td, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.email}</td>
                      <td style={td}>{p.phone}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 500 }}>
                          {p.childrenStrings?.length ?? 0}명
                        </span>
                      </td>
                      <td style={td}>
                        {p.roleRequestStatus ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ background: RR_BADGE[p.roleRequestStatus]?.bg ?? '#f3f4f6', color: RR_BADGE[p.roleRequestStatus]?.color ?? '#6b7280', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                              {RR_BADGE[p.roleRequestStatus]?.label ?? p.roleRequestStatus}
                            </span>
                            {p.roleRequestStatus === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => approveRequest(p.roleRequestId)}
                                  style={{ padding: '2px 8px', background: '#fff', border: '1px solid #16a34a', borderRadius: 4, fontSize: 11, fontWeight: 500, color: '#16a34a', cursor: 'pointer' }}
                                >승인</button>
                                <button
                                  onClick={() => rejectRequest(p.roleRequestId)}
                                  style={{ padding: '2px 8px', background: '#fff', border: '1px solid #ef4444', borderRadius: 4, fontSize: 11, fontWeight: 500, color: '#ef4444', cursor: 'pointer' }}
                                >거절</button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>
                        )}
                      </td>
                      <td style={{ ...td, textAlign: 'right', paddingRight: 24 }}>
                        <Link
                          to={ADMIN_ROUTES.PARENTS.DETAIL(p.id)}
                          style={{ padding: '4px 12px', background: '#fff', border: '1px solid #25A194', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#25A194', textDecoration: 'none', whiteSpace: 'nowrap' }}
                        >
                          상세보기
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: '48px 16px', whiteSpace: 'normal' }}>
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* [soojin] 페이지네이션 카드 밖, 우측 정렬, 정사각형 버튼 */}
          {page && page.totalPages >= 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 0', gap: 4 }}>
              <button
                onClick={() => load(currentPage - 1)}
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
                onClick={() => load(currentPage + 1)}
                disabled={page.last}
                style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: page.last ? 'not-allowed' : 'pointer', color: page.last ? '#d1d5db' : '#374151', fontSize: 12 }}
              >
                ›
              </button>
            </div>
          )}

        </div>
      </div>
    </ParentAdminLayout>
  );
}
