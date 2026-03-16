import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../../constants/routes";
import NotificationDropdown from "../fragments/NotificationDropdown";

function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const saved = localStorage.getItem("theme") ?? "light";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  return { isDark, toggle: () => setIsDark((prev) => !prev) };
}

// [joon] 공통 트랜지션 스타일 정의 (부드러운 다크모드 전환용)
const smoothTransition =
  "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease";

export default function AdminHeader() {
  const theme = useTheme();

  return (
    <div
      className="navbar-header shadow-1"
      style={{ transition: smoothTransition }}
    >
      <div className="row align-items-center justify-content-between">
        {/* 빠른 메뉴 */}
        <div className="col-auto d-none d-md-block">
          <div className="d-flex align-items-center gap-1">
            {(
              [
                { to: ADMIN_ROUTES.STUDENTS.LIST,  icon: "ri-graduation-cap-line", label: "학생 관리" },
                { to: ADMIN_ROUTES.TEACHERS.LIST,  icon: "ri-user-follow-line",    label: "교사 관리" },
                { to: ADMIN_ROUTES.STAFFS.LIST,    icon: "ri-user-2-line",         label: "교직원 관리" },
                { to: ADMIN_ROUTES.CLASSES.LIST,   icon: "ri-building-2-line",     label: "학급 관리" },
                { to: ADMIN_ROUTES.NOTICES.LIST,   icon: "ri-megaphone-line",      label: "공지 관리" },
              ] as const
            ).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="d-flex align-items-center gap-1 text-decoration-none text-secondary-light px-10 py-6 radius-8"
                style={{ fontSize: 12, fontWeight: 500, transition: "background 0.15s" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--neutral-100)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <i className={item.icon} style={{ fontSize: 14 }} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="col-auto">
          <div className="d-flex flex-wrap align-items-center gap-3">
            {/* 시스템 안내 멘트 */}
            <span
              className="d-none d-xl-inline text-secondary-light"
              style={{ fontSize: 11, lineHeight: 1.5 }}
            >
              왼쪽 메뉴를 통해 학급 편성, 교직원 관리 및 학생 DB 관리를 진행하실 수 있습니다.
            </span>
            <div
              className="d-none d-xl-block"
              style={{ width: 1, height: 20, background: "var(--neutral-300)" }}
            />
            {/* 다크모드 토글 버튼 */}
            <button
              type="button"
              onClick={theme.toggle}
              className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
              aria-label="Dark & Light Mode Button"
              style={{ transition: smoothTransition }}
            >
              <iconify-icon
                icon={theme.isDark ? "ri:sun-line" : "ri:moon-line"}
                className="text-primary-light text-xl"
                style={{ transition: "color 0.3s ease" }}
              />
            </button>

            <NotificationDropdown />
          </div>
        </div>
      </div>
    </div>
  );
}
