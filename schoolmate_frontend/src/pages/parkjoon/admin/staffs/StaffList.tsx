import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../../../components/layout/AdminLayout";
import admin from "../../../../api/adminApi";
import { STAFF_STATUS, EMPLOYMENT_TYPE, STATUS_DEFAULT } from "../../../../constants/statusConfig";
import { ADMIN_ROUTES } from '../../../../constants/routes';

export default function StaffList() {
  const [page, setPage] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [type, setType] = useState("name");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const load = (p = 0) =>
    admin
      .get("/staffs", {
        params: {
          status: status || undefined,
          employmentType: employmentType || undefined,
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
    setSelected(checked ? list.map((s: any) => s.uid) : []);
  const toggleOne = (uid: string) =>
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid],
    );

  const bulkStatus = async (s: string, label: string) => {
    if (!selected.length) return alert("직원을 선택하세요.");
    if (
      !confirm(
        `선택한 ${selected.length}명을 "${label}" 상태로 변경하시겠습니까?`,
      )
    )
      return;
    await admin.post("/staffs/bulk-status", null, {
      params: { uids: selected, status: s },
    });
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
      await admin.post("/staffs/import-csv", fd);
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
            <h5 className="text-white mt-3">직원 데이터를 등록 중입니다...</h5>
          </div>
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">직원 정보 관리</h2>
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
              <li>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    bulkStatus("EMPLOYED", "재직");
                    setShowDropdown(false);
                  }}
                >
                  재직
                </a>
              </li>
              <li>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    bulkStatus("LEAVE", "휴직");
                    setShowDropdown(false);
                  }}
                >
                  휴직
                </a>
              </li>
              <li>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    bulkStatus("DISPATCHED", "파견");
                    setShowDropdown(false);
                  }}
                >
                  파견
                </a>
              </li>
              <li>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    bulkStatus("SUSPENDED", "정직");
                    setShowDropdown(false);
                  }}
                >
                  정직
                </a>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <a
                  className="dropdown-item text-danger"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    bulkStatus("RETIRED", "퇴직");
                    setShowDropdown(false);
                  }}
                >
                  퇴직
                </a>
              </li>
            </ul>
          </div>
          <button
            className="btn btn-outline-success"
            onClick={() => csvRef.current?.click()}
          >
            <i className="bi bi-file-earmark-spreadsheet" /> CSV 등록
          </button>
          <Link to={ADMIN_ROUTES.STAFFS.CREATE} className="btn btn-primary">
            <i className="bi bi-person-plus-fill" /> 신규 직원 등록
          </Link>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <div className="row align-items-center">
            <div className="col">
              <h5 className="mb-0 text-dark">전체 직원 목록</h5>
            </div>
            <div className="col-auto">
              <form className="input-group input-group-sm" onSubmit={search}>
                <select
                  className="form-select"
                  style={{ maxWidth: 120 }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">전체 상태</option>
                  {Object.entries(STAFF_STATUS).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <select
                  className="form-select"
                  style={{ maxWidth: 120 }}
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                >
                  <option value="">전체 고용형태</option>
                  {Object.entries(EMPLOYMENT_TYPE).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <select
                  className="form-select"
                  style={{ maxWidth: 120 }}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="name">이름</option>
                  <option value="dept">부서</option>
                  <option value="extNum">내선번호</option>
                  <option value="email">이메일</option>
                  <option value="jobTitle">직위</option>
                  <option value="code">사번</option>
                </select>
                <input
                  className="form-control"
                  placeholder="검색어 입력..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  style={{ minWidth: 150 }}
                />
                <button className="btn btn-primary" type="submit">
                  <i className="bi bi-search" /> 검색
                </button>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => {
                    setStatus("");
                    setEmploymentType("");
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
        </div>
        <div className="card-body p-0">
          <table
            className="table table-hover align-middle mb-0"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <thead className="table-light">
              <tr>
                <th className="text-center" style={{ width: 60 }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="ps-4" style={{ width: 140 }}>
                  사번
                </th>
                <th style={{ width: 100 }}>이름</th>
                <th style={{ width: 200 }}>이메일</th>
                <th style={{ width: 100 }}>내선번호</th>
                <th style={{ width: 180 }}>부서 / 직책</th>
                <th style={{ width: 130 }}>고용형태</th>
                <th style={{ width: 90 }}>상태</th>
                <th className="text-end pe-40" style={{ width: 100 }}>
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((s: any) => (
                <tr key={s.uid}>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selected.includes(s.uid)}
                      onChange={() => toggleOne(s.uid)}
                    />
                  </td>
                  <td className="ps-4 text-secondary">{s.code}</td>
                  <td>
                    <Link
                      to={ADMIN_ROUTES.STAFFS.DETAIL(s.uid)}
                      className="fw-bold text-decoration-none text-dark"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.email}
                  </td>
                  <td>{s.extensionNumber ?? "-"}</td>
                  <td>
                    <span>{s.department}</span> /{" "}
                    <span className="small text-muted">{s.jobTitle}</span>
                  </td>
                  <td>{(() => { const cfg = EMPLOYMENT_TYPE[s.employmentType]; return <span className={`badge ${cfg?.badge ?? 'bg-secondary-subtle text-secondary'}`}>{cfg?.label ?? s.employmentType}</span> })()}</td>
                  <td>{(() => { const cfg = STAFF_STATUS[s.statusName] ?? STATUS_DEFAULT; return <span className={`badge ${cfg.badge}`}>{cfg.label}</span> })()}</td>
                  <td className="text-end pe-4">
                    <Link
                      to={ADMIN_ROUTES.STAFFS.DETAIL(s.uid)}
                      className="btn btn-sm btn-outline-primary"
                    >
                      상세보기
                    </Link>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {page && page.totalPages >= 1 && (
          <div className="card-footer bg-white py-3">
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
