import { type ReactNode } from "react";
import AdminTopBar from "@/components/layout/admin/AdminTopBar";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";

// [woo] requireSchool prop 추가
interface ParentAdminLayoutProps {
  children: ReactNode;
  msg?: string;
  error?: string;
  requireSchool?: boolean;
}

const SCHOOL_QUICK_LINK = {
  to: ADMIN_ROUTES.DASHBOARD,
  icon: "ri-building-2-line",
  label: "학교 관리",
};

export default function ParentAdminLayout({ children, msg, error, requireSchool }: ParentAdminLayoutProps) {
  void requireSchool;
  const { user } = useAuth();
  const grants = user?.grants ?? [];
  const isSuperAdmin = user?.roles?.includes("ADMIN") || user?.role === "ADMIN";
  // 학교 관리 버튼: PARENT_MANAGER 외 다른 학교 관리 권한이 있을 때만 표시
  const hasNonParentGrant = isSuperAdmin || grants.some((g) => g.grantedRole !== "PARENT_MANAGER");
  return (
    <div style={{ minHeight: "100vh", background: "var(--body-bg, #f8fafc)" }}>
      {/* [soojin] 사이드바 없는 페이지이므로 좌측 상단 로고 표시 */}
      <AdminTopBar
        position="sticky"
        quickLink={hasNonParentGrant ? SCHOOL_QUICK_LINK : undefined}
        logoTo={ADMIN_ROUTES.PARENTS.LIST}
        showLogo
      />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {msg && (
          <div
            className="alert alert-dismissible mb-24 px-20 py-12 radius-8"
            role="alert"
            style={{
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)",
              color: "var(--text-primary-light)",
            }}
          >
            {msg}
            <button
              type="button"
              className="btn-close"
              onClick={(e) => (e.currentTarget.closest(".alert") as HTMLElement)?.remove()}
            />
          </div>
        )}
        {error && (
          <div
            className="alert alert-dismissible mb-24 px-20 py-12 radius-8"
            role="alert"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#dc2626",
            }}
          >
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={(e) => (e.currentTarget.closest(".alert") as HTMLElement)?.remove()}
            />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
