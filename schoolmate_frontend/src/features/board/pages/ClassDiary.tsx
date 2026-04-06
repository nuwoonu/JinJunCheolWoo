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
      {/* [woo] 상단 헤더 */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h5 className="fw-bold mb-4">우리반 알림장</h5>
          <p className="text-secondary-light text-sm mb-0">
            {isTeacher && myClass
              ? `${myClass.className} 학생 및 학부모에게 전달되는 알림장입니다.`
              : "담임선생님이 전달하는 우리반 소식입니다."}
          </p>
        </div>
      </div>

      {/* [woo] 교사 담임 학급 안내 배너 */}
      {isTeacher && myClass && (
        <div className="card border-0 radius-8 mb-20" style={{ background: "#f0faf8" }}>
          <div className="card-body py-12 px-20 d-flex align-items-center gap-10">
            <i className="ri-information-line text-success-600" />
            <span className="text-sm text-dark">
              <strong>{myClass.className}</strong> 학생 및 학부모에게 자동 전달됩니다.
            </span>
          </div>
        </div>
      )}

      {/* [woo] 게시판 테이블 */}
      <div>
        <div className="mb-12 d-flex flex-column align-items-end">
          <span
            style={{
              display: "inline-block",
              background: "#3b82f6",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              padding: "5px 14px",
              borderRadius: 4,
              marginTop: 8,
            }}
          >
            총 {totalElements}건
          </span>
        </div>

        {loading ? (
          <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
        ) : boards.length === 0 ? (
          <div className="text-center py-48">
            <p className="text-secondary-light mb-0">등록된 알림장이 없습니다.</p>
          </div>
        ) : (
          <table className="table table-hover mb-0 board-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: 70 }}>번호</th>
                <th>제목</th>
                <th className="text-center" style={{ width: 90 }}>작성자</th>
                <th className="text-center" style={{ width: 110 }}>등록일</th>
                <th className="text-center" style={{ width: 70 }}>조회수</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((board, idx) => {
                const rowNum = totalElements - page * 10 - idx;
                const isNew = Date.now() - new Date(board.createDate).getTime() < 24 * 60 * 60 * 1000;
                return (
                  <tr
                    key={board.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`${baseUrl}/${board.id}`)}
                  >
                    <td className="text-center td-num">{rowNum}</td>
                    <td className="td-title">
                      <div className="d-flex align-items-center gap-4">
                        <span className="td-title-text">{board.title}</span>
                        {isNew && (
                          <span
                            style={{
                              display: "inline-block",
                              background: "#ef4444",
                              color: "#fff",
                              fontSize: 9,
                              fontWeight: 800,
                              padding: "1px 4px",
                              borderRadius: 2,
                              lineHeight: "12px",
                            }}
                          >
                            N
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center td-writer">{board.writerName}</td>
                    <td className="text-center td-date">{formatDate(board.createDate)}</td>
                    <td className="text-center td-views">{board.viewCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* [woo] 페이지네이션 */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center py-16">
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item${page === 0 ? " disabled" : ""}`}>
                  <button className="page-link d-flex align-items-center justify-content-center" style={{ minWidth: 32, minHeight: 32 }} onClick={() => fetchBoards(page - 1)}>
                    <i className="ri-arrow-left-s-line" />
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i} className={`page-item${i === page ? " active" : ""}`}>
                    <button className="page-link d-flex align-items-center justify-content-center" style={{ minWidth: 32, minHeight: 32 }} onClick={() => fetchBoards(i)}>
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item${page >= totalPages - 1 ? " disabled" : ""}`}>
                  <button className="page-link d-flex align-items-center justify-content-center" style={{ minWidth: 32, minHeight: 32 }} onClick={() => fetchBoards(page + 1)}>
                    <i className="ri-arrow-right-s-line" />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* [woo 03-27] 작성 버튼 — 하단 우측, 클릭 시 모달 */}
        {(isAdmin || (isTeacher && myClass)) && (
          <div className="d-flex justify-content-end mt-16">
            <button
              type="button"
              className="btn btn-primary-600 radius-8 d-flex align-items-center gap-6"
              onClick={() => setShowWriteModal(true)}
            >
              <i className="ri-edit-line" />
              작성
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
                  className="btn btn-primary-600 radius-8 d-flex align-items-center gap-6"
                  onClick={handleWrite}
                  disabled={saving}
                >
                  {saving ? "저장 중..." : (
                    <>
                      <i className="ri-check-line" />
                      등록
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
