import { type ReactNode } from "react";
import AdminTopBar from "@/components/layout/admin/AdminTopBar";
import { ADMIN_ROUTES } from "@/constants/routes";

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

export default function ParentAdminLayout({
  children,
  msg,
  error,
  requireSchool,
}: ParentAdminLayoutProps) {
  void requireSchool;
  return (
    <div style={{ minHeight: "100vh", background: "var(--body-bg, #f8fafc)" }}>
      <AdminTopBar position="sticky" quickLink={SCHOOL_QUICK_LINK} />

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
              onClick={(e) =>
                (e.currentTarget.closest(".alert") as HTMLElement)?.remove()
              }
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
              onClick={(e) =>
                (e.currentTarget.closest(".alert") as HTMLElement)?.remove()
              }
            />
          </div>
        )}
        {children}
      </main>

    </div>
  );
}
