import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo] /student/list - 학생 리스트 (STUDENT, TEACHER, ADMIN 공용)

// [woo] StudentStatus enum description 한글화 매핑
const STATUS_LABEL: Record<string, string> = {
  PENDING: "승인대기",
  ENROLLED: "재학",
  LEAVE_OF_ABSENCE: "휴학",
  DROPOUT: "자퇴",
  EXPELLED: "제적",
  GRADUATED: "졸업",
  TRANSFERRED: "전학",
};

interface Student {
  id: number;
  studentNumber: number | null;
  fullStudentNumber: string | null;
  studentCode: string | null;
  year: number;
  classNum: number | null;
  userName: string | null;
  userEmail: string | null;
  phone: string | null;
  gender: string | null;
  status: string | null;
}

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    api
      .get("/students")
      .then((res) => setStudents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.userName?.toLowerCase().includes(q) ||
      s.fullStudentNumber?.toLowerCase().includes(q) ||
      s.userEmail?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학생</h6>
          <div>
            <Link to="/student/dashboard" className="text-secondary-light hover-text-primary hover-underline">
              학생 대시보드{" "}
            </Link>
            <span className="text-neutral-600 mt-4 mb-0"> / 학생 리스트</span>
          </div>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">학생</li>
          <li>-</li>
          <li className="fw-medium">학생 리스트</li>
        </ul>
      </div>

      <div className="card radius-12">
        <div className="card-header py-16 px-24 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-12">
          <h6 className="mb-0">학생 목록</h6>
          <input
            type="text"
            className="form-control"
            placeholder="이름, 학번, 이메일 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col">학번</th>
                  <th scope="col">이름</th>
                  <th scope="col">학년/반</th>
                  <th scope="col">연락처</th>
                  <th scope="col">이메일</th>
                  <th scope="col" className="text-center">
                    성별
                  </th>
                  <th scope="col" className="text-center">
                    상세
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-24 text-secondary-light">
                      불러오는 중...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-24 text-secondary-light">
                      등록된 학생이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id}>
                      <td className="fw-medium">{s.fullStudentNumber ?? s.studentCode ?? "-"}</td>
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <div className="w-36-px h-36-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                            <iconify-icon icon="mdi:account" className="text-primary-600" />
                          </div>
                          <span className="fw-medium">{s.userName ?? "-"}</span>
                        </div>
                      </td>
                      <td className="text-secondary-light">
                        {s.year && s.classNum ? `${s.year}학년 ${s.classNum}반` : "-"}
                      </td>
                      <td className="text-secondary-light">{s.phone ?? "-"}</td>
                      <td className="text-secondary-light">{s.userEmail ?? "-"}</td>
                      <td className="text-center text-secondary-light">
                        {s.gender === "MALE" ? "남" : s.gender === "FEMALE" ? "여" : "-"}
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary-600 radius-4"
                          onClick={() => setSelectedStudent(s)}
                        >
                          <iconify-icon icon="mdi:eye-outline" />
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
                  <h5 className="mb-4">{selectedStudent.userName ?? "-"}</h5>
                  <span className="text-secondary-light">
                    {selectedStudent.fullStudentNumber ?? selectedStudent.studentCode ?? "-"}
                  </span>
                </div>
                <div className="d-flex flex-column gap-12">
                  {[
                    {
                      label: "학년/반",
                      value:
                        selectedStudent.year && selectedStudent.classNum
                          ? `${selectedStudent.year}학년 ${selectedStudent.classNum}반`
                          : "-",
                    },
                    { label: "연락처", value: selectedStudent.phone },
                    { label: "이메일", value: selectedStudent.userEmail },
                    {
                      label: "성별",
                      value:
                        selectedStudent.gender === "MALE" ? "남" : selectedStudent.gender === "FEMALE" ? "여" : "-",
                    },
                    // [woo] STATUS_LABEL로 한글 변환, 매핑 없는 값은 원본 그대로 표시
                    {
                      label: "상태",
                      value: selectedStudent.status
                        ? (STATUS_LABEL[selectedStudent.status] ?? selectedStudent.status)
                        : null,
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="d-flex justify-content-between align-items-center py-10 border-bottom"
                    >
                      <span className="text-secondary-light text-sm">{row.label}</span>
                      <span className="fw-medium text-sm">{row.value ?? "-"}</span>
                    </div>
                  ))}
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
