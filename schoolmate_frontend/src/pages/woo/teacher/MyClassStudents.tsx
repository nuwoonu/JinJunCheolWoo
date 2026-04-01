import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo] /teacher/myclass/students - 학생 관리 페이지

interface Student {
  studentId: number;
  name: string;
  studentNumber: number;
  phone?: string;
  email?: string;
}

interface ClassInfo {
  year: number;
  grade: number;
  classNum: number;
  homeroomTeacherName?: string;
  totalStudents: number;
  students: Student[];
}

// [woo] 승인대기 학생 인터페이스
interface PendingStudent {
  studentInfoId: number;
  name: string;
  email: string;
  phone: string;
  status: string;
}

const EMPTY_ADD_FORM = {
  name: "",
  email: "",
  password: "",
  phone: "",
  gender: "MALE",
  studentNumber: "",
  birthDate: "",
};

export default function TeacherMyClassStudents() {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);

  // [woo] 승인대기 학생 상태
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  // [woo] 배정 모달 상태
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState<PendingStudent | null>(null);
  const [assignNum, setAssignNum] = useState("");
  // [woo] 반번호 수정 상태
  const [editingNum, setEditingNum] = useState<string>("");
  const [editSaving, setEditSaving] = useState(false);

  // [woo] 학급 정보 조회
  const fetchClassInfo = () => {
    api
      .get("/teacher/myclass")
      .then((res) => {
        const data = res.data;
        if (data.hasClassroom === false) {
          setErrorMessage(data.message ?? "담당 학급이 없습니다.");
        } else {
          setClassInfo(data);
        }
      })
      .catch(() => setErrorMessage("학급 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  // [woo] 승인대기 학생 조회
  const fetchPendingStudents = () => {
    api
      .get("/teacher/myclass/pending-students")
      .then((res) => setPendingStudents(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchClassInfo();
    fetchPendingStudents();
  }, []);

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    const open = showAssignModal || showAddModal || !!selectedStudent;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAssignModal, showAddModal, selectedStudent]);

  const filtered =
    classInfo?.students.filter((s) => s.name.includes(search) || String(s.studentNumber).includes(search)) ?? [];

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddForm((f) => ({ ...f, [field]: e.target.value }));

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 3 && digits.length <= 7) formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    else if (digits.length > 7) formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    setAddForm((f) => ({ ...f, phone: formatted }));
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classInfo) return;
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim() || !addForm.studentNumber) {
      // [woo] 학생 추가 필수값 미입력 시 에러 메시지
      setAddError("이름, 이메일, 비밀번호, 반번호는 필수입니다.");
      return;
    }
    setAddSaving(true);
    setAddError(null);
    try {
      await api.post("/students", {
        name: addForm.name,
        email: addForm.email,
        password: addForm.password,
        phone: addForm.phone || null,
        gender: addForm.gender,
        studentNumber: Number(addForm.studentNumber),
        birthDate: addForm.birthDate || null,
        // [woo] 본인 학급만 - grade/classNum 고정
        grade: classInfo.grade,
        classNum: classInfo.classNum,
      });
      // [woo] 목록 갱신
      fetchClassInfo();
      setShowAddModal(false);
      setAddForm(EMPTY_ADD_FORM);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAddError(msg ?? "학생 추가에 실패했습니다.");
    } finally {
      setAddSaving(false);
    }
  };

  // [woo] 반번호 수정 요청
  const handleUpdateStudentNumber = async () => {
    if (!selectedStudent || !editingNum) return;
    const num = Number(editingNum);
    if (num < 1) return;
    setEditSaving(true);
    try {
      const res = await api.put("/teacher/myclass/student-number", {
        studentId: selectedStudent.studentId,
        studentNumber: num,
      });
      alert(res.data.message);
      fetchClassInfo();
      setSelectedStudent(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg ?? "반번호 변경에 실패했습니다.");
    } finally {
      setEditSaving(false);
    }
  };

  // [woo] 승인대기 학생 배정 모달 열기
  const openAssignModal = (student: PendingStudent) => {
    setAssignTarget(student);
    // [woo] 반번호 자동 제안: 현재 학생 수 + 1
    setAssignNum(classInfo ? String(classInfo.totalStudents + 1) : "");
    setShowAssignModal(true);
  };

  // [woo] 승인대기 학생을 본인 학급에 배정
  const handleAssignStudent = async () => {
    if (!assignTarget) return;
    setAssigningId(assignTarget.studentInfoId);
    try {
      const res = await api.post("/teacher/myclass/assign-student", {
        studentInfoId: assignTarget.studentInfoId,
        attendanceNum: assignNum ? Number(assignNum) : null,
      });
      alert(res.data.message);
      // [woo] 목록 갱신
      fetchClassInfo();
      fetchPendingStudents();
      setShowAssignModal(false);
      setAssignTarget(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg ?? "배정에 실패했습니다.");
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">나의 학급</h6>
          <p className="text-neutral-600 mt-4 mb-0">학생 관리</p>
        </div>
      </div>

      {loading && <div className="text-center py-48 text-secondary-light">불러오는 중...</div>}

      {/* 학급 없음 */}
      {!loading && errorMessage && (
        <div className="card">
          <div className="card-body text-center py-48">
            <iconify-icon
              icon="mdi:account-group-outline"
              className="text-neutral-400 mb-16"
              style={{ fontSize: 64 }}
            />
            <h5 className="text-neutral-600 mb-8">담당 학급이 없습니다</h5>
            <p className="text-neutral-500 mb-0">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 학급 헤더 */}
      {!loading && classInfo && (
        <>
          <div className="card radius-12 mb-24">
            <div className="card-body p-20">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-16">
                <div className="d-flex align-items-center gap-16">
                  <div className="w-48-px h-48-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center">
                    <iconify-icon icon="mdi:google-classroom" className="text-primary-600 text-2xl" />
                  </div>
                  <div>
                    <h6 className="mb-0">
                      {classInfo.year}학년도 {classInfo.grade}학년 {classInfo.classNum}반
                    </h6>
                    <span className="text-secondary-light text-sm">
                      담임: {classInfo.homeroomTeacherName ?? "-"} | 총 {classInfo.totalStudents}명
                    </span>
                  </div>
                </div>
                <Link to="/teacher/myclass" className="btn btn-outline-neutral-300 radius-8">
                  <iconify-icon icon="mdi:arrow-left" className="me-4" />
                  학급 현황
                </Link>
              </div>
            </div>
          </div>

          {/* [woo] 승인대기 학생 목록 */}
          {pendingStudents.length > 0 && (
            <div className="card radius-12 mb-24">
              <div className="card-header py-16 px-24 border-bottom d-flex align-items-center gap-10">
                <div className="w-32-px h-32-px bg-warning-100 rounded-circle d-flex justify-content-center align-items-center">
                  <iconify-icon icon="mdi:account-clock" className="text-warning-600" />
                </div>
                <h6 className="mb-0">승인대기 학생</h6>
                <span className="badge bg-warning-100 text-warning-600 px-10 py-4 radius-4 text-xs">
                  {pendingStudents.length}명
                </span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table bordered-table mb-0">
                    <thead>
                      <tr>
                        <th scope="col">이름</th>
                        <th scope="col">이메일</th>
                        <th scope="col">연락처</th>
                        <th scope="col" className="text-center">
                          상태
                        </th>
                        <th scope="col" className="text-center" style={{ width: 140 }}>
                          배정
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingStudents.map((s) => (
                        <tr key={s.studentInfoId}>
                          <td>
                            <div className="d-flex align-items-center gap-10">
                              <div className="w-36-px h-36-px bg-warning-100 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                                <iconify-icon icon="mdi:account-clock" className="text-warning-600" />
                              </div>
                              <span className="fw-medium">{s.name}</span>
                            </div>
                          </td>
                          <td className="text-secondary-light">{s.email}</td>
                          <td className="text-secondary-light">{s.phone}</td>
                          <td className="text-center">
                            <span className="badge bg-warning-100 text-warning-600 px-8 py-4 radius-4 text-xs">
                              {s.status}
                            </span>
                          </td>
                          <td className="text-center">
                            {/* [woo] 본인 학급으로 배정 버튼 */}
                            <button
                              type="button"
                              className="btn btn-sm btn-success-600 radius-4 d-inline-flex align-items-center gap-4"
                              onClick={() => openAssignModal(s)}
                              disabled={assigningId === s.studentInfoId}
                            >
                              <iconify-icon icon="mdi:account-plus" />
                              나의 학급으로 배정
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* [soojin] 학생 목록 - TeacherList 동일 패턴 */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            {/* 카드 헤더 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 24px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#111827",
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                학생 목록
                <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>
                  전체 {classInfo.totalStudents}명
                </span>
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                  <i
                    className="bi bi-search"
                    style={{ position: "absolute", left: 8, color: "#9ca3af", fontSize: 13, pointerEvents: "none" }}
                  />
                  <input
                    type="text"
                    style={{
                      padding: "5px 8px 5px 28px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      width: 180,
                      background: "#fff",
                    }}
                    placeholder="이름 또는 번호 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  style={{
                    padding: "5px 12px",
                    background: "#25A194",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  onClick={() => {
                    setShowAddModal(true);
                    setAddError(null);
                    setAddForm(EMPTY_ADD_FORM);
                  }}
                >
                  <i className="ri-user-add-line" style={{ fontSize: 14 }} /> 학생 추가
                </button>
              </div>
            </div>
            {/* 테이블 */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: 80 }} />
                  <col style={{ width: 180 }} />
                  <col style={{ width: 140 }} />
                  <col />
                  <col style={{ width: 90 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        background: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                      }}
                    >
                      번호
                    </th>
                    <th
                      style={{
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        background: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                      }}
                    >
                      이름
                    </th>
                    <th
                      style={{
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        background: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                      }}
                    >
                      연락처
                    </th>
                    <th
                      style={{
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        background: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                      }}
                    >
                      이메일
                    </th>
                    <th
                      style={{
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        background: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                      }}
                    >
                      상세
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}
                      >
                        등록된 학생이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => (
                      <tr key={s.studentId}>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 13,
                            color: "#6b7280",
                            borderBottom: "1px solid #f3f4f6",
                            verticalAlign: "middle",
                          }}
                        >
                          {s.studentNumber}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 13,
                            color: "#374151",
                            borderBottom: "1px solid #f3f4f6",
                            verticalAlign: "middle",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                background: "#f3f4f6",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <i className="ri-user-line" style={{ fontSize: 14, color: "#6b7280" }} />
                            </div>
                            <span style={{ fontWeight: 600 }}>{s.name}</span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 13,
                            color: "#6b7280",
                            borderBottom: "1px solid #f3f4f6",
                            verticalAlign: "middle",
                          }}
                        >
                          {s.phone ?? "-"}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 13,
                            color: "#6b7280",
                            borderBottom: "1px solid #f3f4f6",
                            verticalAlign: "middle",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.email ?? "-"}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 13,
                            borderBottom: "1px solid #f3f4f6",
                            verticalAlign: "middle",
                          }}
                        >
                          <button
                            type="button"
                            style={{
                              padding: "4px 10px",
                              background: "#fff",
                              border: "1px solid #d1d5db",
                              borderRadius: 6,
                              fontSize: 12,
                              color: "#374151",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setSelectedStudent(s);
                              setEditingNum(String(s.studentNumber));
                            }}
                          >
                            보기
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* [woo] 학급 배정 모달 - 반번호 입력 후 배정 */}
      {showAssignModal && assignTarget && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title d-flex align-items-center gap-8">
                  <iconify-icon icon="mdi:account-plus" className="text-success-600" />
                  학급 배정
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)} />
              </div>
              <div className="modal-body p-24">
                <div className="text-center mb-16">
                  <div className="w-56-px h-56-px bg-warning-100 rounded-circle d-flex justify-content-center align-items-center mx-auto mb-12">
                    <iconify-icon icon="mdi:account-clock" className="text-warning-600 text-2xl" />
                  </div>
                  <h6 className="mb-4">{assignTarget.name}</h6>
                  <span className="text-secondary-light text-sm">{assignTarget.email}</span>
                </div>
                {/* [woo] 배정 정보 */}
                <div className="bg-neutral-50 radius-8 p-12 mb-16 text-sm text-center">
                  <iconify-icon icon="mdi:google-classroom" className="text-primary-600 me-4" />
                  {classInfo?.grade}학년 {classInfo?.classNum}반에 배정됩니다
                </div>
                {/* [woo] 반번호 입력 */}
                <div>
                  <label className="form-label fw-medium text-sm mb-6">반번호</label>
                  <input
                    type="number"
                    className="form-control radius-8"
                    min={1}
                    placeholder="자동 부여"
                    value={assignNum}
                    onChange={(e) => setAssignNum(e.target.value)}
                  />
                  <p className="text-xs text-secondary-light mt-4 mb-0">비워두면 자동 부여됩니다</p>
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24 gap-8">
                <button
                  type="button"
                  className="btn btn-outline-neutral-300 radius-8"
                  onClick={() => setShowAssignModal(false)}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="btn btn-success-600 radius-8 d-flex align-items-center gap-6"
                  onClick={handleAssignStudent}
                  disabled={assigningId !== null}
                >
                  {assigningId ? (
                    <>
                      <span className="spinner-border spinner-border-sm" /> 배정 중...
                    </>
                  ) : (
                    <>
                      <iconify-icon icon="mdi:check" /> 배정하기
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* [woo] 학생 추가 모달 - 본인 학급 고정 */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">
                  학생 추가 — {classInfo?.grade}학년 {classInfo?.classNum}반
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
              </div>
              <form onSubmit={handleAddStudent}>
                <div className="modal-body p-24">
                  {addError && <div className="alert alert-danger radius-8 mb-16 text-sm">{addError}</div>}
                  <div className="row gy-16">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-sm">이름 *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="홍길동"
                        value={addForm.name}
                        onChange={setField("name")}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-sm">반번호 *</label>
                      <input
                        type="number"
                        className="form-control"
                        min={1}
                        placeholder="예: 5"
                        value={addForm.studentNumber}
                        onChange={setField("studentNumber")}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold text-sm">이메일 *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="student@gmail.com"
                        value={addForm.email}
                        onChange={setField("email")}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold text-sm">초기 비밀번호 *</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="초기 비밀번호"
                        value={addForm.password}
                        onChange={setField("password")}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-sm">연락처</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="010-0000-0000"
                        value={addForm.phone}
                        onChange={handlePhoneInput}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-sm">성별</label>
                      <select className="form-select" value={addForm.gender} onChange={setField("gender")}>
                        <option value="MALE">남</option>
                        <option value="FEMALE">여</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold text-sm">생년월일</label>
                      <input
                        type="date"
                        className="form-control"
                        value={addForm.birthDate}
                        onChange={setField("birthDate")}
                      />
                    </div>
                    <div className="col-12">
                      <div className="p-12 bg-neutral-50 radius-8 text-xs text-secondary-light">
                        <i className="ri-information-line me-4" />
                        학급: {classInfo?.grade}학년 {classInfo?.classNum}반 (자동 배정)
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top py-16 px-24 gap-8">
                  <button
                    type="button"
                    className="btn btn-outline-neutral-300 radius-8"
                    onClick={() => setShowAddModal(false)}
                  >
                    취소
                  </button>
                  <button type="submit" className="btn btn-primary-600 radius-8" disabled={addSaving}>
                    {addSaving ? "추가 중..." : "학생 추가"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* [woo] 학생 상세 모달 - 반번호 수정 기능 포함 */}
      {selectedStudent && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">학생 정보</h6>
                <button type="button" className="btn-close" onClick={() => setSelectedStudent(null)} />
              </div>
              <div className="modal-body p-24">
                <div className="text-center mb-24">
                  <div className="w-80-px h-80-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center mx-auto mb-16">
                    <iconify-icon icon="mdi:account" className="text-primary-600 text-4xl" />
                  </div>
                  <h5 className="mb-4">{selectedStudent.name}</h5>
                  <span className="text-secondary-light">{selectedStudent.studentNumber}번</span>
                </div>
                <div className="d-flex flex-column gap-16">
                  {/* [woo] 반번호 수정 */}
                  <div className="d-flex justify-content-between align-items-center py-12 border-bottom">
                    <span className="text-secondary-light">
                      <iconify-icon icon="mdi:numeric" className="me-8" />
                      반번호
                    </span>
                    <div className="d-flex align-items-center gap-8">
                      <input
                        type="number"
                        className="form-control form-control-sm radius-8"
                        style={{ width: 80 }}
                        min={1}
                        value={editingNum}
                        onChange={(e) => setEditingNum(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-primary-600 radius-4 d-flex align-items-center gap-4"
                        onClick={handleUpdateStudentNumber}
                        disabled={editSaving || !editingNum || Number(editingNum) === selectedStudent.studentNumber}
                      >
                        {editSaving ? (
                          <span className="spinner-border spinner-border-sm" />
                        ) : (
                          <iconify-icon icon="mdi:check" />
                        )}
                        변경
                      </button>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-12 border-bottom">
                    <span className="text-secondary-light">
                      <iconify-icon icon="mdi:phone" className="me-8" />
                      연락처
                    </span>
                    <span className="fw-medium">{selectedStudent.phone ?? "-"}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-12 border-bottom">
                    <span className="text-secondary-light">
                      <iconify-icon icon="mdi:email" className="me-8" />
                      이메일
                    </span>
                    <span className="fw-medium">{selectedStudent.email ?? "-"}</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24">
                <button
                  type="button"
                  className="btn btn-outline-neutral-300 radius-8"
                  onClick={() => setSelectedStudent(null)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
