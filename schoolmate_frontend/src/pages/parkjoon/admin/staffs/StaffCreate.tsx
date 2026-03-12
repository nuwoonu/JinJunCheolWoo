import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layout/AdminLayout";
import admin from "../../../../api/adminApi";
import { ADMIN_ROUTES } from '../../../../constants/routes';
const DEPARTMENTS = ["행정실", "시설관리실", "급식실", "전산실", "당직실", "기타"];

export default function StaffCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    code: "",
    password: "",
    department: "",
    jobTitle: "",
    extensionNumber: "",
    employmentType: "PERMANENT",
    contractEndDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form };
    if (form.employmentType !== "FIXED_TERM") delete payload.contractEndDate;
    await admin.post("/staffs", payload);
    navigate(ADMIN_ROUTES.STAFFS.LIST);
  };

  return (
    <AdminLayout>
      <div className="breadcrumb d-flex align-items-center gap-3 mb-24">
        <button type="button" onClick={() => navigate(-1)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#6b7280" }}>
          <i className="bi bi-arrow-left" />
        </button>
        <div>
          <h6 className="fw-semibold mb-0">신규 교직원 등록</h6>
          <p className="text-neutral-600 mt-4 mb-0">새 교직원 계정을 등록합니다.</p>
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
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="example@school.com"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">사번</label>
              <input
                className="form-control"
                required
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="ST20240203"
              />
            </div>
            <div className="col-md-12">
              <label className="form-label fw-bold">초기 비밀번호</label>
              <input
                type="password"
                className="form-control"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
          </div>
          <h5 className="mb-4 text-primary fw-bold">
            <i className="bi bi-briefcase me-2" />
            직무 정보
          </h5>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">부서</label>
              <select
                className="form-select"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
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
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              >
                <option value="">직책 선택</option>
                <option value="팀장">팀장</option>
                <option value="주임">주임</option>
                <option value="사원">사원</option>
                <option value="기간제">기간제</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">내선번호</label>
              <input
                className="form-control"
                value={form.extensionNumber}
                onChange={(e) => setForm((f) => ({ ...f, extensionNumber: e.target.value }))}
                placeholder="예: 123"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">고용형태</label>
              <select
                className="form-select"
                value={form.employmentType}
                onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))}
              >
                <option value="PERMANENT">정규직</option>
                <option value="FIXED_TERM">계약직</option>
              </select>
            </div>
            {form.employmentType === "FIXED_TERM" && (
              <div className="col-md-6">
                <label className="form-label fw-bold">계약 종료일</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.contractEndDate}
                  onChange={(e) => setForm((f) => ({ ...f, contractEndDate: e.target.value }))}
                />
              </div>
            )}
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2 px-24 py-16 border-top border-neutral-200">
          <button type="button" className="btn btn-secondary px-4 me-2" onClick={() => navigate(-1)}>
            취소
          </button>
          <button type="submit" className="btn btn-primary px-5">
            등록 완료
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
