import { useEffect, useState } from "react";
import AdminLayout from "../../../components/layout/AdminLayout";
import admin from "../../../api/adminApi";

// AccessLog.AccessType: LOGIN, LOGOUT, LOGIN_FAIL
const ACCESS_TYPES = [
  { value: "", label: "전체" },
  { value: "LOGIN", label: "로그인" },
  { value: "LOGOUT", label: "로그아웃" },
  { value: "LOGIN_FAIL", label: "로그인 실패" },
];

const typeBadge = (t: string) => {
  if (t === "LOGIN")
    return "bg-success-subtle text-success border border-success-subtle";
  if (t === "LOGOUT")
    return "bg-secondary-subtle text-secondary border border-secondary-subtle";
  if (t === "LOGIN_FAIL")
    return "bg-danger-subtle text-danger border border-danger-subtle";
  return "bg-light text-dark";
};

const typeLabel = (t: string) =>
  ACCESS_TYPES.find((o) => o.value === t)?.label ?? t;

export default function AccessLogs() {
  const [page, setPage] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloading, setDownloading] = useState(false);

  const load = (p = 0) => {
    const params: any = { page: p, size: 20 };
    if (keyword) params.keyword = keyword;
    if (type) params.type = type;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    admin.get("/audit/access", { params }).then((r) => {
      setPage(r.data);
      setCurrentPage(p);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    load(0);
  };

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const params: any = {};
      if (keyword) params.keyword = keyword;
      if (type) params.type = type;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await admin.get("/audit/access/csv", {
        params,
        responseType: "blob",
      });
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "text/csv;charset=utf-8;" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `access_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const list: any[] = page?.content ?? [];

  return (
    <AdminLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">시스템 접속 기록</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            사용자 로그인/로그아웃 기록을 조회합니다.
          </p>
        </div>
        <button
          className="btn btn-outline-success radius-8 btn-sm"
          onClick={downloadCsv}
          disabled={downloading}
        >
          <i className="bi bi-download me-1" />
          {downloading ? "다운로드 중..." : "CSV 내보내기"}
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body py-3">
          <form className="row g-2 align-items-end" onSubmit={search}>
            <div className="col-md-3">
              <label className="form-label small mb-1">사용자명 검색</label>
              <input
                className="form-control form-control-sm"
                placeholder="사용자명..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small mb-1">유형</label>
              <select
                className="form-select form-select-sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {ACCESS_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small mb-1">시작일</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small mb-1">종료일</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-auto">
              <button
                type="submit"
                className="btn btn-primary-600 radius-8 btn-sm me-2"
              >
                <i className="bi bi-search" /> 검색
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setKeyword("");
                  setType("");
                  setStartDate("");
                  setEndDate("");
                  setTimeout(() => load(0), 0);
                }}
              >
                초기화
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-heading-dark-mode">
              <tr>
                <th className="px-4 py-3" style={{ width: 160 }}>일시</th>
                <th className="px-3 py-3" style={{ width: 180 }}>사용자</th>
                <th className="px-3 py-3" style={{ width: 120 }}>유형</th>
                <th className="px-3 py-3" style={{ width: 140 }}>IP 주소</th>
                <th className="px-3 py-3">브라우저 정보</th>
              </tr>
            </thead>
            <tbody>
              {list.map((log: any) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-muted small" style={{ whiteSpace: "nowrap" }}>
                    {log.createDate?.replace("T", " ").substring(0, 19)}
                  </td>
                  <td className="px-3 py-3 fw-semibold">{log.actorName}</td>
                  <td className="px-3 py-3">
                    <span className={`badge ${typeBadge(log.accessType)}`}>
                      {typeLabel(log.accessType)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted small">{log.ipAddress}</td>
                  <td
                    className="px-3 py-3 text-muted small"
                    style={{
                      maxWidth: 320,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={log.userAgent}
                  >
                    {log.userAgent}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    접속 기록이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {page && page.totalPages > 1 && (
          <div className="card-footer bg-base py-3">
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
            <div className="text-center text-muted small mt-1">
              총 {page.totalElements}건
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
