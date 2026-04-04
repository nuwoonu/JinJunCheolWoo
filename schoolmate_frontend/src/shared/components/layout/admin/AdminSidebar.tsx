import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from '@/shared/contexts/SidebarContext';
import { useSchool } from '@/shared/contexts/SchoolContext';
import { useAuth } from '@/shared/contexts/AuthContext';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import type { GrantInfo } from '@/shared/api/authApi';


// [soojin] 현재 경로 기반으로 해당 드롭다운 자동 열림 - 일반 Sidebar와 동일한 방식
function useSubmenu() {
  const location = useLocation();

  function initOpen(p: string): Record<string, boolean> {
    const r: Record<string, boolean> = {};
    if (p.startsWith("/admin/students") || p.startsWith("/admin/teachers") ||
        p.startsWith("/admin/staffs") || p.startsWith("/admin/parents")) r.adminUsers = true;
    // [soojin] 학급 관리 + 기준 정보 + 학사 일정을 "학사 운영"으로 통합
    if (p.startsWith("/admin/classes") || p.startsWith("/admin/master")) r.adminAcademic = true;
    if (p.startsWith("/admin/facilities") || p.startsWith("/admin/assets") ||
        p.startsWith("/admin/dormitory")) r.adminFacilities = true;
    if (p.startsWith("/admin/audit")) r.adminAudit = true;
    return r;
  }

  const [open, setOpen] = useState<Record<string, boolean>>(() => initOpen(location.pathname));

  useEffect(() => {
    setOpen(initOpen(location.pathname));
  }, [location.pathname]);

  const toggle = (key: string) => setOpen((prev) => ({ [key]: !prev[key] }));
  return { open, toggle };
}

// [soojin] 현재 페이지 링크만 primary 색상으로 표시
function SNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink to={to} end style={({ isActive }) => (isActive ? { color: "#25A194" } : {})}>
      {children}
    </NavLink>
  );
}

function dc(isOpen: boolean) {
  return `dropdown${isOpen ? " open dropdown-open" : ""}`;
}

/** grants 배열에서 특정 역할 보유 여부 */
function hasGrant(grants: GrantInfo[], ...roles: string[]) {
  return grants.some(g => roles.includes(g.grantedRole));
}

