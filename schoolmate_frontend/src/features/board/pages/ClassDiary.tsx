import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ReactQuill, QUILL_MODULES, QUILL_FORMATS, isQuillEmpty } from "@/shared/types/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import api from "@/shared/api/authApi";
import { useAuth } from "@/shared/contexts/AuthContext";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [woo] /board/class-diary - 우리반 알림장 목록 (담임 작성, 학생+학부모 열람)

interface Board {
  id: number;
  title: string;
  writerName: string;
  viewCount: number;
  pinned: boolean;
  createDate: string;
  targetClassroomName?: string;
}

interface MyClassInfo {
  classroomId: number;
  className: string;
  grade: number;
  classNum: number;
}

export default function ClassDiary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // [woo] 진입 경로별 detail URL prefix 결정
  const baseUrl = location.pathname.startsWith("/teacher/myclass/notice")
    ? "/teacher/myclass/notice"
    : location.pathname.startsWith("/parent/class/notice")
    ? "/parent/class/notice"
    : "/board/class-diary";
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // [woo] 교사 담임 학급 정보 (배너 표시용)
  const [myClass, setMyClass] = useState<MyClassInfo | null>(null);

  // [woo 03-27] 작성 모달 상태
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";
  const isParent = user?.role === "PARENT";

  // [woo] 다자녀 학부모: sessionStorage에서 선택된 자녀 ID
  const selectedChildId = isParent ? sessionStorage.getItem("selectedChildId") : null;

  // [woo] 모든 역할 공용 — 서버가 역할별로 학급을 자동 판별
  const fetchBoards = (p = 0) => {
    setLoading(true);
    const childParam = selectedChildId ? `&studentUserUid=${selectedChildId}` : "";
    api
      .get(`/board/class-diary?page=${p}&size=10${childParam}`)
      .then((res) => {
        setBoards(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
        setPage(res.data.currentPage);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBoards();
    // [woo] 교사: 담임 학급 정보 조회 (배너 표시용)
    if (isTeacher) {
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
    }
  }, []);

  // [woo 03-27] 모달 열림/닫힘 시 스크롤 제어
  useEffect(() => {
    document.body.style.overflow = showWriteModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showWriteModal]);

  // [woo] 날짜 포맷
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  // [woo 03-27] 작성 모달 — 등록 처리
  const handleWrite = async () => {
    if (!writeTitle.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (isQuillEmpty(writeContent)) {
      alert("내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/board", {
        boardType: "CLASS_DIARY",
        title: writeTitle,
        content: writeContent,
      });
      setShowWriteModal(false);
      setWriteTitle("");
      setWriteContent("");
      fetchBoards(0);
    } catch {
      alert("알림장 작성에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 4.5rem - 48px)" }}>
        {/* 제목 + 전체 건수 + 작성 버튼 */}
        <div
          style={{
            marginBottom: 16,
            flexShrink: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h5
              style={{
                fontWeight: 700,
                color: "#111827",
                marginBottom: 4,
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              우리반 알림장
              <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>전체 {totalElements}건</span>
            </h5>
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
              {isTeacher && myClass
                ? `${myClass.className} 학생 및 학부모에게 전달되는 알림장입니다.`
                : "담임선생님이 전달하는 우리반 소식입니다."}
            </p>
          </div>
          {(isAdmin || (isTeacher && myClass)) && (
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
                gap: 6,
              }}
              onClick={() => setShowWriteModal(true)}
            >
              <i className="ri-edit-line" />
              작성
            </button>
          )}
        </div>

        {/* [woo] 교사 담임 학급 안내 배너 */}
        {isTeacher && myClass && (
          <div
            style={{
              background: "#f0faf8",
              border: "1px solid #c8ede8",
              borderRadius: 8,
              padding: "10px 16px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <i className="ri-information-line" style={{ color: "#25a194" }} />
            <span style={{ fontSize: 13, color: "#1a2e2c" }}>
              <strong>{myClass.className}</strong> 학생 및 학부모에게 자동 전달됩니다.
            </span>
          </div>
        )}

        {/* 테이블 카드 */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", minHeight: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "6%" }} />
                <col style={{ width: "52%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr>
                  {["번호", "제목", "작성자", "날짜", "조회"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        background: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: "48px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}
                    >
                      불러오는 중...
                    </td>
                  </tr>
                ) : boards.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: "48px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}
                    >
                      등록된 알림장이 없습니다.
                    </td>
                  </tr>
                ) : (
                  boards.map((board, idx) => {
                    const rowNum = totalElements - page * 10 - idx;
                    const isNew = Date.now() - new Date(board.createDate).getTime() < 24 * 60 * 60 * 1000;
                    return (
                      <tr
                        key={board.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`${baseUrl}/${board.id}`)}
                      >
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            color: "#6b7280",
                            borderBottom: "1px solid #f3f4f6",
                            verticalAlign: "middle",
                          }}
                        >
                          {rowNum}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            borderBottom: "1px solid #f3f4f6",
                            verticalAlign: "middle",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              color: "#1d4ed8",
                              fontWeight: 500,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            {board.title}
                            {isNew && (
                              <span style={{ color: "#25a194", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                새글
                              </span>
                            )}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            color: "#6b7280",
                            borderBottom: "1px solid #f3f4f6",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {board.writerName}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            color: "#6b7280",
                            borderBottom: "1px solid #f3f4f6",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(board.createDate)}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            color: "#6b7280",
                            borderBottom: "1px solid #f3f4f6",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {board.viewCount}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 페이지네이션: 카드 밖, 우측 정렬, 28×28 정사각형 버튼 */}
        {totalPages >= 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => fetchBoards(page - 1)}
              disabled={page === 0}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
                cursor: page === 0 ? "not-allowed" : "pointer",
                color: page === 0 ? "#d1d5db" : "#374151",
                fontSize: 12,
              }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => fetchBoards(i)}
                style={{
                  width: 28,
                  height: 28,
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${i === page ? "#25A194" : "#e5e7eb"}`,
                  borderRadius: 6,
                  background: i === page ? "#25A194" : "#fff",
                  color: i === page ? "#fff" : "#374151",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: i === page ? 600 : 400,
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => fetchBoards(page + 1)}
              disabled={page >= totalPages - 1}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
                cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                color: page >= totalPages - 1 ? "#d1d5db" : "#374151",
                fontSize: 12,
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* [woo 03-27] 작성 모달 — ReactQuill 에디터 */}
      {showWriteModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">
                  <i className="ri-edit-line me-8 text-primary-600" />
                  알림장 작성
                  {isTeacher && myClass && (
                    <span className="text-sm text-secondary-light fw-normal ms-8">
                      — {myClass.className}
                    </span>
                  )}
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowWriteModal(false)} />
              </div>
              <div className="modal-body p-24">
                {isTeacher && myClass && (
                  <div
                    className="radius-8 mb-16 py-10 px-16 d-flex align-items-center gap-8"
                    style={{ background: "#f0faf8" }}
                  >
                    <i className="ri-information-line text-success-600" />
                    <span className="text-sm text-dark">
                      <strong>{myClass.className}</strong> 학생 및 학부모에게 자동 전달됩니다.
                    </span>
                  </div>
                )}
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">제목 *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="알림장 제목을 입력하세요"
                    value={writeTitle}
                    onChange={(e) => setWriteTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label fw-semibold text-sm">내용 *</label>
                  <div style={{ minHeight: 280 }}>
                    <ReactQuill
                      theme="snow"
                      value={writeContent}
                      onChange={setWriteContent}
                      modules={QUILL_MODULES}
                      formats={QUILL_FORMATS}
                      placeholder="준비물, 전달사항 등을 입력하세요"
                      style={{ height: 250 }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24 gap-8">
                <button
                  type="button"
                  className="btn btn-outline-neutral-300 radius-8"
                  onClick={() => setShowWriteModal(false)}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="btn btn-primary-600 radius-8"
                  onClick={handleWrite}
                  disabled={saving}
                >
                  {saving ? "저장 중..." : "등록"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
