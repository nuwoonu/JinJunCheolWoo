import { useEffect, useState } from "react";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

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

const COCURRICULAR_CATEGORIES = [
  { value: "AUTONOMOUS", label: "자율활동" },
  { value: "CLUB",       label: "동아리활동" },
  { value: "VOLUNTEER",  label: "봉사활동" },
  { value: "CAREER",     label: "진로활동" },
];

const EMPTY_COCURRICULAR_FORM = {
  academicTermId: null as number | null,
  category: "AUTONOMOUS",
  specifics: "",
};

const EMPTY_AWARD_FORM = {
  name: "",
  achievementsGrade: "GOLD",
  day: "",
  awardingOrganization: "",
};

const EMPTY_VOLUNTEER_FORM = {
  academicTermId: null as number | null,
  startDate: "",
  endDate: "",
  organizer: "",
  activityContent: "",
  hours: "",
};

const EMPTY_ADD_FORM = {
  name: "",
  email: "",
  password: "",
  phone: "",
  gender: "MALE",
  studentNumber: "",
  birthDate: "",
};

const SUB_MODAL_TITLE_STYLE = {
  fontSize: 20,
  fontWeight: 600,
};

const MODAL_CONTENT_BODY_STYLE = {
  fontSize: 14,
  color: "#374151",
};

const MODAL_CONTENT_LABEL_STYLE = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
  display: "block",
};

const MODAL_CONTENT_HELPER_STYLE = {
  fontSize: 12,
  color: "#6b7280",
  marginBottom: 6,
  lineHeight: 1.4,
};

const MODAL_CONTENT_LOADING_STYLE = {
  fontSize: 13,
  color: "#6b7280",
  padding: "8px 0",
};

const MODAL_CONTENT_CONTROL_STYLE = {
  fontSize: 14,
  color: "#111827",
  borderColor: "#d1d5db",
  height: 40,
  padding: "8px 12px",
  lineHeight: 1.4,
};

const MODAL_CONTENT_ROW_STYLE = {
  rowGap: 14,
};

const MODAL_CONTENT_ACTIONS_STYLE = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 8,
  padding: "16px 24px",
  borderTop: "1px solid #e5e7eb",
};

const MODAL_CONTENT_CANCEL_BUTTON_STYLE = {
  minWidth: 72,
  height: 36,
  padding: "0 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "#fff",
  color: "#374151",
  fontSize: 13,
  fontWeight: 500,
};

