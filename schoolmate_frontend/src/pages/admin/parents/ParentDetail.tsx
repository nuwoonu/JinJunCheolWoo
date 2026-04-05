import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ParentAdminLayout from '@/components/layout/admin/ParentAdminLayout';
import admin from '@/api/adminApi';
import { ROLE_REQUEST_STATUS, STATUS_DEFAULT } from '@/constants/statusConfig';
import { ADMIN_ROUTES } from '@/constants/routes';
import { useAdminMsg, apiErrMsg } from '@/hooks/useAdminMsg';

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
        <div className="text-center py-5">
          <div className="spinner-border" />
        </div>
      </ParentAdminLayout>
    );

  const children: ParentChild[] = parent.children ?? [];

  return (
    <ParentAdminLayout msg={msg} error={error}>
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "var(--white)",
              borderRadius: 12,
              width: "100%",
              maxWidth: 480,
              margin: "0 16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                자녀 추가
              </h6>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSearchResults([]);
                  setPendingStudent(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "var(--text-secondary-light)",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "20px" }}>
              {!pendingStudent ? (
                <>
                  <div className="input-group mb-3">
                    <input
                      className="form-control"
                      placeholder="학생 이름 또는 학번 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchStudents()}
                    />
                    <button
                      style={{ padding: "9px 20px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
                      onClick={searchStudents}
                    >
                      검색
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div style={{ maxHeight: 250, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                      {searchResults.map((s) => (
                        <div
                          key={s.uid}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}
                        >
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
                  <p className="mb-3">
                    선택한 학생: <strong>{pendingStudent.name}</strong> (
                    {pendingStudent.code})
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">관계 선택</label>
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
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-secondary flex-fill"
                      onClick={() => setPendingStudent(null)}
                    >
                      다시 검색
                    </button>
                    <button
                      style={{ padding: "9px 20px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", flex: 1 }}
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

      <div className="breadcrumb d-flex align-items-center gap-3" style={{ marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.PARENTS.LIST)}
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
        <h6 className="fw-semibold mb-0">학부모 상세 정보</h6>
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
                <span className="text-success fw-bold" style={{ fontSize: 36 }}>
                  {parent.name?.[0] ?? "?"}
                </span>
              </div>
              <h5 className="mb-1 fw-bold">{parent.name}</h5>
              <p className="text-muted small mb-2">{parent.email}</p>
              {(() => {
                const cfg = ROLE_REQUEST_STATUS[parent.roleRequestStatus] ?? STATUS_DEFAULT;
                return (
                  <button
                    type="button"
                    className={`btn ${cfg.btn} w-100 rounded-pill mb-3`}
                    style={{ pointerEvents: "none" }}
                  >
                    {cfg.label || "미신청"}
                  </button>
                );
              })()}
              <hr />
              <div className="text-start px-2">
                <div className="mb-2">
                  <small className="text-muted d-block">연락처</small>
                  <span className="fw-semibold">{parent.phone ?? "-"}</span>
                </div>
                <div>
                  <small className="text-muted d-block">자녀 수</small>
                  <span style={{ background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 }}>
                    {children.length}명
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 우측 탭 카드 */}
        <div className="col-md-8">
          <div className="card">
            <div className="d-flex" style={{ borderBottom: "1px solid #e5e7eb" }}>
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
                  </div>
                </div>
                <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", textAlign: "right" }}>
                  <button
                    type="submit"
                    style={{ padding: "9px 20px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
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

            {activeTab === "children" && (
              <>
                <div className="d-flex align-items-center justify-content-between" style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
                  <h6 className="fw-semibold mb-0">
                    자녀 목록{" "}
                    <span style={{ background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500, marginLeft: 8 }}>
                      {children.length}명
                    </span>
                  </h6>
                  <button
                    className="btn btn-sm"
                    style={{ padding: "9px 20px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
                    onClick={() => setShowModal(true)}
                  >
                    <i className="bi bi-plus-lg" /> 자녀 추가
                  </button>
                </div>
                <div className="card-body p-0">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, paddingLeft: 24 }}>이름</th>
                        <th style={thStyle}>학번</th>
                        <th style={thStyle}>소속 학교</th>
                        <th style={thStyle}>관계</th>
                        <th style={{ ...thStyle, textAlign: "right", paddingRight: 24 }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {children.map((c) => (
                        <tr key={c.uid}>
                          <td style={{ padding: "12px 16px", paddingLeft: 24, fontWeight: 600 }}>{c.name}</td>
                          <td style={{ padding: "12px 16px" }}>{c.code ?? "-"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            {c.schoolName ? (
                              <span style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 500 }}>
                                {c.schoolName}
                              </span>
                            ) : (
                              <span style={{ color: "#9ca3af", fontSize: 12 }}>미배정</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>
                              {c.relationship ?? "-"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right", paddingRight: 24 }}>
                            <button
                              style={{ padding: "4px 12px", background: "#fff", border: "1px solid #ef4444", borderRadius: 6, fontSize: 13, color: "#ef4444", cursor: "pointer" }}
                              onClick={() => removeChild(c.uid)}
                            >
                              연결 해제
                            </button>
                          </td>
                        </tr>
                      ))}
                      {children.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 14 }}
                          >
                            연결된 자녀가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === "approval" && (
              <div className="card-body p-4">
                <h6 className="fw-semibold mb-3">학부모 역할 승인 상태</h6>
                {parent.roleRequestId ? (
                  <div className="border rounded p-3" style={{ background: "var(--neutral-50, #f9fafb)" }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span className={`badge ${(ROLE_REQUEST_STATUS[parent.roleRequestStatus] ?? STATUS_DEFAULT).badge}`}>
                        {(ROLE_REQUEST_STATUS[parent.roleRequestStatus] ?? { label: parent.roleRequestStatus }).label}
                      </span>
                    </div>
                    <div className="d-flex gap-2 flex-wrap align-items-center">
                      {parent.roleRequestStatus === 'PENDING' && (
                        <button className="btn btn-sm btn-success" onClick={approveRequest}>승인</button>
                      )}
                      {parent.roleRequestStatus === 'ACTIVE' && (
                        <button className="btn btn-sm btn-warning" onClick={suspendRequest}>정지</button>
                      )}
                      {parent.roleRequestStatus === 'SUSPENDED' && (
                        <button className="btn btn-sm btn-success" onClick={approveRequest}>재활성화</button>
                      )}
                      {parent.roleRequestStatus === 'PENDING' && (
                        <>
                          <input
                            className="form-control form-control-sm"
                            style={{ maxWidth: 220 }}
                            placeholder="거절 사유 입력"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <button className="btn btn-sm btn-outline-danger" onClick={rejectRequest}>거절</button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted">역할 신청 내역이 없습니다.</p>
                )}
              </div>
            )}

            {activeTab === "noti" && (
              <div className="card-body text-center py-5 text-muted">
                <i className="bi bi-bell display-4 d-block mb-3" />
                <p>알림 이력 기능은 준비 중입니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ParentAdminLayout>
  );
}
