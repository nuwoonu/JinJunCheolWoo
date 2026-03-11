import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layout/AdminLayout";
import admin from "../../../../api/adminApi";

const BASE = "/parkjoon/admin";

export default function ClassCreate() {
  const navigate = useNavigate();
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
    await admin.post("/classes", form);
    navigate(`${BASE}/classes`);
  };

  return (
    <AdminLayout>
      <h2 className="mb-4">
        <span
          className="me-2"
          style={{ cursor: "pointer" }}
          onClick={() => navigate(-1)}
        >
          ←
        </span>
        학급 생성
      </h2>
      <form onSubmit={handleSubmit} className="card shadow-sm">
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">학년도</label>
              <input
                type="number"
                className="form-control"
                required
                value={form.year}
                onChange={(e) =>
                  setForm((f) => ({ ...f, year: Number(e.target.value) }))
                }
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">학년</label>
              <select
                className="form-select"
                required
                value={form.grade}
                onChange={(e) =>
                  setForm((f) => ({ ...f, grade: e.target.value }))
                }
              >
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">반</label>
              <input
                type="number"
                className="form-control"
                required
                min={1}
                value={form.classNum}
                onChange={(e) =>
                  setForm((f) => ({ ...f, classNum: Number(e.target.value) }))
                }
              />
            </div>
            <div className="col-md-12">
              <label className="form-label fw-bold">담임 교사</label>
              <select
                className="form-select"
                value={form.teacherUid}
                onChange={(e) =>
                  setForm((f) => ({ ...f, teacherUid: e.target.value }))
                }
              >
                <option value="">담임 미배정</option>
                {teachers.map((t) => (
                  <option key={t.uid} value={t.uid}>
                    {t.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="card-footer bg-light p-4 text-end">
          <button
            type="button"
            className="btn btn-secondary px-4 me-2"
            onClick={() => navigate(-1)}
          >
            취소
          </button>
          <button type="submit" className="btn btn-primary px-5">
            학급 생성
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
