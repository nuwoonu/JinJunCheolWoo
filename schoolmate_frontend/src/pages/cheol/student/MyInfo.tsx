import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/auth";
import { useAuth } from "../../../contexts/AuthContext";
import DashboardLayout from "../../../components/layout/DashboardLayout";

// [cheol] /student/myinfo - 학생 본인 정보 (student/student-details.html 구조 그대로)

const STATUS_LABEL: Record<string, string> = {
  PENDING: "승인대기",
  ENROLLED: "재학",
  LEAVE_OF_ABSENCE: "휴학",
  DROPOUT: "자퇴",
  EXPELLED: "제적",
  GRADUATED: "졸업",
  TRANSFERRED: "전학",
};
const STATUS_COLOR: Record<string, string> = {
  ENROLLED: "bg-success-100 text-success-600",
  LEAVE_OF_ABSENCE: "bg-warning-100 text-warning-600",
  DROPOUT: "bg-danger-100 text-danger-600",
  EXPELLED: "bg-danger-100 text-danger-600",
  GRADUATED: "bg-primary-100 text-primary-600",
  TRANSFERRED: "bg-info-100 text-info-600",
  PENDING: "bg-neutral-100 text-secondary-light",
};
const GENDER_LABEL: Record<string, string> = { MALE: "남성", FEMALE: "여성" };

const TABS = [
  { key: "details", icon: "ri-group-line", label: "Student Details" },
  { key: "attendance", icon: "ri-calendar-check-line", label: "Attendance" },
  { key: "awards", icon: "ri-trophy-line", label: "수상경력" },
  { key: "fees", icon: "ri-money-dollar-box-line", label: "Fees" },
  { key: "grades", icon: "ri-file-edit-line", label: "성적" },
  { key: "library", icon: "ri-book-line", label: "Library" },
];

interface Guardian {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
  representative: boolean;
}

interface Award {
  id: number;
  name: string;
  achievementsGrade?: string;
  day?: string;
  organization?: string;
}

interface StudentInfo {
  id: number;
  studentNumber?: number;
  fullStudentNumber?: string;
  studentCode?: string;
  year: number;
  classNum?: number;
  birthDate?: string;
  address?: string;
  addressDetail?: string;
  phone?: string;
  gender?: string;
  status?: string;
  basicHabits?: string;
  specialNotes?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  userUid?: number;
  userName?: string;
  userEmail?: string;
  guardians?: Guardian[];
  awards?: Award[];
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="d-flex gap-4">
      <span className="fw-semibold text-sm text-primary-light w-110-px">{label}</span>
      <span className="fw-normal text-sm text-secondary-light">: {value ?? "-"}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="shadow-1 radius-12 bg-base h-100 overflow-hidden">
      <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between">
        <h6 className="text-lg fw-semibold mb-0">{title}</h6>
      </div>
      <div className="card-body p-0">{children}</div>
    </div>
  );
}

