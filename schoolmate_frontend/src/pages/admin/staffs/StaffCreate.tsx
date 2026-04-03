import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';
import GrantRoleSelect from '@/components/GrantRoleSelect';

const DEPARTMENTS = [
  "행정실",
  "시설관리실",
  "급식실",
  "전산실",
  "당직실",
  "기타",
];

const sectionTitle: React.CSSProperties = {
  fontWeight: 700,
  color: "#25A194",
  fontSize: 16,
  marginBottom: 16,
  marginTop: 4,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: 13,
  marginBottom: 6,
  color: "#1a1a2e",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  color: "#374151",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const fieldWrap: React.CSSProperties = { marginBottom: 20 };

export default function StaffCreate() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    jobTitle: "",
    extensionNumber: "",
    employmentType: "PERMANENT",
    contractEndDate: "",
    grantedRole: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const payload: any = { ...form };
    if (form.employmentType !== "FIXED_TERM") delete payload.contractEndDate;
    try {
      await admin.post("/staffs", payload);
      navigate(ADMIN_ROUTES.STAFFS.LIST);
    } catch (err: any) {
      const msg = err?.response?.data || "교직원 등록에 실패했습니다.";
      setSubmitError(msg);
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>신규 교직원 등록</h6>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>새 교직원 계정을 등록합니다.</p>
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.STAFFS.LIST)}
          style={{ marginTop: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#6b7280", fontSize: 13 }}
        >
          ← 목록으로
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          {submitError && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 14 }}>
              {submitError}
            </div>
          )}

          <h6 style={sectionTitle}>기본 정보</h6>

          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>이름</label>
              <input
                type="text"
                style={inputStyle}
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="성함 입력"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>이메일 (ID)</label>
              <input
                type="email"
                style={inputStyle}
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="example@school.com"
              />
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <label style={labelStyle}>초기 비밀번호</label>
            <input
              type="password"
              style={inputStyle}
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>

          <h6 style={sectionTitle}>직무 정보</h6>

          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>부서</label>
              <select
                style={inputStyle}
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              >
                <option value="">부서 선택</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>직책</label>
              <select
                style={inputStyle}
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              >
                <option value="">직책 선택</option>
                <option value="팀장">팀장</option>
                <option value="주임">주임</option>
                <option value="사원">사원</option>
                <option value="기간제">기간제</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: form.employmentType === "FIXED_TERM" ? 20 : 32 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>내선번호</label>
              <input
                type="text"
                style={inputStyle}
                value={form.extensionNumber}
                onChange={(e) => setForm((f) => ({ ...f, extensionNumber: e.target.value }))}
                placeholder="예: 123"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>고용형태</label>
              <select
                style={inputStyle}
                value={form.employmentType}
                onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))}
              >
                <option value="PERMANENT">정규직</option>
                <option value="FIXED_TERM">계약직</option>
              </select>
            </div>
          </div>
          {form.employmentType === "FIXED_TERM" && (
            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>계약 종료일</label>
              <input
                type="date"
                style={inputStyle}
                value={form.contractEndDate}
                onChange={(e) => setForm((f) => ({ ...f, contractEndDate: e.target.value }))}
              />
            </div>
          )}

          <h6 style={sectionTitle}>권한 설정 (선택)</h6>
          <div style={fieldWrap}>
            <GrantRoleSelect
              value={form.grantedRole}
              onChange={(v) => setForm((f) => ({ ...f, grantedRole: v }))}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, padding: "5px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{ background: "#25A194", color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              등록 완료
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
