import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [woo] 과제 수정 페이지 (교사 전용)
// - GET /api/homework/{id} 로 기존 데이터 불러오기
// - PUT /api/homework/{id} (multipart/form-data) 로 수정 전송

interface ClassroomOption {
  id: number;
  name: string;
  grade: number;
  classNum: number;
}

export default function HomeworkEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    classroomId: "",
    dueDate: "",
    maxScore: "100",
  });
  // [woo] 기존 첨부파일 정보 (수정하지 않으면 그대로 유지)
  const [existingFile, setExistingFile] = useState<{ url: string; name: string } | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);

  // [woo] 학급 목록 + 기존 과제 데이터 병렬 로드
  useEffect(() => {
    Promise.all([api.get("/homework/classrooms"), api.get(`/homework/${id}`)])
      .then(([classRes, hwRes]) => {
        setClassrooms(classRes.data);
        const hw = hwRes.data;
        setForm({
          title: hw.title ?? "",
          content: hw.content ?? "",
          classroomId: String(hw.classroomId ?? ""),
          dueDate: hw.dueDate?.slice(0, 10) ?? "",
          maxScore: String(hw.maxScore ?? 100),
        });
        if (hw.attachmentUrl) {
          setExistingFile({ url: hw.attachmentUrl, name: hw.attachmentOriginalName ?? hw.attachmentUrl });
        }
      })
      .catch(() => alert("과제 정보를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert("제목을 입력해주세요.");
    if (!form.content.trim()) return alert("내용을 입력해주세요.");
    if (!form.classroomId) return alert("대상 학급을 선택해주세요.");
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
            classroomId: Number(form.classroomId),
            dueDate: form.dueDate + "T23:59:59",
            maxScore: form.maxScore ? Number(form.maxScore) : 100,
          }),
        ],
        { type: "application/json" },
      );
      formData.append("data", jsonBlob);

      // [woo] 새 파일 첨부 또는 기존 파일 유지 (removeFile=true면 파일 없이 전송)
      if (newFile) {
        formData.append("file", newFile);
      }

      await api.put(`/homework/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("과제가 수정되었습니다.");
      navigate(`/homework/${id}`);
    } catch (err: any) {
      alert(err.response?.data || "과제 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-40 text-secondary-light">불러오는 중...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">과제</h6>
          <p className="text-neutral-600 mt-4 mb-0">과제 수정</p>
        </div>
      </div>

      <div className="card radius-12">
        <div className="card-header py-16 px-24 border-bottom">
          <h6 className="mb-0">과제 수정</h6>
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
              <label className="form-label fw-semibold text-sm">대상 학급 *</label>
              <select
                className="form-select radius-8"
                value={form.classroomId}
                onChange={(e) => setForm((f) => ({ ...f, classroomId: e.target.value }))}
              >
                <option value="">학급을 선택하세요</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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

          {/* [woo] 첨부파일 - 기존 파일 표시 + 교체 가능 */}
          <div className="mb-20">
            <label className="form-label fw-semibold text-sm">
              첨부파일 <span className="text-secondary-light fw-normal">(예시 파일, 참고 자료 등)</span>
            </label>

            {/* [woo] 기존 첨부파일 표시 */}
            {existingFile && !removeFile && !newFile && (
              <div className="mb-8 d-flex align-items-center gap-8 p-12 bg-neutral-50 radius-8">
                <iconify-icon icon="mdi:attachment" />
                <span className="text-sm text-secondary-light">{existingFile.name}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger-600 radius-8 ms-auto"
                  onClick={() => setRemoveFile(true)}
                >
                  삭제
                </button>
              </div>
            )}

            <input
              type="file"
              className="form-control radius-8"
              onChange={(e) => {
                setNewFile(e.target.files?.[0] ?? null);
                setRemoveFile(false);
              }}
            />
            {newFile && (
              <div className="mt-8 d-flex align-items-center gap-8">
                <span className="text-sm text-secondary-light">
                  <iconify-icon icon="mdi:attachment" className="me-4" />
                  {newFile.name} ({(newFile.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger-600 radius-8"
                  onClick={() => setNewFile(null)}
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
              onClick={() => navigate(`/homework/${id}`)}
            >
              취소
            </button>
            <button type="button" className="btn btn-primary-600 radius-8" onClick={handleSubmit} disabled={saving}>
              {saving ? "저장 중..." : "수정하기"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
