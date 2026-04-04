import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [woo] 과제 출제 페이지 (교사 전용)
// - 제목, 내용, 학급 선택, 마감일, 첨부파일
// - POST /api/homework (multipart/form-data)

// [woo] 수업 분반 (과목 + 학급)
interface CourseSectionOption {
  id: number;
  name: string;
  subjectName: string;
  classroomName: string;
  classroomId: number;
}

export default function HomeworkCreate() {
  const navigate = useNavigate();
  const [courseSections, setCourseSections] = useState<CourseSectionOption[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    courseSectionId: "",
    dueDate: "",
    maxScore: "100",
  });
  const [file, setFile] = useState<File | null>(null);

  // [woo] 교사 수업 분반 목록 로드
  useEffect(() => {
    api
      .get("/homework/course-sections")
      .then((res) => setCourseSections(res.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert("제목을 입력해주세요.");
    if (!form.content.trim()) return alert("내용을 입력해주세요.");
    if (!form.courseSectionId) return alert("수업 분반을 선택해주세요.");
    if (!form.dueDate) return alert("마감일을 선택해주세요.");

    setSaving(true);
    try {
      const formData = new FormData();
      // [woo] JSON 데이터를 Blob으로 전송 (Spring @RequestPart("data") 대응)
      const jsonBlob = new Blob(
        [
          JSON.stringify({
            title: form.title,
            content: form.content,
            courseSectionId: Number(form.courseSectionId),
            dueDate: form.dueDate + "T23:59:59",
            maxScore: form.maxScore ? Number(form.maxScore) : 100,
          }),
        ],
        { type: "application/json" },
      );
      formData.append("data", jsonBlob);

      if (file) {
        formData.append("file", file);
      }

      await api.post("/homework", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("과제가 출제되었습니다.");
      navigate("/homework");
    } catch (err: any) {
      alert(err.response?.data || "과제 출제에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">과제</h6>
          <p className="text-neutral-600 mt-4 mb-0">과제 출제</p>
        </div>
      </div>

      <div className="card radius-12">
        <div className="card-header py-16 px-24 border-bottom">
          <h6 className="mb-0">과제 출제</h6>
        </div>
        <div className="card-body p-24">
          {/* 제목 */}
          <div className="mb-20">
            <label className="form-label fw-semibold text-sm">제목 *</label>
            <input
              type="text"
              className="form-control radius-8"
              placeholder="과제 제목을 입력하세요"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* 학급 선택 + 마감일 + 최대점수 */}
          <div className="row mb-20">
            <div className="col-md-4 mb-16 mb-md-0">
              <label className="form-label fw-semibold text-sm">수업 분반 *</label>
              <select
                className="form-select radius-8"
                value={form.courseSectionId}
                onChange={(e) => setForm((f) => ({ ...f, courseSectionId: e.target.value }))}
              >
                <option value="">수업 분반을 선택하세요</option>
                {courseSections.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-16 mb-md-0">
              <label className="form-label fw-semibold text-sm">마감일 *</label>
              <input
                type="date"
                className="form-control radius-8"
                value={form.dueDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            {/* [woo] 최대 점수 입력 */}
            <div className="col-md-4">
              <label className="form-label fw-semibold text-sm">최대 점수</label>
              <input
                type="number"
                className="form-control radius-8"
                placeholder="100"
                min={1}
                value={form.maxScore}
                onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
              />
            </div>
          </div>

          {/* 내용 */}
          <div className="mb-20">
            <label className="form-label fw-semibold text-sm">내용 *</label>
            <textarea
              className="form-control radius-8"
              rows={12}
              placeholder="과제 내용을 입력하세요"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
          </div>

          {/* [woo] 첨부파일 - 교사가 예시/참고 파일 첨부 */}
          <div className="mb-20">
            <label className="form-label fw-semibold text-sm">
              첨부파일 <span className="text-secondary-light fw-normal">(예시 파일, 참고 자료 등)</span>
            </label>
            <input
              type="file"
              className="form-control radius-8"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <div className="mt-8 d-flex align-items-center gap-8">
                <span className="text-sm text-secondary-light">
                  <iconify-icon icon="mdi:attachment" className="me-4" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger-600 radius-8"
                  onClick={() => setFile(null)}
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="d-flex justify-content-end gap-8">
            <button
              type="button"
              className="btn btn-outline-neutral-300 radius-8"
              onClick={() => navigate("/homework")}
            >
              취소
            </button>
            <button type="button" className="btn btn-primary-600 radius-8" onClick={handleSubmit} disabled={saving}>
              {saving ? "저장 중..." : "출제하기"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
