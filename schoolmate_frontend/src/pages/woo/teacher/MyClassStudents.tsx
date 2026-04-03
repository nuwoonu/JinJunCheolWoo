import { useEffect, useState } from "react";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [soojin] 학급 현황 + 학생 관리 페이지 통합: 2단 레이아웃 (학급정보+승인대기 / 학생목록)

interface Student {
  studentId: number;
  name: string;
  studentNumber: number;
  phone?: string;
  email?: string;
  // [soojin] 학생 관리 테이블 컬럼 추가
  gender?: string;
  birthDate?: string;
  parentName?: string;
}

interface ClassInfo {
  year: number;
  grade: number;
  classNum: number;
  homeroomTeacherName?: string;
  totalStudents: number;
  students: Student[];
}

// [soojin] 승인대기 학생 - 학부모 성함, 신청일 추가
interface PendingStudent {
  studentInfoId: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  parentName?: string;
  createdAt?: string;
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

// [soojin] 성별 한글 변환
const genderLabel = (gender?: string) => {
  if (gender === "MALE") return "남";
  if (gender === "FEMALE") return "여";
  return "-";
};

// [soojin] 신청일 포맷 (ISO → YYYY.MM.DD)
const formatDate = (dateStr?: string) => {
  if (!dateStr || dateStr === "-") return "-";
  try {
    return dateStr.slice(0, 10).replace(/-/g, ".");
  } catch {
    return dateStr;
  }
};

export default function TeacherMyClassStudents() {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // [soojin] 검색: input 입력값 / 실제 적용된 검색어 분리 (버튼 클릭 시 적용)
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState("전체");
  const [searchGender, setSearchGender] = useState("MALE");

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);

  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState<PendingStudent | null>(null);
  const [assignNum, setAssignNum] = useState("");
  const [editingNum, setEditingNum] = useState<string>("");
  const [editSaving, setEditSaving] = useState(false);

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
    classInfo?.students.filter((s) => {
      if (filterField === "성별") return s.gender === searchGender;
      if (!search) return true;
      switch (filterField) {
        case "이름":
          return s.name.includes(search);
        case "이메일":
          return (s.email ?? "").includes(search);
        case "연락처":
          return (s.phone ?? "").includes(search);
        default:
          return s.name.includes(search) || (s.email ?? "").includes(search) || (s.phone ?? "").includes(search);
      }
    }) ?? [];

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

