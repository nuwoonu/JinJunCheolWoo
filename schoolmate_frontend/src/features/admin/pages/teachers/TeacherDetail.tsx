import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from '@/shared/components/layout/admin/AdminLayout';
import admin from '@/shared/api/adminApi';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useSchool } from '@/shared/contexts/SchoolContext';
import { useAdminMsg, apiErrMsg } from '@/shared/hooks/useAdminMsg';
import {
  TEACHER_STATUS,
  ROLE_REQUEST_STATUS,
  STATUS_DEFAULT,
} from '@/shared/constants/statusConfig';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import type { GrantInfo } from '@/shared/api/authApi';

// [joon] 교사 상세

// [soojin] any 대신 백엔드 응답 타입 정의
interface TeacherData {
  uid?: number;
  name?: string;
  email?: string;
  code?: string;
  subjectCode?: string;
  subject?: string;
  department?: string;
  position?: string;
  statusName?: string;
  roleRequestId?: number | null;
  roleRequestStatus?: string;
  roles?: string[];
}
interface TeacherSection {
  id: number;
  classroomId?: number;
  grade: number;
  classNum: number;
  subjectName?: string;
  termName?: string;
  studentCount?: number;
}
interface TeacherClassroom {
  cid: number;
  year?: number;
  grade?: number;
  classNum?: number;
}
interface GrantEntry {
  id: number;
  grantedRoleDescription?: string;
  schoolName?: string;
}

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

function getRoleRequestBadgeStyle(status: string) {
  switch (status) {
    case 'ACTIVE': return { background: 'rgba(22,163,74,0.1)', color: '#16a34a' };
    case 'PENDING': return { background: 'rgba(14,165,233,0.1)', color: '#0284c7' };
    case 'SUSPENDED': return { background: 'rgba(234,179,8,0.1)', color: '#ca8a04' };
    case 'REJECTED': return { background: 'rgba(239,68,68,0.1)', color: '#dc2626' };
    default: return { background: '#f3f4f6', color: '#6b7280' };
  }
}

