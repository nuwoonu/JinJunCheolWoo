import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ParentAdminLayout from '@/components/layout/admin/ParentAdminLayout';
import admin from '@/api/adminApi';
import { ROLE_REQUEST_STATUS, STATUS_DEFAULT } from '@/constants/statusConfig';
import { ADMIN_ROUTES } from '@/constants/routes';

export default function ParentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [parent, setParent] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [relationship, setRelationship] = useState("OTHER");
  const [pendingStudent, setPendingStudent] = useState<any>(null);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.put(`/parents/${id}`, form);
      alert("저장되었습니다.");
      load();
    } finally {
      setSaving(false);
    }
  };

  const approveRequest = async () => {
    await admin.post(`/role-requests/${parent.roleRequestId}/approve`);
    load();
  };

  const rejectRequest = async () => {
    await admin.post(`/role-requests/${parent.roleRequestId}/reject`, { reason: rejectReason });
    setRejectReason("");
    load();
  };

  const suspendRequest = async () => {
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
      params: { keyword: searchQuery, size: 10 },
    });
    setSearchResults(r.data?.content ?? []);
  };

  const selectStudent = (student: any) => {
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

  const children: any[] = parent.children ?? [];

  return (
    <ParentAdminLayout>
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
                      className="btn btn-primary-600 radius-8"
                      onClick={searchStudents}
                    >
                      검색
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div
                      className="list-group"
                      style={{ maxHeight: 250, overflowY: "auto" }}
                    >
                      {searchResults.map((s: any) => (
                        <div
                          key={s.uid}
                          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        >
                          <span>
                            <strong>{s.name}</strong>{" "}
                            <small className="text-muted ms-2">{s.code}</small>
                          </span>
                          <button
                            className="btn btn-sm btn-outline-secondary radius-8"
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
                      className="btn btn-outline-secondary radius-8 flex-fill"
                      onClick={() => setPendingStudent(null)}
                    >
                      다시 검색
                    </button>
                    <button
                      className="btn btn-primary-600 radius-8 flex-fill"
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

      <div className="breadcrumb d-flex align-items-center gap-3 mb-24">
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
                  <span className="badge bg-neutral-100 text-neutral-600 border border-neutral-200">
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
            <div className="d-flex border-bottom border-neutral-200">
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

            {activeTab === "children" && (
              <>
                <div className="d-flex align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                  <h6 className="fw-semibold mb-0">
                    자녀 목록{" "}
                    <span className="badge bg-neutral-100 text-neutral-600 border border-neutral-200 ms-2">
                      {children.length}명
                    </span>
                  </h6>
                  <button
                    className="btn btn-sm btn-primary-600 radius-8"
                    onClick={() => setShowModal(true)}
                  >
                    <i className="bi bi-plus-lg" /> 자녀 추가
                  </button>
                </div>
                <div className="card-body p-0">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-heading-dark-mode">
                      <tr>
                        <th className="ps-4">이름</th>
                        <th>학번</th>
                        <th>학년/반</th>
                        <th className="text-end pe-4">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {children.map((c: any) => (
                        <tr key={c.uid}>
                          <td className="ps-4 fw-bold">{c.name}</td>
                          <td>{c.studentCode ?? c.code}</td>
                          <td>
                            {c.grade ? `${c.grade}학년 ${c.classNum}반` : "-"}
                          </td>
                          <td className="text-end pe-4">
                            <button
                              className="btn btn-sm btn-outline-danger"
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
                            colSpan={4}
                            className="text-center py-5 text-muted"
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
