import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';
import { useAdminMsg, apiErrMsg } from '@/hooks/useAdminMsg';

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

export default function ClassCreate() {
  const navigate = useNavigate();
  const { error, setError } = useAdminMsg();
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    grade: "1",
    classNum: 1,
    teacherUid: "",
  });
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    admin
      .get("/classes/teachers/unassigned")
      .then((r) => setTeachers(r.data))
      .catch(() => setTeachers([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await admin.post("/classes", form);
      navigate(ADMIN_ROUTES.CLASSES.LIST);
    } catch (err: any) {
      setError(apiErrMsg(err, "학급 생성에 실패했습니다."));
    }
  };

  return (
    <AdminLayout error={error}>
      <div style={{ marginBottom: 24 }}>
        <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>새 학급 생성</h6>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>새 학급을 생성합니다.</p>
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.CLASSES.LIST)}
          style={{ marginTop: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#6b7280", fontSize: 13 }}
        >
          ← 목록으로
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>학년도</label>
              <input
                type="number"
                style={inputStyle}
                required
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>학년</label>
              <select
                style={inputStyle}
                required
                value={form.grade}
                onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
              >
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>
            </div>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>반</label>
            <input
              type="number"
              style={inputStyle}
              required
              min={1}
              value={form.classNum}
              onChange={(e) => setForm((f) => ({ ...f, classNum: Number(e.target.value) }))}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>담임 교사</label>
            <select
              style={inputStyle}
              value={form.teacherUid}
              onChange={(e) => setForm((f) => ({ ...f, teacherUid: e.target.value }))}
            >
              <option value="">담임 미배정</option>
              {teachers.map((t) => (
                <option key={t.uid} value={t.uid}>{t.displayName}</option>
              ))}
            </select>
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
              학급 생성
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
