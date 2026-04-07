import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ParentAdminLayout from '@/shared/components/layout/admin/ParentAdminLayout';
import admin from '@/shared/api/adminApi';
import { ROLE_REQUEST_STATUS, STATUS_DEFAULT } from '@/shared/constants/statusConfig';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import { useAdminMsg, apiErrMsg } from '@/shared/hooks/useAdminMsg';

// [soojin] any 대신 백엔드 응답 타입 정의
interface ParentChild {
  uid: number;
  name: string;
  code?: string;
  schoolName?: string;
  relationship?: string;
}
interface ParentSearchResult {
  uid: number;
  name: string;
  code?: string;
  schoolName?: string;
}
interface ParentData {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  roleRequestId?: number | null;
  roleRequestStatus?: string;
  children?: ParentChild[];
}

const thStyle: React.CSSProperties = {
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

// [soojin] 역할 상태 인라인 컬러 맵
const RR_COLOR: Record<string, { color: string; bg: string; border: string }> = {
  ACTIVE:    { color: "#16a34a", bg: "rgba(22,163,74,0.1)",   border: "#86efac" },
  PENDING:   { color: "#0ea5e9", bg: "rgba(14,165,233,0.1)",  border: "#7dd3fc" },
  SUSPENDED: { color: "#d97706", bg: "rgba(217,119,6,0.1)",   border: "#fcd34d" },
  REJECTED:  { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "#fca5a5" },
};

export default function ParentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [parent, setParent] = useState<ParentData | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [saving, setSaving] = useState(false);
  const { msg, error, setMsg, setError } = useAdminMsg();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ParentSearchResult[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [relationship, setRelationship] = useState("OTHER");
  const [pendingStudent, setPendingStudent] = useState<ParentSearchResult | null>(null);

  const load = () =>
    admin.get(`/parents/${id}`).then((r) => {
      setParent(r.data);
      const d = r.data;
      setForm({
        name: d.name ?? "",
        email: d.email ?? "",
        phone: d.phone ?? "",
      });
    });

  useEffect(() => {
    load();
  }, [id]);

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showModal]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.put(`/parents/${id}`, form);
      setMsg("저장되었습니다.");
      load();
    } catch (err: unknown) {
      setError(apiErrMsg(err, "저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  const approveRequest = async () => {
    if (!parent?.roleRequestId) return; // [soojin] roleRequestId 없을 때 API 호출 방지
    await admin.post(`/role-requests/${parent.roleRequestId}/approve`);
    load();
  };

  const rejectRequest = async () => {
    if (!parent?.roleRequestId) return; // [soojin] roleRequestId 없을 때 API 호출 방지
    await admin.post(`/role-requests/${parent.roleRequestId}/reject`, { reason: rejectReason });
    setRejectReason("");
    load();
  };

  const suspendRequest = async () => {
    if (!parent?.roleRequestId) return; // [soojin] roleRequestId 없을 때 API 호출 방지
    if (!confirm("역할을 정지하시겠습니까?")) return;
    await admin.post(`/role-requests/${parent.roleRequestId}/suspend`);
    load();
  };

  const removeChild = async (studentUid: string) => {
    if (!confirm("자녀 연결을 해제하시겠습니까?")) return;
    await admin.delete(`/parents/${id}/child/${studentUid}`);
    load();
  };

  const searchStudents = async () => {
    if (!searchQuery.trim()) return;
    const r = await admin.get("/students", {
      params: { keyword: searchQuery, size: 10, ignoreSchoolFilter: true, excludeParentId: id },
    });
    setSearchResults(r.data?.content ?? []);
  };

  const selectStudent = (student: ParentSearchResult) => {
    setPendingStudent(student);
    setRelationship("OTHER");
  };

  const addChild = async () => {
    if (!pendingStudent) return;
    await admin.post(`/parents/${id}/child`, null, {
      params: { studentUid: pendingStudent.uid, relationship },
    });
    setPendingStudent(null);
    setShowModal(false);
    setSearchQuery("");
    setSearchResults([]);
    load();
  };

  if (!parent)
    return (
      <ParentAdminLayout requireSchool={false}>
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div className="spinner-border" />
        </div>
      </ParentAdminLayout>
    );

  const children: ParentChild[] = parent.children ?? [];
  const rrStatus = parent.roleRequestStatus ?? "";
  const rrColorCfg = RR_COLOR[rrStatus] ?? { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" };

  return (
    <ParentAdminLayout msg={msg} error={error}>
      {/* 자녀 추가 모달 */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 480, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>자녀 추가</h6>
              <button
                onClick={() => { setShowModal(false); setSearchResults([]); setPendingStudent(null); }}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "20px" }}>
              {!pendingStudent ? (
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input
                      className="form-control"
                      placeholder="학생 이름 또는 학번 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchStudents()}
                    />
                    <button
                      style={{ padding: "5px 12px", background: "#25A194", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
                      onClick={searchStudents}
                    >
                      검색
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div style={{ maxHeight: 250, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                      {searchResults.map((s) => (
                        <div key={s.uid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{s.name}</span>
                            <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>{s.code}</span>
                            {s.schoolName && (
                              <span style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: 6, padding: "1px 7px", fontSize: 11, fontWeight: 500, marginLeft: 8 }}>
                                {s.schoolName}
                              </span>
                            )}
                          </div>
                          <button
                            style={{ padding: "4px 12px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#374151", cursor: "pointer" }}
                            onClick={() => selectStudent(s)}
                          >
                            선택
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p style={{ marginBottom: 12 }}>선택한 학생: <strong>{pendingStudent.name}</strong> ({pendingStudent.code})</p>
                  <div style={{ marginBottom: 12 }}>
                    <label style={LABEL_STYLE}>관계 선택</label>
                    <select className="form-select" value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                      <option value="FATHER">부</option>
                      <option value="MOTHER">모</option>
                      <option value="GRANDFATHER">조부</option>
                      <option value="GRANDMOTHER">조모</option>
                      <option value="OTHER">기타</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{ flex: 1, padding: "7px 16px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#374151", cursor: "pointer" }}
                      onClick={() => setPendingStudent(null)}
                    >
                      다시 검색
                    </button>
                    <button
                      style={{ flex: 1, padding: "7px 16px", background: "#25A194", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
                      onClick={addChild}
                    >
                      연결 추가
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 페이지 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>학부모 상세 정보</h6>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>학부모 정보를 확인하고 수정합니다.</p>
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.PARENTS.LIST)}
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
                  {parent.name?.[0] ?? "?"}
                </span>
              </div>
              <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>{parent.name}</h5>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>{parent.email}</p>
              <span style={{ padding: "5px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: rrColorCfg.bg, color: rrColorCfg.color }}>
                {(ROLE_REQUEST_STATUS[rrStatus] ?? STATUS_DEFAULT).label || "미신청"}
              </span>
              <hr style={{ margin: "20px 0", borderColor: "#f3f4f6" }} />
              <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                  <i className="ri-phone-line" style={{ fontSize: 15, color: "#9ca3af", marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>연락처</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 0 }}>{parent.phone ?? "-"}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <i className="ri-user-heart-line" style={{ fontSize: 15, color: "#9ca3af", marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>자녀 수</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 0 }}>{children.length}명</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 우측 탭 카드 */}
        <div className="col-md-8">
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            {/* 탭 헤더 */}
            <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
              {[
                ["info", "기본 정보"],
                ["children", "자녀 관리"],
                ["approval", "역할 승인"],
                ["noti", "알림 이력"],
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

            <div style={{ padding: "20px 24px" }}>
              {/* 기본 정보 탭 */}
              {activeTab === "info" && (
                <form onSubmit={handleSave}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label style={LABEL_STYLE}>이름</label>
                      <input className="form-control" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label style={LABEL_STYLE}>연락처</label>
                      <input className="form-control" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label style={LABEL_STYLE}>이메일</label>
                      <input type="email" className="form-control" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className="col-12" style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                      <button
                        type="submit"
                        disabled={saving}
                        style={{ background: "#25A194", color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                      >
                        {saving ? <><span className="spinner-border spinner-border-sm me-2" />저장 중...</> : "정보 수정 저장"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* 자녀 관리 탭 */}
              {activeTab === "children" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <i className="ri-user-heart-line" style={{ fontSize: 16, color: "#9ca3af" }} />
                      <h6 style={{ fontWeight: 600, color: "#111827", margin: 0 }}>자녀 목록</h6>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowModal(true)}
                      style={{ padding: "5px 12px", background: "#25A194", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <i className="bi bi-plus-lg" /> 자녀 추가
                    </button>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>이름</th>
                        <th style={thStyle}>학번</th>
                        <th style={thStyle}>소속 학교</th>
                        <th style={thStyle}>관계</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {children.map((c) => (
                        <tr key={c.uid}>
                          <td style={{ ...TD_STYLE, fontWeight: 600 }}>{c.name}</td>
                          <td style={TD_STYLE}>{c.code ?? "-"}</td>
                          <td style={TD_STYLE}>
                            {c.schoolName ? (
                              <span style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 500 }}>
                                {c.schoolName}
                              </span>
                            ) : (
                              <span style={{ color: "#9ca3af", fontSize: 12 }}>미배정</span>
                            )}
                          </td>
                          <td style={TD_STYLE}>
                            <span style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>
                              {c.relationship ?? "-"}
                            </span>
                          </td>
                          <td style={{ ...TD_STYLE, textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => removeChild(String(c.uid))}
                              style={{ padding: "3px 10px", background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                            >
                              연결 해제
                            </button>
                          </td>
                        </tr>
                      ))}
                      {children.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: "32px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                            연결된 자녀가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {/* 역할 승인 탭 */}
              {activeTab === "approval" && (
                <div style={{ padding: "16px 0" }}>
                  <h6 style={{ fontWeight: 600, color: "#111827", marginBottom: 12 }}>학부모 역할 승인 상태</h6>
                  {parent.roleRequestId ? (
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#f9fafb" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: rrColorCfg.bg, color: rrColorCfg.color, border: `1px solid ${rrColorCfg.border}` }}>
                          {(ROLE_REQUEST_STATUS[rrStatus] ?? { label: rrStatus }).label}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {parent.roleRequestStatus === "PENDING" && (
                          <button type="button" onClick={approveRequest} style={{ padding: "5px 12px", background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid #86efac", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            승인
                          </button>
                        )}
                        {parent.roleRequestStatus === "ACTIVE" && (
                          <button type="button" onClick={suspendRequest} style={{ padding: "5px 12px", background: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "1px solid #fcd34d", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            정지
                          </button>
                        )}
                        {parent.roleRequestStatus === "SUSPENDED" && (
                          <button type="button" onClick={approveRequest} style={{ padding: "5px 12px", background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid #86efac", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            재활성화
                          </button>
                        )}
                        {parent.roleRequestStatus === "PENDING" && (
                          <>
                            <input
                              className="form-control form-control-sm"
                              style={{ maxWidth: 220 }}
                              placeholder="거절 사유 입력"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <button type="button" onClick={rejectRequest} style={{ padding: "5px 12px", background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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

              {/* 알림 이력 탭 */}
              {activeTab === "noti" && (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
                  <i className="bi bi-bell" style={{ fontSize: 48, display: "block", marginBottom: 12 }} />
                  <p style={{ fontSize: 14 }}>알림 이력 기능은 준비 중입니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ParentAdminLayout>
  );
}
