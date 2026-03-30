import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo 03-27] /board/class-board - 학급 게시판 목록 (교사/학생 작성, 교사 모든글 수정, 학생 본인글만 수정)

interface Board {
  id: number;
  title: string;
  writerName: string;
  viewCount: number;
  pinned: boolean;
  createDate: string;
  targetClassroomName?: string;
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

  // [woo 03-27] 날짜 포맷
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <DashboardLayout>
      {/* [woo 03-27] 상단 헤더 */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h5 className="fw-bold mb-4">학급 게시판</h5>
        </div>
      </div>

      {/* [woo 03-27] 게시판 테이블 */}
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
            <p className="text-secondary-light mb-0">등록된 게시글이 없습니다.</p>
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
                    onClick={() => navigate(`/board/class-board/${board.id}`)}
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

        {/* [woo 03-27] 페이지네이션 */}
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

        {/* [woo 03-27] 작성 버튼 — 하단 우측 (교사/학생/관리자) */}
        {(isAdmin || isTeacher || isStudent) && (
          <div className="d-flex justify-content-end mt-16">
            <button
              type="button"
              className="btn btn-primary-600 radius-8 d-flex align-items-center gap-6"
              onClick={() => navigate("/board/class-board/write")}
            >
              <i className="ri-edit-line" />
              작성
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
