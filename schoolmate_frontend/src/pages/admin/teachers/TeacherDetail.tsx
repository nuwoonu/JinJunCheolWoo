import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import {
  TEACHER_STATUS,
  ROLE_REQUEST_STATUS,
  STATUS_DEFAULT,
} from '@/constants/statusConfig';
import { ADMIN_ROUTES } from '@/constants/routes';

// [joon] 교사 상세
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

export default function TeacherDetail() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    code: "",
    subject: "",
    department: "",
    position: "",
    statusName: "",
  });
  const [activeTab, setActiveTab] = useState("info");
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const load = () =>
    admin.get(`/teachers/${uid}`).then((r) => {
      setTeacher(r.data);
      const d = r.data;
      setForm({
        name: d.name ?? "",
        email: d.email ?? "",
        code: d.code ?? "",
        subject: d.subject ?? "",
        department: d.department ?? "",
        position: d.position ?? "",
        statusName: d.statusName ?? "",
      });
    });

  useEffect(() => {
    load();
  }, [uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.put(`/teachers/${uid}`, form);
      alert("저장되었습니다.");
      load();
    } finally {
      setSaving(false);
    }
  };

  const addRole = async () => {
    if (!newRole.trim()) return;
    await admin.post(`/teachers/${uid}/role`, null, {
      params: { role: newRole },
    });
    setNewRole("");
    load();
  };

  const removeRole = async (role: string) => {
    if (!confirm(`"${ROLE_LABEL[role] ?? role}" 권한을 제거하시겠습니까?`))
      return;
    await admin.delete(`/teachers/${uid}/role`, { params: { role } });
    load();
  };

  const approveRequest = async () => {
    if (!teacher.roleRequestId) return;
    await admin.post(`/role-requests/${teacher.roleRequestId}/approve`);
    load();
  };

  const rejectRequest = async () => {
    if (!teacher.roleRequestId) return;
    await admin.post(`/role-requests/${teacher.roleRequestId}/reject`, { reason: rejectReason });
    setRejectReason("");
    load();
  };

  const suspendRequest = async () => {
    if (!teacher.roleRequestId || !confirm("역할을 정지하시겠습니까?")) return;
    await admin.post(`/role-requests/${teacher.roleRequestId}/suspend`);
    load();
  };

  if (!teacher)
    return (
      <AdminLayout>
        <div className="text-center py-5">
          <div className="spinner-border" />
        </div>
      </AdminLayout>
    );

  const roles: string[] = teacher.roles ?? [];

  return (
    <AdminLayout>
      <div className="breadcrumb d-flex align-items-center gap-3 mb-24">
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.TEACHERS.LIST)}
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
        <h6 className="fw-semibold mb-0">교사 상세 정보</h6>
      </div>

      <div className="row">
        {/* 좌측 프로필 카드 */}
        <div className="col-md-4">
          <div className="card mb-4 text-center py-4">
            <div className="card-body">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: 100, height: 100, background: "var(--neutral-100)" }}
              >
                <span className="text-primary fw-bold" style={{ fontSize: 36 }}>
                  {teacher.name?.[0] ?? "?"}
                </span>
              </div>
              <h5 className="mb-1 fw-bold">{teacher.name}</h5>
              <p className="text-muted small mb-3">{teacher.email}</p>
              {(() => {
                const cfg =
                  TEACHER_STATUS[teacher.statusName] ?? STATUS_DEFAULT;
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
                  <span className="fw-semibold">{teacher.code ?? "-"}</span>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">부서 / 직책</small>
                  <span className="fw-semibold">
                    {teacher.department ?? "-"} / {teacher.position ?? "-"}
                  </span>
                </div>
                <div>
                  <small className="text-muted d-block">담당 과목</small>
                  <span className="badge rounded-pill bg-neutral-100 text-neutral-600 border border-neutral-200">
                    {teacher.subject ?? "-"}
                  </span>
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
                    color: activeTab === key ? "#25A194" : "var(--text-secondary-light)",
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
                      <label className="form-label fw-bold">사번</label>
                      <input
                        className="form-control"
                        value={form.code}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, code: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-12">
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
                    <div className="col-md-12">
                      <label className="form-label fw-bold">재직 상태</label>
                      <select
                        className="form-select"
                        value={form.statusName}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, statusName: e.target.value }))
                        }
                      >
                        {Object.entries(TEACHER_STATUS).map(
                          ([value, { label }]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-bold">담당 과목</label>
                      <input
                        className="form-control"
                        value={form.subject}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, subject: e.target.value }))
                        }
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
                      <select
                        className="form-select"
                        value={form.position}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, position: e.target.value }))
                        }
                      >
                        <option value="">선택</option>
                        {POSITIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
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
                {/* 교사 역할 승인 상태 */}
                <h6 className="fw-semibold mb-3">교사 역할 승인 상태</h6>
                {teacher.roleRequestId ? (
                  <div className="border rounded p-3 mb-4" style={{ background: "var(--neutral-50, #f9fafb)" }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span className={`badge ${(ROLE_REQUEST_STATUS[teacher.roleRequestStatus] ?? STATUS_DEFAULT).badge}`}>
                        {(ROLE_REQUEST_STATUS[teacher.roleRequestStatus] ?? { label: teacher.roleRequestStatus }).label}
                      </span>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      {teacher.roleRequestStatus === 'PENDING' && (
                        <button className="btn btn-sm btn-success" onClick={approveRequest}>승인</button>
                      )}
                      {teacher.roleRequestStatus === 'ACTIVE' && (
                        <button className="btn btn-sm btn-warning" onClick={suspendRequest}>정지</button>
                      )}
                      {teacher.roleRequestStatus === 'SUSPENDED' && (
                        <button className="btn btn-sm btn-success" onClick={approveRequest}>재활성화</button>
                      )}
                      {(teacher.roleRequestStatus === 'PENDING') && (
                        <div className="d-flex gap-2 align-items-center">
                          <input
                            className="form-control form-control-sm"
                            style={{ maxWidth: 220 }}
                            placeholder="거절 사유 입력"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <button className="btn btn-sm btn-outline-danger" onClick={rejectRequest}>거절</button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted mb-4">역할 신청 내역이 없습니다.</p>
                )}
                <hr />
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
                        background: "rgba(37, 161, 148, 0.15)",
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
