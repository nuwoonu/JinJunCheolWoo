import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import PageLoader from "@/components/PageLoader";
import { ADMIN_ROUTES } from "@/constants/routes";
import type { RoleRequestInfo, GrantInfo } from "@/api/auth";
import NotificationDropdown from "@/components/fragments/NotificationDropdown";
import ProfileDropdown from "@/components/profile/ProfileDropdown";

function useTheme() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);
  return { isDark, toggle: () => setIsDark((p) => !p) };
}

interface RoleConfig {
  role: string;
  label: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}

const ROLE_CONFIG: RoleConfig[] = [
  {
    role: "STUDENT",
    label: "학생",
    description: "학생 대시보드로 이동합니다.",
    icon: "ri-graduation-cap-line",
    path: "/student/dashboard",
    color: "#25A194",
  },
  {
    role: "TEACHER",
    label: "교사",
    description: "교사 대시보드로 이동합니다.",
    icon: "ri-presentation-line",
    path: "/teacher/dashboard",
    color: "#1d4ed8",
  },
  {
    role: "PARENT",
    label: "학부모",
    description: "학부모 대시보드로 이동합니다.",
    icon: "ri-user-heart-line",
    path: "/parent/dashboard",
    color: "#d97706",
  },
  {
    role: "STAFF",
    label: "교직원",
    description: "소속 학교 관리 페이지로 이동합니다.",
    icon: "ri-id-card-line",
    path: ADMIN_ROUTES.MAIN,
    color: "#6366f1",
  },
];

function getRoleRequestStatus(roleRequests: RoleRequestInfo[] | undefined, role: string) {
  return roleRequests?.find((r) => r.role === role)?.status ?? null;
}


export default function Hub() {
  const { user, loading, refetch } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  // 역할 추가 후 돌아왔을 때 최신 roleRequests 반영
  useEffect(() => {
    refetch();
  }, []);

  if (loading) return <PageLoader />;
  if (!user?.authenticated) return <Navigate to="/login" replace />;

  const userRoles = user.roles && user.roles.length > 0
    ? user.roles
    : user.role ? [user.role] : [];

  const grants: GrantInfo[] = user.grants ?? [];
  const isSuperAdmin = grants.some(g => g.grantedRole === "SUPER_ADMIN");
  // grants가 하나라도 있으면 어드민 카드 표시
  const roleRequests = user.roleRequests;

  // ACTIVE RoleRequest가 있는 역할만 클릭 가능 카드로 표시
  // PENDING이면 흐릿하게 (대기 중 표시), REJECTED/없음이면 숨김
  const roleCards = ROLE_CONFIG.map((cfg) => {
    const rr = roleRequests?.find((r) => r.role === cfg.role);
    const status = rr?.status ?? null;
    const schoolName = rr?.schoolName ?? null;
    const hasActiveRole = userRoles.includes(cfg.role);

    if (!status && !hasActiveRole) return null; // 신청 기록 없음

    return { cfg, status: status ?? (hasActiveRole ? 'ACTIVE' : null), schoolName };
  }).filter(Boolean) as { cfg: RoleConfig; status: string; schoolName: string | null }[];

  const s = getStyles(theme.isDark);

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* 헤더 */}
        <div style={s.header}>
          <div style={s.logoArea}>
            <img src="/images/schoolmateLogo.png" alt="Schoolmate" style={s.logo} />
          </div>
          <div style={s.userInfo}>
            <span style={s.userName}>{user.name}</span>
            <span style={s.userEmail}>{user.email}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={theme.toggle}
              style={s.iconBtn}
              aria-label="다크모드 전환"
            >
              <i className={theme.isDark ? "ri-sun-line" : "ri-moon-line"} style={{ fontSize: 18 }} />
            </button>
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </div>

        {/* 안내 문구 */}
        <div style={s.welcomeBox}>
          <h4 style={s.welcomeTitle}>이동할 페이지를 선택하세요</h4>
          <p style={s.welcomeDesc}>보유한 역할에 맞는 페이지로 이동하거나, 새 역할을 추가할 수 있습니다.</p>
        </div>

        {/* 역할 카드 목록 */}
        <div style={s.cardGrid}>
          {roleCards.map(({ cfg, status, schoolName }) => {
            const isPending = status === 'PENDING';
            const isSuspended = status === 'SUSPENDED';
            const isActive = status === 'ACTIVE';

            return (
              <button
                key={cfg.role}
                style={{
                  ...s.roleCard,
                  borderTop: `4px solid ${isPending || isSuspended ? '#94a3b8' : cfg.color}`,
                  opacity: isPending || isSuspended ? 0.55 : 1,
                  cursor: isActive ? 'pointer' : 'default',
                  position: 'relative',
                }}
                onClick={() => isActive && navigate(cfg.path)}
                disabled={!isActive}
                title={isPending ? '관리자 승인 대기 중입니다.' : isSuspended ? '역할이 정지되었습니다.' : undefined}
              >
                <i
                  className={cfg.icon}
                  style={{ ...s.roleIcon, color: isPending || isSuspended ? '#94a3b8' : cfg.color }}
                />
                <span style={s.roleLabel}>{cfg.label}</span>
                {schoolName && (
                  <span style={s.roleSchool}>
                    <i className="ri-building-line" />
                    {schoolName}
                  </span>
                )}
                <span style={s.roleDesc}>{cfg.description}</span>
                {isPending && (
                  <span style={s.statusBadge}>
                    <i className="ri-time-line" /> 승인 대기
                  </span>
                )}
                {isSuspended && (
                  <span style={{ ...s.statusBadge, background: '#fef2f2', color: '#dc2626' }}>
                    <i className="ri-forbid-line" /> 정지됨
                  </span>
                )}
              </button>
            );
          })}

          {/* 관리자 페이지 (SUPER_ADMIN 전용) */}
          {isSuperAdmin && (
            <button
              style={{ ...s.roleCard, borderTop: "4px solid #ef4444" }}
              onClick={() => navigate(ADMIN_ROUTES.MAIN)}
            >
              <i className="ri-shield-user-line" style={{ ...s.roleIcon, color: "#ef4444" }} />
              <span style={s.roleLabel}>관리자</span>
              <span style={s.roleDesc}>전체 시스템을 관리합니다.</span>
            </button>
          )}

          {/* 역할 추가 */}
          <button
            style={{ ...s.roleCard, ...s.addRoleCard }}
            onClick={() => navigate("/select-info?source=hub")}
          >
            <i className="ri-add-circle-line" style={{ ...s.roleIcon, color: "#94a3b8" }} />
            <span style={{ ...s.roleLabel, color: "#94a3b8" }}>역할 추가</span>
            <span style={s.roleDesc}>새로운 역할을 등록합니다.</span>
          </button>
        </div>

      </div>
    </div>
  );
}

