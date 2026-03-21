import { useEffect, useState } from "react";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';

export default function Settings() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [semester, setSemester] = useState<string>("1");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    admin
      .get("/settings")
      .then((r) => {
        setYear(r.data?.currentSchoolYear ?? new Date().getFullYear());
        setSemester(String(r.data?.currentSemester ?? 1));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.post("/settings", null, { params: { year, semester } });
      alert("학사 기준 정보가 저장되었습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded)
    return (
      <AdminLayout>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div className="spinner-border" />
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>시스템 설정</h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>학사 기준 연도 및 학기를 설정합니다.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #e5e7eb" }}>
            <h6 style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>학사 기준 정보</h6>
          </div>
          <div style={{ padding: 24 }}>
            <div className="row g-4">
              <div className="col-md-6">
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>현재 학년도</label>
                <input
                  type="number"
                  className="form-control form-control-lg"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  min={2000}
                  max={2100}
                />
                <div className="form-text">학생 성적, 학급 등 전반적인 기준 연도로 사용됩니다.</div>
              </div>
              <div className="col-md-6">
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>현재 학기</label>
                <select
                  className="form-select form-select-lg"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  <option value="1">1학기</option>
                  <option value="2">2학기</option>
                </select>
                <div className="form-text">현재 진행 중인 학기를 선택하세요.</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", textAlign: "right" }}>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: "10px 28px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? (
                <><span className="spinner-border spinner-border-sm me-2" />저장 중...</>
              ) : "설정 저장"}
            </button>
          </div>
        </div>
      </form>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #e5e7eb", background: "#fffbeb", borderRadius: "12px 12px 0 0" }}>
          <h6 style={{ fontWeight: 600, margin: 0, fontSize: 15, color: "#d97706" }}>
            <i className="bi bi-exclamation-triangle-fill me-2" />
            학생 진급 처리
          </h6>
        </div>
        <div style={{ padding: 24 }}>
          <p style={{ color: "#6b7280", marginBottom: 16, fontSize: 14 }}>
            현재 학년도 종료 시 전체 학생의 학년을 일괄 진급 처리합니다. 이 작업은 되돌릴 수 없으니 신중하게 실행하세요.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => alert("현재 준비 중인 기능입니다.\n(학생 Info 엔티티 연동 필요)")}
              style={{ padding: "9px 20px", background: "#f59e0b", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
            >
              <i className="bi bi-arrow-up-circle-fill me-2" />
              전체 학생 진급 처리
            </button>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>* 실행 전 반드시 데이터를 백업하세요.</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
