import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ReactQuill, QUILL_MODULES, QUILL_FORMATS, isQuillEmpty } from "@/shared/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import api from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo 03-27] /board/class-diary/write - 우리반 알림장 작성 (ReactQuill WYSIWYG 에디터)

interface MyClassInfo {
  classroomId: number;
  className: string;
  grade: number;
  classNum: number;
}

export default function ClassDiaryWrite() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [myClass, setMyClass] = useState<MyClassInfo | null>(null);

  const isTeacher = user?.role === "TEACHER";
  const isAdmin = user?.role === "ADMIN";

  // [woo] 교사 담임 학급 정보 조회
  useEffect(() => {
    if (!isTeacher) return;
    api
      .get("/teacher/myclass")
      .then((res) => {
        const d = res.data;
        if (d?.classroomId) {
          setMyClass({
            classroomId: d.classroomId,
            className: d.className ?? `${d.grade}학년 ${d.classNum}반`,
            grade: d.grade,
            classNum: d.classNum,
          });
        }
      })
      .catch(() => {});
  }, []);

  // [woo] 권한 없으면 목록으로 이동
  useEffect(() => {
    if (!isTeacher && !isAdmin) {
      navigate("/board/class-diary");
    }
  }, [isTeacher, isAdmin]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    // [woo 03-27] 이미지 포함 시에도 내용으로 인식
    if (isQuillEmpty(content)) {
      alert("내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/board", {
        boardType: "CLASS_DIARY",
        title: title,
        content: content,
      });
      navigate("/board/class-diary");
    } catch {
      alert("알림장 작성에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      {/* [woo] 상단 헤더 */}
      <div className="d-flex align-items-center gap-8 mb-24">
        <Link
          to="/board/class-diary"
          className="w-36-px h-36-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center text-secondary-light"
        >
          <i className="ri-arrow-left-line text-lg" />
        </Link>
        <h5 className="fw-bold mb-0">알림장 작성</h5>
      </div>

      {/* [woo] 작성 폼 */}
      <div className="card radius-12" style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* [woo] 담임 학급 안내 배너 */}
        {isTeacher && myClass && (
          <div className="px-24 pt-20">
            <div className="radius-8 py-10 px-16 d-flex align-items-center gap-8" style={{ background: "#f0faf8" }}>
              <i className="ri-information-line text-success-600" />
              <span className="text-sm text-dark">
                <strong>{myClass.className}</strong> 학생 및 학부모에게 자동 전달됩니다.
              </span>
            </div>
          </div>
        )}

        <div className="card-body p-24">
          {/* [woo] 제목 */}
          <div className="mb-20">
            <label className="form-label fw-semibold text-sm">제목 *</label>
            <input
              type="text"
              className="form-control"
              placeholder="알림장 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: 15, padding: "10px 14px" }}
            />
          </div>

          {/* [woo 03-27] WYSIWYG 에디터 (글자 크기 포함) */}
          <div className="mb-20">
            <label className="form-label fw-semibold text-sm">내용 *</label>
            <div style={{ minHeight: 300 }}>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="준비물, 전달사항 등을 입력하세요"
                style={{ height: 280 }}
              />
            </div>
          </div>

          {/* [woo] 하단 버튼 */}
          <div className="d-flex justify-content-end gap-8" style={{ marginTop: 60 }}>
            <button
              type="button"
              className="btn btn-outline-neutral-300 radius-8 px-20"
              onClick={() => navigate("/board/class-diary")}
            >
              취소
            </button>
            <button
              type="button"
              className="btn btn-primary-600 radius-8 px-20 d-flex align-items-center gap-6"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                "저장 중..."
              ) : (
                <>
                  <i className="ri-check-line" />
                  등록
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
