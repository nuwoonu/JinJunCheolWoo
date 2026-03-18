import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_ROUTES } from '@/constants/routes';
import NotificationDropdown from '@/components/fragments/NotificationDropdown';

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
  const { signOut } = useAuth();

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
