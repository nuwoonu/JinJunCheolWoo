import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo 03-27] /board/class-board - 학급 게시판 목록 (교사/학생 작성, 교사 모든글 수정, 학생 본인글만 수정)

interface Board {
  id: number;
  title: string;
  content: string;
  writerName: string;
  viewCount: number;
  pinned: boolean;
  createDate: string;
  targetClassroomName?: string;
}

// [woo] HTML 태그 제거 후 텍스트만 추출
function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export default function ClassBoard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";
  const isStudent = user?.role === "STUDENT";

  // [woo 03-27] 교사/학생/관리자 공용 — 서버가 역할별로 학급을 자동 판별
  const fetchBoards = (p = 0) => {
    setLoading(true);
    api
      .get(`/board/class-board?page=${p}&size=10`)
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
  }, []);

  // [woo] 날짜 포맷 — 24시간 이내면 상대 시간, 아니면 날짜
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 60 * 1000) return "방금 전";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}분 전`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}시간 전`;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  // [woo] 인기글 — 조회수 기준 상위 5개
  const popularBoards = [...boards].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

  return (
    <DashboardLayout>
      {/* [woo] 상단 헤더 */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h5 className="fw-bold mb-4">학급 게시판</h5>
        </div>
        {(isAdmin || isTeacher || isStudent) && (
          <button
            type="button"
            className="btn btn-primary-600 radius-8 d-flex align-items-center gap-6"
            onClick={() => navigate("/board/class-board/write")}
          >
            <i className="ri-edit-line" />
            글쓰기
          </button>
        )}
      </div>

      {/* [woo] 2단 레이아웃: 피드(좌) + 인기글 사이드바(우) */}
      <div className="row">
        {/* ===== 좌측: 메인 피드 ===== */}
        <div className="col-12 col-xl-8">
          <div className="card radius-12 overflow-hidden">
            {/* [woo] 탭 영역 */}
            <div
              style={{
                borderBottom: "1px solid #e5e7eb",
                padding: "14px 24px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div className="d-flex gap-20">
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#3b82f6",
                    paddingBottom: 12,
                    borderBottom: "2px solid #3b82f6",
                    cursor: "pointer",
                  }}
                >
                  전체글
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#9ca3af",
                    paddingBottom: 12,
                    cursor: "pointer",
                  }}
                >
                  인기글
                </span>
              </div>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                총 <b style={{ color: "#3b82f6" }}>{totalElements}</b>건
              </span>
            </div>

            {/* [woo] 피드 리스트 */}
            {loading ? (
              <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
            ) : boards.length === 0 ? (
              <div className="text-center py-48">
                <p className="text-secondary-light mb-0">등록된 게시글이 없습니다.</p>
              </div>
            ) : (
              <div>
                {boards.map((board) => {
                  const isNew =
                    Date.now() - new Date(board.createDate).getTime() < 24 * 60 * 60 * 1000;
                  const preview = stripHtml(board.content || "").slice(0, 200);
                  return (
                    <div
                      key={board.id}
                      style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid #f3f4f6",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onClick={() => navigate(`/board/class-board/${board.id}`)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* [woo] 작성자 + 날짜 */}
                      <div className="d-flex align-items-center gap-8 mb-10">
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#e0e7ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#4f46e5",
                            flexShrink: 0,
                          }}
                        >
                          {board.writerName?.charAt(0)}
                        </div>
                        <div className="d-flex flex-column" style={{ gap: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                            {board.writerName}
                          </span>
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>
                            {formatDate(board.createDate)}
                          </span>
                        </div>
                        {isNew && (
                          <span
                            style={{
                              display: "inline-block",
                              background: "#ef4444",
                              color: "#fff",
                              fontSize: 9,
                              fontWeight: 800,
                              padding: "1px 5px",
                              borderRadius: 3,
                              lineHeight: "14px",
                              marginLeft: 4,
                            }}
                          >
                            N
                          </span>
                        )}
                      </div>

                      {/* [woo] 제목 */}
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#111827",
                          marginBottom: 6,
                          lineHeight: 1.5,
                        }}
                      >
                        {board.title}
                      </div>

                      {/* [woo] 본문 미리보기 — 박스 형태 */}
                      {preview && (
                        <div
                          style={{
                            fontSize: 13,
                            color: "#6b7280",
                            marginBottom: 12,
                            lineHeight: 1.7,
                            padding: "10px 14px",
                            background: "#f9fafb",
                            borderRadius: 8,
                            border: "1px solid #f3f4f6",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {preview}
                        </div>
                      )}

                      {/* [woo] 좋아요 + 조회수 */}
                      <div className="d-flex align-items-center gap-16">
                        <span
                          className="d-flex align-items-center gap-4"
                          style={{ fontSize: 12, color: "#9ca3af" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="ri-heart-line" style={{ fontSize: 15 }} />
                          0
                        </span>
                        <span
                          className="d-flex align-items-center gap-4"
                          style={{ fontSize: 12, color: "#9ca3af" }}
                        >
                          <i className="ri-eye-line" style={{ fontSize: 15 }} />
                          {board.viewCount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* [woo] 페이지네이션 */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center py-16">
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item${page === 0 ? " disabled" : ""}`}>
                      <button
                        className="page-link d-flex align-items-center justify-content-center"
                        style={{ minWidth: 32, minHeight: 32 }}
                        onClick={() => fetchBoards(page - 1)}
                      >
                        <i className="ri-arrow-left-s-line" />
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <li key={i} className={`page-item${i === page ? " active" : ""}`}>
                        <button
                          className="page-link d-flex align-items-center justify-content-center"
                          style={{ minWidth: 32, minHeight: 32 }}
                          onClick={() => fetchBoards(i)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item${page >= totalPages - 1 ? " disabled" : ""}`}>
                      <button
                        className="page-link d-flex align-items-center justify-content-center"
                        style={{ minWidth: 32, minHeight: 32 }}
                        onClick={() => fetchBoards(page + 1)}
                      >
                        <i className="ri-arrow-right-s-line" />
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* ===== 우측: 인기글 사이드바 ===== */}
        <div className="col-12 col-xl-4">
          <div className="card radius-12 overflow-hidden" style={{ position: "sticky", top: 90 }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <i className="ri-fire-fill" style={{ color: "#ef4444", fontSize: 18 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>인기글</span>
            </div>

            {loading ? (
              <div className="text-center py-24 text-secondary-light" style={{ fontSize: 13 }}>
                불러오는 중...
              </div>
            ) : popularBoards.length === 0 ? (
              <div className="text-center py-24 text-secondary-light" style={{ fontSize: 13 }}>
                게시글이 없습니다.
              </div>
            ) : (
              <div>
                {popularBoards.map((board, idx) => (
                  <div
                    key={board.id}
                    style={{
                      padding: "12px 20px",
                      borderBottom: idx < popularBoards.length - 1 ? "1px solid #f3f4f6" : "none",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                    onClick={() => navigate(`/board/class-board/${board.id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* [woo] 순위 번호 */}
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: idx < 3 ? "#3b82f6" : "#9ca3af",
                        minWidth: 20,
                        lineHeight: "20px",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#374151",
                          lineHeight: 1.4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {board.title}
                      </div>
                      <div
                        className="d-flex align-items-center gap-8"
                        style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}
                      >
                        <span>{board.writerName}</span>
                        <span className="d-flex align-items-center gap-2">
                          <i className="ri-eye-line" style={{ fontSize: 12 }} />
                          {board.viewCount}
                        </span>
                        <span className="d-flex align-items-center gap-2">
                          <i className="ri-heart-line" style={{ fontSize: 12 }} />0
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
