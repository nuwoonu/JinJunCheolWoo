import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';
import GrantRoleSelect from '@/components/GrantRoleSelect';
const DEPARTMENTS = [
  "행정실",
  "시설관리실",
  "급식실",
  "전산실",
  "당직실",
  "기타",
];

export default function StaffCreate() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    grantedRole: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const payload: any = { ...form };
    if (form.employmentType !== "FIXED_TERM") delete payload.contractEndDate;
    try {
      await admin.post("/staffs", payload);
      navigate(ADMIN_ROUTES.STAFFS.LIST);
    } catch (err: any) {
      const msg = err?.response?.data || "교직원 등록에 실패했습니다.";
      setSubmitError(msg);
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#6b7280', fontSize: 13 }}>← 뒤로</button>
          <div>
            <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>신규 교직원 등록</h5>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>새 교직원 계정을 등록합니다.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          {submitError && (
            <div style={{ margin: '16px 24px 0', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
              {submitError}
            </div>
          )}
          <div style={{ padding: 24 }}>
            <h6 style={{ fontWeight: 700, color: '#25A194', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              기본 정보
            </h6>
            <div className="row g-3" style={{ marginBottom: 24 }}>
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

            <h6 style={{ fontWeight: 700, color: '#25A194', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              직무 정보
            </h6>
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
                    <option key={d} value={d}>{d}</option>
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

            <h6 style={{ fontWeight: 700, color: '#25A194', marginBottom: 16, marginTop: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              권한 설정 (선택)
            </h6>
            <div className="row g-3">
              <GrantRoleSelect
                value={form.grantedRole}
                onChange={(v) => setForm((f) => ({ ...f, grantedRole: v }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ padding: '9px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #25A194, #1a7a6e)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              등록 완료
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
