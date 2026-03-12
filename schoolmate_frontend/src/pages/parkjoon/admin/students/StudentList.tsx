import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layout/AdminLayout";
import admin from "../../../../api/adminApi";

// [joon] 학생 목록

const BASE = "/parkjoon/admin";
const STATUSES = [
  { value: "ENROLLED", label: "재학" },
  { value: "LEAVE_OF_ABSENCE", label: "휴학" },
  { value: "GRADUATED", label: "졸업", danger: true },
  { value: "DROPOUT", label: "자퇴", danger: true },
  { value: "EXPELLED", label: "제적", danger: true },
  { value: "TRANSFERRED", label: "전학", danger: true },
];

function statusBadge(status: string) {
  if (status === "재학") return "bg-success-subtle text-success";
  if (status === "휴학") return "bg-warning-subtle text-warning";
  return "bg-secondary-subtle text-secondary";
}

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
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 9999 }}
        >
          <div className="text-center">
            <div
              className="spinner-border text-light"
              style={{ width: "3rem", height: "3rem" }}
            />
            <h5 className="text-white mt-3">데이터 처리 중입니다...</h5>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">🎓 학생 정보 관리</h2>
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
              {STATUSES.map((s) => (
                <li key={s.value}>
                  <button
                    className={`dropdown-item${s.danger ? " text-danger" : ""}`}
                    onClick={() => {
                      bulkStatus(s.value, s.label);
                      setShowDropdown(false);
                    }}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <button
            className="btn btn-outline-success"
            onClick={() => csvRef.current?.click()}
          >
            <i className="bi bi-file-earmark-spreadsheet" /> CSV 일괄 등록
          </button>
          <Link to={`${BASE}/students/create`} className="btn btn-primary">
            <i className="bi bi-person-plus-fill" /> 신규 학생 등록
          </Link>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <div className="row align-items-center">
            <div className="col">
              <h5 className="mb-0 text-dark">전체 학생 목록</h5>
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
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
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
                  <option value="email">이메일</option>
                  <option value="idNum">학번</option>
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
                      checked={
                        selected.length > 0 && selected.length === list.length
                      }
                    />
                  </th>
                  <th className="ps-4" style={{ width: 150 }}>
                    학번
                  </th>
                  <th>이름</th>
                  <th>계정 (이메일)</th>
                  <th>최근 소속 정보</th>
                  <th>상태</th>
                  <th className="text-end pe-4">관리</th>
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
                    <td className="ps-4 text-secondary">{s.code ?? "-"}</td>
                    <td>
                      <Link
                        to={`${BASE}/students/${s.uid}`}
                        className="fw-bold text-decoration-none text-dark"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td>{s.email}</td>
                    <td>
                      <small className="text-muted">{s.latestClass}</small>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      <Link
                        to={`${BASE}/students/${s.uid}`}
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
        </div>
        {page && page.totalPages >= 1 && (
          <div className="card-footer bg-white py-3">
            <nav>
              <ul className="pagination pagination-sm justify-content-center mb-0">
                <li className={`page-item${page.first ? " disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => load(currentPage - 1)}
                  >
                    &laquo;
                  </button>
                </li>
                {Array.from({ length: page.totalPages }, (_, i) => (
                  <li
                    key={i}
                    className={`page-item${i === currentPage ? " active" : ""}`}
                  >
                    <button className="page-link" onClick={() => load(i)}>
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item${page.last ? " disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => load(currentPage + 1)}
                  >
                    &raquo;
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
