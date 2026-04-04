import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from '@/shared/components/layout/admin/AdminLayout';
import { useAdminMsg, apiErrMsg } from '@/shared/hooks/useAdminMsg';
import admin from '@/shared/api/adminApi';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useSchool } from '@/shared/contexts/SchoolContext';
import {
  STAFF_STATUS,
  EMPLOYMENT_TYPE,
  STATUS_DEFAULT,
} from '@/shared/constants/statusConfig';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import type { GrantInfo } from '@/shared/api/authApi';

/** SUPER_ADMIN이 부여 가능한 GrantedRole 목록 (SUPER_ADMIN 제외) */
const GRANTED_ROLES = [
  { value: "SCHOOL_ADMIN", label: "학교 관리자" },
  { value: "PARENT_MANAGER", label: "학부모 관리" },
  { value: "STUDENT_MANAGER", label: "학생 관리" },
  { value: "CLASS_MANAGER", label: "학급 관리" },
  { value: "TEACHER_MANAGER", label: "교사 관리" },
  { value: "STAFF_MANAGER", label: "교직원 관리" },
  { value: "NOTICE_MANAGER", label: "공지 관리" },
  { value: "SCHEDULE_MANAGER", label: "일정 관리" },
  { value: "FACILITY_MANAGER", label: "시설 관리" },
  { value: "ASSET_MANAGER", label: "기자재 관리" },
  { value: "DORMITORY_MANAGER", label: "기숙사 관리" },
  { value: "LIBRARIAN", label: "도서 관리" },
  { value: "NURSE", label: "보건 관리" },
  { value: "NUTRITIONIST", label: "급식 관리" },
];

const DEPARTMENTS = [
  "행정실",
  "시설관리실",
  "급식실",
  "전산실",
  "당직실",
  "기타",
];

const ROLE_LABEL: Record<string, string> = {
  TEACHER: "교사",
  STAFF: "교직원",
  ADMIN: "관리자",
  STUDENT: "학생",
  PARENT: "학부모",
  FACILITY_MANAGER: "시설 관리자",
  ASSET_MANAGER: "기자재 관리자",
  LIBRARIAN: "사서",
  NURSE: "보건 교사",
  NUTRITIONIST: "영양사",
};

function getStatusBadgeStyle(statusName: string) {
  const key = statusName?.toUpperCase() ?? '';
  if (['TEACHING', 'EMPLOYED', 'ACTIVE'].includes(key))
    return { background: 'rgba(22,163,74,0.1)', color: '#16a34a' };
  if (['LEAVE', 'DISPATCHED'].includes(key))
    return { background: 'rgba(234,179,8,0.1)', color: '#ca8a04' };
  if (['RETIRED', 'SUSPENDED'].includes(key))
    return { background: 'rgba(239,68,68,0.1)', color: '#dc2626' };
  return { background: '#f3f4f6', color: '#6b7280' };
}

function getEmploymentBadgeStyle(type: string) {
  switch (type) {
    case 'PERMANENT': return { background: 'rgba(22,163,74,0.1)', color: '#16a34a' };
    case 'FIXED_TERM': return { background: 'rgba(14,165,233,0.1)', color: '#0284c7' };
    default: return { background: '#f3f4f6', color: '#6b7280' };
  }
}