export default function StudentMyInfo() {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", birthDate: "", address: "", gender: "" });
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    if (!student) return;
    setEditForm({
      name: student.userName ?? "",
      phone: student.phone ?? "",
      birthDate: student.birthDate?.slice(0, 10) ?? "",
      address: student.address ?? "",
      gender: student.gender ?? "",
    });
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await api.put(`/students/user/${user.uid}`, {
        name: editForm.name || null,
        phone: editForm.phone || null,
        birthDate: editForm.birthDate || null,
        address: editForm.address || null,
        gender: editForm.gender || null,
      });
      const res = await api.get(`/students/${user.uid}`);
      setStudent(res.data);
      setIsEditing(false);
    } catch {
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([api.get(`/students/user/${user.uid}`), api.get("/dashboard/student")])
      .then(([studentRes, dashRes]) => {
        setStudent(studentRes.data);
        if (dashRes.data?.profileImageUrl) setProfileImageUrl(dashRes.data.profileImageUrl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.uid]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-80 text-secondary-light">불러오는 중...</div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="card border-0 p-80 text-center">
          <i className="ri-user-search-line text-5xl text-neutral-300 mb-16" />
          <h5 className="text-secondary-light">학생 정보를 불러올 수 없습니다.</h5>
        </div>
      </DashboardLayout>
    );
  }

  const statusLabel = student.status ? (STATUS_LABEL[student.status] ?? student.status) : "재학";
  const statusClass = student.status
    ? (STATUS_COLOR[student.status] ?? "bg-neutral-100 text-secondary-light")
    : "bg-success-100 text-success-600";

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student Details</h1>
          <div>
            <Link to="/student/dashboard" className="text-secondary-light hover-text-primary hover-underline">
              Dashboard{" "}
            </Link>
            <span className="text-secondary-light"> / Student</span>
            <span className="text-secondary-light"> / Student Details</span>
          </div>
        </div>
      </div>

      {/* 프로필 카드 (상단) */}
      <div className="card h-100 mb-16">
        <div className="card-body p-24">
          <div className="d-flex gap-32 flex-md-row flex-column">
            {/* 왼쪽: 아바타 + 이름 + 학번 + 버튼 */}
            <div className="max-w-300-px w-100 text-center">
              <figure className="mb-24 w-120-px h-120-px mx-auto rounded-circle overflow-hidden bg-neutral-100 d-flex align-items-center justify-content-center">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="프로필" className="w-100 h-100 object-fit-cover" />
                ) : (
                  <span className="text-neutral-400" style={{ fontSize: 48 }}>
                    <i className="ri-user-3-line" />
                  </span>
                )}
              </figure>
              <h2 className="h6 text-primary-light mb-16 fw-semibold">{student.userName ?? "-"}</h2>
              <p className="mb-0">
                학번:{" "}
                <span className="text-primary-600 fw-semibold">
                  {student.studentCode ?? student.fullStudentNumber ?? "-"}
                </span>
              </p>
              <p className="mb-0">
                번 번호: <span className="text-primary-light fw-semibold">{student.studentNumber ?? "-"}</span>
              </p>
              <div className="mt-32 d-flex gap-16 w-100">
                {!isEditing ? (
                  <button
                    type="button"
                    className="btn btn-primary-600 border fw-medium border-primary-600 text-md d-flex justify-content-center align-items-center gap-8 flex-grow-1 px-12 py-8 radius-8"
                    onClick={startEdit}
                  >
                    <span className="d-flex text-lg">
                      <i className="ri-edit-line" />
                    </span>
                    수정
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary-600 border fw-medium border-primary-600 text-md d-flex justify-content-center align-items-center gap-8 flex-grow-1 px-12 py-8 radius-8"
                      onClick={saveEdit}
                      disabled={saving}
                    >
                      <span className="d-flex text-lg">
                        <i className="ri-save-line" />
                      </span>
                      {saving ? "저장 중..." : "저장"}
                    </button>
                    <button
                      type="button"
                      className="btn border fw-medium border-neutral-200 text-md d-flex justify-content-center align-items-center gap-8 flex-grow-1 px-12 py-8 radius-8"
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                    >
                      취소
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 구분선 */}
            <div>
              <span className="h-100 w-1-px bg-neutral-200 d-block" />
            </div>

            {/* 오른쪽: 개인정보 */}
            <div className="flex-grow-1">
              <div className="pb-16 border-bottom d-flex align-items-center justify-content-between gap-20">
                <h3 className="h6 text-primary-light text-lg mb-0 fw-semibold">개인정보</h3>
                <span className={`px-16 py-4 radius-4 fw-medium text-sm ${statusClass}`}>{statusLabel}</span>
              </div>
              {!isEditing ? (
                <div className="mt-16 d-flex flex-column gap-8">
                  <InfoRow label="학번" value={student.fullStudentNumber ?? student.studentCode} />
                  <InfoRow label="학년" value={student.year ? `${student.year}학년` : undefined} />
                  <InfoRow label="반" value={student.classNum ? `${student.classNum}반` : undefined} />
                  <InfoRow
                    label="성별"
                    value={student.gender ? (GENDER_LABEL[student.gender] ?? student.gender) : undefined}
                  />
                  <InfoRow label="생년월일" value={student.birthDate?.slice(0, 10)} />
                  <InfoRow label="주소" value={student.address} />
                  <InfoRow label="연락처" value={student.phone} />
                  <InfoRow label="이메일" value={student.userEmail} />
                </div>
              ) : (
                <div className="mt-16 d-flex flex-column gap-12">
                  {/* 읽기 전용 */}
                  <InfoRow label="학번" value={student.fullStudentNumber ?? student.studentCode} />
                  <InfoRow label="학년" value={student.year ? `${student.year}학년` : undefined} />
                  <InfoRow label="반" value={student.classNum ? `${student.classNum}반` : undefined} />
                  <InfoRow label="이메일" value={student.userEmail} />
                  {/* 수정 가능 */}
                  <div className="d-flex align-items-center gap-4">
                    <span className="fw-semibold text-sm text-primary-light w-110-px flex-shrink-0">이름</span>
                    <input
                      className="form-control form-control-sm"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <span className="fw-semibold text-sm text-primary-light w-110-px flex-shrink-0">성별</span>
                    <select
                      className="form-select form-select-sm"
                      value={editForm.gender}
                      onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                    >
                      <option value="">선택</option>
                      <option value="MALE">남성</option>
                      <option value="FEMALE">여성</option>
                    </select>
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <span className="fw-semibold text-sm text-primary-light w-110-px flex-shrink-0">생년월일</span>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={editForm.birthDate}
                      onChange={(e) => setEditForm((f) => ({ ...f, birthDate: e.target.value }))}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <span className="fw-semibold text-sm text-primary-light w-110-px flex-shrink-0">주소</span>
                    <input
                      className="form-control form-control-sm"
                      value={editForm.address}
                      onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-4">
                    <span className="fw-semibold text-sm text-primary-light w-110-px flex-shrink-0">연락처</span>
                    <input
                      className="form-control form-control-sm"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="my-16">
        <ul className="nav nav-pills bordered-tab mb-3" role="tablist">
          {TABS.map((tab) => (
            <li key={tab.key} className="nav-item" role="presentation">
              <button
                className={`nav-link d-flex align-items-center gap-8 text-secondary-light fw-medium text-sm text-hover-primary-600 text-capitalize bg-transparent px-20 py-12${activeTab === tab.key ? " active" : ""}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="d-flex tab-icon line-height-1 text-md">
                  <i className={tab.icon} />
                </span>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="tab-content">
          {/* Student Details 탭 */}
          {activeTab === "details" && (
            <div className="row gy-4">
              {/* 보호자 정보 (col-12) */}
              <div className="col-12">
                <SectionCard title="보호자 정보">
                  {student.guardians && student.guardians.length > 0 ? (
                    student.guardians.map((g, i) => (
                      <div key={g.id ?? i} className="bg-hover-neutral-50 p-20">
                        <div className="row g-4">
                          <div className="col-sm-4">
                            <div className="d-flex align-items-center gap-12">
                              <figure className="w-48-px h-48-px rounded-circle overflow-hidden mb-0 bg-neutral-100 d-flex align-items-center justify-content-center flex-shrink-0">
                                <i className="ri-user-line text-neutral-400 text-xl" />
                              </figure>
                              <div>
                                <h6 className="text-md mb-2 fw-medium flex-grow-1">{g.name}</h6>
                                <span>
                                  {g.relationship ?? "-"}
                                  {g.representative && (
                                    <span className="ms-6 badge bg-primary-100 text-primary-600 text-xs px-6 py-2 radius-4">
                                      주보호자
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-4">
                            <h6 className="text-md mb-2 fw-medium">연락처</h6>
                            <span>{g.phone ?? "-"}</span>
                          </div>
                          <div className="col-sm-4">
                            <h6 className="text-md mb-2 fw-medium">이메일</h6>
                            <span>{g.email ?? "-"}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-20 text-secondary-light text-sm">등록된 보호자가 없습니다.</div>
                  )}
                </SectionCard>
              </div>

              {/* 이전 학교 정보 (col-md-6) */}
              <div className="col-md-6">
                <SectionCard title="이전 학교 정보">
                  <div className="p-20">
                    <div className="row gy-4">
                      <div className="col-sm-12">
                        <h6 className="text-md mb-2 fw-medium">이전 학교명</h6>
                        <span className="text-secondary-light">-</span>
                      </div>
                      <div className="col-sm-12">
                        <h6 className="text-md mb-2 fw-medium">재학 중인 학교명</h6>
                        <span className="text-secondary-light">-</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* 상세주소 (col-md-6) */}
              <div className="col-md-6">
                <SectionCard title="상세주소">
                  <div className="p-20">
                    <div className="row gy-4">
                      <div className="col-sm-12">
                        <h6 className="text-md mb-2 fw-medium">현재 주소</h6>
                        <span className="text-secondary-light">{student.address ?? "-"}</span>
                      </div>
                      <div className="col-sm-12">
                        <h6 className="text-md mb-2 fw-medium">현주소</h6>
                        <span className="text-secondary-light">{student.addressDetail ?? "-"}</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* 계좌 정보 (col-md-6) */}
              <div className="col-md-6">
                <SectionCard title="계좌 정보">
                  <div className="p-20">
                    <div className="row gy-4">
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">은행명</h6>
                        <span className="text-secondary-light">-</span>
                      </div>
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">지점</h6>
                        <span className="text-secondary-light">-</span>
                      </div>
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">계좌번호</h6>
                        <span className="text-secondary-light">-</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* 의료 기록 (col-md-6) */}
              <div className="col-md-6">
                <SectionCard title="의료 기록">
                  <div className="p-20">
                    <div className="row gy-4">
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">혈액형</h6>
                        <span className="text-secondary-light">{student.bloodGroup ?? "-"}</span>
                      </div>
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">신장(cm)</h6>
                        <span className="text-secondary-light">{student.height ?? "-"}</span>
                      </div>
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">체중(kg)</h6>
                        <span className="text-secondary-light">{student.weight ?? "-"}</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* 첨부 서류 (col-md-6) */}
              <div className="col-md-6">
                <SectionCard title="첨부 서류">
                  <div className="p-20">
                    <span className="text-secondary-light text-sm">등록된 서류가 없습니다.</span>
                  </div>
                </SectionCard>
              </div>

              {/* 기숙사 (col-md-6) */}
              <div className="col-md-6">
                <SectionCard title="기숙사">
                  <div className="p-20">
                    <div className="row gy-4">
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">기숙사명</h6>
                        <span className="text-secondary-light">-</span>
                      </div>
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">호실</h6>
                        <span className="text-secondary-light">-</span>
                      </div>
                      <div className="col-sm-4">
                        <h6 className="text-md mb-2 fw-medium">방 유형</h6>
                        <span className="text-secondary-light">-</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* 행동 특성 및 종합의견 (col-md-12) */}
              <div className="col-md-12">
                <SectionCard title="행동 특성 및 종합의견">
                  <div className="p-20">
                    <div className="mb-16">
                      <h6 className="text-md mb-2 fw-medium">기초 생활 기록</h6>
                      <p className="text-secondary-light mb-0" style={{ whiteSpace: "pre-wrap" }}>
                        {student.basicHabits ?? "-"}
                      </p>
                    </div>
                    <div>
                      <h6 className="text-md mb-2 fw-medium">특이사항</h6>
                      <p className="text-secondary-light mb-0" style={{ whiteSpace: "pre-wrap" }}>
                        {student.specialNotes ?? "-"}
                      </p>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {/* 수상경력 탭 */}
          {activeTab === "awards" && (
            <div className="shadow-1 radius-12 bg-base overflow-hidden">
              <div className="card-header border-bottom bg-base py-16 px-24">
                <h6 className="text-lg fw-semibold mb-0">수상 이력</h6>
              </div>
              {student.awards && student.awards.length > 0 ? (
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table bordered-table mb-0">
                      <thead>
                        <tr>
                          <th>수상명</th>
                          <th>수상일</th>
                          <th>수상 기관</th>
                          <th>등급</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.awards.map((a, i) => (
                          <tr key={a.id ?? i}>
                            <td className="fw-medium">{a.name}</td>
                            <td className="text-secondary-light">{a.day?.slice(0, 10) ?? "-"}</td>
                            <td className="text-secondary-light">{a.organization ?? "-"}</td>
                            <td className="text-secondary-light">{a.achievementsGrade ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-20 text-secondary-light text-sm">등록된 수상 이력이 없습니다.</div>
              )}
            </div>
          )}

          {/* 나머지 탭 - 준비 중 */}
          {["attendance", "fees", "grades", "library"].includes(activeTab) && (
            <div className="shadow-1 radius-12 bg-base p-40 text-center text-secondary-light">
              <i className="ri-tools-line text-3xl mb-12 d-block" />
              준비 중입니다.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
