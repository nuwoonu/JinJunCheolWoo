import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../../components/layout/AdminLayout";
import admin from "../../../api/adminApi";
import { PARENT_STATUS, STATUS_DEFAULT } from "../../../constants/statusConfig";
import { ADMIN_ROUTES } from "../../../constants/routes";

export default function ParentList() {
  const [page, setPage] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("name");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
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
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    load(0);
  };
  const list = page?.content ?? [];
  const toggleAll = (checked: boolean) =>
    setSelected(checked ? list.map((p: any) => p.id) : []);
  const toggleOne = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const bulkStatus = async (s: string, label: string) => {
    if (!selected.length) return alert("학부모를 선택하세요.");
    if (
      !confirm(
        `선택한 ${selected.length}명을 "${label}" 상태로 변경하시겠습니까?`,
      )
    )
      return;
    await admin.post("/parents/bulk-status", { ids: selected, status: s });
    setSelected([]);
    load(currentPage);
  };

  const uploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await admin.post("/parents/import-csv", fd);
    } finally {
      setLoading(false);
      load(0);
    }
    e.target.value = "";
  };

  return (
    <AdminLayout>
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
          <div className="dropdown">
            <button
              className="btn btn-outline-dark dropdown-toggle"
              type="button"
              onClick={() => setShowDropdown((v) => !v)}
            >
              <i className="bi bi-pencil-square" /> 선택 상태 변경
            </button>
            <ul className={`dropdown-menu${showDropdown ? " show" : ""}`}>
              {Object.entries(PARENT_STATUS).map(([value, { label }]) => (
                <li key={value}>
                  {value === "BLOCKED" && <hr className="dropdown-divider" />}
                  <a
                    className={`dropdown-item${value === "BLOCKED" ? " text-danger" : ""}`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      bulkStatus(value, label);
                      setShowDropdown(false);
                    }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
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

      <div className="card">
        <div className="card-body p-0">
          <div className="d-flex align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
            <h6 className="fw-semibold mb-0">전체 학부모 목록</h6>
            <div className="d-flex gap-2">
              <form className="input-group input-group-sm" onSubmit={search}>
                <select
                  className="form-select"
                  style={{ maxWidth: 120 }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">전체 상태</option>
                  {Object.entries(PARENT_STATUS).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
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
                    setStatus("");
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
                <th className="text-center" style={{ width: 50 }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    style={{ borderColor: "#6b7280" }}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="ps-4">이름</th>
                <th>이메일</th>
                <th>연락처</th>
                <th>자녀 수</th>
                <th>상태</th>
                <th className="text-end pe-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p: any) => (
                <tr key={p.id}>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      style={{ borderColor: "#6b7280" }}
                      checked={selected.includes(p.id)}
                      onChange={() => toggleOne(p.id)}
                    />
                  </td>
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
                    {(() => {
                      const cfg = PARENT_STATUS[p.statusName] ?? STATUS_DEFAULT;
                      return (
                        <span className={`badge ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      );
                    })()}
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
                  <td colSpan={7} className="text-center py-5 text-muted">
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
    </AdminLayout>
  );
}
