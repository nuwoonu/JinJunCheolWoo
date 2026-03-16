import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/layout/AdminLayout";
import admin from "../../../api/adminApi";
import { ADMIN_ROUTES } from "../../../constants/routes";

export default function ParentCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    code: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // code가 빈 문자열이면 null로 전송 (백엔드가 null일 때 중복 체크 생략)
    const payload = { ...form, code: form.code || null };
    await admin.post("/parents", payload);
    navigate(ADMIN_ROUTES.PARENTS.LIST);
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
          <h6 className="fw-semibold mb-0">신규 학부모 등록</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            새 학부모 계정을 등록합니다.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body p-4">
          <div className="row g-3">
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
              <label className="form-label fw-bold">학부모 코드</label>
              <input
                className="form-control"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                placeholder="예: P2024001 (선택)"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">연락처</label>
              <input
                className="form-control"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="010-0000-0000"
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