export default function AdminSidebar() {
  const { open, toggle } = useSubmenu();
  const { isOpen, isCollapsed, closeSidebar, toggleCollapse } = useSidebar();
  const { selectedSchool, clearSelectedSchool } = useSchool();
  const { user } = useAuth();
  const navigate = useNavigate();

  const grants: GrantInfo[] = user?.grants ?? [];
  const isSuperAdmin = hasGrant(grants, 'SUPER_ADMIN');
  const isSchoolAdmin = isSuperAdmin || hasGrant(grants, 'SCHOOL_ADMIN');

  // 메뉴 항목별 표시 여부
  const canSeeStudents    = isSchoolAdmin || hasGrant(grants, 'STUDENT_MANAGER');
  const canSeeTeachers    = isSchoolAdmin || hasGrant(grants, 'TEACHER_MANAGER');
  const canSeeStaffs      = isSchoolAdmin || hasGrant(grants, 'STAFF_MANAGER');
  const canSeeClasses     = isSchoolAdmin || hasGrant(grants, 'CLASS_MANAGER');
  const canSeeNotices     = isSchoolAdmin || hasGrant(grants, 'NOTICE_MANAGER');
  const canSeeFacilities  = isSchoolAdmin || hasGrant(grants, 'FACILITY_MANAGER');
  const canSeeAssets      = isSchoolAdmin || hasGrant(grants, 'ASSET_MANAGER');
  const canSeeDormitory   = isSchoolAdmin || hasGrant(grants, 'DORMITORY_MANAGER');
  const canSeeSchedule    = isSchoolAdmin || hasGrant(grants, 'SCHEDULE_MANAGER');
  // 기준 정보(과목·학기)는 SCHOOL_ADMIN 이상, 감사 로그는 SUPER_ADMIN 전용
  const canSeeMaster      = isSuperAdmin || isSchoolAdmin;
  const canSeeAudit       = isSuperAdmin;

  const canSeeMembers = canSeeStudents || canSeeTeachers || canSeeStaffs;
  // [soojin] 학사 운영 그룹: 학급 관리 + 학교 일정 + 학기 관리/교과목 중 하나라도 권한 있으면 표시
  const canSeeAcademicGroup = canSeeClasses || canSeeSchedule || canSeeMaster;
  const canSeeFacilitiesGroup = canSeeFacilities || canSeeAssets || canSeeDormitory;

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
        <div
          className="sidebar-logo d-flex align-items-center justify-content-between"
          style={{ paddingInlineStart: "1.5rem", paddingInlineEnd: "1.5rem" }}
        >
          {!isCollapsed && (
            <a href="/main">
              <img src="/images/schoolmateLogo.png" alt="홈" className="light-logo" width="160" height="37" />
              <img src="/images/schoolmateLogo.png" alt="홈" className="dark-logo" width="160" height="37" />
              <img src="/images/schoolmateLogo.png" alt="홈" className="logo-icon" />
            </a>
          )}
          <button
            type="button"
            className="text-xxl d-xl-flex d-none line-height-1 sidebar-toggle text-neutral-500"
            aria-label="Collapse Sidebar"
            onClick={toggleCollapse}
            style={
              isCollapsed
                ? { left: "50%", right: "auto", top: "2.25rem", transform: "translateX(-50%) translateY(-50%)" }
                : {}
            }
          >
            <i className={isCollapsed ? "ri-contract-right-line" : "ri-contract-left-line"} />
          </button>
        </div>
      </div>

      <div className="sidebar-menu-area" style={{ flex: 1, overflowY: "auto" }}>
        <ul className="sidebar-menu" id="sidebar-menu">
          <li>
            <SNavLink to={ADMIN_ROUTES.DASHBOARD}>
              <i className="ri-layout-grid-line" />
              <span>관리자 대시보드</span>
            </SNavLink>
          </li>

          {canSeeMembers && (
            <li className={dc(open.adminUsers)}>
              {/* [soojin] "구성원 관리" → "사용자 관리" */}
              <a href="#" onClick={(e) => { e.preventDefault(); toggle("adminUsers"); }}>
                <i className="ri-group-line" />
                <span>사용자 관리</span>
              </a>
              <ul className="sidebar-submenu">
                {canSeeStudents && (
                  <li>
                    <SNavLink to={ADMIN_ROUTES.STUDENTS.LIST}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 학생 관리
                    </SNavLink>
                  </li>
                )}
                {canSeeTeachers && (
                  <li>
                    <SNavLink to={ADMIN_ROUTES.TEACHERS.LIST}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 교사 관리
                    </SNavLink>
                  </li>
                )}
                {canSeeStaffs && (
                  <li>
                    <SNavLink to={ADMIN_ROUTES.STAFFS.LIST}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 교직원 관리
                    </SNavLink>
                  </li>
                )}
                <li>
                  <SNavLink to={ADMIN_ROUTES.TRANSFER}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 전입 처리
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}

          {/* [soojin] 학급 관리 + 학사 일정 + 기준 정보를 "학사 운영"으로 통합 */}
          {canSeeAcademicGroup && (
            <li className={dc(open.adminAcademic)}>
              <a href="#" onClick={(e) => { e.preventDefault(); toggle("adminAcademic"); }}>
                <i className="ri-book-open-line" />
                <span>학사 운영</span>
              </a>
              <ul className="sidebar-submenu">
                {canSeeClasses && (
                  <>
                    <li>
                      <SNavLink to={ADMIN_ROUTES.CLASSES.LIST}>
                        <i className="ri-circle-fill circle-icon w-auto" /> 학급 목록
                      </SNavLink>
                    </li>
                    <li>
                      <SNavLink to={ADMIN_ROUTES.CLASSES.CREATE}>
                        <i className="ri-circle-fill circle-icon w-auto" /> 학급 생성
                      </SNavLink>
                    </li>
                  </>
                )}
                {canSeeSchedule && (
                  <li>
                    <SNavLink to={ADMIN_ROUTES.MASTER.SCHEDULE}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 학교 일정
                    </SNavLink>
                  </li>
                )}
                {canSeeMaster && (
                  <li>
                    <SNavLink to={ADMIN_ROUTES.MASTER.SETTINGS}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 학기 관리
                    </SNavLink>
                  </li>
                )}
                {canSeeMaster && (
                  <li>
                    <SNavLink to={ADMIN_ROUTES.MASTER.SUBJECTS}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 교과목
                    </SNavLink>
                  </li>
                )}
              </ul>
            </li>
          )}

          {canSeeNotices && (
            <li>
              {/* [soojin] "공지사항 관리" → "공지사항" */}
              <SNavLink to={ADMIN_ROUTES.NOTICES.LIST}>
                <i className="ri-megaphone-line" />
                <span>공지사항</span>
              </SNavLink>
            </li>
          )}

          {canSeeFacilitiesGroup && (
            <li className={dc(open.adminFacilities)}>
              {/* [soojin] "시설/기자재" → "시설 및 자산 관리" */}
              <a href="#" onClick={(e) => { e.preventDefault(); toggle("adminFacilities"); }}>
                <i className="ri-store-2-line" />
                <span>시설 및 자산 관리</span>
              </a>
              <ul className="sidebar-submenu">
                {canSeeFacilities && (
                  <li>
                    <SNavLink to={ADMIN_ROUTES.FACILITIES}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 시설 관리
                    </SNavLink>
                  </li>
                )}
                {canSeeAssets && (
                  <li>
                    <SNavLink to={ADMIN_ROUTES.ASSETS}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 기자재 관리
                    </SNavLink>
                  </li>
                )}
                {canSeeDormitory && (
                  <li>
                    <SNavLink to={ADMIN_ROUTES.DORMITORY}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 기숙사 관리
                    </SNavLink>
                  </li>
                )}
              </ul>
            </li>
          )}

          {canSeeAudit && (
            <li className={dc(open.adminAudit)}>
              <a href="#" onClick={(e) => { e.preventDefault(); toggle("adminAudit"); }}>
                <i className="ri-shield-check-line" />
                <span>감사 로그</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to={ADMIN_ROUTES.AUDIT.ACCESS}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 접근 로그
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to={ADMIN_ROUTES.AUDIT.CHANGES}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 변경 로그
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}
        </ul>
      </div>

      {/* 현재 학교 표시 + 학교 변경 버튼 (SUPER_ADMIN 전용) */}
      <div
        className="border-top border-neutral-200 py-12"
        style={{ paddingInline: isCollapsed ? "0" : "16px", textAlign: isCollapsed ? "center" : "left" }}
      >
        {isCollapsed ? (
          /* 접힌 상태: 아이콘만 */
          <div
            className="text-secondary-light d-flex justify-content-center"
            title={selectedSchool?.name}
            style={{ fontSize: 18 }}
          >
            <i className="ri-building-line" />
          </div>
        ) : (
          <>
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
            {isSuperAdmin && (
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
                  e.currentTarget.classList.replace("bg-neutral-100", "bg-neutral-200")
                }
                onMouseLeave={(e) =>
                  e.currentTarget.classList.replace("bg-neutral-200", "bg-neutral-100")
                }
              >
                <i className="ri-building-4-line" />
                <span>다른 학교 선택</span>
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
