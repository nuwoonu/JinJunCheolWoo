import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/layout/AdminLayout";
import admin from "../../../api/adminApi";
import { ADMIN_ROUTES } from "../../../constants/routes";
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

export default function TeacherCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    code: "",
    password: "",
    subject: "",
    department: "",
    position: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await admin.post("/teachers", form);
    navigate(ADMIN_ROUTES.TEACHERS.LIST);
  };

  return (
    <AdminLayout>
      <div className="breadcrumb d-flex align-items-center gap-3 mb-24">
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            padding: "4px 10px",
            cursor: "pointer",
            color: "var(--text-secondary-light)",
          }}
        >
          <i className="bi bi-arrow-left" />
        </button>
        <div>
          <h6 className="fw-semibold mb-0">신규 교사 등록</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            새 교사 계정을 등록합니다.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body p-4">
          <h5 className="mb-4 text-primary fw-bold">
            <i className="bi bi-person-circle me-2" />
            기본 정보
          </h5>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label fw-bold">이름</label>
              <input
                className="form-control"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="성함 입력"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">이메일 (ID)</label>
              <input
                type="email"
                className="form-control"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="example@school.com"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">사번</label>
              <input
                className="form-control"
                required
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                placeholder="T2024001"
              />
            </div>
            <div className="col-md-12">
              <label className="form-label fw-bold">초기 비밀번호</label>
              <input
                type="password"
                className="form-control"
                required
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
          </div>
          <h5 className="mb-4 text-primary fw-bold">
            <i className="bi bi-briefcase me-2" />
            직무 정보
          </h5>
          <div className="row g-3">
            <div className="col-md-12">
              <label className="form-label fw-bold">담당 과목</label>
              <input
                className="form-control"
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                placeholder="예: 수학, 영어"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">부서</label>
              <select
                className="form-select"
                value={form.department}
                onChange={(e) =>
                  setForm((f) => ({ ...f, department: e.target.value }))
                }
              >
                <option value="">부서 선택</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">직책</label>
              <select
                className="form-select"
                value={form.position}
                onChange={(e) =>
                  setForm((f) => ({ ...f, position: e.target.value }))
                }
              >
                <option value="">직책 선택</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2 px-24 py-16 border-top border-neutral-200">
          <button
            type="button"
            className="btn btn-secondary px-4 me-2"
            onClick={() => navigate(-1)}
          >
            취소
          </button>
          <button type="submit" className="btn btn-primary-600 radius-8 px-5">
            등록 완료
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