function getStyles(isDark: boolean): Record<string, React.CSSProperties> {
  const bg = isDark ? "#0f172a" : "#f3f4f6";
  const surface = isDark ? "#1e293b" : "#fff";
  const border = isDark ? "#334155" : "#e5e7eb";
  const textPrimary = isDark ? "#f1f5f9" : "#111827";
  const textSecondary = isDark ? "#94a3b8" : "#6b7280";
  const iconBtnBg = isDark ? "#334155" : "#f3f4f6";
  const addCardBg = isDark ? "#1e293b" : "#fafafa";

  return {
    page: {
      minHeight: "100vh",
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    },
    container: {
      width: "100%",
      maxWidth: 640,
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 28,
      background: surface,
      borderRadius: 12,
      padding: "16px 20px",
      boxShadow: isDark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)",
    },
    logoArea: {
      flex: "0 0 auto",
    },
    logo: {
      height: 32,
      objectFit: "contain",
    },
    userInfo: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
    },
    userName: {
      fontSize: 14,
      fontWeight: 600,
      color: textPrimary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    userEmail: {
      fontSize: 12,
      color: textSecondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    iconBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: iconBtnBg,
      border: "none",
      cursor: "pointer",
      color: textSecondary,
    },
    welcomeBox: {
      marginBottom: 20,
      paddingLeft: 4,
    },
    welcomeTitle: {
      fontSize: 18,
      fontWeight: 700,
      color: textPrimary,
      margin: "0 0 6px",
    },
    welcomeDesc: {
      fontSize: 13,
      color: textSecondary,
      margin: 0,
    },
    cardGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
      gap: 16,
      marginBottom: 20,
    },
    roleCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: 12,
      padding: "24px 16px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      cursor: "pointer",
      transition: "box-shadow 0.15s, transform 0.1s",
      textAlign: "center",
    },
    addRoleCard: {
      borderStyle: "dashed",
      background: addCardBg,
    },
    roleIcon: {
      fontSize: 32,
    },
    roleLabel: {
      fontSize: 15,
      fontWeight: 600,
      color: textPrimary,
    },
    roleSchool: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      color: textSecondary,
      background: isDark ? "#334155" : "#f3f4f6",
      borderRadius: 20,
      padding: "2px 8px",
    },
    roleDesc: {
      fontSize: 12,
      color: textSecondary,
      lineHeight: 1.4,
    },
    statusBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      fontWeight: 500,
      color: "#92400e",
      background: "#fffbeb",
      border: "1px solid #fde68a",
      borderRadius: 20,
      padding: "2px 8px",
      marginTop: 4,
    },
  };
}
