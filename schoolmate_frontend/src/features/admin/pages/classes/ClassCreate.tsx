import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from '@/shared/components/layout/admin/AdminLayout';
import admin from '@/shared/api/adminApi';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import { useAdminMsg, apiErrMsg } from '@/shared/hooks/useAdminMsg';

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
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#6b7280" }}
        >
          <i className="bi bi-arrow-left" />
        </button>
        <div>
          <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>새 학급 생성</h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>새 학급을 생성합니다.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: 24 }}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">학년도</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">학년</label>
                <select
                  className="form-select"
                  required
                  value={form.grade}
                  onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                >
                  <option value="1">1학년</option>
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">반</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  min={1}
                  value={form.classNum}
                  onChange={(e) => setForm((f) => ({ ...f, classNum: Number(e.target.value) }))}
                />
              </div>
              <div className="col-md-12">
                <label className="form-label fw-semibold">담임 교사</label>
                <select
                  className="form-select"
                  value={form.teacherUid}
                  onChange={(e) => setForm((f) => ({ ...f, teacherUid: e.target.value }))}
                >
                  <option value="">담임 미배정</option>
                  {teachers.map((t) => (
                    <option key={t.uid} value={t.uid}>{t.displayName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ padding: "9px 20px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#374151", cursor: "pointer" }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{ padding: "9px 20px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
            >
              학급 생성
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
