import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_ROUTES } from "@/shared/constants/routes";
import { ADMIN_GRANTS, GRANTED_ROLE } from "@/shared/constants/adminPermissions";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useSchool } from "@/shared/contexts/SchoolContext";
import type { GrantInfo } from "@/shared/api/authApi";
import AdminTopBar from "@/shared/components/layout/admin/AdminTopBar";
import PageLoader from "@/shared/components/PageLoader";
import api from "@/shared/api/authApi";

/** AdminSidebar와 동일한 grant 체크 헬퍼 */
function hasGrant(grants: GrantInfo[], ...roles: string[]) {
  return grants.some((g) => roles.includes(g.grantedRole));
}

const ALL_MENU_ITEMS = [
  {
    to: ADMIN_ROUTES.SCHOOL_SELECT,
    icon: "ri-building-2-line",
    label: "학교 정보 관리",
    desc: "학교를 선택하여 학생, 교사, 교직원, 학급, 공지사항 등을 관리합니다.",
    /** 표시 조건: SCHOOL_ADMIN 이상이거나 학교 내 기능 grant 중 하나라도 보유 */
    requiredGrants: ADMIN_GRANTS.DASHBOARD.filter(
      (g) => g !== GRANTED_ROLE.PARENT_MANAGER,
    ),
    superAdminOnly: false,
  },
  {
    to: ADMIN_ROUTES.PARENTS.LIST,
    icon: "ri-user-heart-line",
    label: "학부모 관리",
    desc: "학부모 계정을 등록하고 자녀 연결 및 상태를 관리합니다.",
    requiredGrants: ADMIN_GRANTS.PARENTS,
    superAdminOnly: false,
  },
  {
    to: ADMIN_ROUTES.SERVICE_NOTICES.LIST,
    icon: "ri-notification-2-line",
    label: "서비스 공지 관리",
    desc: "SchoolMate 서비스 전체 공지사항을 작성하고 관리합니다.",
    requiredGrants: [] as string[],
    superAdminOnly: true,
  },
];

export default function AdminMain() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const { user } = useAuth();
  const { selectedSchool, setSelectedSchool } = useSchool();

  const grants: GrantInfo[] = user?.grants ?? [];
  const isSuperAdmin = user?.roles?.includes("ADMIN") || user?.role === "ADMIN";

  useEffect(() => {
    if (!isSuperAdmin) return;
    api.get<{ testMode: boolean }>("/admin/test/status")
      .then(res => setTestMode(res.data.testMode))
      .catch(() => {/* 조회 실패 시 버튼 미표시 */});
  }, [isSuperAdmin]);

  // 비 SUPER_ADMIN 그랜트 보유자: 학교 자동 선택 후 바로 대시보드로 이동
  // AdminMain은 SUPER_ADMIN 전용 학교 선택 허브이므로 그랜트 보유자는 직접 대시보드 진입
  const firstGrant = !isSuperAdmin ? grants.find((g) => g.schoolId) : undefined;
  const willRedirect = !!user && !isSuperAdmin && !!firstGrant;

  useEffect(() => {
    if (!willRedirect || !firstGrant) return;
    if (!selectedSchool) {
      setSelectedSchool({
        id: firstGrant.schoolId!,
        name: firstGrant.schoolName!,
        schoolCode: firstGrant.schoolCode ?? "",
        schoolKind: firstGrant.schoolKind ?? "",
        officeOfEducation: firstGrant.officeOfEducation ?? "",
      });
    }
    navigate(ADMIN_ROUTES.DASHBOARD, { replace: true });
  }, [willRedirect]);

  // 리다이렉트 예정이면 UI 렌더링 없이 스피너만 표시
  if (willRedirect) return <PageLoader />;

  // ADMIN role은 모든 메뉴 표시, GrantedRole 보유자는 superAdminOnly 항목 제외 후 requiredGrants 기준 필터링
  const menuItems = useMemo(() => {
    if (isSuperAdmin) return ALL_MENU_ITEMS;
    return ALL_MENU_ITEMS.filter(
      (item) =>
        !item.superAdminOnly && hasGrant(grants, ...item.requiredGrants),
    );
  }, [grants, isSuperAdmin]);

  return (
    <div>
      {/* [soojin] 사이드바 없는 페이지이므로 좌측 상단 로고 표시 */}
      <AdminTopBar position="sticky" showBackButton={false} showLogo />

      <main
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "40px 24px",
          boxSizing: "border-box",
        }}
      >
        <div className="text-center mb-40">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #25A194, #1a7a6e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <i
              className="ri-shield-user-line"
              style={{ fontSize: 24, color: "#fff" }}
            />
          </div>
          <h3
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 8,
            }}
          >
            관리자 메뉴
          </h3>
          <p style={{ color: "#6b7280", fontSize: 17, margin: 0 }}>
            관리할 항목을 선택해 주세요.
          </p>
        </div>

        {/* [soojin] 메뉴 카드 가로 배열 */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {menuItems.map((item) => (
            <div
              key={item.to}
              onClick={() => navigate(item.to)}
              onMouseEnter={() => setHovered(item.to)}
              onMouseLeave={() => setHovered(null)}
              style={{
                flex: "1 1 220px",
                border: `2px solid ${hovered === item.to ? "#25A194" : "#e5e7eb"}`,
                borderRadius: 16,
                padding: 24,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background:
                  hovered === item.to
                    ? "linear-gradient(135deg, rgba(37,161,148,0.07), rgba(37,161,148,0.13))"
                    : "#fff",
                boxShadow:
                  hovered === item.to
                    ? "0 4px 12px rgba(37,161,148,0.18)"
                    : "0 1px 4px rgba(0,0,0,0.07)",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12, color: "#25A194" }}>
                <i className={item.icon} />
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#111827",
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>{item.desc}</div>
            </div>
          ))}

          {/* 테스트 모드 활성화 시 표시되는 테스트 데이터 카드 */}
          {isSuperAdmin && testMode && (
            <div
              onClick={() => navigate(ADMIN_ROUTES.TEST_MODE)}
              onMouseEnter={() => setHovered("__test__")}
              onMouseLeave={() => setHovered(null)}
              style={{
                flex: "1 1 220px",
                border: `2px solid ${hovered === "__test__" ? "#f59e0b" : "#fde68a"}`,
                borderRadius: 16,
                padding: 24,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background:
                  hovered === "__test__"
                    ? "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.16))"
                    : "#fffbeb",
                boxShadow:
                  hovered === "__test__"
                    ? "0 4px 12px rgba(245,158,11,0.22)"
                    : "0 1px 4px rgba(0,0,0,0.07)",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12, color: "#f59e0b" }}>
                <i className="ri-flask-line" />
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#92400e",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                테스트 데이터 생성
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    background: "#f59e0b",
                    color: "#fff",
                    borderRadius: 4,
                    padding: "2px 6px",
                  }}
                >
                  TEST
                </span>
              </div>
              <div style={{ fontSize: 14, color: "#78350f" }}>
                테스트 전용 가상 학교에 학생·교사·교직원 샘플 데이터를 생성합니다.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
