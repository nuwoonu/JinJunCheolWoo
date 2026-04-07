import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ADMIN_ROUTES } from "@/shared/constants/routes";
import NotificationDropdown from "@/features/notification/components/NotificationDropdown";
import ProfileDropdown from "@/features/profile/components/ProfileDropdown";
import { useSidebar } from "@/shared/contexts/SidebarContext";

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

const smoothTransition = "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease";

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
  /** 로고 클릭 시 이동할 경로 (기본값: /hub) */
  logoTo?: string;
  /** 좌측 상단 로고 표시 여부 (사이드바 없는 독립 페이지용) */
  showLogo?: boolean;
}

export default function AdminTopBar({
  position = "sticky",
  showBackButton = true,
  sectionBadge,
  navLinks,
  quickLink,
  logoTo = "/hub",
  showLogo = false,
}: AdminTopBarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  // [soojin] lazy initializer로 초기값을 즉시 계산 — 리마운트 시 초기값이 "13.75rem"으로 고정되어 페이지 이동마다 좌측으로 튀는 문제 수정
  const calcLeft = (collapsed: boolean) => {
    if (collapsed) return "5.375rem";
    const w = window.innerWidth;
    if (w >= 1650) return "19.5rem";
    if (w >= 1400) return "17.1875rem";
    return "13.75rem";
  };
  const [navLinksLeft, setNavLinksLeft] = useState(() => calcLeft(isCollapsed));
  useEffect(() => {
    const update = () => setNavLinksLeft(calcLeft(isCollapsed));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isCollapsed]);

  const navBtnCls = "d-flex align-items-center gap-1 text-decoration-none text-secondary-light px-10 py-6 radius-8";

  return (
    <div
      className="navbar-header"
      style={{
        transition: smoothTransition,
        position,
        top: 0,
        borderBottom: "1px solid #e0e0e0",
        ...(position === "fixed" ? { left: 0, right: 0, zIndex: 200 } : {}),
      }}
    >
      <div className="row align-items-center justify-content-between">
        {/* ── 좌측: 로고 (showLogo=true 시 표시) 또는 빈 공간 ── */}
        {/* [soojin] 사이드바 없는 독립 페이지(관리자 메뉴·학부모 관리·서비스 공지 관리)에 로고 표시 */}
        <div className="col-auto">
          {showLogo && (
            <Link to={logoTo} style={{ display: "flex", alignItems: "center", paddingLeft: "1.5rem", textDecoration: "none" }}>
              <img src="/images/schoolmateLogo.png" alt="SchoolMate" width="160" height="37" style={{ objectFit: "contain" }} />
            </Link>
          )}
        </div>

        {/* ── 중앙: 네비 링크 (사이드바 접힘 상태에 따라 left 동적 조정) ── */}
        {navLinks && navLinks.length > 0 && (
          <div
            className="d-none d-xl-flex align-items-center gap-1"
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              left: navLinksLeft,
              transition: "left 0.3s",
              pointerEvents: "none",
            }}
          >
            {/* [soojin] Link → NavLink 교체: 현재 페이지 링크는 글자색 강조, hover 라운드 박스 제거 */}
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navBtnCls}
                style={({ isActive }) => ({
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#25A194" : undefined,
                  pointerEvents: "auto",
                  transition: "color 0.15s",
                })}
                onMouseEnter={(e) => {
                  if (e.currentTarget.getAttribute("aria-current") !== "page") e.currentTarget.style.color = "#25A194";
                }}
                onMouseLeave={(e) => {
                  if (e.currentTarget.getAttribute("aria-current") !== "page") e.currentTarget.style.color = "";
                }}
              >
                <i className={item.icon} style={{ fontSize: 14 }} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* ── 우측: 섹션 뱃지 → 학부모 관리 → 관리자 메뉴 → 구분선 → 다크모드 → 알림 → 프로필 ── */}
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
              <button
                type="button"
                onClick={() => navigate(quickLink.to)}
                className={navBtnCls}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#25A194")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "")}
              >
                <i className={quickLink.icon} style={{ fontSize: 15 }} />
                <span>{quickLink.label}</span>
              </button>
            )}
            {showBackButton && (
              <button
                type="button"
                onClick={() => navigate(ADMIN_ROUTES.MAIN)}
                className={navBtnCls}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#25A194")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "")}
              >
                <span>관리자 메뉴</span>
              </button>
            )}
            {(quickLink || showBackButton) && (
              <div style={{ width: 1, height: 20, background: "var(--neutral-300)" }} />
            )}
            <button
              type="button"
              onClick={theme.toggle}
              className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
              aria-label="Dark & Light Mode Button"
              style={{ border: "none", transition: smoothTransition }}
            >
              <i className={`${theme.isDark ? "ri-sun-line" : "ri-moon-line"} text-primary-light text-xl`}></i>
            </button>
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </div>
  );
}
