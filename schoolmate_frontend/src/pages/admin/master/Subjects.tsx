import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/layout/admin/AdminLayout";
import admin from "@/api/adminApi";

const EMPTY = { id: null as number | null, originCode: "", code: "", name: "" };

const th: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 12,
  fontWeight: 600,
  color: "#6b7280",
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  textAlign: "left",
};

const td: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: 14,
  color: "#374151",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

export default function Subjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [isEdit, setIsEdit] = useState(false);
  const [csvResults, setCsvResults] = useState<string[] | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const load = () =>
    admin.get("/subjects").then((r) => setSubjects(r.data ?? []));

  useEffect(() => { load(); }, []);

  const openCreateModal = () => {
    setForm({ ...EMPTY });
    setIsEdit(false);
    setShowModal(true);
  };

  const openUpdateModal = (s: any) => {
    setForm({ id: s.id, originCode: s.code, code: s.code, name: s.name });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = { id: form.id, originCode: form.originCode, code: form.code, name: form.name };
    if (isEdit) {
      await admin.put(`/subjects`, payload);
    } else {
      await admin.post("/subjects", payload);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (s: any) => {
    if (!confirm(`"${s.code}" 과목을 삭제하시겠습니까?`)) return;
    await admin.delete(`/subjects/${s.id}`);
    load();
  };

  const uploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await admin.post("/subjects/import-csv", fd);
      setCsvResults(res.data ?? []);
      load();
    } catch {
      setCsvResults(["CSV 등록 중 오류가 발생했습니다."]);
    }
    e.target.value = "";
  };

  return (
    <AdminLayout>
      {/* CSV 결과 모달 */}
      {csvResults && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 480, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>CSV 등록 결과</h6>
              <button onClick={() => setCsvResults(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <div style={{ padding: 20, maxHeight: 360, overflowY: "auto" }}>
              {csvResults.map((r, i) => {
                const isSkip = r.startsWith("건너뜀");
                const isFail = r.startsWith("실패");
                return (
                  <div key={i} style={{ fontSize: 13, padding: "4px 0", color: isFail ? "#ef4444" : isSkip ? "#f59e0b" : "#16a34a" }}>
                    {r}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setCsvResults(null)}
                style={{ padding: "8px 20px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 과목 등록/수정 모달 */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 440, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{isEdit ? "과목 수정" : "과목 등록"}</h6>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: 20 }}>
                {isEdit && <input type="hidden" value={form.originCode} />}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>과목 코드</label>
                  <input
                    className="form-control"
                    required
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="예: MATH01"
                  />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>과목명</label>
                  <input
                    className="form-control"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="예: 1학년 수학"
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: "1px solid #e5e7eb" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 16px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#374151", cursor: "pointer" }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 16px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
                >
                  {isEdit ? "수정" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>과목 관리</h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>교과목 코드 및 과목명을 관리합니다.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="file"
            ref={csvRef}
            accept=".csv"
            style={{ display: "none" }}
            onChange={uploadCsv}
          />
          <button
            onClick={() => csvRef.current?.click()}
            style={{ padding: "9px 20px", background: "#fff", border: "1px solid #25A194", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#25A194", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            CSV 일괄 등록
          </button>
          <button
            onClick={openCreateModal}
            style={{ padding: "9px 20px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            + 과목 등록
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 160 }} />
            <col />
            <col style={{ width: 140 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={th}>과목 코드</th>
              <th style={th}>과목명</th>
              <th style={{ ...th, textAlign: "center" }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s: any) => (
              <tr key={s.code}>
                <td style={{ ...td, fontWeight: 600, color: "#1d4ed8" }}>{s.code}</td>
                <td style={td}>{s.name}</td>
                <td style={{ ...td, textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    <button
                      onClick={() => openUpdateModal(s)}
                      style={{ padding: "4px 12px", background: "#fff", border: "1px solid #25A194", borderRadius: 6, fontSize: 12, fontWeight: 500, color: "#25A194", cursor: "pointer" }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      style={{ padding: "4px 12px", background: "#fff", border: "1px solid #ef4444", borderRadius: 6, fontSize: 12, fontWeight: 500, color: "#ef4444", cursor: "pointer" }}
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan={3} style={{ ...td, textAlign: "center", color: "#9ca3af", padding: "40px 0", whiteSpace: "normal" }}>
                  등록된 과목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