const MODAL_CONTENT_SAVE_BUTTON_STYLE = {
  minWidth: 86,
  height: 36,
  padding: "0 14px",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
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

  // subView: 학생 정보 모달 내 서브 화면
  const [subView, setSubView] = useState<"volunteer" | "award" | "cocurricular" | "behavior" | "activity-info" | "detail-edit" | null>(null);
  const [detailEditTab, setDetailEditTab] = useState<"medical" | "career" | "enrollment">("medical");

  const [medicalForm, setMedicalForm] = useState({ bloodGroup: "", height: "", weight: "" });
  const [medicalSaving, setMedicalSaving] = useState(false);
  const [medicalError, setMedicalError] = useState<string | null>(null);

  const [careerForm, setCareerForm] = useState({ academicTermId: null as number | null, specialtyOrInterest: "", studentDesiredJob: "", parentDesiredJob: "" });
  const [careerSaving, setCareerSaving] = useState(false);
  const [careerError, setCareerError] = useState<string | null>(null);
  const [careerRecords, setCareerRecords] = useState<{ schoolYear: number; semester: number; specialtyOrInterest?: string; studentDesiredJob?: string; parentDesiredJob?: string }[]>([]);

  const [enrollmentForm, setEnrollmentForm] = useState({ address: "", phone: "", previousSchoolName: "", admissionDate: "" });
  const [enrollmentSaving, setEnrollmentSaving] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  const [activityInfo, setActivityInfo] = useState<{
    volunteers: { id: number; schoolYear: number; startDate: string; endDate?: string; organizer: string; activityContent: string; hours: number; cumulativeHours: number }[];
    awards: { id: number; name: string; achievementsGrade?: string; achievementsGradeLabel?: string; day?: string; organization?: string }[];
    loading: boolean;
  }>({ volunteers: [], awards: [], loading: false });

  const [volunteerForm, setVolunteerForm] = useState(EMPTY_VOLUNTEER_FORM);
  const [volunteerSaving, setVolunteerSaving] = useState(false);
  const [volunteerError, setVolunteerError] = useState<string | null>(null);

  const [awardForm, setAwardForm] = useState(EMPTY_AWARD_FORM);
  const [awardSaving, setAwardSaving] = useState(false);
  const [awardError, setAwardError] = useState<string | null>(null);

  const [cocurricularForm, setCocurricularForm] = useState(EMPTY_COCURRICULAR_FORM);
  const [cocurricularSaving, setCocurricularSaving] = useState(false);
  const [cocurricularError, setCocurricularError] = useState<string | null>(null);
  const [cocurricularActivities, setCocurricularActivities] = useState<{ academicTermId: number; termDisplayName: string; category: string; specifics?: string }[]>([]);
  const [academicTerms, setAcademicTerms] = useState<{ id: number; displayName: string; schoolYear: number; semester: number }[]>([]);

  const [behaviorForm, setBehaviorForm] = useState({ academicTermId: null as number | null, specialNotes: "" });
  const [behaviorRecords, setBehaviorRecords] = useState<{ schoolYear: number; semester: number; specialNotes?: string }[]>([]);
  const [behaviorSaving, setBehaviorSaving] = useState(false);
  const [behaviorError, setBehaviorError] = useState<string | null>(null);

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

  const handleSaveCocurricular = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setCocurricularSaving(true);
    setCocurricularError(null);
    if (!cocurricularForm.academicTermId) {
      setCocurricularError("학기를 선택해주세요.");
      setCocurricularSaving(false);
      return;
    }
    try {
      await api.put(`/cocurricular-activities/student/${selectedStudent.studentId}`, {
        academicTermId: cocurricularForm.academicTermId,
        category: cocurricularForm.category,
        specifics: cocurricularForm.specifics,
      });
      setSubView(null);
      setCocurricularForm(EMPTY_COCURRICULAR_FORM);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCocurricularError(msg ?? "창의적 체험활동 저장에 실패했습니다.");
    } finally {
      setCocurricularSaving(false);
    }
  };

  const handleSaveBehavior = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const selectedTerm = academicTerms.find((t) => t.id === behaviorForm.academicTermId);
    if (!selectedTerm) {
      setBehaviorError("학기를 선택해주세요.");
      return;
    }
    setBehaviorSaving(true);
    setBehaviorError(null);
    try {
      await api.put(`/behavior-records/student/${selectedStudent.studentId}`, {
        schoolYear: selectedTerm.schoolYear,
        semester: selectedTerm.semester,
        specialNotes: behaviorForm.specialNotes,
      });
      setSubView(null);
      setBehaviorForm({ academicTermId: null, specialNotes: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setBehaviorError(msg ?? "행동특성 및 종합의견 저장에 실패했습니다.");
    } finally {
      setBehaviorSaving(false);
    }
  };

  const handleSaveAward = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setAwardSaving(true);
    setAwardError(null);
    try {
      await api.post("/awards", {
        studentId: selectedStudent.studentId,
        name: awardForm.name,
        achievementsGrade: awardForm.achievementsGrade,
        day: awardForm.day || null,
        awardingOrganization: awardForm.awardingOrganization,
      });
      setSubView(null);
      setAwardForm(EMPTY_AWARD_FORM);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAwardError(msg ?? "수상 경력 등록에 실패했습니다.");
    } finally {
      setAwardSaving(false);
    }
  };

  const handleSaveVolunteer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setVolunteerSaving(true);
    setVolunteerError(null);
    try {
      if (!volunteerForm.academicTermId) {
        setVolunteerError("학년도를 선택해주세요.");
        setVolunteerSaving(false);
        return;
      }
      await api.post("/volunteer-activities", {
        studentId: selectedStudent.studentId,
        academicTermId: volunteerForm.academicTermId,
        startDate: volunteerForm.startDate,
        endDate: volunteerForm.endDate || null,
        organizer: volunteerForm.organizer,
        activityContent: volunteerForm.activityContent,
        hours: Number(volunteerForm.hours),
      });
      setSubView(null);
      setVolunteerForm(EMPTY_VOLUNTEER_FORM);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setVolunteerError(msg ?? "봉사활동 등록에 실패했습니다.");
    } finally {
      setVolunteerSaving(false);
    }
  };

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
            <i className="ri-group-line text-neutral-400 mb-16" style={{ fontSize: 64 }}></i>
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
            {/* [soojin] 승인대기 카드 항상 표시되므로 flex-grow-1 조건 제거 */}
            <div className="card radius-12 mb-20">
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
                    <i className="ri-graduation-cap-line text-primary-600" style={{ fontSize: 22 }}></i>
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
                    { icon: "ri-user-settings-line", label: "담임 교사", value: classInfo.homeroomTeacherName ?? "-" },
                    { icon: "ri-group-line", label: "총 학생 수", value: `${classInfo.totalStudents}명` },
                    // [soojin] 승인 대기 수 - pendingStudents 이미 fetching 중이라 추가 API 불필요
                    {
                      icon: "ri-time-line",
                      label: "승인 대기",
                      value: `${pendingStudents.length}명`,
                      highlight: pendingStudents.length > 0,
                    },
                  ].map(({ icon, label, value, highlight }) => (
                    <div key={label} className="d-flex align-items-center justify-content-between">
                      <span className="text-secondary-light text-sm d-flex align-items-center gap-6">
                        <i className={icon} style={{ fontSize: 15 }}></i>
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

            {/* [soojin] 승인대기 학생 - 큰 카드 안에 작은 카드 목록, 목록 없어도 카드 항상 표시 */}
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

                {pendingStudents.length === 0 ? (
                  <div className="text-center text-secondary-light py-16" style={{ fontSize: 13 }}>
                    승인대기 학생이 없습니다.
                  </div>
                ) : (
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
                )}
              </div>
              {/* card-body */}
            </div>
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
                        className="ri-search-line"
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
                  <i className="ri-user-add-line text-success-600"></i>
                  학급 배정
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)} />
              </div>
              <div className="modal-body p-24">
                <div className="text-center mb-16">
                  <div className="bg-warning-100 d-flex justify-content-center align-items-center mx-auto mb-12" style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0 }}>
                    <i className="ri-time-line text-warning-600" style={{ fontSize: "2.5rem" }}></i>
                  </div>
                  <h6 className="mb-4">{assignTarget.name}</h6>
                  <span className="text-secondary-light text-sm">{assignTarget.email}</span>
                </div>
                {/* [woo] 배정 정보 */}
                <div className="bg-neutral-50 radius-8 p-12 mb-16 text-sm text-center">
                  <i className="ri-graduation-cap-line text-primary-600 me-4"></i>
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
                      <i className="ri-check-line"></i> 배정하기
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
          <div className={`modal-dialog modal-dialog-centered${subView === "cocurricular" ? " modal-lg" : ""}`}>
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24 d-flex align-items-center gap-12">
                {subView !== null && (
                  <button
                    type="button"
                    onClick={() => setSubView(null)}
                    className="d-inline-flex align-items-center justify-content-center flex-shrink-0 border-0 bg-transparent p-0"
                    aria-label="뒤로 가기"
                  >
                    <i className="ri-arrow-left-line" style={{ fontSize: 20, color: "#6b7280" }}></i>
                  </button>
                )}
                <h6 className="modal-title mb-0 flex-grow-1">
                  {subView === null && "학생 정보"}
                  {subView === "volunteer" && (
                    <span className="d-flex align-items-center gap-8" style={SUB_MODAL_TITLE_STYLE}>
                      <i className="ri-user-heart-line text-success-600"></i>
                      봉사활동 — {selectedStudent.name}
                    </span>
                  )}
                  {subView === "award" && (
                    <span className="d-flex align-items-center gap-8" style={SUB_MODAL_TITLE_STYLE}>
                      <i className="ri-trophy-line text-warning-600"></i>
                      수상 경력 — {selectedStudent.name}
                    </span>
                  )}
                  {subView === "cocurricular" && (
                    <span className="d-flex align-items-center gap-8" style={SUB_MODAL_TITLE_STYLE}>
                      <i className="ri-lightbulb-line text-primary-600"></i>
                      창의적 체험활동 — {selectedStudent.name}
                    </span>
                  )}
                  {subView === "behavior" && (
                    <span className="d-flex align-items-center gap-8" style={SUB_MODAL_TITLE_STYLE}>
                      <i className="ri-survey-line" style={{ color: "#9333ea" }}></i>
                      행동특성 및 종합의견 — {selectedStudent.name}
                    </span>
                  )}
                  {subView === "activity-info" && (
                    <span className="d-flex align-items-center gap-8" style={SUB_MODAL_TITLE_STYLE}>
                      <i className="ri-information-line" style={{ color: "#0284c7" }}></i>
                      활동 정보 — {selectedStudent.name}
                    </span>
                  )}
                  {subView === "detail-edit" && (
                    <span className="d-flex align-items-center gap-8" style={SUB_MODAL_TITLE_STYLE}>
                      <i className="ri-edit-line" style={{ color: "#7c3aed" }}></i>
                      세부 정보 수정 — {selectedStudent.name}
                    </span>
                  )}
                </h6>
                {subView === null && (
                  <button
                    type="button"
                    onClick={() => {
                      setActivityInfo({ volunteers: [], awards: [], loading: true });
                      setSubView("activity-info");
                      Promise.all([
                        api.get(`/volunteer-activities/student/${selectedStudent!.studentId}`),
                        api.get(`/awards/student/${selectedStudent!.studentId}`),
                      ])
                        .then(([volRes, awardRes]) => {
                          setActivityInfo({ volunteers: volRes.data ?? [], awards: awardRes.data ?? [], loading: false });
                        })
                        .catch(() => {
                          setActivityInfo({ volunteers: [], awards: [], loading: false });
                        });
                    }}
                    style={{
                      padding: "5px 12px",
                      background: "#f0f9ff",
                      border: "1px solid #bae6fd",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#0284c7",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <i className="ri-information-line" style={{ fontSize: 14 }}></i>
                    활동 정보
                  </button>
                )}
                <button type="button" className="btn-close" onClick={() => { setSelectedStudent(null); setSubView(null); }} />
              </div>

              {/* 학생 정보 뷰 */}
              {subView === null && (
                <>
                  <div className="modal-body p-24">
                    <div className="text-center mb-24">
                      <div className="bg-primary-100 d-flex justify-content-center align-items-center mx-auto mb-16" style={{ width: 80, height: 80, borderRadius: "50%", flexShrink: 0 }}>
                        <i className="ri-user-line text-primary-600" style={{ fontSize: "3rem" }}></i>
                      </div>
                      <h5 className="mb-4">{selectedStudent.name}</h5>
                      <span className="text-secondary-light">{selectedStudent.studentNumber}번</span>
                    </div>
                    <div className="d-flex flex-column gap-16">
                      {/* [woo] 반번호 수정 */}
                      <div className="d-flex justify-content-between align-items-center py-12 border-bottom">
                        <span className="text-secondary-light">
                          <i className="ri-hashtag me-8"></i>
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
                              <i className="ri-check-line"></i>
                            )}
                            변경
                          </button>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-12 border-bottom">
                        <span className="text-secondary-light">
                          <i className="ri-phone-line me-8"></i>
                          연락처
                        </span>
                        <span className="fw-medium">{selectedStudent.phone ?? "-"}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-12 border-bottom">
                        <span className="text-secondary-light">
                          <i className="ri-mail-line me-8"></i>
                          이메일
                        </span>
                        <span className="fw-medium">{selectedStudent.email ?? "-"}</span>
                      </div>
                    </div>

                    {/* 기록 추가 섹션 */}
                    <div className="mt-20 pt-16">
                      <p className="text-xs fw-semibold text-secondary-light mb-12" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        기록 추가
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }}>
                        {/* 봉사활동 */}
                        <button
                          type="button"
                          onClick={() => {
                            setVolunteerError(null);
                            api.get("/admin/settings/history")
                              .then((res) => {
                                const terms = (res.data ?? []).map((t: { id: number; displayName: string; schoolYear: number; semester: number }) => ({ id: t.id, displayName: t.displayName, schoolYear: t.schoolYear, semester: t.semester }));
                                setAcademicTerms(terms);
                                setVolunteerForm({ ...EMPTY_VOLUNTEER_FORM, academicTermId: terms[0]?.id ?? null });
                              })
                              .catch(() => setVolunteerForm(EMPTY_VOLUNTEER_FORM));
                            setSubView("volunteer");
                          }}
                          style={{ minHeight: 108, padding: "14px 8px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "box-shadow 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(22,163,74,0.18)")}
                          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                        >
                          <div style={{ width: 40, height: 40, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="ri-user-heart-line" style={{ fontSize: 20, color: "#16a34a" }}></i>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", whiteSpace: "nowrap", lineHeight: 1.2 }}>봉사활동</span>
                        </button>

                        {/* 수상 경력 */}
                        <button
                          type="button"
                          onClick={() => { setAwardForm(EMPTY_AWARD_FORM); setAwardError(null); setSubView("award"); }}
                          style={{ minHeight: 108, padding: "14px 8px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "box-shadow 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(202,138,4,0.18)")}
                          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                        >
                          <div style={{ width: 40, height: 40, background: "#fef9c3", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="ri-trophy-line" style={{ fontSize: 20, color: "#ca8a04" }}></i>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#ca8a04", whiteSpace: "nowrap", lineHeight: 1.2 }}>수상경력</span>
                        </button>

                        {/* 창의적 체험활동 */}
                        <button
                          type="button"
                          onClick={() => {
                            setCocurricularError(null);
                            Promise.all([
                              api.get("/admin/settings/history"),
                              api.get(`/cocurricular-activities/student/${selectedStudent!.studentId}`),
                            ])
                              .then(([termsRes, activitiesRes]) => {
                                const terms = (termsRes.data ?? []).map((t: { id: number; displayName: string; schoolYear: number; semester: number }) => ({ id: t.id, displayName: t.displayName, schoolYear: t.schoolYear, semester: t.semester }));
                                const activities = activitiesRes.data ?? [];
                                setAcademicTerms(terms);
                                setCocurricularActivities(activities);
                                const firstTermId = terms[0]?.id ?? null;
                                const existing = activities.find((a: { academicTermId: number; category: string; specifics?: string }) => a.academicTermId === firstTermId && a.category === "AUTONOMOUS");
                                setCocurricularForm({ academicTermId: firstTermId, category: "AUTONOMOUS", specifics: existing?.specifics ?? "" });
                              })
                              .catch(() => { setAcademicTerms([]); setCocurricularActivities([]); setCocurricularForm(EMPTY_COCURRICULAR_FORM); });
                            setSubView("cocurricular");
                          }}
                          style={{ minHeight: 108, padding: "14px 8px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "box-shadow 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.15)")}
                          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                        >
                          <div style={{ width: 40, height: 40, background: "#dbeafe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="ri-lightbulb-line" style={{ fontSize: 20, color: "#2563eb" }}></i>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", whiteSpace: "nowrap", lineHeight: 1.2 }}>창의적 체험</span>
                        </button>

                        {/* 행동특성 및 종합의견 */}
                        <button
                          type="button"
                          onClick={() => {
                            setBehaviorError(null);
                            Promise.all([
                              api.get("/admin/settings/history"),
                              api.get(`/behavior-records/student/${selectedStudent!.studentId}`),
                            ])
                              .then(([termsRes, recordsRes]) => {
                                const terms = (termsRes.data ?? []).map((t: { id: number; displayName: string; schoolYear: number; semester: number }) => ({ id: t.id, displayName: t.displayName, schoolYear: t.schoolYear, semester: t.semester }));
                                const records = recordsRes.data ?? [];
                                setAcademicTerms(terms);
                                setBehaviorRecords(records);
                                const firstTermId = terms[0]?.id ?? null;
                                const firstTerm = terms[0];
                                const existing = firstTerm ? records.find((r: { schoolYear: number; semester: number; specialNotes?: string }) => r.schoolYear === firstTerm.schoolYear && r.semester === firstTerm.semester) : null;
                                setBehaviorForm({ academicTermId: firstTermId, specialNotes: existing?.specialNotes ?? "" });
                              })
                              .catch(() => { setBehaviorRecords([]); setBehaviorForm({ academicTermId: null, specialNotes: "" }); });
                            setSubView("behavior");
                          }}
                          style={{ minHeight: 108, padding: "14px 8px", background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "box-shadow 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(147,51,234,0.15)")}
                          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                        >
                          <div style={{ width: 40, height: 40, background: "#f3e8ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="ri-survey-line" style={{ fontSize: 20, color: "#9333ea" }}></i>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#9333ea", whiteSpace: "nowrap", lineHeight: 1.2 }}>행동특성</span>
                        </button>

                        {/* 세부 정보 */}
                        <button
                          type="button"
                          onClick={() => {
                            setMedicalError(null);
                            setCareerError(null);
                            setEnrollmentError(null);
                            setMedicalForm({ bloodGroup: "", height: "", weight: "" });
                            setEnrollmentForm({ address: "", phone: selectedStudent!.phone ?? "", previousSchoolName: "", admissionDate: "" });
                            setDetailEditTab("medical");
                            Promise.all([
                              api.get("/admin/settings/history"),
                              api.get(`/career-aspirations/students/${selectedStudent!.studentId}`),
                              api.get(`/students/info/${selectedStudent!.studentId}`),
                            ])
                              .then(([termsRes, careerRes, studentRes]) => {
                                const terms = (termsRes.data ?? []).map((t: { id: number; displayName: string; schoolYear: number; semester: number }) => ({ id: t.id, displayName: t.displayName, schoolYear: t.schoolYear, semester: t.semester }));
                                const careers: { schoolYear: number; semester: number; specialtyOrInterest?: string; studentDesiredJob?: string; parentDesiredJob?: string }[] = careerRes.data ?? [];
                                setAcademicTerms(terms);
                                setCareerRecords(careers);
                                const firstTerm = terms[0];
                                const existing = firstTerm ? careers.find((c) => c.schoolYear === firstTerm.schoolYear && c.semester === firstTerm.semester) : null;
                                setCareerForm({ academicTermId: firstTerm?.id ?? null, specialtyOrInterest: existing?.specialtyOrInterest ?? "", studentDesiredJob: existing?.studentDesiredJob ?? "", parentDesiredJob: existing?.parentDesiredJob ?? "" });
                                // 기존 학생 정보 사전 입력
                                const s = studentRes.data;
                                setMedicalForm({ bloodGroup: s.BloodGroup ?? s.bloodGroup ?? "", height: s.Height ?? s.height ? String(s.Height ?? s.height) : "", weight: s.Weight ?? s.weight ? String(s.Weight ?? s.weight) : "" });
                                setEnrollmentForm({ phone: s.phone ?? "", address: s.address ?? "", previousSchoolName: s.previousSchoolName ?? "", admissionDate: s.admissionDate ? String(s.admissionDate).slice(0, 10) : "" });
                              })
                              .catch(() => { setAcademicTerms([]); setCareerRecords([]); setCareerForm({ academicTermId: null, specialtyOrInterest: "", studentDesiredJob: "", parentDesiredJob: "" }); });
                            setSubView("detail-edit");
                          }}
                          style={{ minHeight: 108, padding: "14px 8px", background: "#faf5ff", border: "1px solid #ddd6fe", borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "box-shadow 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(124,58,237,0.15)")}
                          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                        >
                          <div style={{ width: 40, height: 40, background: "#ede9fe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="ri-edit-line" style={{ fontSize: 20, color: "#7c3aed" }}></i>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed", whiteSpace: "nowrap", lineHeight: 1.2 }}>세부 정보 입력</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top py-12 px-24 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-neutral-300 radius-8"
                      onClick={() => setSelectedStudent(null)}
                    >
                      닫기
                    </button>
                  </div>
                </>
              )}

              {/* 창의적 체험활동 폼 */}
              {subView === "cocurricular" && (
                <form onSubmit={handleSaveCocurricular}>
                  <div className="modal-body p-24" style={MODAL_CONTENT_BODY_STYLE}>
                    {cocurricularError && (
                      <div className="alert alert-danger radius-8 mb-16 text-sm">{cocurricularError}</div>
                    )}
                    <div className="row gy-16" style={MODAL_CONTENT_ROW_STYLE}>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>학년도 *</label>
                        {academicTerms.length === 0 ? (
                          <div className="text-secondary-light text-sm py-8" style={MODAL_CONTENT_LOADING_STYLE}>
                            <span className="spinner-border spinner-border-sm me-8" />
                            학년도 목록 불러오는 중...
                          </div>
                        ) : (
                          <select
                            className="form-select"
                            style={MODAL_CONTENT_CONTROL_STYLE}
                            value={academicTerms.find((t) => t.id === cocurricularForm.academicTermId)?.schoolYear ?? ""}
                            onChange={(e) => {
                              const selectedYear = Number(e.target.value);
                              const termId = academicTerms.find((t) => t.schoolYear === selectedYear)?.id ?? null;
                              const existing = cocurricularActivities.find(
                                (a) => a.academicTermId === termId && a.category === cocurricularForm.category
                              );
                              setCocurricularForm((f) => ({ ...f, academicTermId: termId, specifics: existing?.specifics ?? "" }));
                            }}
                            required
                          >
                            {Array.from(new Set(academicTerms.map((t) => t.schoolYear))).sort((a, b) => a - b).map((y) => (
                              <option key={y} value={y}>{y}학년도</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>영역 *</label>
                        <select
                          className="form-select"
                          style={MODAL_CONTENT_CONTROL_STYLE}
                          value={cocurricularForm.category}
                          onChange={(e) => {
                            const newCat = e.target.value;
                            const existing = cocurricularActivities.find(
                              (a) => a.academicTermId === cocurricularForm.academicTermId && a.category === newCat
                            );
                            setCocurricularForm((f) => ({ ...f, category: newCat, specifics: existing?.specifics ?? "" }));
                          }}
                          required
                        >
                          {COCURRICULAR_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>특기사항 *</label>
                        <div className="text-xs text-secondary-light mb-6" style={MODAL_CONTENT_HELPER_STYLE}>
                          학년도+영역 기준으로 저장되며, 기존 내용이 있으면 덮어씁니다.
                        </div>
                        <textarea
                          className="form-control"
                          rows={10}
                          placeholder="활동사항을 입력하세요"
                          value={cocurricularForm.specifics}
                          onChange={(e) => setCocurricularForm((f) => ({ ...f, specifics: e.target.value }))}
                          style={{ ...MODAL_CONTENT_CONTROL_STYLE, height: "auto", resize: "vertical", minHeight: 200, lineHeight: 1.5 }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer" style={MODAL_CONTENT_ACTIONS_STYLE}>
                    <button
                      type="button"
                      className="btn"
                      style={MODAL_CONTENT_CANCEL_BUTTON_STYLE}
                      onClick={() => setSubView(null)}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="btn"
                      style={{ ...MODAL_CONTENT_SAVE_BUTTON_STYLE, background: "#2563eb" }}
                      disabled={cocurricularSaving}
                    >
                      {cocurricularSaving ? (
                        <><span className="spinner-border spinner-border-sm" /> 저장 중...</>
                      ) : (
                        <><i className="ri-check-line"></i> 저장</>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* 수상 경력 폼 */}
              {subView === "award" && (
                <form onSubmit={handleSaveAward}>
                  <div className="modal-body p-24" style={MODAL_CONTENT_BODY_STYLE}>
                    {awardError && (
                      <div className="alert alert-danger radius-8 mb-16 text-sm">{awardError}</div>
                    )}
                    <div className="row gy-16" style={MODAL_CONTENT_ROW_STYLE}>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>수상명 *</label>
                        <input
                          type="text"
                          className="form-control"
                          style={MODAL_CONTENT_CONTROL_STYLE}
                          placeholder="예: 교내 과학 경진대회"
                          value={awardForm.name}
                          onChange={(e) => setAwardForm((f) => ({ ...f, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>등급 *</label>
                        <select
                          className="form-select"
                          style={MODAL_CONTENT_CONTROL_STYLE}
                          value={awardForm.achievementsGrade}
                          onChange={(e) => setAwardForm((f) => ({ ...f, achievementsGrade: e.target.value }))}
                          required
                        >
                          <option value="GOLD">금상</option>
                          <option value="SILVER">은상</option>
                          <option value="BRONZE">동상</option>
                          <option value="HONORABLE_MENTION">장려</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>수상일 *</label>
                        <input
                          type="date"
                          className="form-control"
                          style={MODAL_CONTENT_CONTROL_STYLE}
                          value={awardForm.day}
                          onChange={(e) => setAwardForm((f) => ({ ...f, day: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>수상 기관 *</label>
                        <input
                          type="text"
                          className="form-control"
                          style={MODAL_CONTENT_CONTROL_STYLE}
                          placeholder="예: 부여고등학교"
                          value={awardForm.awardingOrganization}
                          onChange={(e) => setAwardForm((f) => ({ ...f, awardingOrganization: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer" style={MODAL_CONTENT_ACTIONS_STYLE}>
                    <button
                      type="button"
                      className="btn"
                      style={MODAL_CONTENT_CANCEL_BUTTON_STYLE}
                      onClick={() => setSubView(null)}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="btn"
                      style={{ ...MODAL_CONTENT_SAVE_BUTTON_STYLE, background: "#ca8a04" }}
                      disabled={awardSaving}
                    >
                      {awardSaving ? (
                        <><span className="spinner-border spinner-border-sm" /> 저장 중...</>
                      ) : (
                        <><i className="ri-check-line"></i> 저장</>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* 봉사활동 폼 */}
              {subView === "volunteer" && (
                <form onSubmit={handleSaveVolunteer}>
                  <div className="modal-body p-24" style={MODAL_CONTENT_BODY_STYLE}>
                    {volunteerError && (
                      <div className="alert alert-danger radius-8 mb-16 text-sm">{volunteerError}</div>
                    )}
                    <div className="row gy-16" style={MODAL_CONTENT_ROW_STYLE}>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>학년도 *</label>
                        {academicTerms.length === 0 ? (
                          <div className="text-secondary-light text-sm py-8" style={MODAL_CONTENT_LOADING_STYLE}>
                            <span className="spinner-border spinner-border-sm me-8" />
                            학년도 목록 불러오는 중...
                          </div>
                        ) : (
                          <select
                            className="form-select"
                            style={MODAL_CONTENT_CONTROL_STYLE}
                            value={academicTerms.find((t) => t.id === volunteerForm.academicTermId)?.schoolYear ?? ""}
                            onChange={(e) => {
                              const termId = academicTerms.find((t) => t.schoolYear === Number(e.target.value))?.id ?? null;
                              setVolunteerForm((f) => ({ ...f, academicTermId: termId }));
                            }}
                            required
                          >
                            {Array.from(new Set(academicTerms.map((t) => t.schoolYear))).sort((a, b) => a - b).map((y) => (
                              <option key={y} value={y}>{y}학년도</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>시간(h) *</label>
                        <input
                          type="number"
                          className="form-control"
                          style={MODAL_CONTENT_CONTROL_STYLE}
                          min={0.5}
                          step={0.5}
                          placeholder="예: 2"
                          value={volunteerForm.hours}
                          onChange={(e) => setVolunteerForm((f) => ({ ...f, hours: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>시작일 *</label>
                        <input
                          type="date"
                          className="form-control"
                          style={MODAL_CONTENT_CONTROL_STYLE}
                          value={volunteerForm.startDate}
                          onChange={(e) => setVolunteerForm((f) => ({ ...f, startDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>종료일</label>
                        <input
                          type="date"
                          className="form-control"
                          style={MODAL_CONTENT_CONTROL_STYLE}
                          value={volunteerForm.endDate}
                          min={volunteerForm.startDate}
                          onChange={(e) => setVolunteerForm((f) => ({ ...f, endDate: e.target.value }))}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>장소 또는 주관기관명 *</label>
                        <input
                          type="text"
                          className="form-control"
                          style={MODAL_CONTENT_CONTROL_STYLE}
                          placeholder="예: (학교)부여고등학교"
                          value={volunteerForm.organizer}
                          onChange={(e) => setVolunteerForm((f) => ({ ...f, organizer: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>활동내용 *</label>
                        <textarea
                          className="form-control"
                          style={{ ...MODAL_CONTENT_CONTROL_STYLE, height: "auto", lineHeight: 1.5 }}
                          rows={3}
                          placeholder="봉사활동 내용을 입력하세요"
                          value={volunteerForm.activityContent}
                          onChange={(e) => setVolunteerForm((f) => ({ ...f, activityContent: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer" style={MODAL_CONTENT_ACTIONS_STYLE}>
                    <button
                      type="button"
                      className="btn"
                      style={MODAL_CONTENT_CANCEL_BUTTON_STYLE}
                      onClick={() => setSubView(null)}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="btn"
                      style={{ ...MODAL_CONTENT_SAVE_BUTTON_STYLE, background: "#16a34a" }}
                      disabled={volunteerSaving}
                    >
                      {volunteerSaving ? (
                        <><span className="spinner-border spinner-border-sm" /> 저장 중...</>
                      ) : (
                        <><i className="ri-check-line"></i> 저장</>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* 세부 정보 수정 뷰 */}
              {subView === "detail-edit" && (
                <div className="modal-body p-0">
                  {/* 탭 헤더 */}
                  <div className="d-flex border-bottom" style={{ background: "#fafafa" }}>
                    {([
                      { key: "medical", label: "의료 기록", icon: "ri-heart-3-line", color: "#0891b2" },
                      { key: "career", label: "진로희망", icon: "ri-briefcase-line", color: "#16a34a" },
                      { key: "enrollment", label: "학적사항", icon: "ri-building-2-line", color: "#7c3aed" },
                    ] as const).map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setDetailEditTab(tab.key)}
                        style={{
                          flex: 1,
                          padding: "10px 4px",
                          border: "none",
                          borderBottom: detailEditTab === tab.key ? `2px solid ${tab.color}` : "2px solid transparent",
                          background: "transparent",
                          fontSize: 12,
                          fontWeight: detailEditTab === tab.key ? 700 : 500,
                          color: detailEditTab === tab.key ? tab.color : "#9ca3af",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <i className={tab.icon} style={{ fontSize: 14 }}></i>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* 의료 기록 탭 */}
                  {detailEditTab === "medical" && (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!selectedStudent) return;
                      setMedicalSaving(true);
                      setMedicalError(null);
                      try {
                        await api.post(`/medical-details/student/${selectedStudent.studentId}`, {
                          bloodGroup: medicalForm.bloodGroup || null,
                          height: medicalForm.height ? Number(medicalForm.height) : null,
                          weight: medicalForm.weight ? Number(medicalForm.weight) : null,
                        });
                        setSubView(null);
                      } catch (err: unknown) {
                        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                        setMedicalError(msg ?? "의료 기록 저장에 실패했습니다.");
                      } finally {
                        setMedicalSaving(false);
                      }
                    }}>
                      <div className="p-20" style={MODAL_CONTENT_BODY_STYLE}>
                        {medicalError && <div className="alert alert-danger radius-8 mb-12 text-sm">{medicalError}</div>}
                        <div className="row gy-14" style={MODAL_CONTENT_ROW_STYLE}>
                          <div className="col-12">
                            <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>혈액형</label>
                            <select
                              className="form-select"
                              style={MODAL_CONTENT_CONTROL_STYLE}
                              value={medicalForm.bloodGroup}
                              onChange={(e) => setMedicalForm((f) => ({ ...f, bloodGroup: e.target.value }))}
                            >
                              <option value="">선택 안 함</option>
                              {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                                <option key={bg} value={bg}>{bg}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-6">
                            <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>신장 (cm)</label>
                            <input
                              type="number"
                              className="form-control"
                              style={MODAL_CONTENT_CONTROL_STYLE}
                              placeholder="예: 170"
                              min={100}
                              max={250}
                              step={0.1}
                              value={medicalForm.height}
                              onChange={(e) => setMedicalForm((f) => ({ ...f, height: e.target.value }))}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>체중 (kg)</label>
                            <input
                              type="number"
                              className="form-control"
                              style={MODAL_CONTENT_CONTROL_STYLE}
                              placeholder="예: 65"
                              min={20}
                              max={200}
                              step={0.1}
                              value={medicalForm.weight}
                              onChange={(e) => setMedicalForm((f) => ({ ...f, weight: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                      <div style={MODAL_CONTENT_ACTIONS_STYLE}>
                        <button type="button" className="btn" style={MODAL_CONTENT_CANCEL_BUTTON_STYLE} onClick={() => setSubView(null)}>취소</button>
                        <button type="submit" className="btn" style={{ ...MODAL_CONTENT_SAVE_BUTTON_STYLE, background: "#0891b2" }} disabled={medicalSaving}>
                          {medicalSaving ? <><span className="spinner-border spinner-border-sm" /> 저장 중...</> : <><i className="ri-check-line"></i> 저장</>}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 진로희망 탭 */}
                  {detailEditTab === "career" && (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!selectedStudent) return;
                      if (!careerForm.academicTermId) { setCareerError("학기를 선택해주세요."); return; }
                      setCareerSaving(true);
                      setCareerError(null);
                      try {
                        await api.post("/career-aspirations/student", {
                          studentId: selectedStudent.studentId,
                          academicTermId: careerForm.academicTermId,
                          specialtyOrInterest: careerForm.specialtyOrInterest,
                          studentDesiredJob: careerForm.studentDesiredJob,
                        });
                        if (careerForm.parentDesiredJob) {
                          await api.post("/career-aspirations/parent", {
                            studentId: selectedStudent.studentId,
                            academicTermId: careerForm.academicTermId,
                            parentDesiredJob: careerForm.parentDesiredJob,
                          });
                        }
                        setSubView(null);
                      } catch (err: unknown) {
                        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                        setCareerError(msg ?? "진로희망 저장에 실패했습니다.");
                      } finally {
                        setCareerSaving(false);
                      }
                    }}>
                      <div className="p-20" style={MODAL_CONTENT_BODY_STYLE}>
                        {careerError && <div className="alert alert-danger radius-8 mb-12 text-sm">{careerError}</div>}
                        <div className="row gy-14" style={MODAL_CONTENT_ROW_STYLE}>
                          <div className="col-12">
                            <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>학기 *</label>
                            {academicTerms.length === 0 ? (
                              <div className="text-secondary-light text-sm py-6" style={MODAL_CONTENT_LOADING_STYLE}><span className="spinner-border spinner-border-sm me-6" />불러오는 중...</div>
                            ) : (
                              <select
                                className="form-select"
                                style={MODAL_CONTENT_CONTROL_STYLE}
                                value={careerForm.academicTermId ?? ""}
                                onChange={(e) => {
                                  const termId = Number(e.target.value);
                                  const term = academicTerms.find((t) => t.id === termId);
                                  const existing = term ? careerRecords.find((c) => c.schoolYear === term.schoolYear && c.semester === term.semester) : null;
                                  setCareerForm({ academicTermId: termId, specialtyOrInterest: existing?.specialtyOrInterest ?? "", studentDesiredJob: existing?.studentDesiredJob ?? "", parentDesiredJob: existing?.parentDesiredJob ?? "" });
                                }}
                                required
                              >
                                {academicTerms.map((t) => <option key={t.id} value={t.id}>{t.displayName}</option>)}
                              </select>
                            )}
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>특기 또는 흥미</label>
                            <input
                              type="text"
                              className="form-control"
                              style={MODAL_CONTENT_CONTROL_STYLE}
                              placeholder="예: 컴퓨터, 음악"
                              value={careerForm.specialtyOrInterest}
                              onChange={(e) => setCareerForm((f) => ({ ...f, specialtyOrInterest: e.target.value }))}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>학생 희망직업</label>
                            <input
                              type="text"
                              className="form-control"
                              style={MODAL_CONTENT_CONTROL_STYLE}
                              placeholder="예: 소프트웨어 엔지니어"
                              value={careerForm.studentDesiredJob}
                              onChange={(e) => setCareerForm((f) => ({ ...f, studentDesiredJob: e.target.value }))}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>부모 희망직업</label>
                            <input
                              type="text"
                              className="form-control"
                              style={MODAL_CONTENT_CONTROL_STYLE}
                              placeholder="예: 의사"
                              value={careerForm.parentDesiredJob}
                              onChange={(e) => setCareerForm((f) => ({ ...f, parentDesiredJob: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                      <div style={MODAL_CONTENT_ACTIONS_STYLE}>
                        <button type="button" className="btn" style={MODAL_CONTENT_CANCEL_BUTTON_STYLE} onClick={() => setSubView(null)}>취소</button>
                        <button type="submit" className="btn" style={{ ...MODAL_CONTENT_SAVE_BUTTON_STYLE, background: "#16a34a" }} disabled={careerSaving}>
                          {careerSaving ? <><span className="spinner-border spinner-border-sm" /> 저장 중...</> : <><i className="ri-check-line"></i> 저장</>}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 학적사항 탭 */}
                  {detailEditTab === "enrollment" && (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!selectedStudent) return;
                      setEnrollmentSaving(true);
                      setEnrollmentError(null);
                      try {
                        await api.put(`/students/info/${selectedStudent.studentId}`, {
                          phone: enrollmentForm.phone || null,
                          address: enrollmentForm.address || null,
                          previousSchoolName: enrollmentForm.previousSchoolName || null,
                          admissionDate: enrollmentForm.admissionDate || null,
                        });
                        setSubView(null);
                      } catch (err: unknown) {
                        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                        setEnrollmentError(msg ?? "학적사항 저장에 실패했습니다.");
                      } finally {
                        setEnrollmentSaving(false);
                      }
                    }}>
                      <div className="p-20" style={MODAL_CONTENT_BODY_STYLE}>
                        {enrollmentError && <div className="alert alert-danger radius-8 mb-12 text-sm">{enrollmentError}</div>}
                        <div className="row gy-14" style={MODAL_CONTENT_ROW_STYLE}>
                          <div className="col-12">
                            <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>연락처</label>
                            <input
                              type="text"
                              className="form-control"
                              style={MODAL_CONTENT_CONTROL_STYLE}
                              placeholder="010-0000-0000"
                              value={enrollmentForm.phone}
                              onChange={(e) => setEnrollmentForm((f) => ({ ...f, phone: e.target.value }))}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>주소</label>
                            <input
                              type="text"
                              className="form-control"
                              style={MODAL_CONTENT_CONTROL_STYLE}
                              placeholder="주소를 입력하세요"
                              value={enrollmentForm.address}
                              onChange={(e) => setEnrollmentForm((f) => ({ ...f, address: e.target.value }))}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>이전 학교명</label>
                            <input
                              type="text"
                              className="form-control"
                              style={MODAL_CONTENT_CONTROL_STYLE}
                              placeholder="이전에 재학한 학교명"
                              value={enrollmentForm.previousSchoolName}
                              onChange={(e) => setEnrollmentForm((f) => ({ ...f, previousSchoolName: e.target.value }))}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>입학일</label>
                            <input
                              type="date"
                              className="form-control"
                              style={MODAL_CONTENT_CONTROL_STYLE}
                              value={enrollmentForm.admissionDate}
                              onChange={(e) => setEnrollmentForm((f) => ({ ...f, admissionDate: e.target.value }))}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-secondary-light mt-10 mb-0" style={{ ...MODAL_CONTENT_HELPER_STYLE, marginBottom: 0, marginTop: 10 }}>
                          <i className="ri-information-line me-4" />
                          입력하지 않은 항목은 변경되지 않습니다.
                        </p>
                      </div>
                      <div style={MODAL_CONTENT_ACTIONS_STYLE}>
                        <button type="button" className="btn" style={MODAL_CONTENT_CANCEL_BUTTON_STYLE} onClick={() => setSubView(null)}>취소</button>
                        <button type="submit" className="btn" style={{ ...MODAL_CONTENT_SAVE_BUTTON_STYLE, background: "#7c3aed" }} disabled={enrollmentSaving}>
                          {enrollmentSaving ? <><span className="spinner-border spinner-border-sm" /> 저장 중...</> : <><i className="ri-check-line"></i> 저장</>}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* 활동 정보 뷰 */}
              {subView === "activity-info" && (
                <div className="modal-body p-0" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                  {activityInfo.loading ? (
                    <div className="text-center py-24 text-secondary-light" style={{ fontSize: 13 }}>
                      <span className="spinner-border spinner-border-sm me-8" />
                      불러오는 중...
                    </div>
                  ) : (
                    <>
                      {/* 봉사활동 섹션 */}
                      <div style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <div className="d-flex align-items-center gap-6 px-16 py-8" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                          <i className="ri-user-heart-line" style={{ fontSize: 13, color: "#16a34a" }}></i>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>봉사활동</span>
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>({activityInfo.volunteers.length}건)</span>
                        </div>
                        {activityInfo.volunteers.length === 0 ? (
                          <div className="px-16 py-10 text-secondary-light" style={{ fontSize: 12 }}>등록된 봉사활동이 없습니다.</div>
                        ) : (
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                            <thead>
                              <tr style={{ background: "#f9fafb" }}>
                                {["학년도", "기간", "장소/기관", "내용", "시간", "누계"].map((h) => (
                                  <th key={h} style={{ padding: "5px 10px", color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {activityInfo.volunteers.map((v) => (
                                <tr key={v.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                  <td style={{ padding: "5px 10px", whiteSpace: "nowrap", color: "#374151" }}>{v.schoolYear}학년도</td>
                                  <td style={{ padding: "5px 10px", whiteSpace: "nowrap", color: "#6b7280" }}>{String(v.startDate).slice(0, 10)}{v.endDate ? `~${String(v.endDate).slice(5, 10)}` : ""}</td>
                                  <td style={{ padding: "5px 10px", color: "#6b7280", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.organizer}</td>
                                  <td style={{ padding: "5px 10px", color: "#374151", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.activityContent}</td>
                                  <td style={{ padding: "5px 10px", whiteSpace: "nowrap", color: "#16a34a", fontWeight: 600 }}>{v.hours}h</td>
                                  <td style={{ padding: "5px 10px", whiteSpace: "nowrap", color: "#9ca3af" }}>{v.cumulativeHours}h</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* 수상경력 섹션 */}
                      <div>
                        <div className="d-flex align-items-center gap-6 px-16 py-8" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                          <i className="ri-trophy-line" style={{ fontSize: 13, color: "#ca8a04" }}></i>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>수상경력</span>
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>({activityInfo.awards.length}건)</span>
                        </div>
                        {activityInfo.awards.length === 0 ? (
                          <div className="px-16 py-10 text-secondary-light" style={{ fontSize: 12 }}>등록된 수상경력이 없습니다.</div>
                        ) : (
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                            <thead>
                              <tr style={{ background: "#f9fafb" }}>
                                {["수상명", "등급", "수상일", "수상기관"].map((h) => (
                                  <th key={h} style={{ padding: "5px 10px", color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {activityInfo.awards.map((a) => (
                                <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                  <td style={{ padding: "5px 10px", color: "#374151", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</td>
                                  <td style={{ padding: "5px 10px", whiteSpace: "nowrap" }}>
                                    <span style={{ fontSize: 11, color: "#ca8a04", background: "#fef9c3", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
                                      {a.achievementsGradeLabel ?? (
                                        a.achievementsGrade === "GOLD" ? "금상" :
                                        a.achievementsGrade === "SILVER" ? "은상" :
                                        a.achievementsGrade === "BRONZE" ? "동상" :
                                        a.achievementsGrade === "HONORABLE_MENTION" ? "장려" :
                                        a.achievementsGrade ?? "-"
                                      )}
                                    </span>
                                  </td>
                                  <td style={{ padding: "5px 10px", whiteSpace: "nowrap", color: "#6b7280" }}>{a.day ? String(a.day).slice(0, 10) : "-"}</td>
                                  <td style={{ padding: "5px 10px", color: "#6b7280", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.organization ?? "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 행동특성 및 종합의견 폼 */}
              {subView === "behavior" && (
                <form onSubmit={handleSaveBehavior}>
                  <div className="modal-body p-24" style={MODAL_CONTENT_BODY_STYLE}>
                    {behaviorError && (
                      <div className="alert alert-danger radius-8 mb-16 text-sm">{behaviorError}</div>
                    )}
                    <div className="row gy-16" style={MODAL_CONTENT_ROW_STYLE}>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>학기 *</label>
                        {academicTerms.length === 0 ? (
                          <div className="text-secondary-light text-sm py-8" style={MODAL_CONTENT_LOADING_STYLE}>
                            <span className="spinner-border spinner-border-sm me-8" />
                            학기 목록 불러오는 중...
                          </div>
                        ) : (
                          <select
                            className="form-select"
                            style={MODAL_CONTENT_CONTROL_STYLE}
                            value={behaviorForm.academicTermId ?? ""}
                            onChange={(e) => {
                              const newTermId = Number(e.target.value);
                              const term = academicTerms.find((t) => t.id === newTermId);
                              const existing = term ? behaviorRecords.find((r) => r.schoolYear === term.schoolYear && r.semester === term.semester) : null;
                              setBehaviorForm({ academicTermId: newTermId, specialNotes: existing?.specialNotes ?? "" });
                            }}
                            required
                          >
                            {academicTerms.map((t) => (
                              <option key={t.id} value={t.id}>{t.displayName}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-sm" style={MODAL_CONTENT_LABEL_STYLE}>행동특성 및 종합의견 *</label>
                        <div className="text-xs text-secondary-light mb-6" style={MODAL_CONTENT_HELPER_STYLE}>
                          학년도+학기 기준으로 저장되며, 기존 내용이 있으면 덮어씁니다.
                        </div>
                        <textarea
                          className="form-control"
                          rows={10}
                          placeholder="행동특성 및 종합의견을 입력하세요"
                          value={behaviorForm.specialNotes}
                          onChange={(e) => setBehaviorForm((f) => ({ ...f, specialNotes: e.target.value }))}
                          style={{ ...MODAL_CONTENT_CONTROL_STYLE, height: "auto", resize: "vertical", minHeight: 200, lineHeight: 1.5 }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer" style={MODAL_CONTENT_ACTIONS_STYLE}>
                    <button
                      type="button"
                      className="btn"
                      style={MODAL_CONTENT_CANCEL_BUTTON_STYLE}
                      onClick={() => setSubView(null)}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="btn"
                      style={{ ...MODAL_CONTENT_SAVE_BUTTON_STYLE, background: "#9333ea" }}
                      disabled={behaviorSaving}
                    >
                      {behaviorSaving ? (
                        <><span className="spinner-border spinner-border-sm" /> 저장 중...</>
                      ) : (
                        <><i className="ri-check-line"></i> 저장</>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
