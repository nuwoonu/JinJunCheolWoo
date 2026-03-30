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
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
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
  const [contextsLoading, setContextsLoading] = useState(true);
  const [redirectChecked, setRedirectChecked] = useState(false);
  const [switchingId, setSwitchingId] = useState<number | null>(null);

  useEffect(() => {
    refetch();
    getRoleContexts()
      .then((data) => {
        setContexts(data);
        setContextsLoading(false);
      })
      .catch(() => {
        setContexts([]);
        setContextsLoading(false);
      });
  }, []);

  // 단일 활성 역할이면 허브를 거치지 않고 바로 이동
  // redirectChecked가 true가 될 때까지 PageLoader를 유지하므로 렌더링 플리커 없음
  useEffect(() => {
    if (loading || contextsLoading) return;
    if (!user?.authenticated) {
      setRedirectChecked(true);
      return;
    }

    const grants: GrantInfo[] = user.grants ?? [];
    const isSuperAdmin = grants.some((g) => g.grantedRole === "SUPER_ADMIN");
    const roleRequests: RoleRequestInfo[] = user.roleRequests ?? [];
    const parentRequest = roleRequests.find((r) => r.role === "PARENT");

    const hasNonActiveRole =
      contexts.some((c) => !c.isActive) ||
      (parentRequest != null && parentRequest.status !== "ACTIVE");

    if (hasNonActiveRole) {
      setRedirectChecked(true);
      return;
    }

    const activeContexts = contexts.filter((c) => c.isActive);
    const hasActiveParent = parentRequest?.status === "ACTIVE";
    const totalActive = activeContexts.length + (hasActiveParent ? 1 : 0);

    // SUPER_ADMIN 단독(다른 활성 역할 없음) → admin으로 바로 이동
    if (isSuperAdmin && totalActive === 0) {
      navigate(ADMIN_ROUTES.MAIN, { replace: true });
      return;
    }

    // 2개 이상이거나 SUPER_ADMIN이 다른 역할과 공존하면 허브 유지
    if (totalActive !== 1) {
      setRedirectChecked(true);
      return;
    }

    if (hasActiveParent) {
      const cfg = ROLE_CONFIG.find((r) => r.role === "PARENT")!;
      navigate(cfg.path, { replace: true });
      return;
    }

    const ctx = activeContexts[0];
    const cfg = ROLE_CONFIG.find((r) => r.role === ctx.roleType);
    if (!cfg) {
      setRedirectChecked(true);
      return;
    }

    switchContext(ctx.infoId, ctx.roleType)
      .then((tokens) => {
        auth.setTokens(tokens.accessToken, tokens.refreshToken);
        navigate(cfg.path, { replace: true });
      })
      .catch(() => {
        setRedirectChecked(true);
      });
  }, [loading, contextsLoading, user, contexts]);

  // redirectChecked가 true가 될 때까지 PageLoader 표시 (리다이렉트 시 Hub UI가 그려지지 않음)
  if (loading || contextsLoading || !redirectChecked) return <PageLoader />;
  if (!user?.authenticated) return <Navigate to="/login" replace />;

  const grants: GrantInfo[] = user.grants ?? [];
  const isSuperAdmin = grants.some((g) => g.grantedRole === "SUPER_ADMIN");
  const roleRequests: RoleRequestInfo[] = user.roleRequests ?? [];

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

  async function handleSetPrimary(ctx: RoleContext, e: React.MouseEvent) {
    e.stopPropagation();
    if (ctx.isPrimary) return;
    try {
      await setPrimaryRole(ctx.infoId, ctx.roleType);
      setContexts((prev) =>
        prev.map((c) =>
          c.roleType === ctx.roleType
            ? { ...c, isPrimary: c.infoId === ctx.infoId }
            : c,
        ),
      );
    } catch {
      // no-op
    }
  }

  const parentRequest = roleRequests.find((r) => r.role === "PARENT");
  const parentCfg = ROLE_CONFIG.find((r) => r.role === "PARENT")!;

  // 메인 섹션: primary 인스턴스
  const primaryContexts = contexts.filter((c) => c.isPrimary);
  // 서브 섹션: non-primary 인스턴스
  const secondaryContexts = contexts.filter((c) => !c.isPrimary);
  // PENDING 신청 (contexts에 없는 역할)
  const pendingRequests = roleRequests.filter(
    (rr) =>
      rr.role !== "PARENT" &&
      rr.status === "PENDING" &&
      !contexts.some((c) => c.roleType === rr.role),
  );

  const hasSecondarySection =
    secondaryContexts.length > 0 || pendingRequests.length > 0;

  const s = getStyles(theme.isDark);

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* 헤더 */}
        <div style={s.header}>
          <div style={s.logoArea}>
            <img
              src="/images/schoolmateLogo.png"
              alt="Schoolmate"
              style={s.logo}
            />
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
              <i
                className={theme.isDark ? "ri-sun-line" : "ri-moon-line"}
                style={{ fontSize: 18 }}
              />
            </button>
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </div>

        {/* 안내 문구 + 역할 추가 버튼 */}
        <div style={{ ...s.welcomeBox, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h4 style={s.welcomeTitle}>이동할 페이지를 선택하세요</h4>
            <p style={s.welcomeDesc}>보유한 역할에 맞는 페이지로 이동합니다.</p>
          </div>
          <button
            style={s.addRoleBtn}
            onClick={() => navigate("/select-info?source=hub")}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(37,161,148,0.18)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(37,161,148,0.7)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = theme.isDark
                ? "rgba(37,161,148,0.12)"
                : "rgba(37,161,148,0.08)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(37,161,148,0.4)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <i className="ri-add-circle-line" style={{ fontSize: 16 }} />
            역할 추가
          </button>
        </div>

        {/* ── 메인 카드 그리드 ── */}
        <div style={s.cardGrid}>
          {/* primary 인스턴스 카드 */}
          {primaryContexts.map((ctx) => {
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
                  cursor:
                    ctx.isActive && switchingId === null
                      ? "pointer"
                      : "default",
                  position: "relative",
                }}
                onClick={() => handleContextClick(ctx)}
                disabled={!ctx.isActive || switchingId !== null}
                title={!ctx.isActive ? ctx.statusDesc : undefined}
              >
                <i
                  className={cfg.icon}
                  style={{
                    ...s.roleIcon,
                    color: ctx.isActive ? cfg.color : "#94a3b8",
                  }}
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
                {!ctx.isActive && (
                  <span
                    style={{
                      ...s.statusBadge,
                      background: "#fef2f2",
                      color: "#dc2626",
                      borderColor: "#fecaca",
                    }}
                  >
                    <i className="ri-forbid-line" /> {ctx.statusDesc}
                  </span>
                )}
                {isLoading && (
                  <span style={s.loadingText}>
                    <i className="ri-loader-4-line" /> 이동 중...
                  </span>
                )}
              </button>
            );
          })}

          {/* 학부모 카드 (단일 역할) */}
          {parentRequest &&
            (parentRequest.status === "ACTIVE" ||
              parentRequest.status === "PENDING") && (
              <button
                style={{
                  ...s.roleCard,
                  borderTop: `4px solid ${parentRequest.status === "ACTIVE" ? parentCfg.color : "#94a3b8"}`,
                  opacity: parentRequest.status === "ACTIVE" ? 1 : 0.55,
                  cursor:
                    parentRequest.status === "ACTIVE" ? "pointer" : "default",
                }}
                onClick={() =>
                  parentRequest.status === "ACTIVE" && navigate(parentCfg.path)
                }
                disabled={parentRequest.status !== "ACTIVE"}
              >
                <i
                  className={parentCfg.icon}
                  style={{
                    ...s.roleIcon,
                    color:
                      parentRequest.status === "ACTIVE"
                        ? parentCfg.color
                        : "#94a3b8",
                  }}
                />
                <span style={s.roleLabel}>{parentCfg.label}</span>
                <span style={s.roleDesc}>{parentCfg.description}</span>
                {parentRequest.status === "PENDING" && (
                  <span style={s.statusBadge}>
                    <i className="ri-time-line" /> 승인 대기
                  </span>
                )}
              </button>
            )}

          {/* 관리자 카드 (SUPER_ADMIN 전용) */}
          {isSuperAdmin && (
            <button
              onClick={() => navigate(ADMIN_ROUTES.MAIN)}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderTop: "3px solid #ef4444",
                borderRadius: 12,
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 0,
                cursor: "pointer",
                textAlign: "left",
                transition: "box-shadow 0.15s, transform 0.1s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 4px 16px rgba(0,0,0,0.1)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 1px 3px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(239,68,68,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <i
                  className="ri-shield-user-line"
                  style={{ fontSize: 24, color: "#ef4444" }}
                />
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 6,
                }}
              >
                관리자
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                전체 시스템을 관리합니다.
              </p>
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#ef4444",
                }}
              >
                바로가기 <i className="ri-arrow-right-line" />
              </div>
            </button>
          )}
        </div>

        {/* ── 보조 역할 섹션 ── */}
        {hasSecondarySection && (
          <div style={s.secondarySection}>
            <div style={s.sectionDivider}>
              <span style={s.sectionLabel}>
                <i className="ri-stack-line" /> 다른 역할 인스턴스
              </span>
            </div>

            <div style={s.secondaryList}>
              {/* non-primary 인스턴스 행 */}
              {secondaryContexts.map((ctx) => {
                const cfg = ROLE_CONFIG.find((r) => r.role === ctx.roleType);
                if (!cfg) return null;
                const isLoading = switchingId === ctx.infoId;
                return (
                  <div
                    key={ctx.infoId}
                    style={{
                      ...s.secondaryRow,
                      opacity: ctx.isActive ? 1 : 0.55,
                      cursor:
                        ctx.isActive && switchingId === null
                          ? "pointer"
                          : "default",
                    }}
                    onClick={() => handleContextClick(ctx)}
                    title={
                      !ctx.isActive ? ctx.statusDesc : "클릭하여 이 역할로 이동"
                    }
                  >
                    {/* 아이콘 + 이름 + 학교 */}
                    <div style={s.secondaryLeft}>
                      <i
                        className={cfg.icon}
                        style={{
                          fontSize: 20,
                          color: ctx.isActive ? cfg.color : "#94a3b8",
                          flexShrink: 0,
                        }}
                      />
                      <span style={s.secondaryLabel}>{cfg.label}</span>
                      {ctx.schoolName && (
                        <span style={s.roleSchool}>
                          <i className="ri-building-line" />
                          {ctx.schoolName}
                        </span>
                      )}
                      {!ctx.isActive && (
                        <span style={{ ...s.statusBadge, marginTop: 0 }}>
                          {ctx.statusDesc}
                        </span>
                      )}
                    </div>

                    {/* 오른쪽 액션 */}
                    <div
                      style={s.secondaryRight}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isLoading ? (
                        <span style={s.loadingText}>
                          <i className="ri-loader-4-line" /> 이동 중...
                        </span>
                      ) : ctx.isActive ? (
                        <button
                          style={s.promoteBtn}
                          onClick={(e) => handleSetPrimary(ctx, e)}
                          title="메인으로 지정"
                        >
                          <i className="ri-star-line" /> 메인으로
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {/* PENDING 신청 행 */}
              {pendingRequests.map((rr) => {
                const cfg = ROLE_CONFIG.find((r) => r.role === rr.role);
                if (!cfg) return null;
                return (
                  <div
                    key={`pending-${rr.role}`}
                    style={{
                      ...s.secondaryRow,
                      opacity: 0.55,
                      cursor: "default",
                    }}
                  >
                    <div style={s.secondaryLeft}>
                      <i
                        className={cfg.icon}
                        style={{
                          fontSize: 20,
                          color: "#94a3b8",
                          flexShrink: 0,
                        }}
                      />
                      <span style={s.secondaryLabel}>{cfg.label}</span>
                      {rr.schoolName && (
                        <span style={s.roleSchool}>
                          <i className="ri-building-line" />
                          {rr.schoolName}
                        </span>
                      )}
                      <span style={s.statusBadge}>
                        <i className="ri-time-line" /> 승인 대기
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
      boxShadow: isDark
        ? "0 1px 4px rgba(0,0,0,0.3)"
        : "0 1px 4px rgba(0,0,0,0.07)",
    },
    logoArea: { flex: "0 0 auto" },
    logo: { height: 32, objectFit: "contain" },
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
    roleIcon: { fontSize: 32 },
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
    loadingText: {
      fontSize: 11,
      color: textSecondary,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
    },
    // 보조 섹션
    secondarySection: {
      marginBottom: 20,
    },
    sectionDivider: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
    },
    sectionLabel: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      fontWeight: 600,
      color: textSecondary,
      letterSpacing: "0.04em",
      textTransform: "uppercase" as const,
    },
    secondaryList: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 6,
      maxHeight: 224,
      overflowY: "auto" as const,
      paddingRight: 2,
    },
    secondaryRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: 10,
      padding: "10px 14px",
      transition: "background 0.1s",
    },
    secondaryLeft: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flex: 1,
      minWidth: 0,
      flexWrap: "wrap" as const,
    },
    secondaryLabel: {
      fontSize: 13,
      fontWeight: 600,
      color: textPrimary,
    },
    secondaryRight: {
      flexShrink: 0,
      marginLeft: 12,
    },
    promoteBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "4px 12px",
      fontSize: 12,
      fontWeight: 500,
      color: "#d97706",
      background: isDark ? "#292524" : "#fffbeb",
      border: "1px solid #fde68a",
      borderRadius: 20,
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
    },
    // 역할 추가
    addRoleBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 24px",
      fontSize: 14,
      fontWeight: 600,
      color: "#25A194",
      background: isDark ? "rgba(37,161,148,0.12)" : "rgba(37,161,148,0.08)",
      border: "1.5px solid rgba(37,161,148,0.4)",
      borderRadius: 24,
      cursor: "pointer",
      transition: "background 0.15s, border-color 0.15s, transform 0.1s",
    },
  };
}
