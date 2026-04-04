import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/admin/AdminLayout";
import admin from "@/shared/api/adminApi";
import { STUDENT_STATUS, ROLE_REQUEST_STATUS, STATUS_DEFAULT } from "@/shared/constants/statusConfig";
import { ADMIN_ROUTES } from "@/shared/constants/routes";
import { useAdminMsg, apiErrMsg } from "@/shared/hooks/useAdminMsg";

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

export default function StudentDetail() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState<any>({});
  const [parentSearch, setParentSearch] = useState("");
  const [parentResults, setParentResults] = useState<any[]>([]);
  const [showParentModal, setShowParentModal] = useState(false);
  const [relationship, setRelationship] = useState("OTHER");
  const { msg, error, setMsg, setError } = useAdminMsg();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [behaviorForm, setBehaviorForm] = useState({
    year: "FIRST",
    semester: "FIRST",
    basicHabits: "",
    specialNotes: "",
  });
  const [savingBehavior, setSavingBehavior] = useState(false);

  const load = () => {
    setLoadError(null);
    admin
      .get(`/students/${uid}`)
      .then((r) => {
        setStudent(r.data);
        setForm(r.data);
      })
      .catch((e) => setLoadError(`[${e.response?.status ?? "ERR"}] ${e.response?.data?.message ?? e.message}`));
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
    } catch (err: any) {
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
    await admin.post(`/role-requests/${student.roleRequestId}/approve`);
    load();
  };

  const rejectRequest = async () => {
    await admin.post(`/role-requests/${student.roleRequestId}/reject`, { reason: rejectReason });
    setRejectReason("");
    load();
  };

  const suspendRequest = async () => {
    if (!confirm("역할을 정지하시겠습니까?")) return;
    await admin.post(`/role-requests/${student.roleRequestId}/suspend`);
    load();
  };

  const saveBehavior = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBehavior(true);
    try {
      await admin.put(`/behavior-records/student/${student.id}`, behaviorForm);
      setMsg("행동 특성이 저장되었습니다.");
      load();
    } catch (err: any) {
      setMsg(`저장 실패: ${err.response?.data ?? err.message}`);
    } finally {
      setSavingBehavior(false);
    }
  };

  const handleBehaviorYearSemesterChange = (year: string, semester: string) => {
    const existing = (student.behaviorRecords ?? []).find((r: any) => r.year === year && r.semester === semester);
    setBehaviorForm({
      year,
      semester,
      basicHabits: existing?.basicHabits ?? "",
      specialNotes: existing?.specialNotes ?? "",
    });
  };

  if (!student)
    return (
      <AdminLayout>
        <div className="text-center py-5">
          {loadError ? (
            <div className="alert alert-danger d-inline-block">{loadError}</div>
          ) : (
            <div className="spinner-border" />
          )}
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout msg={msg} error={error}>
      <div className="breadcrumb d-flex align-items-center gap-3" style={{ marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.STUDENTS.LIST)}
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
        <h6 className="fw-semibold mb-0">학생 상세 정보</h6>
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body text-center" style={{ padding: "24px 20px" }}>
              {/* 프로필 아이콘 */}
              <div
                className="rounded-circle mx-auto d-flex align-items-center justify-content-center"
                style={{ width: 80, height: 80, background: "rgba(37,161,148,0.12)", marginBottom: 12 }}
              >
                <span style={{ fontSize: 32, color: "#25A194", fontWeight: 700 }}>{student.name?.[0]}</span>
              </div>
              <h5 className="fw-bold text-primary-light mb-4">{student.name}</h5>
              <p className="text-secondary-light mb-0" style={{ fontSize: 13, marginBottom: 12 }}>
                학번 {student.code ?? "-"}
              </p>
              {/* 상태 뱃지 */}
              {(() => {
                const cfg = STUDENT_STATUS[student.statusName] ?? STATUS_DEFAULT;
                return (
                  <span className={`badge px-12 py-6 ${cfg.badge}`} style={{ fontSize: 12 }}>
                    {student.statusDescription || cfg.label}
                  </span>
                );
              })()}
            </div>
            {/* 구분선 */}
            <div style={{ borderTop: "1px solid #e5e7eb" }} />
            {/* 추가 정보 */}
            <div style={{ padding: "16px 20px" }}>
              <div className="d-flex align-items-start gap-10 mb-12">
                <i className="ri-mail-line text-neutral-400 mt-1" style={{ fontSize: 15 }} />
                <div className="min-w-0">
                  <p className="text-neutral-400 mb-2" style={{ fontSize: 11 }}>
                    계정 이메일
                  </p>
                  <p className="text-primary-light fw-medium mb-0" style={{ fontSize: 13, wordBreak: "break-all" }}>
                    {student.email}
                  </p>
                </div>
              </div>
              {student.assignments?.length > 0 && (
                <div className="d-flex align-items-start gap-10">
                  <i className="ri-building-2-line text-neutral-400 mt-1" style={{ fontSize: 15 }} />
                  <div>
                    <p className="text-neutral-400 mb-2" style={{ fontSize: 11 }}>
                      최근 소속
                    </p>
                    <p className="text-primary-light fw-medium mb-0" style={{ fontSize: 13 }}>
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

        <div className="col-md-8">
          <div className="card">
            <div className="d-flex" style={{ borderBottom: "1px solid #e5e7eb" }}>
              {[
                ["basic", "기본 정보"],
                ["history", "학적 이력"],
                ["parent", "보호자 관리"],
                ["behavior", "행동 특성"],
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
                    color: tab === key ? "#25A194" : "var(--text-secondary-light)",
                    fontWeight: tab === key ? 600 : 400,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="card-body px-24 py-20">
              {tab === "basic" && (
                <form onSubmit={saveBasic}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">이름</label>
                      <input
                        className="form-control"
                        required
                        value={form.name ?? ""}
                        onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">학번</label>
                      <input
                        className="form-control"
                        required
                        value={form.code ?? ""}
                        onChange={(e) => setForm((f: any) => ({ ...f, code: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">학적 상태</label>
                      <select
                        className="form-select"
                        value={form.statusName ?? ""}
                        onChange={(e) =>
                          setForm((f: any) => ({
                            ...f,
                            statusName: e.target.value,
                          }))
                        }
                      >
                        {Object.entries(STUDENT_STATUS).map(([value, cfg]) => (
                          <option key={value} value={value}>
                            {cfg.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 text-end mt-4">
                      <button
                        type="submit"
                        style={{
                          padding: "9px 20px",
                          background: "linear-gradient(135deg, #25A194, #1a7a6e)",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        정보 수정 저장
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {tab === "history" && (
                <>
                  <div className="d-flex align-items-center gap-8 mb-16">
                    <i className="ri-history-line text-neutral-400" style={{ fontSize: 16 }} />
                    <h6 className="fw-semibold text-primary-light mb-0">학년도별 학급 배정 이력</h6>
                  </div>
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th style={TH_STYLE}>학년도</th>
                        <th style={TH_STYLE}>소속 (학년-반-번호)</th>
                        <th style={{ ...TH_STYLE, textAlign: "right" }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(student.assignments ?? []).map((a: any) => (
                        <tr key={a.schoolYear}>
                          <td className="fw-bold">{a.schoolYear}학년도</td>
                          <td>
                            {a.grade}학년 {a.classNum}반 {a.attendanceNum}번
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteAssignment(a.schoolYear)}
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!student.assignments?.length && (
                        <tr>
                          <td colSpan={3} className="text-center py-4 text-muted">
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
                  <div className="d-flex justify-content-between align-items-center mb-16">
                    <div className="d-flex align-items-center gap-8">
                      <i className="ri-user-heart-line text-neutral-400" style={{ fontSize: 16 }} />
                      <h6 className="fw-semibold text-primary-light mb-0">연동된 보호자 목록</h6>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowParentModal(true)}>
                      <i className="bi bi-plus-lg" /> 보호자 추가
                    </button>
                  </div>
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th style={TH_STYLE}>보호자명</th>
                        <th style={TH_STYLE}>연락처</th>
                        <th style={TH_STYLE}>관계</th>
                        <th style={{ ...TH_STYLE, textAlign: "right" }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(student.guardians ?? []).map((g: any) => (
                        <tr key={g.parentId}>
                          <td className="fw-bold">{g.name}</td>
                          <td>{g.phone}</td>
                          <td>
                            <span
                              style={{
                                background: "#f3f4f6",
                                color: "#6b7280",
                                border: "1px solid #e5e7eb",
                                borderRadius: 6,
                                padding: "2px 10px",
                                fontSize: 12,
                              }}
                            >
                              {g.relationship}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeGuardian(g.parentId)}
                            >
                              해제
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!student.guardians?.length && (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-muted">
                            연동된 보호자가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {tab === "behavior" && (
                <>
                  <div className="d-flex align-items-center gap-8 mb-16">
                    <i className="ri-mental-health-line text-neutral-400" style={{ fontSize: 16 }} />
                    <h6 className="fw-semibold text-primary-light mb-0">행동 특성 및 종합의견</h6>
                  </div>

                  {/* 기존 기록 목록 */}
                  {(student.behaviorRecords ?? []).length > 0 && (
                    <div className="mb-20">
                      <p className="text-secondary-light fw-medium mb-8" style={{ fontSize: 13 }}>
                        등록된 기록
                      </p>
                      <div className="d-flex flex-column gap-8">
                        {(student.behaviorRecords as any[]).map((r: any) => {
                          const yearLabel: Record<string, string> = { FIRST: "1학년", SECOND: "2학년", THIRD: "3학년" };
                          const semLabel: Record<string, string> = { FIRST: "1학기", FALL: "2학기" };
                          return (
                            <div
                              key={r.id}
                              className="border rounded p-12"
                              style={{ background: "var(--neutral-50, #f9fafb)", cursor: "pointer" }}
                              onClick={() =>
                                setBehaviorForm({
                                  year: r.year,
                                  semester: r.semester,
                                  basicHabits: r.basicHabits ?? "",
                                  specialNotes: r.specialNotes ?? "",
                                })
                              }
                            >
                              <p className="fw-semibold mb-4" style={{ fontSize: 13 }}>
                                {yearLabel[r.year] ?? r.year} {semLabel[r.semester] ?? r.semester}
                              </p>
                              <p className="text-secondary-light mb-2" style={{ fontSize: 12 }}>
                                기초 생활: {r.basicHabits || "-"}
                              </p>
                              <p className="text-secondary-light mb-0" style={{ fontSize: 12 }}>
                                특기사항: {r.specialNotes || "-"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 등록/수정 폼 */}
                  <form onSubmit={saveBehavior}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">학년</label>
                        <select
                          className="form-select"
                          value={behaviorForm.year}
                          onChange={(e) => handleBehaviorYearSemesterChange(e.target.value, behaviorForm.semester)}
                        >
                          <option value="FIRST">1학년</option>
                          <option value="SECOND">2학년</option>
                          <option value="THIRD">3학년</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">학기</label>
                        <select
                          className="form-select"
                          value={behaviorForm.semester}
                          onChange={(e) => handleBehaviorYearSemesterChange(behaviorForm.year, e.target.value)}
                        >
                          <option value="FIRST">1학기</option>
                          <option value="FALL">2학기</option>
                        </select>
                      </div>
                      <div className="col-md-12">
                        <label className="form-label fw-semibold">기초 생활 기록</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={behaviorForm.basicHabits}
                          onChange={(e) => setBehaviorForm((f) => ({ ...f, basicHabits: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-12">
                        <label className="form-label fw-semibold">특기사항</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={behaviorForm.specialNotes}
                          onChange={(e) => setBehaviorForm((f) => ({ ...f, specialNotes: e.target.value }))}
                        />
                      </div>
                      <div className="col-12 text-end mt-4">
                        <button
                          type="submit"
                          disabled={savingBehavior}
                          style={{
                            padding: "9px 20px",
                            background: "linear-gradient(135deg, #25A194, #1a7a6e)",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          {savingBehavior ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              )}

              {tab === "approval" && (
                <div className="p-4">
                  <h6 className="fw-semibold mb-3">학생 역할 승인 상태</h6>
                  {student.roleRequestId ? (
                    <div className="border rounded p-3" style={{ background: "var(--neutral-50, #f9fafb)" }}>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <span
                          className={`badge ${(ROLE_REQUEST_STATUS[student.roleRequestStatus] ?? STATUS_DEFAULT).badge}`}
                        >
                          {
                            (ROLE_REQUEST_STATUS[student.roleRequestStatus] ?? { label: student.roleRequestStatus })
                              .label
                          }
                        </span>
                      </div>
                      <div className="d-flex gap-2 flex-wrap align-items-center">
                        {student.roleRequestStatus === "PENDING" && (
                          <button className="btn btn-sm btn-success" onClick={approveRequest}>
                            승인
                          </button>
                        )}
                        {student.roleRequestStatus === "ACTIVE" && (
                          <button className="btn btn-sm btn-warning" onClick={suspendRequest}>
                            정지
                          </button>
                        )}
                        {student.roleRequestStatus === "SUSPENDED" && (
                          <button className="btn btn-sm btn-success" onClick={approveRequest}>
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
                            <button className="btn btn-sm btn-outline-danger" onClick={rejectRequest}>
                              거절
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted">역할 신청 내역이 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showParentModal && (
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
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>보호자 검색</h6>
              <button
                onClick={() => setShowParentModal(false)}
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
              <div className="input-group mb-3">
                <input
                  className="form-control"
                  placeholder="보호자 이름 입력"
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  onKeyUp={(e) => e.key === "Enter" && searchParents()}
                />
                <button
                  style={{
                    padding: "9px 20px",
                    background: "linear-gradient(135deg, #25A194, #1a7a6e)",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                  onClick={searchParents}
                >
                  검색
                </button>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">관계</label>
                <select className="form-select" value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                  <option value="FATHER">부</option>
                  <option value="MOTHER">모</option>
                  <option value="GRANDFATHER">조부</option>
                  <option value="GRANDMOTHER">조모</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>
              <div className="list-group" style={{ maxHeight: 260, overflowY: "auto" }}>
                {parentResults.map((p: any) => (
                  <button
                    key={p.id ?? p.uid}
                    type="button"
                    className="list-group-item list-group-item-action"
                    onClick={() => addGuardian(p.id ?? p.uid)}
                  >
                    {p.name} ({p.email})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
