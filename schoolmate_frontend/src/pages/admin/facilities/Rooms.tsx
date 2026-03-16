import { useEffect, useState } from "react";
import AdminLayout from "../../../components/layout/AdminLayout";
import admin from "../../../api/adminApi";

// FacilityType enum values
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

// FacilityStatus enum values
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

export default function Rooms() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });

  const load = () =>
    admin
      .get("/resources/facilities/rooms")
      .then((r) => setFacilities(r.data.facilities ?? []));

  useEffect(() => {
    load();
  }, []);

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

  const typeLabel = (v: string) =>
    FACILITY_TYPES.find((t) => t.value === v)?.label ?? v;
  const statusLabel = (v: string) =>
    FACILITY_STATUSES.find((s) => s.value === v)?.label ?? v;

  const statusBadge = (v: string) => {
    if (v === "AVAILABLE")
      return "bg-success-subtle text-success border border-success-subtle";
    if (v === "MAINTENANCE")
      return "bg-warning-subtle text-warning border border-warning-subtle";
    return "bg-danger-subtle text-danger border border-danger-subtle";
  };

  return (
    <AdminLayout>
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "var(--white)",
              borderRadius: 12,
              width: "100%",
              maxWidth: 560,
              margin: "0 16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                {form.id !== null ? "시설 수정" : "시설 등록"}
              </h6>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "var(--text-secondary-light)",
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: "20px" }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">시설명</label>
                    <input
                      className="form-control"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm((f: any) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">유형</label>
                    <select
                      className="form-select"
                      value={form.type}
                      onChange={(e) =>
                        setForm((f: any) => ({ ...f, type: e.target.value }))
                      }
                    >
                      {FACILITY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">수용 인원</label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      value={form.capacity}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          capacity: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">위치</label>
                    <input
                      className="form-control"
                      value={form.location}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          location: e.target.value,
                        }))
                      }
                      placeholder="예: 본관 3층"
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">상태</label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) =>
                        setForm((f: any) => ({ ...f, status: e.target.value }))
                      }
                    >
                      {FACILITY_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">편의시설</label>
                    <input
                      className="form-control"
                      value={form.amenities}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          amenities: e.target.value,
                        }))
                      }
                      placeholder="예: 프로젝터, 에어컨"
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">비고</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  padding: "12px 20px",
                  borderTop: "1px solid var(--border-color)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline-secondary radius-8"
                  onClick={() => setShowModal(false)}
                >
                  취소
                </button>
                <button type="submit" className="btn btn-primary-600 radius-8">
                  {form.id !== null ? "수정" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">시설 관리</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            강의실 및 특별실 등 학교 시설을 관리합니다.
          </p>
        </div>
        <button className="btn btn-primary-600 radius-8" onClick={openCreate}>
          <i className="bi bi-plus-lg" /> 시설 등록
        </button>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-heading-dark-mode">
              <tr>
                <th className="ps-4">시설명</th>
                <th>유형</th>
                <th>수용 인원</th>
                <th>위치</th>
                <th>편의시설</th>
                <th>상태</th>
                <th className="text-end pe-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((r: any) => (
                <tr key={r.id}>
                  <td className="ps-4 fw-bold">{r.name}</td>
                  <td>{typeLabel(r.type)}</td>
                  <td>{r.capacity}명</td>
                  <td>{r.location}</td>
                  <td className="text-muted small">{r.amenities}</td>
                  <td>
                    <span className={`badge ${statusBadge(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td className="text-end pe-4">
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => openEdit(r)}
                    >
                      수정
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(r.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {facilities.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    등록된 시설이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
