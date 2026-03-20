import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_ROUTES } from '@/constants/routes';
import NotificationDropdown from '@/components/fragments/NotificationDropdown';
import type { GrantInfo } from '@/api/auth';

const GRANT_LABELS: Record<string, string> = {
  SUPER_ADMIN:      '최고 관리자',
  SCHOOL_ADMIN:     '학교 관리자',
  STUDENT_MANAGER:  '학생 관리',
  TEACHER_MANAGER:  '교사 관리',
  STAFF_MANAGER:    '교직원 관리',
  PARENT_MANAGER:   '학부모 관리',
  CLASS_MANAGER:    '학급 관리',
  NOTICE_MANAGER:   '공지 관리',
  SCHEDULE_MANAGER: '일정 관리',
  FACILITY_MANAGER: '시설 관리',
  ASSET_MANAGER:    '기자재 관리',
  LIBRARIAN:        '도서 관리',
  NURSE:            '보건 관리',
  NUTRITIONIST:     '급식 관리',
};

function grantBadgeColor(role: string) {
  if (role === 'SUPER_ADMIN')  return '#ef4444';
  if (role === 'SCHOOL_ADMIN') return '#f97316';
  return '#25A194';
}

function GrantTooltip({ grants }: { grants: GrantInfo[] }) {
  const [visible, setVisible] = useState(false);
  return (
    <span style={{ position: 'relative' }}>
      <span
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{
          background: 'var(--neutral-400)',
          color: '#fff',
          borderRadius: 4,
          padding: '1px 5px',
          fontSize: 9,
          fontWeight: 600,
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        +{grants.length - 1}
      </span>
      {visible && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--body-bg, #fff)',
            border: '1px solid var(--neutral-200)',
            borderRadius: 8,
            padding: '8px 10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 300,
            minWidth: 140,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {grants.map((g) => (
            <span
              key={g.grantedRole + (g.schoolId ?? '')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: 'var(--text-primary-light)',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: grantBadgeColor(g.grantedRole),
                  flexShrink: 0,
                }}
              />
              {GRANT_LABELS[g.grantedRole] ?? g.grantedRole}
            </span>
          ))}
        </div>
      )}
    </span>
  );
}

function useTheme() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);
  useEffect(() => {
    const saved = localStorage.getItem("theme") ?? "light";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);
  return { isDark, toggle: () => setIsDark((p) => !p) };
}

const smoothTransition =
  "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease";

interface NavLinkItem {
  to: string;
  icon: string;
  label: string;
}

interface AdminTopBarProps {
  /** fixed: 사이드바 레이아웃용 / sticky: 독립 페이지용 */
  position?: "fixed" | "sticky";
  /** 관리자 메뉴 뒤로가기 버튼 표시 여부 (default: true) */
  showBackButton?: boolean;
  /** 우측에 표시할 현재 섹션 뱃지 (예: "학부모 관리") */
  sectionBadge?: string;
  /** 상단 빠른 메뉴 링크 목록 (학생관리, 교사관리 등) */
  navLinks?: ReadonlyArray<NavLinkItem>;
  /** 섹션 간 빠른 이동 버튼 (예: 학부모 관리 → 학교 관리) */
  quickLink?: NavLinkItem;
}

export default function AdminTopBar({
  position = "sticky",
  showBackButton = true,
  sectionBadge,
  navLinks,
  quickLink,
}: AdminTopBarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const grants: GrantInfo[] = user?.grants ?? [];

  const navBtnCls =
    "d-flex align-items-center gap-1 text-decoration-none text-secondary-light px-10 py-6 radius-8";

  return (
    <div
      className="navbar-header shadow-1"
      style={{
        transition: smoothTransition,
        position,
        top: 0,
        zIndex: 200,
        ...(position === "fixed" ? { left: 0, right: 0 } : {}),
      }}
    >
      <div className="row align-items-center justify-content-between">

        {/* ── 좌측: 로고 → 구분선 → 관리자 메뉴 → (빠른 메뉴) ── */}
        <div className="col-auto">
          <div className="d-flex align-items-center gap-2">
            <Link to="/hub" style={{ lineHeight: 0 }}>
              <img
                src="/images/schoolmateLogo.png"
                alt="SchoolMate"
                style={{ height: 28, width: "auto" }}
              />
            </Link>
            {showBackButton && (
              <>
                <div style={{ width: 1, height: 20, background: "var(--neutral-300)" }} />
                <button
                  type="button"
                  onClick={() => navigate(ADMIN_ROUTES.MAIN)}
                  className={navBtnCls}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--neutral-100)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <i className="ri-arrow-left-line" style={{ fontSize: 16 }} />
                  <span>관리자 메뉴</span>
                </button>
              </>
            )}

            {navLinks && navLinks.length > 0 && (
              <div className="d-none d-md-flex align-items-center gap-1 ms-1">
                {navLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={navBtnCls}
                    style={{ fontSize: 12, fontWeight: 500, transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--neutral-100)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <i className={item.icon} style={{ fontSize: 14 }} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 우측: 섹션 뱃지 → 퀵 이동 버튼 → 구분선 → 다크모드 → 알림 → 로그아웃 ── */}
        <div className="col-auto">
          <div className="d-flex align-items-center gap-3">
            {sectionBadge && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#25A194",
                  padding: "4px 12px",
                  background: "rgba(37,161,148,0.1)",
                  borderRadius: 20,
                }}
              >
                {sectionBadge}
              </span>
            )}
            {quickLink && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(quickLink.to)}
                  className={navBtnCls}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--neutral-100)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <i className={quickLink.icon} style={{ fontSize: 15 }} />
                  <span>{quickLink.label}</span>
                </button>
                <div style={{ width: 1, height: 20, background: "var(--neutral-300)" }} />
              </>
            )}
            <button
              type="button"
              onClick={theme.toggle}
              className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
              aria-label="Dark & Light Mode Button"
              style={{ border: "none", transition: smoothTransition }}
            >
              <iconify-icon
                icon={theme.isDark ? "ri:sun-line" : "ri:moon-line"}
                className="text-primary-light text-xl"
              />
            </button>
            <NotificationDropdown />

            {/* 현재 로그인 사용자 정보 */}
            {user && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 10px',
                  borderRadius: 8,
                  background: 'var(--neutral-100)',
                  border: '1px solid var(--neutral-200)',
                  transition: smoothTransition,
                  maxWidth: 220,
                }}
              >
                <i className="ri-user-3-fill" style={{ fontSize: 18, color: '#25A194', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name ?? user.email}
                  </div>
                  <div style={{ display: 'flex', gap: 3, marginTop: 2, alignItems: 'center' }}>
                    {grants[0] && (
                      <span
                        style={{
                          background: grantBadgeColor(grants[0].grantedRole),
                          color: '#fff',
                          borderRadius: 4,
                          padding: '1px 5px',
                          fontSize: 9,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {GRANT_LABELS[grants[0].grantedRole] ?? grants[0].grantedRole}
                      </span>
                    )}
                    {grants.length >= 2 && (
                      <GrantTooltip grants={grants} />
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              className="btn btn-sm btn-outline-danger"
              onClick={signOut}
              style={{ fontSize: 13 }}
            >
              <i className="bi bi-box-arrow-right me-1" />
              로그아웃
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
