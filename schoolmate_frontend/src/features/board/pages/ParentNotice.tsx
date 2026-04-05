import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ReactQuill, QUILL_MODULES_TEXT, QUILL_FORMATS_TEXT, isQuillEmpty } from "@/shared/types/quillConfig";
import "react-quill-new/dist/quill.snow.css";
import api from "@/shared/api/authApi";
import { useAuth } from "@/shared/contexts/AuthContext";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [woo] /board/parent-notice - 가정통신문 목록
// [soojin] 플랜 패턴 적용: 교사/학부모 모두 테이블 형태로 통일

interface Board {
  id: number;
  title: string;
  content?: string;
  writerName: string;
  viewCount: number;
  pinned: boolean;
  createDate: string;
  targetClassroomName?: string;
  readCount?: number;
}

// [woo] 교사 담임 학급 정보
interface MyClassInfo {
  classroomId: number;
  className: string;
  grade: number;
  classNum: number;
}

export default function ParentNotice() {
  const { user } = useAuth();
  // [soojin] 화면 꽉 채우기 + 필터 카드 밖 + 페이지네이션 카드 밖
  const [page, setPage] = useState<any>(null);
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const isInitialLoad = useRef(true);
  const [searchType, setSearchType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeForm, setWriteForm] = useState({ title: "", content: "", isPinned: false });
  const [writeFile, setWriteFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // [woo] 교사일 때 담임 학급 정보 조회
  const [myClass, setMyClass] = useState<MyClassInfo | null>(null);

  // [woo] 교사용 읽음 현황 모달
  const [readStatusModal, setReadStatusModal] = useState<{
    boardTitle: string;
    list: { uid: number; name: string; studentName: string; read: boolean }[];
  } | null>(null);
  const [readStatusLoading, setReadStatusLoading] = useState(false);

  const openReadStatus = (e: React.MouseEvent, board: Board) => {
    e.preventDefault();
    setReadStatusLoading(true);
    setReadStatusModal({ boardTitle: board.title, list: [] });
    api
      .get(`/board/${board.id}/read-status`)
      .then((res) => setReadStatusModal({ boardTitle: board.title, list: res.data }))
      .catch(() => setReadStatusModal(null))
      .finally(() => setReadStatusLoading(false));
  };

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";
  const isParent = user?.role === "PARENT";

  // [woo] 읽음 상태 — 백엔드 API로 관리 (웹/앱 동기화)
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isParent) return;
    api
      .get("/board/read-ids?type=PARENT_NOTICE")
      .then((res) => setReadIds(new Set(res.data)))
      .catch(() => {});
  }, [isParent]);

  const markRead = (id: number) => {
    if (readIds.has(id)) return;
    api.post(`/board/${id}/read`).catch(() => {});
    setReadIds((prev) => new Set([...prev, id]));
  };

  // [woo] 다자녀 학부모: sessionStorage에서 선택된 자녀 ID 읽기
  const selectedChildId = isParent ? sessionStorage.getItem("selectedChildId") : null;

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showWriteModal || !!readStatusModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showWriteModal, readStatusModal]);

  const load = (p = 0, kw = keyword, st = searchType) => {
    const childParam = selectedChildId ? `&studentUserUid=${selectedChildId}` : "";
    const params = new URLSearchParams({ page: String(p), size: "10" });
    if (kw) params.set("keyword", kw);
    if (st) params.set("searchType", st);

    api
      .get(`/board/parent-notice?${params}${childParam}`)
      .then((res) => {
        setPage(res.data);
        setCurrentPage(p);
        // [soojin] 최초 로드 시에만 전체 건수 세팅
        if (isInitialLoad.current) {
          setTotalAll(res.data.totalElements);
          isInitialLoad.current = false;
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    // [woo] 교사인 경우 담임 학급 정보 가져오기
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

  const handleWrite = async () => {
    if (!writeForm.title.trim() || isQuillEmpty(writeForm.content)) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      let attachmentUrl = "";
      // [woo] 파일 첨부 시 먼저 업로드
      if (writeFile) {
        const fd = new FormData();
        fd.append("file", writeFile);
        const uploadRes = await api.post("/board/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        attachmentUrl = uploadRes.data.url;
      }
      await api.post("/board", {
        boardType: "PARENT_NOTICE",
        title: writeForm.title,
        content: writeForm.content,
        isPinned: writeForm.isPinned,
        attachmentUrl,
      });
      setShowWriteModal(false);
      setWriteForm({ title: "", content: "", isPinned: false });
      setWriteFile(null);
      load(0);
    } catch {
      alert("게시물 작성에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const list: Board[] = page?.content ?? [];

  const getRowNumber = (index: number, board: Board) => {
    if (board.pinned) return null;
    return (page?.totalElements ?? 0) - currentPage * 10 - index;
  };

  return (
    <DashboardLayout>
      {/* [soojin] 화면 꽉 채우는 flex column 컨테이너 */}
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 4.5rem - 48px)" }}>
        {/* [soojin] 제목 + 전체 건수 인라인 */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
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
            가정통신문
            <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>전체 {totalAll ?? 0}건</span>
          </h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            {isTeacher && myClass
              ? `${myClass.className} 담임 학부모에게 전달되는 가정통신문입니다.`
              : "학교와 가정을 연결하는 소식을 전합니다."}
          </p>
        </div>

        {/* [soojin] 컨트롤 바: 검색(좌) + 작성(우, teacher/admin only) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            gap: 12,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <form
            style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
            onSubmit={(e) => {
              e.preventDefault();
              load(0);
            }}
          >
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <select
                style={{
                  padding: "5px 24px 5px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  background: "#fff",
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                }}
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="">전체</option>
                <option value="writer">작성자</option>
                <option value="title">제목</option>
                <option value="content">내용</option>
                <option value="title_content">제목 + 내용</option>
              </select>
              <i
                className="ri-arrow-down-s-line"
                style={{ position: "absolute", right: 4, pointerEvents: "none", fontSize: 16, color: "#6b7280" }}
              />
            </div>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <i
                className="bi bi-search"
                style={{ position: "absolute", left: 8, color: "#9ca3af", fontSize: 13, pointerEvents: "none" }}
              />
              <input
                style={{
                  padding: "5px 8px 5px 28px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  minWidth: 180,
                  background: "#fff",
                }}
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <button
              style={{
                padding: "5px 12px",
                background: "#25A194",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              type="submit"
            >
              검색
            </button>
            <button
              style={{
                padding: "5px 10px",
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
              type="button"
              onClick={() => {
                setSearchType("");
                setKeyword("");
                load(0, "", "");
              }}
            >
              초기화
            </button>
            {/* [soojin] 검색 중일 때만 필터 결과 건수 표시 */}
            {(keyword || searchType) && page && (
              <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 600, color: "#111827" }}>{page.totalElements}건</span> / 전체 {totalAll ?? 0}
                건
              </span>
            )}
          </form>
          {(isAdmin || isTeacher) && (
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
              <strong>{myClass.className}</strong> 학부모에게 자동 전달됩니다.
            </span>
          </div>
        )}

        {/* [soojin] 카드: flex:1 화면 꽉 채움 */}
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
          {/* [soojin] 스크롤 div: flex:1 overflowY:auto */}
          <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", minHeight: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                {/* [soojin] 제목 열 auto로 인해 2·3열 간격 과다 → 퍼센트 비율로 전환해 균형 조정 */}
                <col style={{ width: "6%" }} />
                <col style={{ width: "42%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "8%" }} />
                {/* [soojin] 교사/관리자: 읽음 확인 버튼 열 / 학부모: 읽음 여부 배지 열 */}
                {(isTeacher || isAdmin) && <col style={{ width: "10%" }} />}
                {isParent && <col style={{ width: "10%" }} />}
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
                  {(isTeacher || isAdmin) && (
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        background: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      읽음 확인
                    </th>
                  )}
                  {isParent && (
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        background: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      읽음
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isTeacher || isAdmin || isParent ? 6 : 5}
                      style={{ padding: "48px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}
                    >
                      등록된 가정통신문이 없습니다.
                    </td>
                  </tr>
                ) : (
                  list.map((board, i) => {
                    const isRead = readIds.has(board.id);
                    const isNew =
                      isParent &&
                      !isRead &&
                      (() => {
                        const diff = Date.now() - new Date(board.createDate).getTime();
                        return diff < 7 * 24 * 60 * 60 * 1000;
                      })();
                    return (
                      <tr key={board.id} style={{ background: board.pinned ? "#f0fdf4" : undefined }}>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 13,
                            color: "#6b7280",
                            borderBottom: "1px solid #f3f4f6",
                            verticalAlign: "middle",
                          }}
                        >
                          {board.pinned ? (
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                background: "rgba(239,68,68,0.1)",
                                color: "#dc2626",
                              }}
                            >
                              공지
                            </span>
                          ) : (
                            getRowNumber(i, board)
                          )}
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
                          <Link
                            to={`/board/parent-notice/${board.id}`}
                            style={{
                              color: "#1d4ed8",
                              fontWeight: isParent && !isRead ? 700 : 500,
                              textDecoration: "none",
                            }}
                            onClick={() => isParent && markRead(board.id)}
                          >
                            {isNew && (
                              <span
                                style={{
                                  background: "#25a194",
                                  color: "#fff",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: 8,
                                  marginRight: 6,
                                }}
                              >
                                NEW
                              </span>
                            )}
                            {board.title}
                          </Link>
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
                          {board.createDate?.slice(0, 10)}
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
                        {(isTeacher || isAdmin) && (
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: 13,
                              borderBottom: "1px solid #f3f4f6",
                              verticalAlign: "middle",
                              textAlign: "center",
                            }}
                          >
                            <button
                              type="button"
                              style={{
                                fontSize: 11,
                                padding: "3px 8px",
                                background: "#f0faf8",
                                color: "#25a194",
                                border: "1px solid #c8ede8",
                                borderRadius: 6,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                              onClick={(e) => openReadStatus(e, board)}
                            >
                              <i className="ri-check-double-line" style={{ marginRight: 2 }} />
                              읽음 확인
                            </button>
                          </td>
                        )}
                        {isParent && (
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: 13,
                              borderBottom: "1px solid #f3f4f6",
                              verticalAlign: "middle",
                              textAlign: "center",
                            }}
                          >
                            {isRead ? (
                              <i className="ri-check-double-line" style={{ fontSize: 18, color: "#25a194" }} />
                            ) : (
                              <i className="ri-circle-line" style={{ fontSize: 18, color: "#d1d5db" }} />
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* [soojin] 페이지네이션: 카드 밖, 우측 정렬, 28×28 정사각형 버튼 */}
        {page && page.totalPages >= 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => load(currentPage - 1)}
              disabled={currentPage === 0}
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
                cursor: currentPage === 0 ? "not-allowed" : "pointer",
                color: currentPage === 0 ? "#d1d5db" : "#374151",
                fontSize: 12,
              }}
            >
              ‹
            </button>
            {Array.from({ length: page.totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => load(i)}
                style={{
                  width: 28,
                  height: 28,
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${i === currentPage ? "#25A194" : "#e5e7eb"}`,
                  borderRadius: 6,
                  background: i === currentPage ? "#25A194" : "#fff",
                  color: i === currentPage ? "#fff" : "#374151",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: i === currentPage ? 600 : 400,
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => load(currentPage + 1)}
              disabled={currentPage >= page.totalPages - 1}
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
                cursor: currentPage >= page.totalPages - 1 ? "not-allowed" : "pointer",
                color: currentPage >= page.totalPages - 1 ? "#d1d5db" : "#374151",
                fontSize: 12,
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* [woo] 작성 모달 */}
      {showWriteModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">가정통신문 작성</h6>
                <button type="button" className="btn-close" onClick={() => setShowWriteModal(false)} />
              </div>
              <div className="modal-body p-24">
                {/* [woo] 교사 담임 학급 자동 연결 안내 */}
                {isTeacher && myClass && (
                  <div
                    className="radius-8 mb-16 py-10 px-16 d-flex align-items-center gap-8"
                    style={{ background: "#f0faf8" }}
                  >
                    <i className="ri-information-line text-success-600" />
                    <span className="text-sm text-dark">
                      <strong>{myClass.className}</strong> 학부모에게 자동 전달됩니다.
                    </span>
                  </div>
                )}
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">제목 *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="가정통신문 제목을 입력하세요"
                    value={writeForm.title}
                    onChange={(e) => setWriteForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">내용 *</label>
                  <div style={{ minHeight: 320 }}>
                    <ReactQuill
                      theme="snow"
                      value={writeForm.content}
                      onChange={(val: string) => setWriteForm((f) => ({ ...f, content: val }))}
                      modules={QUILL_MODULES_TEXT}
                      formats={QUILL_FORMATS_TEXT}
                      placeholder="학부모에게 전달할 내용을 입력하세요"
                      style={{ height: 280 }}
                    />
                  </div>
                </div>
                {/* [woo] 첨부파일 */}
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">첨부파일 (PDF, DOCX)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.docx,.doc,.hwp"
                    onChange={(e) => setWriteFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="pinCheck"
                    checked={writeForm.isPinned}
                    onChange={(e) => setWriteForm((f) => ({ ...f, isPinned: e.target.checked }))}
                  />
                  <label className="form-check-label text-sm" htmlFor="pinCheck">
                    상단 고정
                  </label>
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

      {/* [woo] 교사용 읽음 현황 모달 */}
      {readStatusModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setReadStatusModal(null);
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-md modal-dialog-scrollable">
            <div className="modal-content radius-12">
              <div className="modal-header py-16 px-24 border-bottom">
                <div>
                  <h6 className="modal-title mb-2">읽음 현황</h6>
                  <p
                    className="text-xs text-secondary-light mb-0"
                    style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {readStatusModal.boardTitle}
                  </p>
                </div>
                <button type="button" className="btn-close" onClick={() => setReadStatusModal(null)} />
              </div>
              <div className="modal-body p-0">
                {readStatusLoading ? (
                  <div className="text-center py-32 text-secondary-light">불러오는 중...</div>
                ) : readStatusModal.list.length === 0 ? (
                  <div className="text-center py-32 text-secondary-light">대상 학부모 정보가 없습니다.</div>
                ) : (
                  <div>
                    <div className="d-flex gap-16 px-20 py-12 border-bottom" style={{ background: "#f8f9fa" }}>
                      <span className="text-sm">
                        <i className="ri-check-double-line me-4" style={{ color: "#25a194" }} />
                        읽음{" "}
                        <strong style={{ color: "#25a194" }}>
                          {readStatusModal.list.filter((r) => r.read).length}명
                        </strong>
                      </span>
                      <span className="text-sm">
                        <i className="ri-time-line me-4" style={{ color: "#adb5bd" }} />
                        미확인{" "}
                        <strong style={{ color: "#adb5bd" }}>
                          {readStatusModal.list.filter((r) => !r.read).length}명
                        </strong>
                        <span style={{ color: "#ced4da", margin: "0 4px" }}>/</span>총{" "}
                        <strong style={{ color: "#495057" }}>{readStatusModal.list.length}명</strong>
                      </span>
                    </div>
                    {readStatusModal.list.map((r) => (
                      <div
                        key={r.uid}
                        className="d-flex align-items-center px-20 py-12 border-bottom"
                        style={{ gap: 12, borderColor: "#f1f3f5" }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: r.read ? "#e8f8f5" : "#f8f9fa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <i
                            className={r.read ? "ri-check-double-line" : "ri-time-line"}
                            style={{ color: r.read ? "#25a194" : "#adb5bd", fontSize: 16 }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="fw-semibold text-sm" style={{ color: "#1a2e2c" }}>
                            {r.name}
                          </div>
                          <div className="text-xs text-secondary-light">{r.studentName} 학부모</div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 10,
                            background: r.read ? "#e8f8f5" : "#f8f9fa",
                            color: r.read ? "#25a194" : "#adb5bd",
                          }}
                        >
                          {r.read ? "읽음" : "미확인"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer py-12 px-20 border-top">
                <button
                  className="btn btn-sm btn-outline-neutral-300 radius-8"
                  onClick={() => setReadStatusModal(null)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
