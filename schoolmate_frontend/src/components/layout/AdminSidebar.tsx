import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { useSchool } from "../../context/SchoolContext";
import { ADMIN_ROUTES } from "../../constants/routes";

function useSubmenu() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setOpen((prev) => ({ [key]: !prev[key] }));
  return { open, toggle };
}

function dc(isOpen: boolean) {
  return `dropdown${isOpen ? " open dropdown-open" : ""}`;
}

function useProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return { isOpen, toggle: () => setIsOpen((p) => !p), ref };
}

export default function AdminSidebar() {
  const { user, signOut } = useAuth();
  const { open, toggle } = useSubmenu();
  const { isOpen, isCollapsed, closeSidebar, toggleCollapse } = useSidebar();
  const profile = useProfileDropdown();
  const { selectedSchool, clearSelectedSchool } = useSchool();
  const navigate = useNavigate();

  const handleChangeSchool = () => {
    clearSelectedSchool();
    navigate(ADMIN_ROUTES.SCHOOL_SELECT);
  };

  return (
    <aside
      className={`sidebar${isOpen ? " sidebar-open" : ""}${isCollapsed ? " active" : ""}`}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <button
        type="button"
        className="sidebar-close-btn"
        onClick={closeSidebar}
      >
        <iconify-icon icon="radix-icons:cross-2" />
      </button>

      <div>
        <div className="sidebar-logo d-flex align-items-center justify-content-between">
          <a>
            <img
              src="/images/schoolmateLogo.png"
              alt="홈"
              className="light-logo"
              width="173"
              height="40"
            />
            <img
              src="/images/schoolmateLogo.png"
              alt="홈"
              className="dark-logo"
              width="173"
              height="40"
            />
            <img
              src="/images/schoolmateLogo.png"
              alt="홈"
              className="logo-icon"
            />
          </a>
          {/* <button
            type="button"
            className="text-xxl d-xl-flex d-none line-height-1 sidebar-toggle text-neutral-500"
            aria-label="Collapse Sidebar"
            onClick={toggleCollapse}
          >
            <i className="ri-contract-left-line" />
          </button> */}
        </div>
      </div>

      {user?.authenticated && (
        <div className="mx-16 py-12">
          <div className="dropdown profile-dropdown" ref={profile.ref}>
            <button
              type="button"
              className="profile-dropdown__button d-flex align-items-center justify-content-between p-10 w-100 overflow-hidden bg-neutral-50 radius-12"
              onClick={profile.toggle}
            >
              <span className="d-flex align-items-start gap-10">
                <img
                  src="/images/thumbs/leave-request-img2.png"
                  alt="Thumbnail"
                  className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                />
                <span className="profile-dropdown__contents">
                  <span className="h6 mb-0 text-md d-block text-primary-light">
                    {user.name ?? user.email}
                  </span>
                  <span className="text-secondary-light text-sm mb-0 d-block">
                    관리자
                  </span>
                </span>
              </span>
              <span className="profile-dropdown__icon pe-8 text-xl d-flex line-height-1">
                <i
                  className={`ri-arrow-${profile.isOpen ? "down" : "right"}-s-line`}
                />
              </span>
            </button>
            <ul
              className={`dropdown-menu dropdown-menu-lg-end border p-12${profile.isOpen ? " show" : ""}`}
            >
              {/* <li>
                <Link
                  to="/user/profile"
                  className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                >
                  <i className="ri-user-3-line" /> 나의 프로필
                </Link>
              </li> */}
              <li>
                <button
                  type="button"
                  className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6 w-100 border-0 bg-transparent"
                  onClick={signOut}
                >
                  <i className="ri-shut-down-line" /> 로그아웃
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="sidebar-menu-area" style={{ flex: 1, overflowY: "auto" }}>
        <ul className="sidebar-menu" id="sidebar-menu">
          <li>
            <Link to={ADMIN_ROUTES.DASHBOARD}>
              <i className="ri-layout-grid-line" />
              <span>관리자 대시보드</span>
            </Link>
          </li>

          <li className={dc(open.adminUsers)}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toggle("adminUsers");
              }}
            >
              <i className="ri-group-line" />
              <span>구성원 관리</span>
            </a>
            <ul className="sidebar-submenu">
              <li>
                <Link to={ADMIN_ROUTES.STUDENTS.LIST}>
                  <i className="ri-circle-fill circle-icon w-auto" /> 학생 관리
                </Link>
              </li>
              <li>
                <Link to={ADMIN_ROUTES.TEACHERS.LIST}>
                  <i className="ri-circle-fill circle-icon w-auto" /> 교사 관리
                </Link>
              </li>
              <li>
                <Link to={ADMIN_ROUTES.STAFFS.LIST}>
                  <i className="ri-circle-fill circle-icon w-auto" /> 교직원
                  관리
                </Link>
              </li>
            </ul>
          </li>

          <li className={dc(open.adminClasses)}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toggle("adminClasses");
              }}
            >
              <i className="ri-building-2-line" />
              <span>학급 관리</span>
            </a>
            <ul className="sidebar-submenu">
              <li>
                <Link to={ADMIN_ROUTES.CLASSES.LIST}>
                  <i className="ri-circle-fill circle-icon w-auto" /> 학급 목록
                </Link>
              </li>
              <li>
                <Link to={ADMIN_ROUTES.CLASSES.CREATE}>
                  <i className="ri-circle-fill circle-icon w-auto" /> 학급 생성
                </Link>
              </li>
            </ul>
          </li>

          <li>
            <Link to={ADMIN_ROUTES.NOTICES.LIST}>
              <i className="ri-megaphone-line" />
              <span>공지사항 관리</span>
            </Link>
          </li>

          <li className={dc(open.adminFacilities)}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toggle("adminFacilities");
              }}
            >
              <i className="ri-store-2-line" />
              <span>시설/기자재</span>
            </a>
            <ul className="sidebar-submenu">
              <li>
                <Link to={ADMIN_ROUTES.FACILITIES}>
                  <i className="ri-circle-fill circle-icon w-auto" /> 시설 관리
                </Link>
              </li>
              <li>
                <Link to={ADMIN_ROUTES.ASSETS}>
                  <i className="ri-circle-fill circle-icon w-auto" /> 기자재
                  관리
                </Link>
              </li>
            </ul>
          </li>

          <li className={dc(open.adminMaster)}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toggle("adminMaster");
              }}
            >
              <i className="ri-settings-3-line" />
              <span>기준 정보</span>
            </a>
            <ul className="sidebar-submenu">
              <li>
                <Link to={ADMIN_ROUTES.MASTER.SCHEDULE}>
                  <i className="ri-circle-fill circle-icon w-auto" /> 학사 일정
                </Link>
              </li>
              <li>
                <Link to={ADMIN_ROUTES.MASTER.SUBJECTS}>
                  <i className="ri-circle-fill circle-icon w-auto" /> 교과목
                </Link>
              </li>
              <li>
                <Link to={ADMIN_ROUTES.MASTER.SETTINGS}>
                  <i className="ri-circle-fill circle-icon w-auto" /> 시스템
                  설정
                </Link>
              </li>
            </ul>
          </li>

          <li className={dc(open.adminAudit)}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toggle("adminAudit");
              }}
            >
              <i className="ri-shield-check-line" />
              <span>감사 로그</span>
            </a>
            <ul className="sidebar-submenu">
              <li>
                <Link to={ADMIN_ROUTES.AUDIT.ACCESS}>
                  <i className="ri-circle-fill circle-icon w-auto" /> 접근 로그
                </Link>
              </li>
              <li>
                <Link to={ADMIN_ROUTES.AUDIT.CHANGES}>
                  <i className="ri-circle-fill circle-icon w-auto" /> 변경 로그
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </div>

      {/* 현재 학교 표시 + 학교 변경 버튼 */}
      <div className="border-top border-neutral-200 px-16 py-12">
        {selectedSchool && (
          <div
            className="text-secondary-light mb-6"
            style={{
              fontSize: 11,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={selectedSchool.name}
          >
            <i className="ri-building-line me-1" />
            {selectedSchool.name}
          </div>
        )}
        <button
          type="button"
          onClick={handleChangeSchool}
          className="w-100 bg-neutral-100 border border-neutral-200 text-secondary-light radius-8 d-flex align-items-center gap-2 px-12 py-8"
          style={{
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            e.currentTarget.classList.replace(
              "bg-neutral-100",
              "bg-neutral-200",
            )
          }
          onMouseLeave={(e) =>
            e.currentTarget.classList.replace(
              "bg-neutral-200",
              "bg-neutral-100",
            )
          }
        >
          <i className="ri-building-4-line" />
          <span>다른 학교 선택</span>
        </button>
      </div>
    </aside>
  );
}
