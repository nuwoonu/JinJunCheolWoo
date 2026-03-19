import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/admin/AdminLayout";
import admin from "@/api/adminApi";

// cheol
const YEAR_OPTIONS = [
  { value: "FIRST",  label: "1학년" },
  { value: "SECOND", label: "2학년" },
  { value: "THIRD",  label: "3학년" },
];
const YEAR_LABEL: Record<string, string> = { FIRST: "1학년", SECOND: "2학년", THIRD: "3학년" }; // cheol

const EMPTY = { originCode: "", code: "", name: "", year: "" }; // cheol

export default function Subjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [isEdit, setIsEdit] = useState(false);

  const load = () =>
    admin.get("/subjects").then((r) => setSubjects(r.data ?? []));
  useEffect(() => {
    load();
  }, []);

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showModal]);

  const openCreateModal = () => {
    setForm({ ...EMPTY });
    setIsEdit(false);
    setShowModal(true);
  };

  const openUpdateModal = (s: any) => {
    setForm({ originCode: s.code, code: s.code, name: s.name, year: s.year ?? "" }); // cheol
    setIsEdit(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = { originCode: form.originCode, code: form.code, name: form.name, year: form.year || null }; // cheol
    if (isEdit) {
      await admin.put(`/subjects`, payload);
    } else {
      await admin.post("/subjects", payload);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`"${code}" 과목을 삭제하시겠습니까?`)) return;
    await admin.delete(`/subjects/${code}`);
    load();
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
              maxWidth: 440,
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
                {isEdit ? "과목 수정" : "과목 등록"}
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
                {isEdit && <input type="hidden" value={form.originCode} />}
                <div className="mb-3">
                  <label className="form-label fw-semibold">과목 코드</label>
                  <input
                    className="form-control"
                    required
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value }))
                    }
                    placeholder="예: MATH01"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">과목명</label>
                  <input
                    className="form-control"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="예: 수학"
                  />
                </div>
                {/* cheol */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">학년</label>
                  <select
                    className="form-select"
                    value={form.year}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, year: e.target.value }))
                    }
                  >
                    <option value="">-- 학년 선택 --</option>
                    {YEAR_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
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
                  {isEdit ? "수정" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">과목 관리</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            교과목 코드 및 과목명을 관리합니다.
          </p>
        </div>
        <button
          className="btn btn-primary-600 radius-8"
          onClick={openCreateModal}
        >
          <i className="bi bi-plus-lg" /> 과목 등록
        </button>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-heading-dark-mode">
              <tr>
                <th className="ps-4">과목 코드</th>
                <th>과목명</th>
                <th>학년</th> {/* cheol */}
                <th className="text-end pe-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s: any) => (
                <tr key={s.code}>
                  <td className="ps-4 fw-bold text-primary">{s.code}</td>
                  <td>{s.name}</td>
                  <td>{s.year ? YEAR_LABEL[s.year] : "-"}</td> {/* cheol */}
                  <td className="text-end pe-4">
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => openUpdateModal(s)}
                    >
                      수정
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(s.code)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted">
                    등록된 과목이 없습니다.
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
