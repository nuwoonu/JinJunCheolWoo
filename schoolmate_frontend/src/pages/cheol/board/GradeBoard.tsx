import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

// [cheol] /board/grade

interface Board {
  id: number;
  title: string;
  writerName: string;
  viewCount: number;
  pinned: boolean;
  createDate: string;
}

export default function GradeBoard() {
  const { grade } = useParams<{ grade: string }>();
  const gradeNum = Number(grade);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // [woo] 글쓰기 모달 - TEACHER/ADMIN만 사용 가능
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeForm, setWriteForm] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);

  const canWrite = user?.role === "TEACHER" || user?.role === "ADMIN";

  const fetchBoards = (p = 0) => {
    setLoading(true);
    api
      .get(`/board/grade/${gradeNum}?page=${p}&size=10`)
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
  }, [gradeNum]);

  const handleWrite = async () => {
    if (!writeForm.title.trim() || !writeForm.content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/board", {
        boardType: "GRADE_BOARD",
        title: writeForm.title,
        content: writeForm.content,
        targetGrade: gradeNum,
      });
      setShowWriteModal(false);
      setWriteForm({ title: "", content: "" });
      fetchBoards(0);
    } catch {
      alert("게시물 작성에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const getRowNumber = (index: number, board: Board) => {
    if (board.pinned) return null;
    return totalElements - page * 10 - index;
  };

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">게시판</h6>
          <p className="text-neutral-600 mt-4 mb-0">{gradeNum}학년 게시판</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">게시판</li>
          <li>-</li>
          <li className="fw-medium">{gradeNum}학년 게시판</li>
        </ul>
      </div>

      <div className="card radius-12">
        <div className="card-header d-flex justify-content-between align-items-center py-16 px-24 border-bottom flex-wrap gap-12">
          <h6 className="mb-0">{gradeNum}학년 게시판</h6>
          <div className="d-flex align-items-center gap-12">
            {/* [woo] 학년 탭 이동 버튼 (1~3학년) */}
            <div className="d-flex gap-6">
              {[1, 2, 3].map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`btn btn-sm radius-8 ${g === gradeNum ? "btn-primary-600" : "btn-outline-neutral-300"}`}
                  onClick={() => navigate(`/board/grade/${g}`)}
                >
                  {g}학년
                </button>
              ))}
            </div>
            {canWrite && (
              <button type="button" className="btn btn-primary-600 radius-8" onClick={() => setShowWriteModal(true)}>
                <iconify-icon icon="mdi:plus" className="me-4" />
                글쓰기
              </button>
            )}
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col" style={{ width: 60 }}>
                    번호
                  </th>
                  <th scope="col">제목</th>
                  <th scope="col" style={{ width: 120 }}>
                    작성자
                  </th>
                  <th scope="col" style={{ width: 120 }}>
                    작성일
                  </th>
                  <th scope="col" style={{ width: 80 }}>
                    조회
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-24 text-secondary-light">
                      불러오는 중...
                    </td>
                  </tr>
                ) : boards.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-24 text-secondary-light">
                      등록된 게시물이 없습니다.
                    </td>
                  </tr>
                ) : (
                  boards.map((board, i) => (
                    <tr key={board.id} className={board.pinned ? "bg-primary-50" : ""}>
                      <td>
                        {board.pinned ? (
                          <span className="badge bg-danger-100 text-danger-600">공지</span>
                        ) : (
                          getRowNumber(i, board)
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/board/grade/${gradeNum}/${board.id}`}
                          className="text-primary-600 hover-text-primary-700 fw-medium"
                        >
                          {board.title}
                        </Link>
                      </td>
                      <td className="text-secondary-light">{board.writerName}</td>
                      <td className="text-secondary-light">{board.createDate?.slice(0, 10)}</td>
                      <td className="text-secondary-light">{board.viewCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center py-16">
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item${page === 0 ? " disabled" : ""}`}>
                    <button className="page-link" onClick={() => fetchBoards(page - 1)}>
                      <iconify-icon icon="mdi:chevron-left" />
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li key={i} className={`page-item${i === page ? " active" : ""}`}>
                      <button className="page-link" onClick={() => fetchBoards(i)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item${page >= totalPages - 1 ? " disabled" : ""}`}>
                    <button className="page-link" onClick={() => fetchBoards(page + 1)}>
                      <iconify-icon icon="mdi:chevron-right" />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* [cheol] 글쓰기 모달 (TEACHER/ADMIN 전용) */}
      {showWriteModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">{gradeNum}학년 게시판 작성</h6>
                <button type="button" className="btn-close" onClick={() => setShowWriteModal(false)} />
              </div>
              <div className="modal-body p-24">
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">제목 *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="제목을 입력하세요"
                    value={writeForm.title}
                    onChange={(e) => setWriteForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label fw-semibold text-sm">내용 *</label>
                  <textarea
                    className="form-control"
                    rows={10}
                    placeholder="내용을 입력하세요"
                    value={writeForm.content}
                    onChange={(e) => setWriteForm((f) => ({ ...f, content: e.target.value }))}
                  />
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
                <button type="button" className="btn btn-primary-600 radius-8" onClick={handleWrite} disabled={saving}>
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
