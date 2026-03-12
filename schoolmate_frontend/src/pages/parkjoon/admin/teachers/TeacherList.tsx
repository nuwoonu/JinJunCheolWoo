import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../../../components/layout/AdminLayout";
import admin from "../../../../api/adminApi";
import { TEACHER_STATUS, STATUS_DEFAULT } from "../../../../constants/statusConfig";
import { ADMIN_ROUTES } from '../../../../constants/routes';

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
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 9999 }}
        >
          <div className="text-center">
            <div
              className="spinner-border text-light"
              style={{ width: "3rem", height: "3rem" }}
            />
            <h5 className="text-white mt-3">교사 데이터를 등록 중입니다...</h5>
          </div>
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">👨‍🏫 교사 정보 관리</h2>
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
              {Object.entries(TEACHER_STATUS).map(([value, { label }]) => (
                <li key={value}>
                  {value === "RETIRED" && <hr className="dropdown-divider" />}
                  <a
                    className={`dropdown-item${value === "RETIRED" ? " text-danger" : ""}`}
                    href="#"
                    onClick={(e) => { e.preventDefault(); bulkStatus(value, label); setShowDropdown(false); }}
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
            <i className="bi bi-file-earmark-spreadsheet" /> CSV 교사 등록
          </button>
          <Link to={ADMIN_ROUTES.TEACHERS.CREATE} className="btn btn-primary">
            <i className="bi bi-person-plus-fill" /> 신규 교사 등록
          </Link>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <div className="row align-items-center">
            <div className="col">
              <h5 className="mb-0 text-dark">전체 교사 목록</h5>
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
                  {Object.entries(TEACHER_STATUS).map(([value, { label }]) => (
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
                  <option value="email">이메일</option>
                  <option value="dept">부서</option>
                  <option value="position">직책</option>
                  <option value="subject">담당 과목</option>
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
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="text-center" style={{ width: 50 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th className="ps-4" style={{ width: 150 }}>
                    사번
                  </th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>부서 / 직책</th>
                  <th>담당 과목</th>
                  <th>상태</th>
                  <th className="text-end pe-4">관리</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t: any) => (
                  <tr key={t.uid}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selected.includes(t.uid)}
                        onChange={() => toggleOne(t.uid)}
                      />
                    </td>
                    <td className="ps-4 text-secondary">{t.code}</td>
                    <td>
                      <Link
                        to={ADMIN_ROUTES.TEACHERS.DETAIL(t.uid)}
                        className="fw-bold text-decoration-none text-dark"
                      >
                        {t.name}
                      </Link>
                    </td>
                    <td>{t.email}</td>
                    <td>
                      <span>{t.department}</span> /{" "}
                      <span className="small text-muted">{t.position}</span>
                    </td>
                    <td>
                      <span className="badge rounded-pill bg-light text-dark border">
                        {t.subject}
                      </span>
                    </td>
                    <td>
                      {(() => { const cfg = TEACHER_STATUS[t.statusName] ?? STATUS_DEFAULT; return <span className={`badge ${cfg.badge}`}>{cfg.label}</span> })()}
                    </td>
                    <td className="text-end pe-4">
                      <Link
                        to={ADMIN_ROUTES.TEACHERS.DETAIL(t.uid)}
                        className="btn btn-sm btn-outline-primary"
                      >
                        상세보기
                      </Link>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