  // 공통 th 스타일
  const thStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 600,
    color: "#6b7280",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
    textAlign: "left",
  };

  // 공통 td 스타일
  const tdStyle: React.CSSProperties = {
    padding: "11px 12px",
    fontSize: 13,
    color: "#374151",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "middle",
  };

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">나의 학급</h6>
          <p className="text-neutral-600 mt-4 mb-0">학급 정보, 학생 정보, 학생 승인 관리 페이지입니다.</p>
        </div>
        {classInfo && (
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
            <i className="ri-user-add-line" style={{ fontSize: 15 }} /> 학생 추가
          </button>
        )}
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

      {/* [soojin] 2단 레이아웃: 왼쪽(학급정보 + 승인대기) / 오른쪽(학생목록) */}
      {!loading && classInfo && (
        <div className="row align-items-stretch" style={{ minHeight: "calc(100vh - 180px)" }}>
          {/* ── 왼쪽 ── */}
          <div className="col-12 col-lg-4 mb-24 d-flex flex-column">
            {/* 학급 정보 카드 */}
            <div className={`card radius-12 mb-20${pendingStudents.length === 0 ? " flex-grow-1" : ""}`}>
              <div className="card-body p-24">
                {/* 학급 요약 내부 카드 */}
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    className="d-flex justify-content-center align-items-center rounded-circle bg-primary-100"
                    style={{ width: 44, height: 44, flexShrink: 0 }}
                  >
                    <iconify-icon icon="mdi:google-classroom" className="text-primary-600" style={{ fontSize: 22 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#15803d" }}>
                      {classInfo.grade}학년 {classInfo.classNum}반
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{classInfo.year}학년도</div>
                  </div>
                </div>

                {/* 정보 항목 리스트 */}
                <div className="d-flex flex-column gap-10">
                  {[
                    { icon: "mdi:account-tie", label: "담임 교사", value: classInfo.homeroomTeacherName ?? "-" },
                    { icon: "mdi:account-group", label: "총 학생 수", value: `${classInfo.totalStudents}명` },
                    // [soojin] 승인 대기 수 - pendingStudents 이미 fetching 중이라 추가 API 불필요
                    {
                      icon: "mdi:account-clock",
                      label: "승인 대기",
                      value: `${pendingStudents.length}명`,
                      highlight: pendingStudents.length > 0,
                    },
                  ].map(({ icon, label, value, highlight }) => (
                    <div key={label} className="d-flex align-items-center justify-content-between">
                      <span className="text-secondary-light text-sm d-flex align-items-center gap-6">
                        <iconify-icon icon={icon} style={{ fontSize: 15 }} />
                        {label}
                      </span>
                      <span className="fw-semibold text-sm" style={{ color: highlight ? "#d97706" : "#111827" }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* [soojin] 승인대기 학생 - 큰 카드 안에 작은 카드 목록 */}
            {pendingStudents.length > 0 && (
              <div className="card radius-12 flex-grow-1" style={{ border: "1px solid #fde68a" }}>
                <div className="card-body p-20">
                  <div className="d-flex align-items-center gap-8 mb-16">
                    <span className="fw-bold text-sm" style={{ color: "#111827" }}>
                      승인대기 학생
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 20,
                        height: 20,
                        padding: "0 6px",
                        background: "#fef3c7",
                        color: "#d97706",
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {pendingStudents.length}
                    </span>
                  </div>

                  <div className="d-flex flex-column gap-10">
                    {pendingStudents.map((s) => (
                      <div
                        key={s.studentInfoId}
                        className="card radius-8"
                        style={{ border: "1px solid #fde68a", background: "#fffbeb" }}
                      >
                        <div className="card-body p-16">
                          <div className="d-flex align-items-start gap-12">
                            {/* 아바타 아이콘 */}
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                background: "#fef3c7",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <i className="ri-time-line" style={{ fontSize: 16, color: "#d97706" }} />
                            </div>

                            {/* 학생 정보 */}
                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                              <div className="fw-semibold mb-4" style={{ fontSize: 14, color: "#111827" }}>
                                {s.name}
                              </div>
                              <div className="text-secondary-light" style={{ fontSize: 12, lineHeight: 1.6 }}>
                                <div>학부모: {s.parentName ?? "-"}</div>
                                <div>연락처: {s.phone}</div>
                                <div
                                  style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  이메일: {s.email}
                                </div>
                                <div>신청일: {formatDate(s.createdAt)}</div>
                              </div>
                            </div>

                            {/* 배정하기 버튼 - 상단 우측 */}
                            <button
                              type="button"
                              style={{
                                padding: "5px 12px",
                                background: "#16a34a",
                                border: "none",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#fff",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                flexShrink: 0,
                                alignSelf: "flex-start",
                                opacity: assigningId === s.studentInfoId ? 0.6 : 1,
                              }}
                              onClick={() => openAssignModal(s)}
                              disabled={assigningId === s.studentInfoId}
                            >
                              <i className="ri-user-add-line" style={{ fontSize: 13 }} />
                              배정하기
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* card-body */}
              </div>
            )}
          </div>

          {/* ── 오른쪽: 학생목록 ── */}
          <div className="col-12 col-lg-8 mb-24 d-flex flex-column">
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                flex: 1,
              }}
            >
              {/* 카드 헤더 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                  padding: "12px 20px",
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

                {/* 검색 필터 영역 */}
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {/* 필드 선택 드롭다운 */}
                  <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                    <select
                      style={{
                        padding: "5px 28px 5px 10px",
                        border: "1px solid #d1d5db",
                        borderRadius: 6,
                        fontSize: 13,
                        background: "#fff",
                        appearance: "none",
                        cursor: "pointer",
                        color: "#374151",
                      }}
                      value={filterField}
                      onChange={(e) => {
                        setFilterField(e.target.value);
                        setSearchInput("");
                        setSearch("");
                      }}
                    >
                      <option>전체</option>
                      <option>이름</option>
                      <option>성별</option>
                      <option>이메일</option>
                      <option>연락처</option>
                    </select>
                    <i
                      className="ri-arrow-down-s-line"
                      style={{ position: "absolute", right: 6, pointerEvents: "none", color: "#6b7280", fontSize: 14 }}
                    />
                  </div>

                  {/* 성별 선택 or 텍스트 입력 */}
                  {filterField === "성별" ? (
                    <select
                      style={{
                        padding: "5px 28px 5px 10px",
                        border: "1px solid #d1d5db",
                        borderRadius: 6,
                        fontSize: 13,
                        background: "#fff",
                        appearance: "none",
                        cursor: "pointer",
                        color: "#374151",
                        position: "relative",
                      }}
                      value={searchGender}
                      onChange={(e) => setSearchGender(e.target.value)}
                    >
                      <option value="MALE">남</option>
                      <option value="FEMALE">여</option>
                    </select>
                  ) : (
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
                          width: 160,
                          background: "#fff",
                        }}
                        placeholder={filterField === "전체" ? "이름, 이메일, 연락처" : `${filterField} 검색`}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setSearch(searchInput);
                        }}
                      />
                    </div>
                  )}

                  {/* 텍스트 필드일 때만 검색 버튼 */}
                  {filterField !== "성별" && (
                    <button
                      type="button"
                      style={{
                        padding: "5px 10px",
                        background: "#25A194",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() => setSearch(searchInput)}
                    >
                      검색
                    </button>
                  )}

                  {/* 초기화 버튼 */}
                  <button
                    type="button"
                    style={{
                      padding: "5px 10px",
                      background: "#fff",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6b7280",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setFilterField("전체");
                      setSearchGender("MALE");
                    }}
                  >
                    초기화
                  </button>
                </div>
              </div>

              {/* [soojin] 학생목록 테이블 - 번호, 이름, 성별, 생년월일, 학부모, 연락처, 이메일, 상세 */}
              <div>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
                  <thead>
                    <tr>
                      {["번호", "이름", "성별", "생년월일", "학부모", "연락처", "이메일", "상세"].map((label) => (
                        <th key={label} style={thStyle}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          style={{
                            padding: "32px 16px",
                            textAlign: "center",
                            fontSize: 13,
                            color: "#9ca3af",
                          }}
                        >
                          {search ? "검색 결과가 없습니다." : "등록된 학생이 없습니다."}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((s) => (
                        <tr key={s.studentId}>
                          <td style={{ ...tdStyle, color: "#6b7280" }}>{s.studentNumber}</td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  background: "#f3f4f6",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <i className="ri-user-line" style={{ fontSize: 13, color: "#6b7280" }} />
                              </div>
                              <span style={{ fontWeight: 600 }}>{s.name}</span>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, color: "#6b7280" }}>{genderLabel(s.gender)}</td>
                          <td style={{ ...tdStyle, color: "#6b7280" }}>{s.birthDate ?? "-"}</td>
                          <td style={{ ...tdStyle, color: "#6b7280" }}>{s.parentName ?? "-"}</td>
                          <td style={{ ...tdStyle, color: "#6b7280" }}>{s.phone ?? "-"}</td>
                          <td
                            style={{
                              ...tdStyle,
                              color: "#6b7280",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {s.email ?? "-"}
                          </td>
                          <td style={tdStyle}>
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
          </div>
        </div>
      )}

      {/* [woo] 학급 배정 모달 */}
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

      {/* [woo] 학생 추가 모달 */}
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

      {/* [woo] 학생 상세 모달 */}
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
