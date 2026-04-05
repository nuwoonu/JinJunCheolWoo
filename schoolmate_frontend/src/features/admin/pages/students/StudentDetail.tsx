import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from '@/shared/components/layout/admin/AdminLayout';
import admin from '@/shared/api/adminApi';
import { STUDENT_STATUS, ROLE_REQUEST_STATUS, STATUS_DEFAULT } from '@/shared/constants/statusConfig';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import { useAdminMsg, apiErrMsg } from '@/shared/hooks/useAdminMsg';

// [soojin] any 대신 백엔드 응답 타입 정의
interface StudentAssignment {
  schoolYear: number;
  grade: number;
  classNum: number;
  attendanceNum: number;
}
interface StudentGuardian {
  parentId: number;
  name: string;
  phone?: string;
  relationship?: string;
}
interface StudentData {
  name?: string;
  code?: string;
  email?: string;
  statusName?: string;
  statusDescription?: string;
  roleRequestId?: number | null;
  roleRequestStatus?: string;
  assignments?: StudentAssignment[];
  guardians?: StudentGuardian[];
  basicHabits?: string;
  specialNotes?: string;
}
interface ParentSearchResult {
  id?: number;
  uid?: number;
  name: string;
  email?: string;
}

const TH_STYLE: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 12,
  fontWeight: 600,
  color: "#6b7280",
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  textAlign: "left",
};

const TD_STYLE: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  color: "#374151",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

