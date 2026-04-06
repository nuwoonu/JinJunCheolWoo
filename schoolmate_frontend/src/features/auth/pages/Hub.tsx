import { useState, useEffect } from "react";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import PageLoader from "@/shared/components/PageLoader";
import { ADMIN_ROUTES } from "@/shared/constants/routes";
import type { RoleRequestInfo, GrantInfo, RoleContext, AuthUser } from "@/shared/api/authApi";
import { getRoleContexts, switchContext, setPrimaryRole } from "@/shared/api/authApi";
import { auth } from "@/shared/api/auth";
import NotificationDropdown from "@/features/notification/components/NotificationDropdown";
import ProfileDropdown from "@/features/profile/components/ProfileDropdown";

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
  subLabel: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}

const ROLE_CONFIG: RoleConfig[] = [
  {
    role: "STUDENT",
    label: "학생",
    subLabel: "학생으로 활동",
    description: "학생 대시보드로 이동합니다.",
    icon: "ri-graduation-cap-line",
    path: "/student/dashboard",
    color: "#25A194",
  },
  {
    role: "TEACHER",
    label: "교사",
    subLabel: "교사로 활동",
    description: "교사 대시보드로 이동합니다.",
    icon: "ri-presentation-line",
    path: "/teacher/dashboard",
    color: "#1d4ed8",
  },
  {
    role: "PARENT",
    label: "학부모",
    subLabel: "학부모로 활동",
    description: "학부모 대시보드로 이동합니다.",
    icon: "ri-user-heart-line",
    path: "/parent/dashboard",
    color: "#d97706",
  },
  {
    role: "STAFF",
    label: "교직원",
    subLabel: "교직원으로 활동",
    description: "소속 학교 관리 페이지로 이동합니다.",
    icon: "ri-id-card-line",
    path: ADMIN_ROUTES.MAIN,
    color: "#6366f1",
  },
];

// [soojin] 관리자 카드용 config (ROLE_CONFIG에 포함하지 않고 별도 상수로 관리)
const ADMIN_ROLE_CFG: RoleConfig = {
  role: "ADMIN",
  label: "관리자",
  subLabel: "관리자로 활동",
  description: "전체 시스템을 관리합니다.",
  icon: "ri-shield-user-line",
  path: ADMIN_ROUTES.MAIN,
  color: "#ef4444",
};

// [soojin] hubMode: 활성 역할 0개 → status(풀스크린), 1개↑ → select(역할 선택 허브)
type HubMode = "status" | "select";

// ── 풀스크린 상태 카드 ──────────────────────────────────────────────────────────
interface StatusScreenProps {
  user: AuthUser;
  roleRequests: RoleRequestInfo[];
  isDark: boolean;
  onToggleTheme: () => void;
  onRefresh: () => void;
}

