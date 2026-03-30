import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSidebar } from '@/contexts/SidebarContext';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_ROUTES } from '@/constants/routes';
import type { GrantInfo } from '@/api/auth';

function useSubmenu() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setOpen((prev) => ({ [key]: !prev[key] }));
  return { open, toggle };
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
  const { isOpen, isCollapsed, closeSidebar } = useSidebar();
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
  const canSeeFacilitiesGroup = canSeeFacilities || canSeeAssets || canSeeDormitory;

  const handleChangeSchool = () => {
    clearSelectedSchool();
    navigate(ADMIN_ROUTES.SCHOOL_SELECT);
  };

  return (
    <aside
      className={`sidebar${isOpen ? " sidebar-open" : ""}${isCollapsed ? " active" : ""}`}
      style={{ display: "flex", flexDirection: "column", insetBlockStart: "4.5rem", height: "calc(100vh - 4.5rem)" }}
    >
      <button
        type="button"
        className="sidebar-close-btn"
        onClick={closeSidebar}
      >
        <iconify-icon icon="radix-icons:cross-2" />
      </button>

      <div className="sidebar-menu-area" style={{ flex: 1, overflowY: "auto" }}>
        <ul className="sidebar-menu" id="sidebar-menu">
          <li>
            <Link to={ADMIN_ROUTES.DASHBOARD}>
              <i className="ri-layout-grid-line" />
              <span>관리자 대시보드</span>
            </Link>
          </li>

          {canSeeMembers && (
            <li className={dc(open.adminUsers)}>
              <a href="#" onClick={(e) => { e.preventDefault(); toggle("adminUsers"); }}>
                <i className="ri-group-line" />
                <span>구성원 관리</span>
              </a>
              <ul className="sidebar-submenu">
                {canSeeStudents && (
                  <li>
                    <Link to={ADMIN_ROUTES.STUDENTS.LIST}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 학생 관리
                    </Link>
                  </li>
                )}
                {canSeeTeachers && (
                  <li>
                    <Link to={ADMIN_ROUTES.TEACHERS.LIST}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 교사 관리
                    </Link>
                  </li>
                )}
                {canSeeStaffs && (
                  <li>
                    <Link to={ADMIN_ROUTES.STAFFS.LIST}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 교직원 관리
                    </Link>
                  </li>
                )}
              </ul>
            </li>
          )}

          {canSeeClasses && (
            <li className={dc(open.adminClasses)}>
              <a href="#" onClick={(e) => { e.preventDefault(); toggle("adminClasses"); }}>
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
          )}

          {canSeeNotices && (
            <li>
              <Link to={ADMIN_ROUTES.NOTICES.LIST}>
                <i className="ri-megaphone-line" />
                <span>공지사항 관리</span>
              </Link>
            </li>
          )}

          {canSeeSchedule && !canSeeMaster && (
            <li>
              <Link to={ADMIN_ROUTES.MASTER.SCHEDULE}>
                <i className="ri-calendar-line" />
                <span>학사 일정</span>
              </Link>
            </li>
          )}

          {canSeeFacilitiesGroup && (
            <li className={dc(open.adminFacilities)}>
              <a href="#" onClick={(e) => { e.preventDefault(); toggle("adminFacilities"); }}>
                <i className="ri-store-2-line" />
                <span>시설/기자재</span>
              </a>
              <ul className="sidebar-submenu">
                {canSeeFacilities && (
                  <li>
                    <Link to={ADMIN_ROUTES.FACILITIES}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 시설 관리
                    </Link>
                  </li>
                )}
                {canSeeAssets && (
                  <li>
                    <Link to={ADMIN_ROUTES.ASSETS}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 기자재 관리
                    </Link>
                  </li>
                )}
                {canSeeDormitory && (
                  <li>
                    <Link to={ADMIN_ROUTES.DORMITORY}>
                      <i className="ri-circle-fill circle-icon w-auto" /> 기숙사 관리
                    </Link>
                  </li>
                )}
              </ul>
            </li>
          )}

          {canSeeMaster && (
            <li className={dc(open.adminMaster)}>
              <a href="#" onClick={(e) => { e.preventDefault(); toggle("adminMaster"); }}>
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
                    <i className="ri-circle-fill circle-icon w-auto" /> 시스템 설정
                  </Link>
                </li>
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
          )}
        </ul>
      </div>

      {/* 현재 학교 표시 + 학교 변경 버튼 (SUPER_ADMIN 전용) */}
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
        )}
      </div>
    </aside>
  );
}