export default function TeacherDetail() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedSchool } = useSchool();
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [subjects, setSubjects] = useState<{ code: string; name: string }[]>([]); // cheol
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
  const [rejectReason, setRejectReason] = useState("");
  const { msg, error, setMsg, setError } = useAdminMsg();

  // 수업 분반 관련 state
  const [sections, setSections] = useState<TeacherSection[]>([]);
  const [classrooms, setClassrooms] = useState<TeacherClassroom[]>([]);
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<number[]>([]);
  const [sectionSaving, setSectionSaving] = useState(false);

  // 위임 권한 관련 state
  const [grants, setGrants] = useState<GrantEntry[]>([]);
  const [newGrantRole, setNewGrantRole] = useState("");

  const grants_user: GrantInfo[] = user?.grants ?? [];
  const isSuperAdmin = grants_user.some(g => g.grantedRole === "SUPER_ADMIN");

  const load = () =>
    admin.get(`/teachers/${uid}`).then((r) => {
      setTeacher(r.data);
      const d = r.data;
      setForm({
        name: d.name ?? "",
        email: d.email ?? "",
        code: d.code ?? "",
        subject: d.subjectCode ?? "", // cheol
        department: d.department ?? "",
        position: d.position ?? "",
        statusName: d.statusName ?? "",
      });
    });

  const loadSections = () =>
    admin.get(`/teachers/${uid}/sections`).then(r => setSections(r.data ?? []));

  const loadClassrooms = () =>
    admin.get('/classes', { params: { size: 200 } }).then(r => setClassrooms(r.data?.content ?? []));

  const loadGrants = () =>
    admin.get("/grants", { params: { userId: uid } }).then((r) => setGrants(r.data ?? []));

  // cheol
  useEffect(() => {
    admin.get("/subjects").then((r) => setSubjects(r.data ?? []));
  }, []);

  useEffect(() => {
    load();
    if (isSuperAdmin) loadGrants();
  }, [uid]);

  useEffect(() => {
    if (activeTab === 'sections') {
      loadSections();
      loadClassrooms();
    }
  }, [activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.put(`/teachers/${uid}`, form);
      setMsg("저장되었습니다.");
      load();
    } catch (err: unknown) {
      setError(apiErrMsg(err, "저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  const approveRequest = async () => {
    if (!teacher?.roleRequestId) return;
    await admin.post(`/role-requests/${teacher.roleRequestId}/approve`);
    load();
  };

  const rejectRequest = async () => {
    if (!teacher?.roleRequestId) return;
    await admin.post(`/role-requests/${teacher.roleRequestId}/reject`, { reason: rejectReason });
    setRejectReason("");
    load();
  };

  const suspendRequest = async () => {
    if (!teacher?.roleRequestId || !confirm("역할을 정지하시겠습니까?")) return;
    await admin.post(`/role-requests/${teacher.roleRequestId}/suspend`);
    load();
  };

  const addGrant = async () => {
    if (!newGrantRole || !selectedSchool?.id) return;
    try {
      await admin.post("/grants", {
        userId: Number(uid),
        schoolId: selectedSchool.id,
        grantedRole: newGrantRole,
      });
      setNewGrantRole("");
      setMsg("권한이 부여되었습니다.");
      loadGrants();
    } catch (err: any) {
      setError(apiErrMsg(err, "권한 부여에 실패했습니다."));
    }
  };

  const removeGrant = async (grantId: number) => {
    if (!confirm("이 위임 권한을 회수하시겠습니까?")) return;
    try {
      await admin.delete(`/grants/${grantId}`);
      setMsg("권한이 회수되었습니다.");
      loadGrants();
    } catch (err: any) {
      setError(apiErrMsg(err, "권한 회수에 실패했습니다."));
    }
  };

  if (!teacher)
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div className="spinner-border" />
        </div>
      </AdminLayout>
    );

  const roles: string[] = teacher.roles ?? [];
  const statusCfg = TEACHER_STATUS[teacher.statusName] ?? STATUS_DEFAULT;

  return (
    <AdminLayout msg={msg} error={error}>
      <div style={{ marginBottom: 24 }}>
        <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>교사 상세 정보</h6>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>교사 정보를 확인하고 수정합니다.</p>
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.TEACHERS.LIST)}
          style={{ marginTop: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#6b7280", fontSize: 13 }}
        >
          ← 목록으로
        </button>
      </div>

      <div className="row">
        {/* 좌측 프로필 카드 */}
        <div className="col-md-4">
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(37,161,148,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: '#25A194' }}>
                  {teacher.name?.[0] ?? "?"}
                </span>
              </div>
              <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>{teacher.name}</h5>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{teacher.email}</p>
              <span style={{ padding: '5px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, ...getStatusBadgeStyle(teacher.statusName ?? "") }}>
                {statusCfg.label}
              </span>
              <hr style={{ margin: '20px 0', borderColor: '#f3f4f6' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>사번</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{teacher.code ?? "-"}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>부서 / 직책</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{teacher.department ?? "-"} / {teacher.position ?? "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>담당 과목</div>
                  <span style={{ padding: '3px 8px', background: '#f3f4f6', color: '#374151', borderRadius: 4, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {teacher.subject ?? "-"}
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
                ["sections", "수업 분반"],
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
                      <label className="form-label fw-bold">사번</label>
                      <input
                        className="form-control"
                        value={form.code}
                        onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-bold">이메일</label>
                      <input
                        type="email"
                        className="form-control"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-bold">재직 상태</label>
                      <select
                        className="form-select"
                        value={form.statusName}
                        onChange={(e) => setForm((f) => ({ ...f, statusName: e.target.value }))}
                      >
                        {Object.entries(TEACHER_STATUS).map(([value, { label }]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    {/* cheol */}
                    <div className="col-md-12">
                      <label className="form-label fw-bold">담당 과목</label>
                      <select
                        className="form-select"
                        value={form.subject}
                        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                      >
                        <option value="">-- 과목 선택 --</option>
                        {subjects.map((s) => (
                          <option key={s.code} value={s.code}>{s.name}</option>
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
                      <select
                        className="form-select"
                        value={form.position}
                        onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                      >
                        <option value="">선택</option>
                        {POSITIONS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ padding: '9px 18px', background: '#25A194', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: saving ? 0.7 : 1 }}
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

            {activeTab === "sections" && (
              <div style={{ padding: 24 }}>
                {/* 현재 분반 목록 */}
                <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>현재 학기 수업 분반</p>
                {sections.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px dashed #d1d5db', minHeight: 60, background: '#f9fafb', marginBottom: 20 }}>
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>등록된 수업 분반이 없습니다.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {sections.map((s) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(37,161,148,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="ri-book-2-line" style={{ color: '#25A194', fontSize: 15 }} />
                          </span>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'block' }}>
                              {s.grade}학년 {s.classNum}반 · {s.subjectName}
                            </span>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{s.termName} · 학생 {s.studentCount}명</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`${s.grade}학년 ${s.classNum}반 ${s.subjectName} 분반을 삭제합니까?`)) return;
                            await admin.delete(`/teachers/${uid}/sections/${s.id}`);
                            loadSections();
                          }}
                          style={{ padding: '3px 10px', background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <hr style={{ borderColor: '#e5e7eb' }} />

                {/* 분반 추가 */}
                <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>분반 추가</p>
                {teacher.subject ? (
                  <>
                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                      담당 과목 <strong style={{ color: '#111827' }}>{teacher.subject}</strong> 으로 수업할 학급을 선택하세요.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                      {classrooms.map((c) => {
                        const alreadyAdded = sections.some((s) => s.classroomId === c.cid);
                        const checked = selectedClassroomIds.includes(c.cid);
                        return (
                          <label
                            key={c.cid}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '6px 12px', borderRadius: 8, border: `1px solid ${checked ? '#25A194' : '#e5e7eb'}`,
                              background: alreadyAdded ? '#f3f4f6' : checked ? 'rgba(37,161,148,0.08)' : '#fff',
                              cursor: alreadyAdded ? 'not-allowed' : 'pointer',
                              fontSize: 13, color: alreadyAdded ? '#9ca3af' : '#374151',
                              opacity: alreadyAdded ? 0.6 : 1,
                            }}
                          >
                            <input
                              type="checkbox"
                              disabled={alreadyAdded}
                              checked={checked}
                              onChange={e => {
                                if (e.target.checked) setSelectedClassroomIds(ids => [...ids, c.cid]);
                                else setSelectedClassroomIds(ids => ids.filter(id => id !== c.cid));
                              }}
                            />
                            {c.grade}학년 {c.classNum}반
                            {alreadyAdded && <span style={{ fontSize: 11, color: '#9ca3af' }}>(등록됨)</span>}
                          </label>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      disabled={sectionSaving || selectedClassroomIds.length === 0}
                      onClick={async () => {
                        setSectionSaving(true);
                        try {
                          await admin.post(`/teachers/${uid}/sections`, { classroomIds: selectedClassroomIds });
                          setSelectedClassroomIds([]);
                          loadSections();
                        } catch (err: any) {
                          const msg = err?.response?.data?.error || '분반 등록에 실패했습니다.';
                          alert(msg);
                        } finally {
                          setSectionSaving(false);
                        }
                      }}
                      style={{ padding: '9px 18px', background: '#25A194', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: (sectionSaving || selectedClassroomIds.length === 0) ? 'not-allowed' : 'pointer', opacity: (sectionSaving || selectedClassroomIds.length === 0) ? 0.6 : 1 }}
                    >
                      {sectionSaving ? <><span className="spinner-border spinner-border-sm me-2" />등록 중...</> : `선택한 ${selectedClassroomIds.length}개 학급에 분반 등록`}
                    </button>
                  </>
                ) : (
                  <div style={{ padding: '16px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
                      <i className="ri-error-warning-line me-2" />
                      담당 과목이 설정되지 않았습니다. 기본 정보 탭에서 담당 과목을 먼저 설정해주세요.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "noti" && (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
                <i className="ri-notification-3-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
                <p>알림 이력 기능은 준비 중입니다.</p>
              </div>
            )}

            {activeTab === "role" && (
              <div style={{ padding: 24 }}>

                {/* ── 역할 신청 상태 ── */}
                <div style={{ marginBottom: 4 }}>
                  <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>역할 신청</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', flexWrap: 'wrap' }}>
                    {teacher.roleRequestId ? (
                      <>
                        <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ...getRoleRequestBadgeStyle(teacher.roleRequestStatus ?? "") }}>
                          {(ROLE_REQUEST_STATUS[teacher.roleRequestStatus ?? ""] ?? { label: teacher.roleRequestStatus }).label}
                        </span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
                          {teacher.roleRequestStatus === 'PENDING' && (
                            <button style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: 'rgba(22,163,74,0.1)', color: '#16a34a' }} onClick={approveRequest}>승인</button>
                          )}
                          {teacher.roleRequestStatus === 'ACTIVE' && (
                            <button style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: 'rgba(234,179,8,0.1)', color: '#ca8a04' }} onClick={suspendRequest}>정지</button>
                          )}
                          {teacher.roleRequestStatus === 'SUSPENDED' && (
                            <button style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: 'rgba(22,163,74,0.1)', color: '#16a34a' }} onClick={approveRequest}>재활성화</button>
                          )}
                          {teacher.roleRequestStatus === 'PENDING' && (
                            <>
                              <input
                                className="form-control form-control-sm"
                                style={{ maxWidth: 180, fontSize: 12 }}
                                placeholder="거절 사유 입력"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                              />
                              <button style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: 'rgba(239,68,68,0.1)', color: '#dc2626' }} onClick={rejectRequest}>거절</button>
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>역할 신청 내역이 없습니다.</span>
                    )}
                  </div>
                </div>

                <hr style={{ margin: '20px 0', borderColor: '#e5e7eb' }} />

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
                        {grants.map((g) => (
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
                        style={{ padding: '9px 14px', background: '#25A194', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: (!newGrantRole || !selectedSchool?.id) ? 'not-allowed' : 'pointer', opacity: (!newGrantRole || !selectedSchool?.id) ? 0.6 : 1 }}
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