function HubStatusScreen({ user, roleRequests, isDark, onToggleTheme, onRefresh }: StatusScreenProps) {
  const allNonActive = roleRequests.filter((r) => r.status !== "ACTIVE");
  const dominant =
    allNonActive.find((r) => r.status === "PENDING") ??
    allNonActive.find((r) => r.status === "SUSPENDED") ??
    allNonActive[0];
  const status = (dominant?.status ?? "PENDING") as "PENDING" | "SUSPENDED" | "REJECTED";

  const STATUS_CFG = {
    PENDING: {
      title: "승인 대기 중",
      subtitle: "회원가입 요청이 접수되었습니다.\n관리자 승인 후 서비스를 이용하실 수 있습니다.",
      badgeLabel: "승인 대기",
      badgeDesc: "관리자가 역할을 검토하고 있습니다",
      color: "#d97706",
      bg: "rgba(217,119,6,0.1)",
      badgeBorder: "rgba(217,119,6,0.3)",
      icon: "ri-time-line",
    },
    SUSPENDED: {
      title: "계정이 정지되었습니다",
      subtitle: "계정이 일시 정지되었습니다.\n관리자에게 문의하세요.",
      badgeLabel: "계정 정지",
      badgeDesc: "관리자에게 문의하시기 바랍니다",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
      badgeBorder: "rgba(239,68,68,0.3)",
      icon: "ri-forbid-line",
    },
    REJECTED: {
      title: "신청이 거절되었습니다",
      subtitle: "역할 신청이 거절되었습니다.\n관리자에게 문의하세요.",
      badgeLabel: "신청 거절",
      badgeDesc: "관리자에게 문의하시기 바랍니다",
      color: "#6b7280",
      bg: "rgba(107,114,128,0.1)",
      badgeBorder: "rgba(107,114,128,0.3)",
      icon: "ri-close-circle-line",
    },
  } as const;

  const ROLE_LABEL: Record<string, string> = {
    STUDENT: "학생",
    TEACHER: "교사",
    PARENT: "학부모",
    STAFF: "교직원",
  };

  const infoRows = [
    { label: "신청 일시", value: "-" },
    { label: "신청 학교", value: dominant?.schoolName ?? "-" },
    { label: "신청 계정", value: user.email ?? "-" },
    { label: "신청 유형", value: ROLE_LABEL[dominant?.role ?? ""] ?? dominant?.role ?? "-" },
  ];

  const cfg = STATUS_CFG[status] ?? STATUS_CFG.PENDING;
  const surface = isDark ? "#1e293b" : "#fff";
  const textPrimary = isDark ? "#f1f5f9" : "#111827";
  const bg = isDark ? "#0f172a" : "#f3f4f6";

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column" }}>
      {/* 헤더 */}
      <div
        style={{
          height: 60,
          flexShrink: 0,
          background: surface,
          borderBottom: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a href="/main" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img
            src="/images/schoolmateLogo.png"
            alt="SchoolMate"
            width="160"
            height="37"
            style={{ objectFit: "contain" }}
          />
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={onToggleTheme}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: isDark ? "#334155" : "#f3f4f6",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="다크모드 전환"
          >
            <i className={isDark ? "ri-sun-line" : "ri-moon-line"} style={{ fontSize: 18 }} />
          </button>
          <NotificationDropdown />
          <ProfileDropdown />
        </div>
      </div>

      {/* 본문 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        {/* 카드 */}
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: surface,
            borderRadius: 16,
            padding: "32px 28px",
            border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
            boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          <h5 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, margin: "0 0 8px" }}>{cfg.title}</h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6, whiteSpace: "pre-line" }}>
            {cfg.subtitle}
          </p>

          {/* 상태 배지 박스 */}
          <div
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.badgeBorder}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: cfg.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i className={cfg.icon} style={{ fontSize: 20, color: "#fff" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: cfg.color, marginBottom: 2 }}>{cfg.badgeLabel}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{cfg.badgeDesc}</div>
            </div>
          </div>

          {/* 신청 정보 행 */}
          {infoRows.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: i < infoRows.length - 1 ? `1px solid ${isDark ? "#334155" : "#f3f4f6"}` : "none",
              }}
            >
              <span style={{ fontSize: 13, color: "#6b7280" }}>{row.label}</span>
              <span style={{ fontSize: 13, color: textPrimary, fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}

          {/* 상태 확인 버튼 */}
          <button
            onClick={onRefresh}
            style={{
              width: "100%",
              padding: "13px",
              marginTop: 24,
              background: "#25a194",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <i className="ri-refresh-line" />
            상태 확인
          </button>
        </div>

        {/* 카드 하단 안내 문구 */}
        <p style={{ marginTop: 20, fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
          문의사항이 있으시면 <strong style={{ textDecoration: "underline" }}>고객센터</strong>로 연락해 주세요.
        </p>
      </div>
    </div>
  );
}

// ── 역할 카드 컴포넌트 ─────────────────────────────────────────────────────────
interface RoleCardProps {
  cfg: RoleConfig;
  isActive: boolean;
  isLoading: boolean;
  statusDesc?: string | null;
  schoolName?: string | null;
  isDark: boolean;
  isPending?: boolean;
  onClick: () => void;
}

function RoleCard({ cfg, isActive, isLoading, statusDesc, schoolName, isDark, isPending, onClick }: RoleCardProps) {
  const [hovered, setHovered] = useState(false);
  const surface = isDark ? "#1e293b" : "#fff";
  const border = isDark ? "#334155" : "#e5e7eb";
  const textPrimary = isDark ? "#f1f5f9" : "#111827";
  const textSecondary = isDark ? "#94a3b8" : "#6b7280";

  const cardBg = isPending
    ? isDark ? "#271c0a" : "#fffbeb"
    : hovered && isActive ? (isDark ? "#1a2942" : "#f8fffe") : surface;
  const cardBorder = isPending
    ? "1.5px solid #fbbf24"
    : `1px solid ${hovered && isActive ? cfg.color : border}`;

  return (
    <button
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: 12,
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        cursor: isActive ? "pointer" : "default",
        textAlign: "left",
        transition: "box-shadow 0.15s, transform 0.1s, border-color 0.15s, background 0.15s",
        boxShadow: hovered && isActive ? "0 4px 16px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.06)",
        transform: hovered && isActive ? "translateY(-2px)" : "translateY(0)",
        opacity: isPending || isActive ? 1 : 0.55,
        width: "100%",
      }}
      onClick={onClick}
      disabled={!isActive}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 승인 대기 배지 (상단) */}
      {isPending && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            color: "#92400e",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 20,
            padding: "3px 10px",
            marginBottom: 12,
          }}
        >
          <i className="ri-time-line" /> 승인 대기
        </span>
      )}

      {/* 아이콘 박스 */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: isActive ? `${cfg.color}1a` : "rgba(148,163,184,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        <i className={cfg.icon} style={{ fontSize: 24, color: isActive ? cfg.color : "#94a3b8" }} />
      </div>

      {/* 라벨 */}
      <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary, marginBottom: 4 }}>{cfg.label}</div>

      {/* 소제목 */}
      <div style={{ fontSize: 13, color: textSecondary, marginBottom: 8 }}>{cfg.subLabel}</div>

      {/* 학교명 */}
      {schoolName && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            color: textSecondary,
            background: isDark ? "#334155" : "#f3f4f6",
            borderRadius: 20,
            padding: "2px 8px",
            marginBottom: 8,
          }}
        >
          <i className="ri-building-line" />
          {schoolName}
        </span>
      )}

      {/* 설명 */}
      <p style={{ fontSize: 13, color: textSecondary, margin: "0 0 16px", lineHeight: 1.5 }}>
        {isPending ? "관리자 승인을 기다리고 있습니다" : isActive ? cfg.description : (statusDesc ?? cfg.description)}
      </p>

      {/* 비활성 배지 (PENDING 제외한 비활성) */}
      {!isActive && !isPending && statusDesc && (
        <span
          style={{
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
            marginBottom: 8,
          }}
        >
          <i className="ri-forbid-line" /> {statusDesc}
        </span>
      )}

      {/* 승인 대기 중 (하단) */}
      {isPending && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            color: "#92400e",
            marginTop: "auto",
          }}
        >
          <i className="ri-time-line" /> 승인 대기 중
        </div>
      )}

      {/* 이동하기 → */}
      {isActive && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: cfg.color,
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: "auto",
          }}
        >
          {isLoading ? (
            <>
              <i className="ri-loader-4-line" /> 이동 중...
            </>
          ) : (
            <>
              이동하기 <i className="ri-arrow-right-line" />
            </>
          )}
        </div>
      )}
    </button>
  );
}

