import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from '@/shared/components/layout/admin/AdminLayout';
import admin from '@/shared/api/adminApi';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import { useAdminMsg, apiErrMsg } from '@/shared/hooks/useAdminMsg';

// [joon] 학급 상세

interface Student {
  uid: number;
  name: string;
  code: string;
  attendanceNum: number;
  status: string;
}
interface History {
  createdAt: string;
  actionType: string;
  description: string;
  createdBy: string;
}
interface ClassDetail {
  cid: number;
  year: number;
  grade: number;
  classNum: number;
  teacherName: string;
  teacherUid: number;
  studentCount: number;
  status: string;
  statusDescription: string;
  students: Student[];
  histories: History[];
}
interface Teacher {
  uid: number;
  displayName: string;
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

export default function ClassDetail() {
  const { cid } = useParams<{ cid: string }>();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<ClassDetail | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [tab, setTab] = useState<"students" | "history">("students");
  const { msg, error, setMsg, setError } = useAdminMsg();
  const [selected, setSelected] = useState<number[]>([]);
  const [editForm, setEditForm] = useState({
    grade: "1",
    classNum: "",
    status: "ACTIVE",
    teacherUid: "",
  });
  const [showEdit, setShowEdit] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [randomCount, setRandomCount] = useState(0);

  const load = () => {
    admin.get(`/classes/${cid}`).then((r) => {
      const d = r.data;
      setClassroom(d);
      setEditForm({
        grade: String(d.grade),
        classNum: String(d.classNum),
        status: d.status,
        teacherUid: String(d.teacherUid ?? ""),
      });
      admin
        .get(`/classes/${cid}/teachers/available?year=${d.year}`)
        .then((res) => setAvailableTeachers(res.data));
    });
  };

  useEffect(() => {
    load();
  }, [cid]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await admin.put(`/classes/${cid}`, {
        grade: Number(editForm.grade),
        classNum: Number(editForm.classNum),
        status: editForm.status,
        teacherUid: editForm.teacherUid ? Number(editForm.teacherUid) : null,
      });
      setShowEdit(false);
      setMsg("수정되었습니다.");
      load();
    } catch (err: any) {
      setError(apiErrMsg(err, "수정에 실패했습니다."));
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까? 학생이나 교사가 배정되어 있으면 삭제되지 않습니다.")) return;
    try {
      await admin.delete(`/classes/${cid}`);
      navigate(ADMIN_ROUTES.CLASSES.LIST);
    } catch (err: any) {
      setError(apiErrMsg(err, "삭제에 실패했습니다."));
    }
  };

  const searchStudents = async () => {
    if (!studentSearch || !classroom) return;
    const res = await admin.get("/classes/students/unassigned", {
      params: { year: classroom.year, keyword: studentSearch },
    });
    setSearchResults(res.data);
  };

  const addStudents = async (studentUids: number[]) => {
    const params = new URLSearchParams();
    studentUids.forEach((u) => params.append("studentUids", String(u)));
    if (randomCount > 0) params.set("randomCount", String(randomCount));
    try {
      await admin.post(`/classes/${cid}/students?${params}`);
      setSearchResults([]);
      setStudentSearch("");
      setRandomCount(0);
      load();
    } catch (err: any) {
      setError(apiErrMsg(err, "학생 배정에 실패했습니다."));
    }
  };

  const removeStudent = async (studentUid: number) => {
    if (!confirm("배정을 해제할까요?")) return;
    try {
      await admin.delete(`/classes/${cid}/students/${studentUid}`);
      load();
    } catch (err: any) {
      setError(apiErrMsg(err, "배정 해제에 실패했습니다."));
    }
  };

  const removeSelected = async () => {
    if (!selected.length) return alert("선택하세요.");
    if (!confirm(`${selected.length}명의 배정을 해제할까요?`)) return;
    const params = new URLSearchParams();
    selected.forEach((u) => params.append("studentUids", String(u)));
    await admin.post(`/classes/${cid}/students/remove-bulk?${params}`);
    setSelected([]);
    load();
  };

  const downloadRoster = () => {
    window.open(`/api/admin/classes/${cid}/roster-csv`, "_blank");
  };

  if (!classroom)
    return (
      <AdminLayout>
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div className="spinner-border" />
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout msg={msg} error={error}>
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>학급 상세 정보</h6>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>학급 정보를 확인하고 수정합니다.</p>
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.CLASSES.LIST)}
          style={{ marginTop: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#6b7280", fontSize: 13 }}
        >
          ← 목록으로
        </button>
      </div>

      <div className="row gy-4">
        {/* 좌측 학급 정보 카드 */}
        <div className="col-md-4">
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: 24, textAlign: "center" }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(37,161,148,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <i className="ri-group-line" style={{ fontSize: 40, color: "#25A194" }} />
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 8 }}>
                <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(37,161,148,0.12)", color: "#25A194" }}>
                  {classroom.year}학년도
                </span>
                <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: classroom.status === "ACTIVE" ? "rgba(22,163,74,0.1)" : "#f3f4f6", color: classroom.status === "ACTIVE" ? "#16a34a" : "#6b7280" }}>
                  {classroom.statusDescription}
                </span>
              </div>
              <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 16 }}>
                {classroom.grade}학년 {classroom.classNum}반
              </h5>
              <hr style={{ margin: '20px 0', borderColor: '#f3f4f6' }} />
              <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>담임 교사</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    {classroom.teacherName ?? "미배정"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>총 학생 수</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{classroom.studentCount}명</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  style={{ padding: "7px 12px", background: "#fff", border: "1px solid #25A194", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#25A194", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <i className="ri-edit-line" /> 학급 정보 수정
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{ padding: "7px 12px", background: "#fff", border: "1px solid #ef4444", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <i className="ri-delete-bin-line" /> 학급 삭제
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 우측 탭 카드 */}
        <div className="col-md-8">
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
              {(
                [
                  ["students", "학생 명단"],
                  ["history", "변경 이력"],
                ] as const
              ).map(([key, label]) => (
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
              {tab === "students" && (
                <>
                  {/* 학생 검색 */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input
                      className="form-control"
                      placeholder="학생 이름 검색"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchStudents()}
                    />
                    <button
                      type="button"
                      onClick={searchStudents}
                      style={{ padding: "5px 12px", background: "#25A194", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      검색
                    </button>
                    <button
                      type="button"
                      onClick={removeSelected}
                      style={{ padding: "5px 12px", background: "#fff", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      선택 제외
                    </button>
                    <button
                      type="button"
                      onClick={downloadRoster}
                      style={{ padding: "5px 12px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <i className="ri-download-line" /> 명렬표
                    </button>
                  </div>

                  {/* 검색 결과 */}
                  {searchResults.length > 0 && (
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                      <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>검색 결과 (클릭하여 추가)</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {searchResults.map((s: any) => (
                          <button
                            key={s.uid}
                            type="button"
                            onClick={() => addStudents([s.uid])}
                            style={{ padding: "4px 12px", background: "#fff", border: "1px solid #25A194", borderRadius: 6, fontSize: 13, fontWeight: 500, color: "#25A194", cursor: "pointer" }}
                          >
                            {s.name} ({s.code})
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#9ca3af" }}>랜덤 배정:</span>
                        <input
                          type="number"
                          className="form-control"
                          style={{ maxWidth: 80 }}
                          min={0}
                          value={randomCount}
                          onChange={(e) => setRandomCount(Number(e.target.value))}
                        />
                        <span style={{ fontSize: 13, color: "#9ca3af" }}>명</span>
                        <button
                          type="button"
                          onClick={() => addStudents([])}
                          style={{ padding: "5px 12px", background: "#25A194", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >
                          랜덤 배정
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 학생 테이블 */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ ...TH_STYLE, width: 40 }}>
                            <input
                              type="checkbox"
                              style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#25A194" }}
                              checked={selected.length === classroom.students.length && !!classroom.students.length}
                              onChange={(e) =>
                                setSelected(e.target.checked ? classroom.students.map((s) => s.uid) : [])
                              }
                            />
                          </th>
                          <th style={TH_STYLE}>번호</th>
                          <th style={TH_STYLE}>이름</th>
                          <th style={TH_STYLE}>학번</th>
                          <th style={TH_STYLE}>상태</th>
                          <th style={{ ...TH_STYLE, textAlign: "right" }}>관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!classroom.students.length ? (
                          <tr>
                            <td colSpan={6} style={{ padding: "32px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                              배정된 학생이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          classroom.students.map((s) => (
                            <tr key={s.uid}>
                              <td style={TD_STYLE}>
                                <input
                                  type="checkbox"
                                  style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#25A194" }}
                                  checked={selected.includes(s.uid)}
                                  onChange={() =>
                                    setSelected((prev) =>
                                      prev.includes(s.uid)
                                        ? prev.filter((x) => x !== s.uid)
                                        : [...prev, s.uid],
                                    )
                                  }
                                />
                              </td>
                              <td style={TD_STYLE}>{s.attendanceNum ?? "-"}</td>
                              <td style={TD_STYLE}>
                                <Link
                                  to={ADMIN_ROUTES.STUDENTS.DETAIL(s.uid)}
                                  style={{ color: "#1d4ed8", fontWeight: 600, textDecoration: "none" }}
                                >
                                  {s.name}
                                </Link>
                              </td>
                              <td style={{ ...TD_STYLE, color: "#9ca3af" }}>{s.code}</td>
                              <td style={TD_STYLE}>
                                <span style={{
                                  padding: "2px 10px",
                                  borderRadius: 20,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: s.status === "재학" ? "rgba(22,163,74,0.1)" : "#f3f4f6",
                                  color: s.status === "재학" ? "#16a34a" : "#6b7280",
                                }}>
                                  {s.status}
                                </span>
                              </td>
                              <td style={{ ...TD_STYLE, textAlign: "right" }}>
                                <button
                                  type="button"
                                  onClick={() => removeStudent(s.uid)}
                                  style={{ padding: "3px 10px", background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                                >
                                  제외
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === "history" && (
                <>
                  <h6 style={{ fontWeight: 600, color: "#111827", marginBottom: 12 }}>학급 관리 로그</h6>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={TH_STYLE}>일시</th>
                          <th style={TH_STYLE}>작업</th>
                          <th style={TH_STYLE}>내용</th>
                          <th style={TH_STYLE}>작업자</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!classroom.histories?.length ? (
                          <tr>
                            <td colSpan={4} style={{ padding: "32px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                              이력이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          classroom.histories.map((h, i) => (
                            <tr key={i}>
                              <td style={{ ...TD_STYLE, color: "#9ca3af", fontSize: 12 }}>{h.createdAt}</td>
                              <td style={TD_STYLE}>
                                <span style={{ background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 10px", fontSize: 12 }}>
                                  {h.actionType}
                                </span>
                              </td>
                              <td style={{ ...TD_STYLE, fontSize: 12 }}>{h.description}</td>
                              <td style={TD_STYLE}>{h.createdBy}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 수정 모달 */}
      {showEdit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 480, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>학급 정보 수정</h6>
              <button
                onClick={() => setShowEdit(false)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div style={{ padding: 20 }}>
                <div className="row g-3">
                  <div className="col-6">
                    <label style={LABEL_STYLE}>학년</label>
                    <select
                      className="form-select"
                      value={editForm.grade}
                      onChange={(e) => setEditForm((f) => ({ ...f, grade: e.target.value }))}
                    >
                      <option value="1">1학년</option>
                      <option value="2">2학년</option>
                      <option value="3">3학년</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label style={LABEL_STYLE}>반</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editForm.classNum}
                      onChange={(e) => setEditForm((f) => ({ ...f, classNum: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label style={LABEL_STYLE}>운영 상태</label>
                    <select
                      className="form-select"
                      value={editForm.status}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    >
                      <option value="ACTIVE">운영</option>
                      <option value="FINISHED">종료</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label style={LABEL_STYLE}>담임 교사</label>
                    <select
                      className="form-select"
                      value={editForm.teacherUid}
                      onChange={(e) => setEditForm((f) => ({ ...f, teacherUid: e.target.value }))}
                    >
                      <option value="">미배정</option>
                      {availableTeachers.map((t) => (
                        <option key={t.uid} value={t.uid}>{t.displayName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: "1px solid #e5e7eb" }}>
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, padding: "5px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ background: "#25A194", color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  수정 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
