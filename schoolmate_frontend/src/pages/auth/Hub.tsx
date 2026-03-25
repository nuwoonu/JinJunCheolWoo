import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import PageLoader from "@/components/PageLoader";
import { ADMIN_ROUTES } from "@/constants/routes";
import type { RoleRequestInfo, GrantInfo } from "@/api/auth";
import NotificationDropdown from "@/components/fragments/NotificationDropdown";

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

// @ts-ignore [woo] 추후 사용 예정
function getRoleRequestStatus(roleRequests: RoleRequestInfo[] | undefined, role: string) {
  return roleRequests?.find((r) => r.role === role)?.status ?? null;
}

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "학생",
  TEACHER: "교사",
  ADMIN: "관리자",
  PARENT: "학부모",
  STAFF: "교직원",
  GUEST: "게스트",
};

export default function Hub() {
  const { user, loading, signOut, refetch } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const theme = useTheme();

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
  const roleRequests = user.roleRequests;

  const roleCards = ROLE_CONFIG.map((cfg) => {
    const rr = roleRequests?.find((r) => r.role === cfg.role);
    const status = rr?.status ?? null;
    const schoolName = rr?.schoolName ?? null;
    const hasActiveRole = userRoles.includes(cfg.role);

    if (!status && !hasActiveRole) return null;

    return { cfg, status: status ?? (hasActiveRole ? "ACTIVE" : null), schoolName };
  }).filter(Boolean) as { cfg: RoleConfig; status: string; schoolName: string | null }[];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f6f8" }}>
      {/* 헤더 */}
      <div
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "0 24px",
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/images/schoolmateLogo.png" alt="Schoolmate" width={173} height={40} style={{ objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<button
            onClick={theme.toggle}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#f3f4f6",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              fontSize: 17,
            }}
            aria-label="다크모드 전환"
          >
            <i className={theme.isDark ? "ri-sun-line" : "ri-moon-line"} />
          </button>
          <NotificationDropdown />
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              color: "#6b7280",
              cursor: "pointer",
            }}
            onClick={signOut}
          >
            <i className="ri-logout-box-line" />
            로그아웃
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px" }}>
        {/* 사용자 프로필 섹션 */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            padding: "28px 32px",
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #25A194, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
                {user?.name?.[0] ?? user?.email?.[0] ?? "?"}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                안녕하세요, {user.name}님
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>{user.email}</div>
            </div>
          </div>
          <button
            onClick={() => setShowProfile(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 13,
              color: "#374151",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <i className="ri-user-settings-line" />
            내 프로필
          </button>
        </div>

        {/* 타이틀 */}
        <div style={{ marginBottom: 20 }}>
          <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>이동할 페이지를 선택하세요</h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            보유한 역할에 맞는 페이지로 이동하거나, 새 역할을 추가할 수 있습니다.
          </p>
        </div>

        {/* 역할 카드 그리드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {roleCards.map(({ cfg, status, schoolName }) => {
            const isPending = status === "PENDING";
            const isSuspended = status === "SUSPENDED";
            const isActive = status === "ACTIVE";
            const accentColor = isPending || isSuspended ? "#94a3b8" : cfg.color;

            return (
              <button
                key={cfg.role}
                onClick={() => isActive && navigate(cfg.path)}
                disabled={!isActive}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderTop: `3px solid ${accentColor}`,
                  borderRadius: 12,
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 0,
                  cursor: isActive ? "pointer" : "default",
                  opacity: isPending || isSuspended ? 0.6 : 1,
                  textAlign: "left",
                  transition: "box-shadow 0.15s, transform 0.1s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
                onMouseEnter={(e) => {
                  if (isActive) {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {/* 아이콘 */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${accentColor}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  <i className={cfg.icon} style={{ fontSize: 24, color: accentColor }} />
                </div>

                {/* 역할명 + 상태 */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, width: "100%" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{cfg.label}</span>
                  {isPending && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#92400e",
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: 20,
                        padding: "1px 7px",
                      }}
                    >
                      승인 대기
                    </span>
                  )}
                  {isSuspended && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#dc2626",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 20,
                        padding: "1px 7px",
                      }}
                    >
                      정지됨
                    </span>
                  )}
                </div>

                {/* 학교명 */}
                {schoolName && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "#6b7280",
                      background: "#f3f4f6",
                      borderRadius: 20,
                      padding: "2px 8px",
                      marginBottom: 8,
                    }}
                  >
                    <i className="ri-building-line" />
                    {schoolName}
                  </div>
                )}

                {/* 설명 */}
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>
                  {cfg.description}
                </p>

                {/* 이동 화살표 (ACTIVE만) */}
                {isActive && (
                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: accentColor,
                    }}
                  >
                    바로가기 <i className="ri-arrow-right-line" />
                  </div>
                )}
              </button>
            );
          })}

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
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
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
                <i className="ri-shield-user-line" style={{ fontSize: 24, color: "#ef4444" }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 6 }}>관리자</div>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>
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

          {/* 역할 추가 카드 */}
          <button
            onClick={() => navigate("/select-info?source=hub")}
            style={{
              background: "#fafafa",
              border: "1.5px dashed #d1d5db",
              borderRadius: 12,
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 0,
              cursor: "pointer",
              textAlign: "left",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#9ca3af";
              (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db";
              (e.currentTarget as HTMLElement).style.background = "#fafafa";
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <i className="ri-add-line" style={{ fontSize: 24, color: "#9ca3af" }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>역할 추가</div>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>
              새로운 역할을 등록합니다.
            </p>
          </button>
        </div>
      </div>

      {/* 프로필 모달 */}
      {showProfile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={(e) => e.target === e.currentTarget && setShowProfile(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 400,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              overflow: "hidden",
            }}
          >
            {/* 모달 헤더 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>내 프로필</span>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9ca3af", lineHeight: 1, padding: 0 }}
                onClick={() => setShowProfile(false)}
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* 아바타 영역 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "28px 20px 20px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #25A194, #1d4ed8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>
                  {user?.name?.[0] ?? user?.email?.[0] ?? "?"}
                </span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
                {user?.name ?? "-"}
              </p>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#25A194",
                  background: "rgba(37,161,148,0.12)",
                  padding: "3px 12px",
                  borderRadius: 20,
                }}
              >
                {ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? "-"}
              </span>
            </div>

            {/* 정보 목록 */}
            <div style={{ padding: "8px 20px 20px" }}>
              {[
                { icon: "ri-user-line", label: "이름", value: user?.name },
                { icon: "ri-mail-line", label: "이메일", value: user?.email },
                { icon: "ri-shield-line", label: "역할", value: ROLE_LABEL[user?.role ?? ""] ?? user?.role },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid #f9fafb",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <i className={icon} style={{ fontSize: 16, color: "#6b7280" }} />
                  </div>
                  <span style={{ fontSize: 13, color: "#6b7280", flex: "0 0 56px" }}>{label}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#111827",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {value ?? "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
