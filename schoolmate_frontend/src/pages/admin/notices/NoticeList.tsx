import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/layout/AdminLayout";
import admin from "../../../api/adminApi";
import { ADMIN_ROUTES } from "../../../constants/routes";

export default function NoticeList() {
  const navigate = useNavigate();
  const [page, setPage] = useState<any>(null);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const load = (p = 0, kw = keyword) =>
    admin
      .get("/notices", {
        params: { keyword: kw || undefined, page: p, size: 15 },
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

  return (
    <AdminLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">공지사항 관리</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            전체 공지사항을 관리합니다.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link
            to={ADMIN_ROUTES.NOTICES.CREATE}
            className="btn btn-primary-600 radius-8"
          >
            <i className="bi bi-pencil-fill" /> 공지 작성
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="d-flex align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
            <h6 className="fw-semibold mb-0">공지사항 목록</h6>
            <div className="d-flex gap-2">
              <form className="input-group input-group-sm" onSubmit={search}>
                <input
                  className="form-control"
                  style={{ width: 300 }}
                  placeholder="제목 검색..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <button className="btn btn-primary-600 radius-8" type="submit">
                  <i className="bi bi-search" />
                </button>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => {
                    setKeyword("");
                    load(0, "");
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
                <th className="text-center" style={{ width: 80 }}>
                  No
                </th>
                <th>제목</th>
                <th className="text-center" style={{ width: 120 }}>
                  작성자
                </th>
                <th className="text-center" style={{ width: 120 }}>
                  작성일
                </th>
                <th className="text-center" style={{ width: 80 }}>
                  조회
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((n: any) => (
                <tr key={n.id}>
                  <td className="text-center">
                    {n.important ? (
                      <span className="badge bg-danger">중요</span>
                    ) : (
                      <span className="text-muted">{n.id}</span>
                    )}
                  </td>
                  <td>
                    <Link
                      to={ADMIN_ROUTES.NOTICES.DETAIL(n.id)}
                      className="fw-bold text-decoration-none text-primary-light"
                    >
                      {n.title}
                    </Link>
                  </td>
                  <td className="text-center text-muted">{n.writerName}</td>
                  <td className="text-center text-muted">
                    {n.createDate?.split("T")[0]}
                  </td>
                  <td className="text-center text-muted">{n.viewCount}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    공지사항이 없습니다.
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
