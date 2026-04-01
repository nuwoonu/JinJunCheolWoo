import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ReactQuill, QUILL_MODULES_TEXT, QUILL_FORMATS_TEXT, isQuillEmpty } from "@/shared/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo] /board/teacher - 교직원 게시판 (TEACHER, ADMIN)

interface Board {
  id: number;
  title: string;
  writerName: string;
  viewCount: number;
  pinned: boolean;
  createDate: string;
}

export default function TeacherBoard() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeForm, setWriteForm] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);

  const fetchBoards = (p = 0) => {
    setLoading(true);
    api
      .get(`/board/teacher-board?page=${p}&size=10`)
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

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showWriteModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showWriteModal]);

  const handleWrite = async () => {
    if (!writeForm.title.trim() || isQuillEmpty(writeForm.content)) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/board", {
        boardType: "TEACHER_BOARD",
        title: writeForm.title,
        content: writeForm.content,
        pinned: false,
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

  const getRowNumber = (index: number) => totalElements - page * 10 - index;

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">게시판</h6>
          <p className="text-neutral-600 mt-4 mb-0">교직원 게시판</p>
        </div>
      </div>

      <div className="card radius-12">
        <div className="card-header d-flex justify-content-between align-items-center py-16 px-24 border-bottom">
          <h6 className="mb-0">교직원 게시판</h6>
          <button
            type="button"
            className="btn btn-primary-600 radius-8 d-flex align-items-center gap-2"
            onClick={() => setShowWriteModal(true)}
          >
            <iconify-icon icon="mdi:plus" />
            글쓰기
          </button>
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
                    <tr key={board.id}>
                      <td>
                        {board.pinned ? <iconify-icon icon="mdi:pin" className="text-danger" /> : getRowNumber(i)}
                      </td>
                      <td>
                        <Link
                          to={`/board/teacher/${board.id}`}
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

      {/* [woo] 글쓰기 모달 */}
      {showWriteModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">교직원 게시글 작성</h6>
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
                {/* [woo] WYSIWYG 에디터 적용 */}
                <div>
                  <label className="form-label fw-semibold text-sm">내용 *</label>
                  <div style={{ minHeight: 280 }}>
                    <ReactQuill
                      theme="snow"
                      value={writeForm.content}
                      onChange={(val: string) => setWriteForm((f) => ({ ...f, content: val }))}
                      modules={QUILL_MODULES_TEXT}
                      formats={QUILL_FORMATS_TEXT}
                      placeholder="내용을 입력하세요"
                      style={{ height: 250 }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24 gap-8" style={{ marginTop: 20 }}>
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
