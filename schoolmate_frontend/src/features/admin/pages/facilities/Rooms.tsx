import { useEffect, useRef, useState } from "react";
import AdminLayout from '@/shared/components/layout/admin/AdminLayout';
import admin from '@/shared/api/adminApi';

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
  fontSize: 13,
  fontWeight: 600,
  color: "#6b7280",
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  textAlign: "left",
};

const td: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: 13,
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
  // [soojin] 전체 건수 표시용 - 초기 로드 시 한 번만 세팅
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const isInitialLoad = useRef(true);
  // [soojin] 시설 검색 - 클라이언트 사이드 필터링
  const [roomInput, setRoomInput] = useState("");
  const [roomKeyword, setRoomKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });

  const load = () =>
    admin.get("/resources/facilities/rooms").then((r) => {
      const data = r.data.facilities ?? [];
      setFacilities(data);
      // [soojin] 최초 로드 시에만 totalAll 세팅
      if (isInitialLoad.current) {
        setTotalAll(data.length);
        isInitialLoad.current = false;
      }
    });

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
    // [soojin] 등록/수정 후 totalAll도 갱신
    isInitialLoad.current = true;
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 시설을 삭제하시겠습니까?")) return;
    await admin.delete(`/resources/facilities/rooms/${id}`);
    // [soojin] 삭제 후 totalAll도 갱신
    isInitialLoad.current = true;
    load();
  };

  const typeLabel = (v: string) => FACILITY_TYPES.find((t) => t.value === v)?.label ?? v;
  const statusLabel = (v: string) => FACILITY_STATUSES.find((s) => s.value === v)?.label ?? v;

  // [soojin] 시설 검색 - 이름/위치/편의시설 기준 클라이언트 사이드 필터링
  const filteredFacilities = roomKeyword
    ? facilities.filter((r) =>
        r.name?.toLowerCase().includes(roomKeyword.toLowerCase()) ||
        r.location?.toLowerCase().includes(roomKeyword.toLowerCase()) ||
        r.amenities?.toLowerCase().includes(roomKeyword.toLowerCase())
      )
    : facilities;

  const handleRoomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setRoomKeyword(roomInput);
  };

  const handleRoomReset = () => {
    setRoomInput("");
    setRoomKeyword("");
  };

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
                <button type="submit" style={{ padding: "8px 16px", background: "#25A194", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                  {form.id !== null ? "수정" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* [soojin] 테이블이 화면 높이를 꽉 채우도록 flex column 컨테이너 */}
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 4.5rem - 48px)" }}>
        {/* [soojin] 제목 + 전체 건수 인라인 표시 */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 4, display: "flex", alignItems: "baseline", gap: 8 }}>
            시설 목록
            <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>전체 {totalAll ?? 0}개</span>
          </h6>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>강의실 및 특별실 등 학교 시설을 관리합니다.</p>
        </div>

        {/* [soojin] 컨트롤 바: 검색(좌) + 버튼(우) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
          <form style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }} onSubmit={handleRoomSearch}>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <i className="bi bi-search" style={{ position: "absolute", left: "8px", color: "#9ca3af", fontSize: "13px", pointerEvents: "none" }} />
              <input
                style={{ padding: "5px 8px 5px 28px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, minWidth: 200, background: "#fff" }}
                placeholder="시설명, 위치 검색"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              style={{ padding: "5px 12px", background: "#25A194", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              검색
            </button>
            <button
              type="button"
              onClick={handleRoomReset}
              style={{ padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, cursor: "pointer", color: "#374151", whiteSpace: "nowrap" }}
            >
              초기화
            </button>
            {roomKeyword && (
              <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 600, color: "#111827" }}>{filteredFacilities.length}개</span> / 전체 {totalAll ?? 0}개
              </span>
            )}
          </form>
          <button
            onClick={openCreate}
            style={{ padding: "5px 12px", background: "#25A194", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            + 시설 등록
          </button>
        </div>

        {/* [soojin] 카드: flex:1로 남은 공간 채우기 */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* [soojin] 스크롤 div: 내부에서만 스크롤 */}
          {/* [soojin] overflowX 래퍼 제거, tableLayout auto, colgroup 제거 → 브라우저 자동 컬럼 분배 */}
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
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
                {filteredFacilities.map((r: any) => (
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
                {filteredFacilities.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...td, textAlign: "center", color: "#9ca3af", padding: "48px 16px", whiteSpace: "normal" }}>
                      {roomKeyword ? "검색 결과가 없습니다." : "등록된 시설이 없습니다."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
