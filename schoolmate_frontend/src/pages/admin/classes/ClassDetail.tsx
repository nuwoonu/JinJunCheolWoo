import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';

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

export default function ClassDetail() {
  const { cid } = useParams<{ cid: string }>();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<ClassDetail | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [tab, setTab] = useState<"students" | "history">("students");
  const [msg, setMsg] = useState("");
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
    await admin.put(`/classes/${cid}`, {
      grade: Number(editForm.grade),
      classNum: Number(editForm.classNum),
      status: editForm.status,
      teacherUid: editForm.teacherUid ? Number(editForm.teacherUid) : null,
    });
    setShowEdit(false);
    setMsg("수정되었습니다.");
    load();
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "정말 삭제하시겠습니까? 학생이나 교사가 배정되어 있으면 삭제되지 않습니다.",
      )
    )
      return;
    try {
      await admin.delete(`/classes/${cid}`);
      navigate(ADMIN_ROUTES.CLASSES.LIST);
    } catch (err: any) {
      setMsg(err.response?.data ?? "삭제 실패");
    }
  };

  const searchStudents = async () => {
    if (!studentSearch) return;
    if (!classroom) return;
    const res = await admin.get("/classes/students/unassigned", {
      params: {
        year: classroom.year,
        keyword: studentSearch,
      },
    });
    setSearchResults(res.data);
  };

  const addStudents = async (studentUids: number[]) => {
    const params = new URLSearchParams();
    studentUids.forEach((u) => params.append("studentUids", String(u)));
    if (randomCount > 0) params.set("randomCount", String(randomCount));
    await admin.post(`/classes/${cid}/students?${params}`);
    setSearchResults([]);
    setStudentSearch("");
    setRandomCount(0);
    load();
  };

  const removeStudent = async (studentUid: number) => {
    if (!confirm("배정을 해제할까요?")) return;
    await admin.delete(`/classes/${cid}/students/${studentUid}`);
    load();
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
        <div className="text-center py-5">
          <div className="spinner-border" />
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="breadcrumb d-flex align-items-center gap-3" style={{ marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.CLASSES.LIST)}
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
        <h6 className="fw-semibold mb-0">학급 상세 정보</h6>
      </div>
      {msg && <div className="alert alert-info mb-3">{msg}</div>}

      <div className="row gy-4">
        {/* 좌측 학급 정보 */}
        <div className="col-md-4">
          <div className="card p-4 text-center">
            <div className="d-flex gap-2 justify-content-center mb-3">
              <span className="badge bg-primary">{classroom.year}학년도</span>
              <span
                className={`badge ${classroom.status === "ACTIVE" ? "bg-success" : "bg-secondary"}`}
              >
                {classroom.statusDescription}
              </span>
            </div>
            <h4 className="fw-bold mb-4">
              {classroom.grade}학년 {classroom.classNum}반
            </h4>
            <div className="text-start">
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">담임 교사</span>
                <span className="fw-semibold">
                  {classroom.teacherName ?? "미배정"}
                </span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="text-muted small">총 학생 수</span>
                <span className="fw-semibold">{classroom.studentCount}명</span>
              </div>
            </div>
            <div className="d-grid gap-2 mt-4">
              <button
                className="btn btn-outline-primary"
                onClick={() => setShowEdit(true)}
              >
                <i className="bi bi-pencil me-1" /> 학급 정보 수정
              </button>
              <button className="btn btn-outline-danger" onClick={handleDelete}>
                <i className="bi bi-trash me-1" /> 학급 삭제
              </button>
            </div>
          </div>
        </div>

        {/* 우측 탭 */}
        <div className="col-md-8">
          <div className="card">
            <div className="d-flex" style={{ borderBottom: "1px solid #e5e7eb" }}>
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
            <div className="card-body p-4">
              {tab === "students" && (
                <>
                  <div className="d-flex gap-2 mb-3">
                    <input
                      className="form-control"
                      placeholder="학생 이름 검색"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchStudents()}
                    />
                    <button
                      className="btn btn-outline-primary"
                      onClick={searchStudents}
                    >
                      검색
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      onClick={removeSelected}
                    >
                      선택 제외
                    </button>
                    <button
                      className="btn btn-outline-success"
                      onClick={downloadRoster}
                    >
                      <i className="bi bi-download me-1" />
                      명렬표
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="border rounded mb-3 p-3">
                      <p className="text-muted small mb-2">
                        검색 결과 (클릭하여 추가)
                      </p>
                      <div className="d-flex flex-wrap gap-2">
                        {searchResults.map((s: any) => (
                          <button
                            key={s.uid}
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => addStudents([s.uid])}
                          >
                            {s.name} ({s.code})
                          </button>
                        ))}
                      </div>
                      <div className="d-flex gap-2 mt-3 align-items-center">
                        <span className="text-muted small">랜덤 배정:</span>
                        <input
                          type="number"
                          className="form-control"
                          style={{ maxWidth: 80 }}
                          min={0}
                          value={randomCount}
                          onChange={(e) =>
                            setRandomCount(Number(e.target.value))
                          }
                        />
                        <span className="text-muted small">명</span>
                        <button
                          style={{ padding: "9px 20px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
                          onClick={() => addStudents([])}
                        >
                          랜덤 배정
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={{ ...thStyle, width: 40 }}>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={
                                selected.length === classroom.students.length &&
                                !!classroom.students.length
                              }
                              onChange={(e) =>
                                setSelected(
                                  e.target.checked
                                    ? classroom.students.map((s) => s.uid)
                                    : [],
                                )
                              }
                            />
                          </th>
                          <th style={thStyle}>번호</th>
                          <th style={thStyle}>이름</th>
                          <th style={thStyle}>학번</th>
                          <th style={thStyle}>상태</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!classroom.students.length ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="text-center py-5 text-muted"
                            >
                              배정된 학생이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          classroom.students.map((s) => (
                            <tr key={s.uid}>
                              <td>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
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
                              <td>{s.attendanceNum ?? "-"}</td>
                              <td>
                                <Link
                                  to={ADMIN_ROUTES.STUDENTS.DETAIL(s.uid)}
                                  className="text-primary fw-semibold text-decoration-none"
                                >
                                  {s.name}
                                </Link>
                              </td>
                              <td className="text-muted">{s.code}</td>
                              <td>
                                <span
                                  className={`badge ${s.status === "재학" ? "bg-success-subtle text-success border border-success-subtle" : "bg-secondary-subtle text-secondary border border-secondary-subtle"}`}
                                >
                                  {s.status}
                                </span>
                              </td>
                              <td className="text-end">
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeStudent(s.uid)}
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
                  <h6 className="fw-bold mb-3">학급 관리 로그</h6>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={thStyle}>일시</th>
                          <th style={thStyle}>작업</th>
                          <th style={thStyle}>내용</th>
                          <th style={thStyle}>작업자</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!classroom.histories?.length ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center py-5 text-muted"
                            >
                              이력이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          classroom.histories.map((h, i) => (
                            <tr key={i}>
                              <td className="small text-muted">
                                {h.createdAt}
                              </td>
                              <td>
                                <span style={{ background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 10px", fontSize: 12 }}>
                                  {h.actionType}
                                </span>
                              </td>
                              <td className="small">{h.description}</td>
                              <td>{h.createdBy}</td>
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
                학급 정보 수정
              </h6>
              <button
                onClick={() => setShowEdit(false)}
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
            <form onSubmit={handleUpdate}>
              <div style={{ padding: "20px" }}>
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold">학년</label>
                    <select
                      className="form-select"
                      value={editForm.grade}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, grade: e.target.value }))
                      }
                    >
                      <option value="1">1학년</option>
                      <option value="2">2학년</option>
                      <option value="3">3학년</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">반</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editForm.classNum}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, classNum: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">운영 상태</label>
                    <select
                      className="form-select"
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, status: e.target.value }))
                      }
                    >
                      <option value="ACTIVE">운영</option>
                      <option value="FINISHED">종료</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">담임 교사</label>
                    <select
                      className="form-select"
                      value={editForm.teacherUid}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          teacherUid: e.target.value,
                        }))
                      }
                    >
                      <option value="">미배정</option>
                      {availableTeachers.map((t) => (
                        <option key={t.uid} value={t.uid}>
                          {t.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  padding: "12px 20px",
                  borderTop: "1px solid var(--border-color)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowEdit(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 20px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
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