// ── 메인 Hub 컴포넌트 ──────────────────────────────────────────────────────────
export default function Hub() {
  const { user, loading, refetch } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [contexts, setContexts] = useState<RoleContext[]>([]);
  const [allContexts, setAllContexts] = useState<RoleContext[]>([]); // TRANSFERRED 포함 전체 (역할 추가 판단용)
  const [contextsLoading, setContextsLoading] = useState(true);
  const [redirectChecked, setRedirectChecked] = useState(false);
  const [switchingId, setSwitchingId] = useState<number | null>(null);
  const [hubMode, setHubMode] = useState<HubMode | null>(null);

  useEffect(() => {
    refetch();
    getRoleContexts()
      .then((data) => {
        setAllContexts(data);
        // 전출/전학 처리된 인스턴스는 Hub에서 숨김 (데이터는 유지, 관리자만 조회)
        setContexts(data.filter((c) => c.status !== "TRANSFERRED"));
        setContextsLoading(false);
      })
      .catch(() => {
        setAllContexts([]);
        setContexts([]);
        setContextsLoading(false);
      });
  }, []);

  // [soojin] 분기 기준: 활성 역할 0개 → status(풀스크린), 그 외 → select(역할 선택 허브)
  useEffect(() => {
    if (loading || contextsLoading) return;
    if (!user?.authenticated) {
      setRedirectChecked(true);
      return;
    }

    const grants: GrantInfo[] = user.grants ?? [];
    const isSuperAdmin =
      user.role === "ADMIN" ||
      user.roles?.includes("ADMIN") ||
      grants.some((g) => g.grantedRole === "SUPER_ADMIN");
    const roleRequests: RoleRequestInfo[] = user.roleRequests ?? [];
    const parentRequest = roleRequests.find((r) => r.role === "PARENT");

    const activeContexts = contexts.filter((c) => c.isActive);
    const hasActiveParent = parentRequest?.status === "ACTIVE";
    const totalActive = activeContexts.length + (hasActiveParent ? 1 : 0);
    const hasAnyNonActive =
      contexts.some((c) => !c.isActive) || (parentRequest != null && parentRequest.status !== "ACTIVE");

    // SUPER_ADMIN은 항상 역할 선택 허브 표시 (ADMIN 카드 + 보유 역할 카드)
    if (isSuperAdmin) {
      if (totalActive === 0 && !hasAnyNonActive) {
        // SUPER_ADMIN 단독 (추가 역할 없음) → admin으로 바로 이동
        navigate(ADMIN_ROUTES.MAIN, { replace: true });
        return;
      }
      // SUPER_ADMIN + 다른 역할 보유 → 항상 허브 표시
      setHubMode("select");
      setRedirectChecked(true);
      return;
    }

    // 활성 역할 0개 → 풀스크린 상태 카드
    if (totalActive === 0) {
      setHubMode("status");
      setRedirectChecked(true);
      return;
    }

    // 활성 1개 + 비활성 없음 → 바로 이동
    if (totalActive === 1 && !hasAnyNonActive) {
      if (hasActiveParent) {
        const cfg = ROLE_CONFIG.find((r) => r.role === "PARENT")!;
        navigate(cfg.path, { replace: true });
        return;
      }
      const ctx = activeContexts[0];
      const cfg = ROLE_CONFIG.find((r) => r.role === ctx.roleType);
      if (cfg) {
        switchContext(ctx.infoId, ctx.roleType)
          .then((tokens) => {
            auth.setTokens(tokens.accessToken, tokens.refreshToken);
            navigate(cfg.path, { replace: true });
          })
          .catch(() => {
            setHubMode("select");
            setRedirectChecked(true);
          });
        return;
      }
    }

    // 그 외(활성 2개↑ or 활성 1개↑+비활성 있음) → 역할 선택 허브
    setHubMode("select");
    setRedirectChecked(true);
  }, [loading, contextsLoading, user, contexts]);

  if (loading || contextsLoading || !redirectChecked) return <PageLoader />;
  if (!user?.authenticated) return <Navigate to="/login" replace />;

  const grants: GrantInfo[] = user.grants ?? [];
  const isSuperAdmin =
    (user as AuthUser & { role?: string; roles?: string[] }).role === "ADMIN" ||
    (user as AuthUser & { roles?: string[] }).roles?.includes("ADMIN") ||
    grants.some((g) => g.grantedRole === "SUPER_ADMIN");
  const roleRequests: RoleRequestInfo[] = user.roleRequests ?? [];
  const parentRequest = roleRequests.find((r) => r.role === "PARENT");
  const parentCfg = ROLE_CONFIG.find((r) => r.role === "PARENT")!;

  // ── status 모드: 풀스크린 상태 카드 ──
  if (hubMode === "status") {
    return (
      <HubStatusScreen
        user={user}
        roleRequests={roleRequests}
        isDark={theme.isDark}
        onToggleTheme={theme.toggle}
        onRefresh={refetch}
      />
    );
  }

  // ── select 모드: 역할 선택 허브 ──
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
        prev.map((c) => (c.roleType === ctx.roleType ? { ...c, isPrimary: c.infoId === ctx.infoId } : c)),
      );
    } catch {
      // no-op
    }
  }

  // 역할 추가 가능 여부: 추가 가능한 역할이 하나라도 있으면 true
  const canAddRole = (["STUDENT", "TEACHER", "PARENT"] as const).some((role) => {
    const hasPending = roleRequests.some((rr) => rr.role === role && rr.status === "PENDING");
    if (hasPending) return false;
    if (role === "PARENT") {
      return !roleRequests.some((rr) => rr.role === "PARENT" && rr.status === "ACTIVE");
    }
    const roleCtxs = allContexts.filter((c) => c.roleType === role);
    if (roleCtxs.length === 0) return true;
    return roleCtxs.every((c) => c.status === "TRANSFERRED");
  });

  const primaryContexts = contexts.filter((c) => c.isPrimary);
  const secondaryContexts = contexts.filter((c) => !c.isPrimary);
  const pendingRequests = roleRequests.filter(
    (rr) => rr.role !== "PARENT" && rr.status === "PENDING" && !contexts.some((c) => c.roleType === rr.role),
  );
  const hasSecondarySection = secondaryContexts.length > 0 || pendingRequests.length > 0;
  const allPendingForCard = [
    ...pendingRequests,
    ...(parentRequest?.status === "PENDING" ? [{ role: "PARENT", schoolName: parentRequest.schoolName ?? null }] : []),
  ];

  const isDark = theme.isDark;
  const bg = isDark ? "#0f172a" : "#f8fafc";
  const surface = isDark ? "#1e293b" : "#fff";
  const border = isDark ? "#334155" : "#e5e7eb";
  const textPrimary = isDark ? "#f1f5f9" : "#111827";
  const textSecondary = isDark ? "#94a3b8" : "#6b7280";

  return (
    <div style={{ minHeight: "100vh", background: bg }}>
      {/* ── 전체 너비 상단 바 ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: surface,
          borderBottom: `1px solid ${border}`,
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* 좌측: 로고 */}
        <a href="/main" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img
            src="/images/schoolmateLogo.png"
            alt="SchoolMate"
            width="160"
            height="37"
            style={{ objectFit: "contain" }}
          />
        </a>
        {/* 우측: 다크모드 / 알림 / 프로필 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={theme.toggle}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: isDark ? "#334155" : "#f3f4f6",
              border: "none",
              cursor: "pointer",
              color: textSecondary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="다크모드 전환"
          >
            <i className={isDark ? "ri-sun-line" : "ri-moon-line"} style={{ fontSize: 18 }} />
          </button>
          <NotificationDropdown />
          <ProfileDropdown />
        </div>
      </div>

      {/* ── 본문 ── */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        {/* 제목 + 역할 추가 버튼 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h5 style={{ fontSize: 22, fontWeight: 700, color: textPrimary, margin: "0 0 6px" }}>
              이동할 페이지를 선택하세요
            </h5>
            <p style={{ fontSize: 14, color: textSecondary, margin: 0 }}>보유한 역할에 맞는 페이지로 이동합니다.</p>
          </div>
          {canAddRole && (
            <button
              onClick={() => navigate("/select-info?source=hub")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                color: "#25A194",
                background: isDark ? "rgba(37,161,148,0.12)" : "rgba(37,161,148,0.08)",
                border: "1.5px solid rgba(37,161,148,0.4)",
                borderRadius: 24,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <i className="ri-add-circle-line" style={{ fontSize: 16 }} />
              역할 추가
            </button>
          )}
        </div>

        {/* ── 카드 그리드 ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* primary 인스턴스 카드 */}
          {primaryContexts.map((ctx) => {
            const cfg = ROLE_CONFIG.find((r) => r.role === ctx.roleType);
            if (!cfg) return null;
            return (
              <RoleCard
                key={ctx.infoId}
                cfg={cfg}
                isActive={ctx.isActive}
                isLoading={switchingId === ctx.infoId}
                statusDesc={ctx.statusDesc}
                schoolName={ctx.schoolName}
                isDark={isDark}
                isPending={!ctx.isActive && ctx.statusDesc === "승인 대기"}
                onClick={() => handleContextClick(ctx)}
              />
            );
          })}

          {/* 학부모 카드 */}
          {parentRequest && (parentRequest.status === "ACTIVE" || parentRequest.status === "PENDING") && (
            <RoleCard
              cfg={parentCfg}
              isActive={parentRequest.status === "ACTIVE"}
              isLoading={false}
              statusDesc={parentRequest.status === "PENDING" ? "승인 대기" : null}
              isDark={isDark}
              isPending={parentRequest.status === "PENDING"}
              onClick={() => parentRequest.status === "ACTIVE" && navigate(parentCfg.path)}
            />
          )}

          {/* 관리자 카드 (SUPER_ADMIN 전용) */}
          {isSuperAdmin && (
            <RoleCard
              cfg={ADMIN_ROLE_CFG}
              isActive={true}
              isLoading={false}
              isDark={isDark}
              onClick={() => navigate(ADMIN_ROUTES.MAIN)}
            />
          )}
        </div>

        {/* ── 보조 역할 섹션 ── */}
        {hasSecondarySection && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <i className="ri-stack-line" style={{ fontSize: 13, color: textSecondary }} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: textSecondary,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                다른 역할 인스턴스
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 224, overflowY: "auto" }}>
              {secondaryContexts.map((ctx) => {
                const cfg = ROLE_CONFIG.find((r) => r.role === ctx.roleType);
                if (!cfg) return null;
                const isLoading = switchingId === ctx.infoId;
                return (
                  <div
                    key={ctx.infoId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: surface,
                      border: `1px solid ${border}`,
                      borderRadius: 10,
                      padding: "10px 14px",
                      opacity: ctx.isActive ? 1 : 0.55,
                      cursor: ctx.isActive && switchingId === null ? "pointer" : "default",
                      transition: "background 0.1s",
                    }}
                    onClick={() => handleContextClick(ctx)}
                    title={!ctx.isActive ? ctx.statusDesc : "클릭하여 이 역할로 이동"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, flexWrap: "wrap" }}>
                      <i
                        className={cfg.icon}
                        style={{ fontSize: 20, color: ctx.isActive ? cfg.color : "#94a3b8", flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{cfg.label}</span>
                      {ctx.schoolName && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            color: textSecondary,
                            background: isDark ? "#334155" : "#f3f4f6",
                            borderRadius: 20,
                            padding: "2px 8px",
                          }}
                        >
                          <i className="ri-building-line" />
                          {ctx.schoolName}
                        </span>
                      )}
                      {!ctx.isActive && (
                        <span
                          style={{
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
                          }}
                        >
                          {ctx.statusDesc}
                        </span>
                      )}
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: 12 }} onClick={(e) => e.stopPropagation()}>
                      {isLoading ? (
                        <span
                          style={{
                            fontSize: 11,
                            color: textSecondary,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <i className="ri-loader-4-line" /> 이동 중...
                        </span>
                      ) : ctx.isActive ? (
                        <button
                          style={{
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
                            whiteSpace: "nowrap",
                          }}
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

              {pendingRequests.map((rr) => {
                const cfg = ROLE_CONFIG.find((r) => r.role === rr.role);
                if (!cfg) return null;
                return (
                  <div
                    key={`pending-${rr.role}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: surface,
                      border: `1px solid ${border}`,
                      borderRadius: 10,
                      padding: "10px 14px",
                      opacity: 0.55,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <i className={cfg.icon} style={{ fontSize: 20, color: "#94a3b8", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{cfg.label}</span>
                      {rr.schoolName && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            color: textSecondary,
                            background: isDark ? "#334155" : "#f3f4f6",
                            borderRadius: 20,
                            padding: "2px 8px",
                          }}
                        >
                          <i className="ri-building-line" />
                          {rr.schoolName}
                        </span>
                      )}
                      <span
                        style={{
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
                        }}
                      >
                        <i className="ri-time-line" /> 승인 대기
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 승인 대기 상세 카드 ── */}
        {allPendingForCard.map((req) => {
          const roleLabelMap: Record<string, string> = {
            STUDENT: "학생",
            TEACHER: "교사",
            PARENT: "학부모",
            STAFF: "교직원",
          };
          const pendingInfoRows = [
            { label: "신청 일시", value: "-" },
            { label: "신청 학교", value: req.schoolName ?? "-" },
            { label: "신청 계정", value: user?.email ?? "-" },
            { label: "신청 유형", value: roleLabelMap[req.role] ?? req.role },
          ];
          return (
            <div
              key={`pending-card-${req.role}`}
              style={{
                background: surface,
                border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <i className="ri-time-line" style={{ fontSize: 16, color: "#d97706" }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>
                  {roleLabelMap[req.role] ?? req.role} 역할 승인 대기 중
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {pendingInfoRows.map((row) => (
                  <div
                    key={row.label}
                    style={{
                      background: isDark ? "#0f172a" : "#f8fafc",
                      border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{row.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{row.value}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={refetch}
                style={{
                  padding: "10px 20px",
                  background: "#25a194",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <i className="ri-refresh-line" />
                상태 확인
              </button>
            </div>
          );
        })}
        {allPendingForCard.length > 0 && (
          <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", margin: "30px 0 0" }}>
            문의사항이 있으시면 <strong style={{ textDecoration: "underline" }}>고객센터</strong>로 연락해 주세요.
          </p>
        )}
      </main>
    </div>
  );
}