export default function StudentDetail() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState<Partial<StudentData>>({});
  const [parentSearch, setParentSearch] = useState("");
  const [parentResults, setParentResults] = useState<ParentSearchResult[]>([]);
  const [showParentModal, setShowParentModal] = useState(false);
  const [relationship, setRelationship] = useState("OTHER");
  const { msg, error, setMsg, setError } = useAdminMsg();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = () => {
    setLoadError(null);
    admin
      .get(`/students/${uid}`)
      .then((r) => {
        setStudent(r.data);
        setForm(r.data);
      })
      .catch((e) =>
        setLoadError(
          `[${e.response?.status ?? "ERR"}] ${e.response?.data?.message ?? e.message}`,
        ),
      );
  };

  useEffect(() => {
    load();
  }, [uid]);

  const saveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await admin.put(`/students/${uid}/basic`, form);
      setMsg("저장되었습니다.");
      load();
    } catch (err: unknown) {
      setError(apiErrMsg(err, "저장에 실패했습니다."));
    }
  };

  const deleteAssignment = async (schoolYear: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await admin.delete(`/students/${uid}/assignment/${schoolYear}`);
    load();
  };

  const searchParents = async () => {
    const r = await admin.get("/students/search-parent", {
      params: { keyword: parentSearch },
    });
    setParentResults(Array.isArray(r.data) ? r.data : (r.data?.content ?? []));
  };

  const addGuardian = async (parentId: string) => {
    await admin.post(`/students/${uid}/guardian`, null, {
      params: { parentId, relationship },
    });
    setShowParentModal(false);
    setRelationship("OTHER");
    load();
  };

  const removeGuardian = async (parentId: string) => {
    if (!confirm("보호자 연동을 해제하시겠습니까?")) return;
    await admin.delete(`/students/${uid}/guardian/${parentId}`);
    load();
  };

  const approveRequest = async () => {
    if (!student?.roleRequestId) return; // [soojin] roleRequestId 없을 때 API 호출 방지
    await admin.post(`/role-requests/${student.roleRequestId}/approve`);
    load();
  };

  const rejectRequest = async () => {
    if (!student?.roleRequestId) return; // [soojin] roleRequestId 없을 때 API 호출 방지
    await admin.post(`/role-requests/${student.roleRequestId}/reject`, { reason: rejectReason });
    setRejectReason("");
    load();
  };

  const suspendRequest = async () => {
    if (!student?.roleRequestId) return; // [soojin] roleRequestId 없을 때 API 호출 방지
    if (!confirm("역할을 정지하시겠습니까?")) return;
    await admin.post(`/role-requests/${student.roleRequestId}/suspend`);
    load();
  };

  if (!student)
    return (
      <AdminLayout>
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          {loadError ? (
            <div style={{ display: "inline-block", padding: "12px 20px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, fontSize: 14 }}>{loadError}</div>
          ) : (
            <div className="spinner-border" />
          )}
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout msg={msg} error={error}>
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>학생 상세 정보</h6>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>학생 정보를 확인하고 수정합니다.</p>
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.STUDENTS.LIST)}
          style={{ marginTop: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#6b7280", fontSize: 13 }}
        >
          ← 목록으로
        </button>
      </div>

      <div className="row">
        {/* 좌측 프로필 카드 */}
        <div className="col-md-4">
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: 24, textAlign: "center" }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(37,161,148,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <span style={{ fontSize: 36, color: "#25A194", fontWeight: 700 }}>
                  {student.name?.[0]}
                </span>
              </div>
              <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>{student.name}</h5>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                학번 {student.code ?? "-"}
              </p>
              {(() => {
                const cfg = STUDENT_STATUS[student.statusName] ?? STATUS_DEFAULT;
                return (
                  <span style={{ padding: "5px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: cfg.bg ?? "#f3f4f6", color: cfg.color ?? "#6b7280" }}>
                    {student.statusDescription || cfg.label}
                  </span>
                );
              })()}
              <hr style={{ margin: '20px 0', borderColor: '#f3f4f6' }} />
              <div style={{ textAlign: 'left' }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                <i className="ri-mail-line" style={{ fontSize: 15, color: "#9ca3af", marginTop: 1 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>계정 이메일</p>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", wordBreak: "break-all", marginBottom: 0 }}>
                    {student.email}
                  </p>
                </div>
              </div>
              {student.assignments?.length > 0 && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <i className="ri-building-2-line" style={{ fontSize: 15, color: "#9ca3af", marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>최근 소속</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 0 }}>
                      {(() => {
                        const a = student.assignments[student.assignments.length - 1];
                        return `${a.schoolYear}년 ${a.grade}학년 ${a.classNum}반`;
                      })()}
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* 우측 탭 카드 */}
        <div className="col-md-8">
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
              {[
                ["basic", "기본 정보"],
                ["history", "학적 이력"],
                ["parent", "보호자 관리"],
                ["approval", "역할 승인"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    padding: "12px 20px",
                    border: "none",
                    background: "none",
                    borderBottom: `2px solid ${tab === key ? "#25A194" : "transparent"}`,
                    color: tab === key ? "#25A194" : "#6b7280",
                    fontWeight: tab === key ? 600 : 400,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ padding: "20px 24px" }}>
              {tab === "basic" && (
                <form onSubmit={saveBasic}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label style={LABEL_STYLE}>이름</label>
                      <input
                        className="form-control"
                        required
                        value={form.name ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label style={LABEL_STYLE}>학번</label>
                      <input
                        className="form-control"
                        required
                        value={form.code ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-12">
                      <label style={LABEL_STYLE}>학적 상태</label>
                      <select
                        className="form-select"
                        value={form.statusName ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, statusName: e.target.value }))}
                      >
                        {Object.entries(STUDENT_STATUS).map(([value, cfg]) => (
                          <option key={value} value={value}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-12">
                      <label style={LABEL_STYLE}>기초 생활 기록</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={form.basicHabits ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, basicHabits: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-12">
                      <label style={LABEL_STYLE}>특이사항</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={form.specialNotes ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, specialNotes: e.target.value }))}
                      />
                    </div>
                    <div className="col-12" style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                      <button
                        type="submit"
                        style={{ background: "#25A194", color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                      >
                        정보 수정 저장
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {tab === "history" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <i className="ri-history-line" style={{ fontSize: 16, color: "#9ca3af" }} />
                    <h6 style={{ fontWeight: 600, color: "#111827", margin: 0 }}>학년도별 학급 배정 이력</h6>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={TH_STYLE}>학년도</th>
                        <th style={TH_STYLE}>소속 (학년-반-번호)</th>
                        <th style={{ ...TH_STYLE, textAlign: "right" }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(student.assignments ?? []).map((a) => (
                        <tr key={a.schoolYear}>
                          <td style={{ ...TD_STYLE, fontWeight: 600 }}>{a.schoolYear}학년도</td>
                          <td style={TD_STYLE}>
                            {a.grade}학년 {a.classNum}반 {a.attendanceNum}번
                          </td>
                          <td style={{ ...TD_STYLE, textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => deleteAssignment(a.schoolYear)}
                              style={{ padding: "3px 10px", background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!student.assignments?.length && (
                        <tr>
                          <td colSpan={3} style={{ padding: "32px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                            등록된 이력이 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {tab === "parent" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <i className="ri-user-heart-line" style={{ fontSize: 16, color: "#9ca3af" }} />
                      <h6 style={{ fontWeight: 600, color: "#111827", margin: 0 }}>연동된 보호자 목록</h6>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowParentModal(true)}
                      style={{ padding: "5px 12px", background: "#25A194", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <i className="bi bi-plus-lg" /> 보호자 추가
                    </button>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={TH_STYLE}>보호자명</th>
                        <th style={TH_STYLE}>연락처</th>
                        <th style={TH_STYLE}>관계</th>
                        <th style={{ ...TH_STYLE, textAlign: "right" }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(student.guardians ?? []).map((g) => (
                        <tr key={g.parentId}>
                          <td style={{ ...TD_STYLE, fontWeight: 600 }}>{g.name}</td>
                          <td style={TD_STYLE}>{g.phone}</td>
                          <td style={TD_STYLE}>
                            <span style={{ background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 10px", fontSize: 12 }}>
                              {g.relationship}
                            </span>
                          </td>
                          <td style={{ ...TD_STYLE, textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => removeGuardian(g.parentId)}
                              style={{ padding: "3px 10px", background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                            >
                              해제
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!student.guardians?.length && (
                        <tr>
                          <td colSpan={4} style={{ padding: "32px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                            연동된 보호자가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {tab === "approval" && (
                <div style={{ padding: "16px 0" }}>
                  <h6 style={{ fontWeight: 600, color: "#111827", marginBottom: 12 }}>학생 역할 승인 상태</h6>
                  {student.roleRequestId ? (
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#f9fafb" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, ...((ROLE_REQUEST_STATUS[student.roleRequestStatus] ?? STATUS_DEFAULT) as any) }}>
                          {(ROLE_REQUEST_STATUS[student.roleRequestStatus] ?? { label: student.roleRequestStatus }).label}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {student.roleRequestStatus === "PENDING" && (
                          <button
                            type="button"
                            onClick={approveRequest}
                            style={{ padding: "5px 12px", background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid #86efac", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                          >
                            승인
                          </button>
                        )}
                        {student.roleRequestStatus === "ACTIVE" && (
                          <button
                            type="button"
                            onClick={suspendRequest}
                            style={{ padding: "5px 12px", background: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "1px solid #fcd34d", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                          >
                            정지
                          </button>
                        )}
                        {student.roleRequestStatus === "SUSPENDED" && (
                          <button
                            type="button"
                            onClick={approveRequest}
                            style={{ padding: "5px 12px", background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid #86efac", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                          >
                            재활성화
                          </button>
                        )}
                        {student.roleRequestStatus === "PENDING" && (
                          <>
                            <input
                              className="form-control form-control-sm"
                              style={{ maxWidth: 220 }}
                              placeholder="거절 사유 입력"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={rejectRequest}
                              style={{ padding: "5px 12px", background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                            >
                              거절
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: "#9ca3af", fontSize: 14 }}>역할 신청 내역이 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 보호자 검색 모달 */}
      {showParentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 480, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>보호자 검색</h6>
              <button
                onClick={() => setShowParentModal(false)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  className="form-control"
                  placeholder="보호자 이름 입력"
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  onKeyUp={(e) => e.key === "Enter" && searchParents()}
                />
                <button
                  type="button"
                  onClick={searchParents}
                  style={{ padding: "5px 12px", background: "#25A194", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  검색
                </button>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ ...LABEL_STYLE, marginBottom: 6 }}>관계</label>
                <select
                  className="form-select"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                >
                  <option value="FATHER">부</option>
                  <option value="MOTHER">모</option>
                  <option value="GRANDFATHER">조부</option>
                  <option value="GRANDMOTHER">조모</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>
              <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                {parentResults.map((p) => (
                  <button
                    key={p.id ?? p.uid}
                    type="button"
                    onClick={() => addGuardian(p.id ?? p.uid)}
                    style={{ display: "block", width: "100%", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #f3f4f6", textAlign: "left", fontSize: 14, color: "#374151", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    {p.name} ({p.email})
                  </button>
                ))}
                {parentResults.length === 0 && (
                  <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "16px 0", margin: 0 }}>검색 결과가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
