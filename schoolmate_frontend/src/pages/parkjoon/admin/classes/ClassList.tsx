import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../../../components/layout/AdminLayout";
import admin from "../../../../api/adminApi";

const BASE = "/parkjoon/admin";

export default function ClassList() {
  const [page, setPage] = useState<any>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [grade, setGrade] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const load = (p = 0) =>
    admin
      .get("/classes", {
        params: {
          year,
          grade: grade || undefined,
          status: status || undefined,
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
    setSelected(checked ? list.map((c: any) => c.cid) : []);
  const toggleOne = (cid: number) =>
    setSelected((prev) =>
      prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid],
    );

  const bulkStatus = async (s: string, label: string) => {
    if (!selected.length) return alert("학급을 선택하세요.");
    if (
      !confirm(
        `선택한 ${selected.length}개 학급을 "${label}" 상태로 변경하시겠습니까?`,
      )
    )
      return;
    await admin.post("/classes/bulk-status", null, {
      params: { cids: selected, status: s },
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
      await admin.post("/classes/import-csv", fd);
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
            <h5 className="text-white mt-3">학급 데이터를 등록 중입니다...</h5>
          </div>
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">학급 관리</h2>
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
                    bulkStatus("ACTIVE", "활성");
                    setShowDropdown(false);
                  }}
                >
                  활성
                </a>
              </li>
              <li>
                <a
                  className="dropdown-item text-danger"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    bulkStatus("FINISHED", "종료");
                    setShowDropdown(false);
                  }}
                >
                  종료
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
          <Link to={`${BASE}/classes/create`} className="btn btn-primary">
            <i className="bi bi-plus-lg" /> 학급 생성
          </Link>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <div className="row align-items-center">
            <div className="col">
              <h5 className="mb-0 text-dark">전체 학급 목록</h5>
            </div>
            <div className="col-auto">
              <form className="input-group input-group-sm" onSubmit={search}>
                <input
                  type="number"
                  className="form-control"
                  style={{ maxWidth: 100 }}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  placeholder="학년도"
                />
                <select
                  className="form-select"
                  style={{ maxWidth: 100 }}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                >
                  <option value="">전체 학년</option>
                  <option value="1">1학년</option>
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                </select>
                <select
                  className="form-select"
                  style={{ maxWidth: 120 }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">전체 상태</option>
                  <option value="ACTIVE">활성</option>
                  <option value="FINISHED">종료</option>
                </select>
                <button className="btn btn-primary" type="submit">
                  <i className="bi bi-search" /> 검색
                </button>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => {
                    setYear(new Date().getFullYear());
                    setGrade("");
                    setStatus("");
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
                <th className="ps-4">학년도</th>
                <th>학년</th>
                <th>반</th>
                <th>담임교사</th>
                <th>학생 수</th>
                <th>상태</th>
                <th className="text-end pe-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c: any) => (
                <tr key={c.cid}>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selected.includes(c.cid)}
                      onChange={() => toggleOne(c.cid)}
                    />
                  </td>
                  <td className="ps-4">{c.year}</td>
                  <td>{c.grade}학년</td>
                  <td>{c.classNum}반</td>
                  <td>
                    {c.teacherName ?? (
                      <span className="text-muted">미배정</span>
                    )}
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">
                      {c.studentCount ?? 0}명
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${c.status === "ACTIVE" ? "bg-success-subtle text-success border border-success-subtle" : "bg-secondary-subtle text-secondary border border-secondary-subtle"}`}
                    >
                      {c.status === "ACTIVE" ? "활성" : "종료"}
                    </span>
                  </td>
                  <td className="text-end pe-4">
                    <Link
                      to={`${BASE}/classes/${c.cid}`}
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
