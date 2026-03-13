import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../../components/layout/AdminLayout";
import admin from "../../../api/adminApi";
import {
  STAFF_STATUS,
  EMPLOYMENT_TYPE,
  STATUS_DEFAULT,
} from "../../../constants/statusConfig";
import { ADMIN_ROUTES } from "../../../constants/routes";
const DEPARTMENTS = [
  "행정실",
  "시설관리실",
  "급식실",
  "전산실",
  "당직실",
  "기타",
];

const SYSTEM_ROLES = [
  { value: "STAFF", label: "교직원" },
  { value: "ADMIN", label: "관리자" },
  { value: "FACILITY_MANAGER", label: "시설 관리자" },
  { value: "ASSET_MANAGER", label: "기자재 관리자" },
  { value: "LIBRARIAN", label: "사서" },
  { value: "NURSE", label: "보건 교사" },
  { value: "NUTRITIONIST", label: "영양사" },
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

export default function StaffDetail() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
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
  const [newRole, setNewRole] = useState("");

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

  useEffect(() => {
    load();
  }, [uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (form.employmentType !== "FIXED_TERM") delete payload.contractEndDate;
      await admin.put(`/staffs/${uid}`, payload);
      alert("저장되었습니다.");
      load();
    } finally {
      setSaving(false);
    }
  };

  const addRole = async () => {
    if (!newRole.trim()) return;
    await admin.post(`/staffs/${uid}/role`, null, {
      params: { role: newRole },
    });
    setNewRole("");
    load();
  };

  const removeRole = async (role: string) => {
    if (!confirm(`"${ROLE_LABEL[role] ?? role}" 권한을 제거하시겠습니까?`))
      return;
    await admin.delete(`/staffs/${uid}/role`, { params: { role } });
    load();
  };

  if (!staff)
    return (
      <AdminLayout>
        <div className="text-center py-5">
          <div className="spinner-border" />
        </div>
      </AdminLayout>
    );

  const roles: string[] = staff.roles ?? [];

  return (
    <AdminLayout>
      <div className="breadcrumb d-flex align-items-center gap-3 mb-24">
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.STAFFS.LIST)}
          style={{
            background: "none",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: "4px 10px",
            cursor: "pointer",
            color: "#6b7280",
          }}
        >
          <i className="bi bi-arrow-left" />
        </button>
        <h6 className="fw-semibold mb-0">교직원 상세 정보</h6>
      </div>

      <div className="row">
        {/* 좌측 프로필 카드 */}
        <div className="col-md-4">
          <div className="card mb-4 text-center py-4">
            <div className="card-body">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: 100, height: 100, background: "#f3f4f6" }}
              >
                <span
                  className="text-secondary fw-bold"
                  style={{ fontSize: 36 }}
                >
                  {staff.name?.[0] ?? "?"}
                </span>
              </div>
              <h5 className="mb-1 fw-bold">{staff.name}</h5>
              <p className="text-muted small mb-2">{staff.email}</p>
              {(() => {
                const cfg = STAFF_STATUS[staff.statusName] ?? STATUS_DEFAULT;
                return (
                  <button
                    type="button"
                    className={`btn ${cfg.btn} w-100 rounded-pill mb-3`}
                    style={{ pointerEvents: "none" }}
                  >
                    {cfg.label}
                  </button>
                );
              })()}
              <hr />
              <div className="text-start px-2">
                <div className="mb-2">
                  <small className="text-muted d-block">사번</small>
                  <span className="fw-semibold">{staff.code ?? "-"}</span>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">부서 / 직책</small>
                  <span className="fw-semibold">
                    {staff.department ?? "-"} / {staff.jobTitle ?? "-"}
                  </span>
                </div>
                <div>
                  <small className="text-muted d-block">고용형태</small>
                  {(() => {
                    const cfg = EMPLOYMENT_TYPE[staff.employmentType];
                    return (
                      <span
                        className={`badge ${cfg?.badge ?? "bg-secondary-subtle text-secondary"}`}
                      >
                        {cfg?.label ?? staff.employmentType ?? "-"}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 우측 탭 카드 */}
        <div className="col-md-8">
          <div className="card">
            <div className="d-flex border-bottom border-neutral-200">
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
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">이름</label>
                      <input
                        className="form-control"
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
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
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">이메일</label>
                      <input
                        type="email"
                        className="form-control"
                        value={form.email}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, email: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">사번</label>
                      <input
                        className="form-control"
                        value={form.code}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, code: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">상태</label>
                      <select
                        className="form-select"
                        value={form.statusName}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, statusName: e.target.value }))
                        }
                      >
                        {Object.entries(STAFF_STATUS).map(
                          ([value, { label }]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
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
                        <option value="">선택</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">직책</label>
                      <input
                        className="form-control"
                        value={form.jobTitle}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, jobTitle: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">내선번호</label>
                      <input
                        className="form-control"
                        value={form.extensionNumber}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            extensionNumber: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">고용형태</label>
                      <select
                        className="form-select"
                        value={form.employmentType}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            employmentType: e.target.value,
                          }))
                        }
                      >
                        {Object.entries(EMPLOYMENT_TYPE).map(
                          ([value, { label }]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    {form.employmentType === "FIXED_TERM" && (
                      <div className="col-md-6">
                        <label className="form-label fw-bold">
                          계약 종료일
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={form.contractEndDate}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              contractEndDate: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-24 py-16 border-top border-neutral-200 text-end">
                  <button
                    type="submit"
                    className="btn btn-primary-600 radius-8 px-5"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        저장 중...
                      </>
                    ) : (
                      "정보 수정 저장"
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "noti" && (
              <div className="card-body text-center py-5 text-muted">
                <i className="bi bi-bell display-4 d-block mb-3" />
                <p>알림 이력 기능은 준비 중입니다.</p>
              </div>
            )}

            {activeTab === "role" && (
              <div className="card-body p-4">
                <h6 className="fw-semibold mb-3">부여된 시스템 권한</h6>
                {roles.length === 0 && (
                  <p className="text-muted">부여된 권한이 없습니다.</p>
                )}
                <div className="d-flex flex-wrap gap-2 mb-4">
                  {roles.map((r) => (
                    <span
                      key={r}
                      className="d-inline-flex align-items-center gap-2 px-3 py-2 radius-8 fs-6"
                      style={{
                        background: "#e0f2f1",
                        color: "#25A194",
                        fontWeight: 500,
                      }}
                    >
                      {ROLE_LABEL[r] ?? r}
                      <button
                        type="button"
                        onClick={() => removeRole(r)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#25A194",
                          fontSize: "0.7rem",
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <h6 className="fw-semibold mb-2">권한 추가</h6>
                <div className="input-group" style={{ maxWidth: 400 }}>
                  <select
                    className="form-select"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="">권한 선택</option>
                    {SYSTEM_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary-600 radius-8"
                    type="button"
                    onClick={addRole}
                  >
                    추가
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
