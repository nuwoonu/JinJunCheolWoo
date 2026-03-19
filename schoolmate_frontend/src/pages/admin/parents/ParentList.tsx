import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ParentAdminLayout from '@/components/layout/admin/ParentAdminLayout';
import admin from '@/api/adminApi';
import { ROLE_REQUEST_STATUS } from '@/constants/statusConfig';
import { ADMIN_ROUTES } from '@/constants/routes';

const RR_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: "활성",     color: "#16a34a", bg: "rgba(22,163,74,0.1)"   },
  PENDING:   { label: "승인대기", color: "#0ea5e9", bg: "rgba(14,165,233,0.1)"  },
  SUSPENDED: { label: "정지됨",  color: "#d97706", bg: "rgba(217,119,6,0.1)"   },
  REJECTED:  { label: "거절됨",  color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
};

export default function ParentList() {
  const [page, setPage] = useState<any>(null);
  const [status] = useState("");
  const [type, setType] = useState("name");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rrCounts, setRrCounts] = useState<Record<string, number>>({});
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
      });

  useEffect(() => {
    load();
    admin
      .get("/role-requests/counts?role=PARENT")
      .then((r) => setRrCounts(r.data))
      .catch(() => {});
  }, []);

  const search = (e: React.FormEvent) => {
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
            <div
              className="spinner-border text-light"
              style={{ width: "3rem", height: "3rem" }}
            />
            <h5 className="text-white mt-3">
              학부모 데이터를 등록 중입니다...
            </h5>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학부모 정보 관리</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            학부모 계정 및 자녀 연동 정보를 관리합니다.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <input
            type="file"
            ref={csvRef}
            accept=".csv"
            style={{ display: "none" }}
            onChange={uploadCsv}
          />
          <button
            className="btn btn-outline-success"
            onClick={() => csvRef.current?.click()}
          >
            <i className="bi bi-file-earmark-spreadsheet" /> CSV 등록
          </button>
          <Link
            to={ADMIN_ROUTES.PARENTS.CREATE}
            className="btn btn-primary-600 radius-8"
          >
            <i className="bi bi-person-plus-fill" /> 신규 학부모 등록
          </Link>
        </div>
      </div>

      {/* 본문: 좌측 통계 + 우측 목록 */}
      <div className="row g-24 align-items-start">

        {/* ── 좌측 통계 패널 ── */}
        <div className="col-lg-3">
          <div className="card mb-24" style={{ borderTop: "3px solid #6366f1" }}>
            <div className="px-20 py-16 border-bottom border-neutral-200">
              <h6 className="fw-semibold mb-1" style={{ fontSize: 14 }}>학부모 현황</h6>
              <p className="text-secondary-light mb-0" style={{ fontSize: 12 }}>
                전체{" "}
                <span className="fw-semibold text-primary-light">
                  {page?.totalElements?.toLocaleString() ?? "-"}
                </span>
                명
              </p>
            </div>
            <div className="card-body px-20 py-16">
              <p className="text-secondary-light mb-12" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                계정 승인 현황
              </p>
              {Object.entries(RR_BADGE).map(([key, cfg]) => (
                <div
                  key={key}
                  className="d-flex align-items-center justify-content-between mb-10"
                >
                  <div className="d-flex align-items-center gap-8">
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: cfg.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, color: "var(--text-primary-light)" }}>
                      {cfg.label}
                    </span>
                  </div>
                  <span
                    className="fw-semibold"
                    style={{
                      fontSize: 13,
                      color: cfg.color,
                      background: cfg.bg,
                      padding: "1px 8px",
                      borderRadius: 12,
                    }}
                  >
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
                  <div
                    className="mt-8"
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: "var(--neutral-100)",
                      overflow: "hidden",
                    }}
                  >
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
          <div className="card">
            <div className="card-body p-0">
              <div className="d-flex align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                <h6 className="fw-semibold mb-0">전체 학부모 목록</h6>
                <div className="d-flex gap-2">
                  <form className="input-group input-group-sm" onSubmit={search}>
                    <select
                      className="form-select"
                      style={{ maxWidth: 120 }}
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="name">이름</option>
                      <option value="childName">자녀 이름</option>
                      <option value="phone">연락처</option>
                      <option value="email">이메일</option>
                    </select>
                    <input
                      className="form-control"
                      placeholder="검색어 입력..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      style={{ minWidth: 150 }}
                    />
                    <button className="btn btn-primary-600 radius-8" type="submit">
                      <i className="bi bi-search" /> 검색
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => {
                        setType("name");
                        setKeyword("");
                        load(0);
                      }}
                    >
                      초기화
                    </button>
                  </form>
                </div>
              </div>
              <table className="table table-hover align-middle mb-0">
                <thead className="table-heading-dark-mode">
                  <tr>
                    <th className="ps-4">이름</th>
                    <th>이메일</th>
                    <th>연락처</th>
                    <th>자녀 수</th>
                    <th>승인 상태</th>
                    <th className="text-end pe-4">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p: any) => (
                    <tr key={p.id}>
                      <td className="ps-4">
                        <Link
                          to={ADMIN_ROUTES.PARENTS.DETAIL(p.id)}
                          className="fw-bold text-decoration-none text-primary-light"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td>{p.email}</td>
                      <td>{p.phone}</td>
                      <td>
                        <span className="badge bg-neutral-100 text-neutral-600 border border-neutral-200">
                          {p.childrenStrings?.length ?? 0}명
                        </span>
                      </td>
                      <td>
                        {p.roleRequestStatus ? (
                          <div className="d-flex align-items-center gap-1">
                            <span className={`badge ${(ROLE_REQUEST_STATUS[p.roleRequestStatus] ?? ROLE_REQUEST_STATUS.PENDING).badge}`}>
                              {(ROLE_REQUEST_STATUS[p.roleRequestStatus] ?? ROLE_REQUEST_STATUS.PENDING).label}
                            </span>
                            {p.roleRequestStatus === 'PENDING' && (
                              <>
                                <button
                                  className="btn btn-xs btn-success py-0 px-1"
                                  style={{ fontSize: 11 }}
                                  onClick={() => approveRequest(p.roleRequestId)}
                                >승인</button>
                                <button
                                  className="btn btn-xs btn-outline-danger py-0 px-1"
                                  style={{ fontSize: 11 }}
                                  onClick={() => rejectRequest(p.roleRequestId)}
                                >거절</button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <Link
                          to={ADMIN_ROUTES.PARENTS.DETAIL(p.id)}
                          className="btn btn-sm btn-outline-primary"
                        >
                          상세보기
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {page && page.totalPages >= 1 && (
              <div className="card-footer border-0 bg-base py-16">
                <nav>
                  <ul className="pagination pagination-sm justify-content-center mb-0">
                    <li className={`page-item${page.first ? " disabled" : ""}`}>
                      <a
                        className="page-link"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          load(currentPage - 1);
                        }}
                      >
                        &laquo;
                      </a>
                    </li>
                    {Array.from({ length: page.totalPages }, (_, i) => (
                      <li
                        key={i}
                        className={`page-item${i === currentPage ? " active" : ""}`}
                      >
                        <a
                          className="page-link"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            load(i);
                          }}
                        >
                          {i + 1}
                        </a>
                      </li>
                    ))}
                    <li className={`page-item${page.last ? " disabled" : ""}`}>
                      <a
                        className="page-link"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          load(currentPage + 1);
                        }}
                      >
                        &raquo;
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>

      </div>
    </ParentAdminLayout>
  );
}
