import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [woo] 과제 출제 페이지 (교사 전용)
// - 제목, 내용, 학급 선택, 마감일, 마감시간, 첨부파일
// - POST /api/homework (multipart/form-data)

interface CourseSectionOption {
  id: number;
  name: string;
  subjectName: string;
  classroomName: string;
  classroomId: number;
}

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: 13,
  marginBottom: 6,
  color: "#1a1a2e",
};

const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  color: "#374151",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const fieldWrap: React.CSSProperties = { marginBottom: 20 };

export default function HomeworkCreate() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [courseSections, setCourseSections] = useState<CourseSectionOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    courseSectionId: "",
    dueDate: "",
    // [soojin] 마감 시간 추가 - 미선택 시 23:59:00으로 처리
    dueTime: "",
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
            // [soojin] 마감시간 선택 시 해당 시간 사용, 미선택 시 23:59:00
            dueDate: form.dueDate + "T" + (form.dueTime ? form.dueTime + ":00" : "23:59:00"),
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

  // [soojin] 드래그&드롭 파일 처리
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 24 }}>
        <h6 style={{ fontWeight: 600, marginBottom: 4 }}>과제 출제</h6>
        <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>새로운 과제를 생성합니다.</p>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        {/* 과제 제목 */}
        <div style={fieldWrap}>
          <label style={label}>과제 제목 *</label>
          <input
            type="text"
            style={input}
            placeholder="과제 제목을 입력하세요"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        {/* 내용 */}
        <div style={fieldWrap}>
          <label style={label}>내용 *</label>
          <textarea
            style={{ ...input, resize: "vertical" }}
            rows={8}
            placeholder="과제 내용을 입력하세요"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          />
        </div>

        {/* [soojin] 담당 반 + 배점 같은 줄 반반 */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>담당 반 *</label>
            <select
              style={input}
              value={form.courseSectionId}
              onChange={(e) => setForm((f) => ({ ...f, courseSectionId: e.target.value }))}
            >
              <option value="">담당 반을 선택하세요</option>
              {courseSections.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>배점 *</label>
            <input
              type="number"
              style={input}
              placeholder="100"
              min={1}
              value={form.maxScore}
              onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
            />
          </div>
        </div>

        {/* 제출 마감일 + 제출 마감시간 */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>제출 마감일 *</label>
            <input
              type="date"
              style={input}
              value={form.dueDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
          {/* [soojin] 마감 시간 추가 */}
          <div style={{ flex: 1 }}>
            <label style={label}>제출 마감시간 *</label>
            <input
              type="time"
              style={input}
              value={form.dueTime}
              onChange={(e) => setForm((f) => ({ ...f, dueTime: e.target.value }))}
            />
          </div>
        </div>

        {/* [soojin] 첨부파일 - 드래그&드롭 UI로 변경 */}
        <div style={fieldWrap}>
          <label style={label}>첨부 파일</label>
          <div
            style={{
              border: `2px dashed ${isDragging ? "#25A194" : "#d1d5db"}`,
              borderRadius: 10,
              padding: "40px 24px",
              textAlign: "center",
              cursor: "pointer",
              background: isDragging ? "#f0faf9" : "#fafafa",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
          >
            {/* [soojin] 아이콘 중앙 정렬 */}
            <div style={{ fontSize: 32, color: "#9ca3af", marginBottom: 8, lineHeight: 1, display: "flex", justifyContent: "center" }}>
              <i className="ri-upload-line"></i>
            </div>
            <p style={{ color: "#374151", fontWeight: 500, fontSize: 14, margin: "0 0 4px" }}>
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>최대 10MB, PDF, 이미지, 문서 파일</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                <i className="ri-attachment-line" style={{ marginRight: 4 }}></i>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "1px solid #ef4444",
                  color: "#ef4444",
                  borderRadius: 6,
                  padding: "2px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
                onClick={() => setFile(null)}
              >
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            style={{
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "5px 12px",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
            onClick={() => navigate("/homework")}
          >
            취소
          </button>
          <button
            type="button"
            style={{
              background: "#25A194",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "5px 12px",
              fontWeight: 600,
              fontSize: 13,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onClick={handleSubmit}
            disabled={saving}
          >
            <i className="ri-survey-line"></i>
            {saving ? "저장 중..." : "과제 출제"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