export default function StaffDetail() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedSchool } = useSchool();
  const [staff, setStaff] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    code: "",
    department: "",
    jobTitle: "",
    extensionNumber: "",
    statusName: "",
    employmentType: "",
    contractEndDate: "",
  });
  const [activeTab, setActiveTab] = useState("info");
  const [saving, setSaving] = useState(false);
  const { msg, error, setMsg, setError } = useAdminMsg();

  // 위임 권한 관련 state
  const [grants, setGrants] = useState<any[]>([]);
  const [newGrantRole, setNewGrantRole] = useState("");

  const grants_user: GrantInfo[] = user?.grants ?? [];
  const isSuperAdmin = grants_user.some(g => g.grantedRole === "SUPER_ADMIN");

  const load = () =>
    admin.get(`/staffs/${uid}`).then((r) => {
      setStaff(r.data);
      const d = r.data;
      setForm({
        name: d.name ?? "",
        email: d.email ?? "",
        phone: d.phone ?? "",
        code: d.code ?? "",
        department: d.department ?? "",
        jobTitle: d.jobTitle ?? "",
        extensionNumber: d.extensionNumber ?? "",
        statusName: d.statusName ?? "",
        employmentType: d.employmentType ?? "PERMANENT",
        contractEndDate: d.contractEndDate ?? "",
      });
    });

  const loadGrants = () =>
    admin.get("/grants", { params: { userId: uid } }).then((r) => setGrants(r.data ?? []));

  useEffect(() => {
    load();
    if (isSuperAdmin) loadGrants();
  }, [uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (form.employmentType !== "FIXED_TERM") delete payload.contractEndDate;
      await admin.put(`/staffs/${uid}`, payload);
      setMsg("저장되었습니다.");
      load();
    } catch (err: any) {
      setError(apiErrMsg(err, "저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  const addGrant = async () => {
    if (!newGrantRole || !selectedSchool?.id) return;
    await admin.post("/grants", {
      userId: Number(uid),
      schoolId: selectedSchool.id,
      grantedRole: newGrantRole,
    });
    setNewGrantRole("");
    loadGrants();
  };

  const removeGrant = async (grantId: number) => {
    if (!confirm("이 위임 권한을 회수하시겠습니까?")) return;
    await admin.delete(`/grants/${grantId}`);
    loadGrants();
  };

  if (!staff)
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div className="spinner-border" />
        </div>
      </AdminLayout>
    );

  const roles: string[] = staff.roles ?? [];
  const statusCfg = STAFF_STATUS[staff.statusName] ?? STATUS_DEFAULT;
  const empCfg = EMPLOYMENT_TYPE[staff.employmentType];

  return (
    <AdminLayout msg={msg} error={error}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(ADMIN_ROUTES.STAFFS.LIST)} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#6b7280', fontSize: 13 }}>← 뒤로</button>
          <div>
            <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>교직원 상세 정보</h5>
          </div>
        </div>
      </div>

      <div className="row">
        {/* 좌측 프로필 카드 */}
        <div className="col-md-4">
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(37,161,148,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: '#25A194' }}>
                  {staff.name?.[0] ?? "?"}
                </span>
              </div>
              <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>{staff.name}</h5>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{staff.email}</p>
              <span style={{ padding: '5px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, ...getStatusBadgeStyle(staff.statusName) }}>
                {statusCfg.label}
              </span>
              <hr style={{ margin: '20px 0', borderColor: '#f3f4f6' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>사번</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{staff.code ?? "-"}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>부서 / 직책</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{staff.department ?? "-"} / {staff.jobTitle ?? "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>고용형태</div>
                  <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ...getEmploymentBadgeStyle(staff.employmentType) }}>
                    {empCfg?.label ?? staff.employmentType ?? "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 우측 탭 카드 */}
        <div className="col-md-8">
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
              {[
                ["info", "기본 정보"],
                ["noti", "알림 이력"],
                ["role", "권한 관리"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: "12px 20px",
                    border: "none",
                    background: "none",
                    borderBottom: `2px solid ${activeTab === key ? "#25A194" : "transparent"}`,
                    color: activeTab === key ? "#25A194" : "#6b7280",
                    fontWeight: activeTab === key ? 600 : 400,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === "info" && (
              <form onSubmit={handleSave}>
                <div style={{ padding: 24 }}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">이름</label>
                      <input
                        className="form-control"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">연락처</label>
                      <input
                        className="form-control"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">이메일</label>
                      <input
                        type="email"
                        className="form-control"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">사번</label>
                      <input
                        className="form-control"
                        value={form.code}
                        onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">상태</label>
                      <select
                        className="form-select"
                        value={form.statusName}
                        onChange={(e) => setForm((f) => ({ ...f, statusName: e.target.value }))}
                      >
                        {Object.entries(STAFF_STATUS).map(([value, { label }]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">부서</label>
                      <select
                        className="form-select"
                        value={form.department}
                        onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                      >
                        <option value="">선택</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">직책</label>
                      <input
                        className="form-control"
                        value={form.jobTitle}
                        onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">내선번호</label>
                      <input
                        className="form-control"
                        value={form.extensionNumber}
                        onChange={(e) => setForm((f) => ({ ...f, extensionNumber: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">고용형태</label>
                      <select
                        className="form-select"
                        value={form.employmentType}
                        onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))}
                      >
                        {Object.entries(EMPLOYMENT_TYPE).map(([value, { label }]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #25A194, #1a7a6e)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: saving ? 0.7 : 1 }}
                  >
                    {saving ? (
                      <><span className="spinner-border spinner-border-sm" style={{ marginRight: 6 }} />저장 중...</>
                    ) : (
                      "정보 수정 저장"
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "noti" && (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
                <i className="bi bi-bell" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
                <p>알림 이력 기능은 준비 중입니다.</p>
              </div>
            )}

            {activeTab === "role" && (
              <div style={{ padding: 24 }}>

                {/* ── 시스템 역할 (읽기 전용) ── */}
                <div style={{ marginBottom: 4 }}>
                  <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>시스템 역할</p>
                  {roles.length === 0 ? (
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>부여된 역할 없음</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {roles.map((r) => (
                        <span
                          key={r}
                          style={{ padding: '4px 12px', background: 'rgba(37,161,148,0.12)', color: '#25A194', borderRadius: 20, fontWeight: 500, fontSize: 12 }}
                        >
                          {ROLE_LABEL[r] ?? r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── 관리자 위임 권한 (SUPER_ADMIN 전용) ── */}
                {isSuperAdmin && (
                  <>
                    <hr style={{ margin: '20px 0', borderColor: '#e5e7eb' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>관리자 위임 권한</p>
                      {selectedSchool && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 12 }}>
                          <i className="ri-building-line" />
                          {selectedSchool.name}
                        </span>
                      )}
                    </div>

                    {/* 기존 위임 권한 목록 */}
                    {grants.length === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px dashed #d1d5db', minHeight: 60, background: '#f9fafb', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: '#9ca3af' }}>부여된 위임 권한이 없습니다.</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        {grants.map((g: any) => (
                          <div
                            key={g.id}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(37,161,148,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <i className="ri-shield-keyhole-line" style={{ color: '#25A194', fontSize: 14 }} />
                              </span>
                              <div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#25A194', display: 'block' }}>{g.grantedRoleDescription}</span>
                                <span style={{ fontSize: 11, color: '#9ca3af' }}>{g.schoolName}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeGrant(g.id)}
                              style={{ padding: '3px 10px', background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            >
                              회수
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 신규 위임 권한 부여 */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select
                        className="form-select form-select-sm"
                        style={{ maxWidth: 220 }}
                        value={newGrantRole}
                        onChange={(e) => setNewGrantRole(e.target.value)}
                      >
                        <option value="">권한 선택</option>
                        {GRANTED_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addGrant}
                        disabled={!newGrantRole || !selectedSchool?.id}
                        style={{ padding: '9px 14px', background: 'linear-gradient(135deg, #25A194, #1a7a6e)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: (!newGrantRole || !selectedSchool?.id) ? 'not-allowed' : 'pointer', opacity: (!newGrantRole || !selectedSchool?.id) ? 0.6 : 1 }}
                      >
                        부여
                      </button>
                    </div>
                    {!selectedSchool && (
                      <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8, marginBottom: 0 }}>관리자 페이지에서 학교를 먼저 선택해주세요.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
