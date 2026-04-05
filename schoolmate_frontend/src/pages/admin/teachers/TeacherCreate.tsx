import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';
import GrantRoleSelect from '@/components/GrantRoleSelect';

const DEPARTMENTS = [
  "교무부",
  "학생부",
  "연구부",
  "진로진학부",
  "환경부",
  "체육부",
];
const POSITIONS = [
  "교장",
  "교감",
  "수석교사",
  "부장교사",
  "평교사",
  "기간제교사",
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

export default function TeacherCreate() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    subject: "",
    department: "",
    position: "",
    grantedRole: "",
  });
  const [subjects, setSubjects] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    admin.get("/subjects").then((r) => setSubjects(r.data ?? []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const payload = { ...form, subject: form.subject || null };
    try {
      await admin.post("/teachers", payload);
      navigate(ADMIN_ROUTES.TEACHERS.LIST);
    } catch (err: unknown) {
      // [soojin] any → unknown, axios 응답 구조 타입 캐스팅
      const errData = (err as { response?: { data?: unknown } })?.response?.data;
      setSubmitError(typeof errData === "string" ? errData : "교사 등록에 실패했습니다.");
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>신규 교사 등록</h6>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>새 교사 계정을 등록합니다.</p>
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.TEACHERS.LIST)}
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

          <div style={fieldWrap}>
            <label style={labelStyle}>담당 과목</label>
            <select
              style={inputStyle}
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            >
              <option value="">-- 과목 선택 (선택 사항) --</option>
              {subjects.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
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
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              >
                <option value="">직책 선택</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

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
