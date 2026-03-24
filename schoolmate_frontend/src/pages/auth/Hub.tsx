import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import PageLoader from "@/components/PageLoader";
import { ADMIN_ROUTES } from "@/constants/routes";
import type { RoleRequestInfo, GrantInfo, RoleContext } from "@/api/auth";
import { getRoleContexts, switchContext, setPrimaryRole } from "@/api/auth";
import { auth } from "@/shared/auth";
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

export default function Hub() {
  const { user, loading, refetch } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [contexts, setContexts] = useState<RoleContext[]>([]);
  const [switchingId, setSwitchingId] = useState<number | null>(null);

  useEffect(() => {
    refetch();
    getRoleContexts()
      .then(setContexts)
      .catch(() => setContexts([]));
  }, []);

  if (loading) return <PageLoader />;
  if (!user?.authenticated) return <Navigate to="/login" replace />;

  const grants: GrantInfo[] = user.grants ?? [];
  const isSuperAdmin = grants.some((g) => g.grantedRole === "SUPER_ADMIN");
  const roleRequests: RoleRequestInfo[] = user.roleRequests ?? [];

  // 컨텍스트 전환 후 해당 역할 대시보드로 이동
  async function handleContextClick(ctx: RoleContext) {
    const cfg = ROLE_CONFIG.find((r) => r.role === ctx.roleType);
    if (!cfg || !ctx.isActive || switchingId !== null) return;
    try {
      setSwitchingId(ctx.infoId);
      const tokens = await switchContext(ctx.infoId, ctx.roleType);
      auth.setTokens(tokens.accessToken, tokens.refreshToken);
      navigate(cfg.path);
    } catch {
      setSwitchingId(null);
    }
  }

  // 메인 역할 지정
  async function handleSetPrimary(ctx: RoleContext, e: React.MouseEvent) {
    e.stopPropagation();
    if (ctx.isPrimary) return;
    try {
      await setPrimaryRole(ctx.infoId, ctx.roleType);
      setContexts((prev) =>
        prev.map((c) =>
          c.roleType === ctx.roleType
            ? { ...c, isPrimary: c.infoId === ctx.infoId }
            : c
        )
      );
    } catch {
      // 에러 무시 (이미 primary인 경우 등)
    }
  }

  // PARENT: roleRequests 기반 (SchoolMemberInfo가 아니므로 role-contexts에 없음)
  const parentRequest = roleRequests.find((r) => r.role === "PARENT");
  const parentCfg = ROLE_CONFIG.find((r) => r.role === "PARENT")!;

  // PENDING 신청 중이지만 아직 contexts에 없는 역할 (STUDENT/TEACHER/STAFF)
  const pendingRequests = roleRequests.filter(
    (rr) =>
      rr.role !== "PARENT" &&
      rr.status === "PENDING" &&
      !contexts.some((c) => c.roleType === rr.role)
  );

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
            <button onClick={theme.toggle} style={s.iconBtn} aria-label="다크모드 전환">
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

          {/* role-contexts 기반 카드 (STUDENT / TEACHER / STAFF) */}
          {contexts.map((ctx) => {
            const cfg = ROLE_CONFIG.find((r) => r.role === ctx.roleType);
            if (!cfg) return null;
            const isLoading = switchingId === ctx.infoId;

            return (
              <button
                key={ctx.infoId}
                style={{
                  ...s.roleCard,
                  borderTop: `4px solid ${ctx.isActive ? cfg.color : "#94a3b8"}`,
                  opacity: ctx.isActive ? 1 : 0.55,
                  cursor: ctx.isActive && switchingId === null ? "pointer" : "default",
                  position: "relative",
                }}
                onClick={() => handleContextClick(ctx)}
                disabled={!ctx.isActive || switchingId !== null}
                title={
                  !ctx.isActive
                    ? ctx.statusDesc
                    : ctx.isPrimary
                    ? "현재 메인 역할"
                    : undefined
                }
              >
                {/* 메인 배지 */}
                {ctx.isPrimary && (
                  <span style={s.primaryBadge}>
                    <i className="ri-star-fill" /> 메인
                  </span>
                )}

                <i
                  className={cfg.icon}
                  style={{ ...s.roleIcon, color: ctx.isActive ? cfg.color : "#94a3b8" }}
                />
                <span style={s.roleLabel}>{cfg.label}</span>

                {ctx.schoolName && (
                  <span style={s.roleSchool}>
                    <i className="ri-building-line" />
                    {ctx.schoolName}
                  </span>
                )}

                <span style={s.roleDesc}>
                  {ctx.isActive ? cfg.description : ctx.statusDesc}
                </span>

                {/* 비활성 상태 배지 */}
                {!ctx.isActive && (
                  <span style={{ ...s.statusBadge, background: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" }}>
                    <i className="ri-forbid-line" /> {ctx.statusDesc}
                  </span>
                )}

                {/* 로딩 표시 */}
                {isLoading && (
                  <span style={s.loadingText}>
                    <i className="ri-loader-4-line" /> 이동 중...
                  </span>
                )}

                {/* 메인으로 지정 버튼 (활성 인스턴스이고 primary 아닐 때) */}
                {ctx.isActive && !ctx.isPrimary && !isLoading && (
                  <button
                    style={s.setPrimaryBtn}
                    onClick={(e) => handleSetPrimary(ctx, e)}
                    title="메인 역할로 지정"
                  >
                    <i className="ri-star-line" /> 메인으로
                  </button>
                )}
              </button>
            );
          })}

          {/* 학부모 카드 (roleRequests 기반) */}
          {parentRequest &&
            (parentRequest.status === "ACTIVE" || parentRequest.status === "PENDING") && (
              <button
                style={{
                  ...s.roleCard,
                  borderTop: `4px solid ${parentRequest.status === "ACTIVE" ? parentCfg.color : "#94a3b8"}`,
                  opacity: parentRequest.status === "ACTIVE" ? 1 : 0.55,
                  cursor: parentRequest.status === "ACTIVE" ? "pointer" : "default",
                }}
                onClick={() => parentRequest.status === "ACTIVE" && navigate(parentCfg.path)}
                disabled={parentRequest.status !== "ACTIVE"}
              >
                <i
                  className={parentCfg.icon}
                  style={{
                    ...s.roleIcon,
                    color: parentRequest.status === "ACTIVE" ? parentCfg.color : "#94a3b8",
                  }}
                />
                <span style={s.roleLabel}>{parentCfg.label}</span>
                {parentRequest.schoolName && (
                  <span style={s.roleSchool}>
                    <i className="ri-building-line" />
                    {parentRequest.schoolName}
                  </span>
                )}
                <span style={s.roleDesc}>{parentCfg.description}</span>
                {parentRequest.status === "PENDING" && (
                  <span style={s.statusBadge}>
                    <i className="ri-time-line" /> 승인 대기
                  </span>
                )}
              </button>
            )}

          {/* PENDING 신청 카드 (아직 contexts에 없는 역할) */}
          {pendingRequests.map((rr) => {
            const cfg = ROLE_CONFIG.find((r) => r.role === rr.role);
            if (!cfg) return null;
            return (
              <button
                key={`pending-${rr.role}`}
                style={{
                  ...s.roleCard,
                  borderTop: "4px solid #94a3b8",
                  opacity: 0.55,
                  cursor: "default",
                }}
                disabled
                title="관리자 승인 대기 중입니다."
              >
                <i className={cfg.icon} style={{ ...s.roleIcon, color: "#94a3b8" }} />
                <span style={s.roleLabel}>{cfg.label}</span>
                {rr.schoolName && (
                  <span style={s.roleSchool}>
                    <i className="ri-building-line" />
                    {rr.schoolName}
                  </span>
                )}
                <span style={s.roleDesc}>{cfg.description}</span>
                <span style={s.statusBadge}>
                  <i className="ri-time-line" /> 승인 대기
                </span>
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
    primaryBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      fontSize: 10,
      fontWeight: 600,
      color: "#d97706",
      background: isDark ? "#292524" : "#fffbeb",
      border: "1px solid #fde68a",
      borderRadius: 20,
      padding: "2px 6px",
    },
    setPrimaryBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
      padding: "3px 10px",
      fontSize: 11,
      color: textSecondary,
      background: "transparent",
      border: `1px solid ${border}`,
      borderRadius: 20,
      cursor: "pointer",
    },
    loadingText: {
      fontSize: 11,
      color: textSecondary,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
    },
  };
}
