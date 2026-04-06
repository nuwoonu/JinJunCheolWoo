import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [cheol] /teacher/ability-students - 세부능력 및 특기사항 입력 페이지

interface Student {
  id: number;
  studentNumber: number | null;
  fullStudentNumber: string | null;
  studentCode: string | null;
  year: number;
  classNum: number | null;
  userName: string | null;
  userEmail: string | null;
  gender: string | null;
}

interface TeacherInfo {
  subjectName: string;
  subjectCode: string | null;
}

export default function AbilityStudents() {
  const [searchParams] = useSearchParams();
  const classroomId = searchParams.get("classroomId");

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo>({ subjectName: "", subjectCode: null });

  // 모달 상태
  const [modalStudent, setModalStudent] = useState<Student | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loadingAbility, setLoadingAbility] = useState(false);

  // 이미 작성된 학생 목록 (studentId set)
  const [writtenSet, setWrittenSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    const url = classroomId ? `/students?classroomId=${classroomId}` : "/students";
    Promise.all([
      api.get(url),
      api.get("/dashboard/teacher"),
    ])
      .then(([studentsRes, dashRes]) => {
        setStudents(studentsRes.data ?? []);
        setTeacherInfo({
          subjectName: dashRes.data.teacherSubject ?? "",
          subjectCode: dashRes.data.teacherSubjectCode ?? null,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classroomId]);

  // 학급 학생 전체의 세부능력 작성 여부 파악 (과목 코드가 있을 때)
  useEffect(() => {
    if (!teacherInfo.subjectCode || students.length === 0) return;
    const written = new Set<number>();
    Promise.all(
      students.map((s) =>
        api
          .get(`/student-abilities/student/${s.id}/subject`, {
            params: { subjectCode: teacherInfo.subjectCode },
          })
          .then((res) => {
            if (res.status === 200 && res.data) written.add(s.id);
          })
          .catch(() => {})
      )
    ).then(() => setWrittenSet(new Set(written)));
  }, [teacherInfo.subjectCode, students]);

  // 모달 열기: 기존 내용 불러오기
  const openModal = (s: Student) => {
    setModalStudent(s);
    setSaveResult(null);
    if (!teacherInfo.subjectCode) {
      setContent("");
      return;
    }
    setLoadingAbility(true);
    api
      .get(`/student-abilities/student/${s.id}/subject`, {
        params: { subjectCode: teacherInfo.subjectCode },
      })
      .then((res) => {
        if (res.status === 200 && res.data?.content) {
          setContent(res.data.content);
        } else {
          setContent("");
        }
      })
      .catch(() => setContent(""))
      .finally(() => setLoadingAbility(false));
  };

  const handleSave = async () => {
    if (!modalStudent || !teacherInfo.subjectCode) {
      setSaveResult({ ok: false, msg: "과목 정보를 불러오지 못했습니다." });
      return;
    }
    if (!content.trim()) {
      setSaveResult({ ok: false, msg: "내용을 입력해주세요." });
      return;
    }
    setSaving(true);
    setSaveResult(null);
    try {
      await api.post("/student-abilities", {
        studentId: modalStudent.id,
        subjectCode: teacherInfo.subjectCode,
        content: content.trim(),
      });
      setSaveResult({ ok: true, msg: "저장되었습니다." });
      setWrittenSet((prev) => new Set(prev).add(modalStudent.id));
    } catch (e: any) {
      setSaveResult({
        ok: false,
        msg: e?.response?.data?.message ?? "저장 중 오류가 발생했습니다.",
      });
    } finally {
      setSaving(false);
    }
  };

  // 모달 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = modalStudent ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modalStudent]);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.userName?.toLowerCase().includes(q) ||
      s.fullStudentNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학생 세부능력 및 특기사항</h6>
          <div>
            <Link to="/teacher/ability-classes" className="text-secondary-light hover-text-primary hover-underline">
              학급 선택
            </Link>
            <span className="text-neutral-600"> / 학생 목록</span>
          </div>
        </div>
      </div>

      <div className="card radius-12">
        <div className="card-header py-16 px-24 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-12">
          <div className="d-flex align-items-center gap-12">
            <h6 className="mb-0">학생 목록</h6>
            {teacherInfo.subjectName && (
              <span className="badge bg-success-100 text-success-600 px-10 py-4 radius-4 text-sm">
                담당 과목: {teacherInfo.subjectName}
              </span>
            )}
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="이름 또는 학번으로 검색"
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
                  <th>학번</th>
                  <th>이름</th>
                  <th>학년/반</th>
                  <th>이메일</th>
                  <th className="text-center">작성 여부</th>
                  <th className="text-center">입력</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-24 text-secondary-light">
                      불러오는 중...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-24 text-secondary-light">
                      등록된 학생이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id}>
                      <td className="fw-medium">{s.fullStudentNumber ?? s.studentCode ?? "-"}</td>
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <div className="w-36-px h-36-px bg-success-100 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                            <iconify-icon icon="mdi:account" className="text-success-600" />
                          </div>
                          <span className="fw-medium">{s.userName ?? "-"}</span>
                        </div>
                      </td>
                      <td className="text-secondary-light">
                        {s.year && s.classNum ? `${s.year}학년 ${s.classNum}반` : "-"}
                      </td>
                      <td className="text-secondary-light">{s.userEmail ?? "-"}</td>
                      <td className="text-center">
                        {writtenSet.has(s.id) ? (
                          <span className="badge bg-success-100 text-success-600 px-8 py-4 radius-4 text-xs">
                            <iconify-icon icon="mdi:check-circle" className="me-4" />작성됨
                          </span>
                        ) : (
                          <span className="badge bg-neutral-100 text-secondary-light px-8 py-4 radius-4 text-xs">
                            미작성
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-success-600 radius-4"
                          onClick={() => openModal(s)}
                        >
                          <iconify-icon icon="mdi:text-box-edit-outline" />{" "}
                          {writtenSet.has(s.id) ? "수정" : "입력"}
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

      {/* 세부능력 입력/수정 모달 */}
      {modalStudent && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">
                  세부능력 및 특기사항 —{" "}
                  <span className="text-success-600 fw-bold">{modalStudent.userName ?? "-"}</span>
                  <span className="text-secondary-light fw-normal text-sm ms-8">
                    ({modalStudent.fullStudentNumber ?? modalStudent.studentCode ?? "-"})
                  </span>
                </h6>
                <button type="button" className="btn-close" onClick={() => setModalStudent(null)} />
              </div>
              <div className="modal-body p-24">
                <div className="d-flex flex-column gap-16">
                  <div>
                    <label className="form-label fw-medium text-sm mb-6">담당 과목</label>
                    <input
                      type="text"
                      className="form-control"
                      value={teacherInfo.subjectName || "과목 정보 없음"}
                      readOnly
                      style={{ background: "#f8fafc" }}
                    />
                  </div>
                  <div>
                    <label className="form-label fw-medium text-sm mb-6">
                      세부능력 및 특기사항
                    </label>
                    {loadingAbility ? (
                      <div className="text-center py-12 text-secondary-light text-sm">
                        기존 내용 불러오는 중...
                      </div>
                    ) : (
                      <textarea
                        className="form-control"
                        rows={8}
                        placeholder="세부능력 및 특기사항을 입력하세요"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        style={{ resize: "vertical", minHeight: 180 }}
                        autoFocus
                      />
                    )}
                  </div>
                  {saveResult && (
                    <div className={`alert ${saveResult.ok ? "alert-success" : "alert-danger"} py-10 px-14 mb-0`}>
                      {saveResult.msg}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24 d-flex gap-8">
                <button
                  type="button"
                  className="btn btn-success-600 radius-8"
                  onClick={handleSave}
                  disabled={saving || loadingAbility || !teacherInfo.subjectCode}
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-neutral-300 radius-8"
                  onClick={() => setModalStudent(null)}
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
