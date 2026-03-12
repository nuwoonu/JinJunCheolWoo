import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ADMIN_ROUTES } from "../../constants/routes";

// [joon] parkjoon 어드민 레이아웃 - Bootstrap 5 다크 사이드바 (Thymeleaf 디자인 그대로)

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={`nav-link ${active ? "text-white fw-bold" : "text-white-50"}`}
    >
      {children}
    </Link>
  );
}

function CollapseMenu({
  icon,
  label,
  children,
  paths,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
  paths: string[];
}) {
  const { pathname } = useLocation();
  const isActive = paths.some((p) => pathname.startsWith(p));
  const [open, setOpen] = useState(isActive);
  return (
    <li className="nav-item">
      <button
        className="nav-link text-white d-flex align-items-center w-100 border-0 bg-transparent"
        onClick={() => setOpen((o) => !o)}
        style={{ cursor: "pointer" }}
      >
        <span className="me-2">{icon}</span>
        <span>{label}</span>
        <i className={`bi bi-chevron-${open ? "up" : "down"} ms-auto small`} />
      </button>
      {open && <ul className="nav flex-column ms-3">{children}</ul>}
    </li>
  );
}

export default function AdminLayout({
  children,
  msg,
  error,
}: {
  children: React.ReactNode;
  msg?: string;
  error?: string;
}) {
  const { user, signOut } = useAuth();

  return (
    <div className="container-fluid p-0" style={{ fontFamily: "inherit" }}>
      <div className="row g-0">
        {/* 사이드바 */}
        <div
          id="sidebar"
          className="col-md-2 bg-dark text-white p-3 d-flex flex-column"
          style={{
            height: "100vh",
            position: "sticky",
            top: 0,
            overflowY: "auto",
          }}
        >
          <div className="mb-4">
            <h5 className="text-info">Admin Center</h5>
          </div>

          <ul className="nav flex-column gap-2 mb-4">
            <li className="nav-item">
              <NavLink to={ADMIN_ROUTES.DASHBOARD}>
                <span className="me-2">📊</span>
                <span>대시보드</span>
              </NavLink>
            </li>
            <li className="nav-item border-top my-2" />

            <CollapseMenu
              icon="🏫"
              label="학교 운영 관리"
              paths={[
                ADMIN_ROUTES.CLASSES.LIST,
                ADMIN_ROUTES.TEACHERS.LIST,
                ADMIN_ROUTES.STUDENTS.LIST,
                ADMIN_ROUTES.PARENTS.LIST,
                ADMIN_ROUTES.STAFFS.LIST,
              ]}
            >
              <li className="nav-item">
                <NavLink to={ADMIN_ROUTES.CLASSES.LIST}>학급 관리</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to={ADMIN_ROUTES.TEACHERS.LIST}>교사 관리</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to={ADMIN_ROUTES.STUDENTS.LIST}>학생 관리</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to={ADMIN_ROUTES.PARENTS.LIST}>학부모 관리</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to={ADMIN_ROUTES.STAFFS.LIST}>교직원 관리</NavLink>
              </li>
            </CollapseMenu>

            <li className="nav-item border-top my-2" />

            <CollapseMenu
              icon="⚙️"
              label="기준 정보 관리"
              paths={[
                ADMIN_ROUTES.MASTER.SCHEDULE,
                ADMIN_ROUTES.MASTER.SUBJECTS,
                ADMIN_ROUTES.MASTER.SETTINGS,
              ]}
            >
              <li className="nav-item">
                <NavLink to={ADMIN_ROUTES.MASTER.SCHEDULE}>학사 일정</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to={ADMIN_ROUTES.MASTER.SUBJECTS}>교과목 코드</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to={ADMIN_ROUTES.MASTER.SETTINGS}>학년도 설정</NavLink>
              </li>
            </CollapseMenu>

            <li className="nav-item">
              <NavLink to={ADMIN_ROUTES.NOTICES.LIST}>
                <span className="me-2">📢</span>
                <span>전체 공지사항</span>
              </NavLink>
            </li>

            <CollapseMenu
              icon="🏢"
              label="시설/자산 관리"
              paths={[ADMIN_ROUTES.FACILITIES, ADMIN_ROUTES.ASSETS]}
            >
              <li className="nav-item">
                <NavLink to={ADMIN_ROUTES.FACILITIES}>
                  시설(강의실) 관리
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to={ADMIN_ROUTES.ASSETS}>기자재 관리</NavLink>
              </li>
            </CollapseMenu>

            <CollapseMenu
              icon="🛡️"
              label="감사 로그"
              paths={[ADMIN_ROUTES.AUDIT.ACCESS, ADMIN_ROUTES.AUDIT.CHANGES]}
            >
              <li className="nav-item">
                <NavLink to={ADMIN_ROUTES.AUDIT.ACCESS}>접속 기록</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to={ADMIN_ROUTES.AUDIT.CHANGES}>
                  정보 변경 이력
                </NavLink>
              </li>
            </CollapseMenu>
          </ul>

          <div className="mt-auto border-top pt-3 bg-dark">
            <div className="mb-3 px-3">
              <small className="text-muted d-block">접속 관리자</small>
              <span className="fw-bold">{user?.email ?? "Admin"}</span> 님
            </div>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={signOut}
            >
              <i className="bi bi-box-arrow-right me-2" /> 로그아웃
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <main className="col-md-10 p-4 bg-light" style={{ minHeight: "100vh" }}>
          {msg && (
            <div
              className="alert alert-success alert-dismissible fade show"
              role="alert"
            >
              {msg}
              <button
                type="button"
                className="btn-close"
                onClick={(e) =>
                  (e.currentTarget.closest(".alert") as HTMLElement)?.remove()
                }
              />
            </div>
          )}
          {error && (
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
            >
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={(e) =>
                  (e.currentTarget.closest(".alert") as HTMLElement)?.remove()
                }
              />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
