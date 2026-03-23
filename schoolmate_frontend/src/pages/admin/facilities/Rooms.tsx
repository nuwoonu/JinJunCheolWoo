import { useEffect, useState } from "react";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';

const FACILITY_TYPES = [
  { value: "CLASSROOM", label: "일반 교실" },
  { value: "SPECIAL_ROOM", label: "특별실(과학실, 음악실 등)" },
  { value: "COMPUTER_LAB", label: "컴퓨터실" },
  { value: "AUDITORIUM", label: "강당/시청각실" },
  { value: "GYM", label: "체육관" },
  { value: "MEETING_ROOM", label: "회의실" },
  { value: "PLAYGROUND", label: "운동장" },
  { value: "ETC", label: "기타" },
];

const FACILITY_STATUSES = [
  { value: "AVAILABLE", label: "사용 가능" },
  { value: "MAINTENANCE", label: "보수/공사 중" },
  { value: "CLOSED", label: "사용 불가/폐쇄" },
];

const EMPTY_FORM = {
  id: null as number | null,
  name: "",
  type: "CLASSROOM",
  status: "AVAILABLE",
  capacity: 0,
  location: "",
  amenities: "",
  description: "",
};

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

const statusStyle = (v: string): React.CSSProperties => {
  if (v === "AVAILABLE") return { background: "#ecfdf5", color: "#065f46", border: "1px solid #6ee7b7", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
  if (v === "MAINTENANCE") return { background: "#fffbeb", color: "#92400e", border: "1px solid #fcd34d", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
  return { background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
};

export default function Rooms() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });

  const load = () =>
    admin.get("/resources/facilities/rooms").then((r) => setFacilities(r.data.facilities ?? []));

  useEffect(() => { load(); }, []);

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showModal]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };
  const openEdit = (f: any) => {
    setForm({
      id: f.id,
      name: f.name ?? "",
      type: f.type ?? "CLASSROOM",
      status: f.status ?? "AVAILABLE",
      capacity: f.capacity ?? 0,
      location: f.location ?? "",
      amenities: f.amenities ?? "",
      description: f.description ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.id !== null) {
      await admin.put("/resources/facilities/rooms", form);
    } else {
      await admin.post("/resources/facilities/rooms", form);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 시설을 삭제하시겠습니까?")) return;
    await admin.delete(`/resources/facilities/rooms/${id}`);
    load();
  };

  const typeLabel = (v: string) => FACILITY_TYPES.find((t) => t.value === v)?.label ?? v;
  const statusLabel = (v: string) => FACILITY_STATUSES.find((s) => s.value === v)?.label ?? v;

  return (
    <AdminLayout>
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 560, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{form.id !== null ? "시설 수정" : "시설 등록"}</h6>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: 20 }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">시설명</label>
                    <input className="form-control" required value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">유형</label>
                    <select className="form-select" value={form.type} onChange={(e) => setForm((f: any) => ({ ...f, type: e.target.value }))}>
                      {FACILITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">수용 인원</label>
                    <input type="number" className="form-control" min={0} value={form.capacity} onChange={(e) => setForm((f: any) => ({ ...f, capacity: Number(e.target.value) }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">위치</label>
                    <input className="form-control" value={form.location} onChange={(e) => setForm((f: any) => ({ ...f, location: e.target.value }))} placeholder="예: 본관 3층" />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">상태</label>
                    <select className="form-select" value={form.status} onChange={(e) => setForm((f: any) => ({ ...f, status: e.target.value }))}>
                      {FACILITY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">편의시설</label>
                    <input className="form-control" value={form.amenities} onChange={(e) => setForm((f: any) => ({ ...f, amenities: e.target.value }))} placeholder="예: 프로젝터, 에어컨" />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">비고</label>
                    <textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: "1px solid #e5e7eb" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#374151", cursor: "pointer" }}>취소</button>
                <button type="submit" style={{ padding: "8px 16px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                  {form.id !== null ? "수정" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>시설 관리</h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>강의실 및 특별실 등 학교 시설을 관리합니다.</p>
        </div>
        <button onClick={openCreate} style={{ padding: "9px 20px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}>
          + 시설 등록
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col />
            <col style={{ width: 160 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 120 }} />
            <col />
            <col style={{ width: 110 }} />
            <col style={{ width: 130 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={th}>시설명</th>
              <th style={th}>유형</th>
              <th style={{ ...th, textAlign: "center" }}>수용 인원</th>
              <th style={th}>위치</th>
              <th style={th}>편의시설</th>
              <th style={{ ...th, textAlign: "center" }}>상태</th>
              <th style={{ ...th, textAlign: "center" }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((r: any) => (
              <tr key={r.id}>
                <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                <td style={{ ...td, color: "#6b7280", fontSize: 13 }}>{typeLabel(r.type)}</td>
                <td style={{ ...td, textAlign: "center", color: "#6b7280" }}>{r.capacity}명</td>
                <td style={{ ...td, color: "#6b7280" }}>{r.location}</td>
                <td style={{ ...td, color: "#9ca3af", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>{r.amenities}</td>
                <td style={{ ...td, textAlign: "center" }}>
                  <span style={statusStyle(r.status)}>{statusLabel(r.status)}</span>
                </td>
                <td style={{ ...td, textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    <button onClick={() => openEdit(r)} style={{ padding: "4px 12px", background: "#fff", border: "1px solid #25A194", borderRadius: 6, fontSize: 12, fontWeight: 500, color: "#25A194", cursor: "pointer" }}>수정</button>
                    <button onClick={() => handleDelete(r.id)} style={{ padding: "4px 12px", background: "#fff", border: "1px solid #ef4444", borderRadius: 6, fontSize: 12, fontWeight: 500, color: "#ef4444", cursor: "pointer" }}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
            {facilities.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign: "center", color: "#9ca3af", padding: "40px 0", whiteSpace: "normal" }}>
                  등록된 시설이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
