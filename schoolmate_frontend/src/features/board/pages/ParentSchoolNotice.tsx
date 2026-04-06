import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import { useAuth } from "@/shared/contexts/AuthContext";

// [parkjoon] 학부모용 학교 공지 페이지
// 자녀 탭으로 자녀를 선택하면 해당 자녀의 학교 공지만 표시
// schoolId를 query param으로 전달 → /api/board/parent-school-notice?schoolId=X

interface Child {
  id: number;
  name: string;
  schoolId?: number;
  schoolName?: string | null;
}

interface Board {
  id: number;
  title: string;
  writerName: string;
  viewCount: number;
  pinned: boolean;
  createDate: string;
}

export default function ParentSchoolNotice() {
  const { user } = useAuth();
  const isParent = user?.role === "PARENT";

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const [page, setPage] = useState<any>(null);
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const isInitialLoad = useRef(true);
  const [searchType, setSearchType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  // 자녀 목록 로드
  useEffect(() => {
    if (!isParent) return;
    api.get("/dashboard/parent").then((res) => {
      const kids: Child[] = res.data.children ?? [];
      setChildren(kids);
      if (kids.length > 0) {
        const storedId = Number(sessionStorage.getItem("selectedChildId")) || null;
        const valid = storedId && kids.some((c) => c.id === storedId);
        const resolved = valid ? storedId! : kids[0].id;
        setSelectedChildId(resolved);
      }
    }).catch(() => {});
  }, [isParent]);

  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;

  const load = (p = 0, kw = keyword, st = searchType) => {
    if (!selectedChild?.schoolId) return;

    const params = new URLSearchParams({
      schoolId: String(selectedChild.schoolId),
      page: String(p),
      size: "10",
    });
    if (kw) params.set("keyword", kw);
    if (st) params.set("searchType", st);

    api
      .get(`/board/parent-school-notice?${params}`)
      .then((res) => {
        setPage(res.data);
        setCurrentPage(p);
        if (isInitialLoad.current) {
          setTotalAll(res.data.totalElements);
          isInitialLoad.current = false;
        }
      })
      .catch(() => {});
  };

  // 자녀(학교) 변경 시 목록 재조회
  useEffect(() => {
    if (selectedChildId === null) return;
    isInitialLoad.current = true;
    setTotalAll(null);
    setPage(null);
    setKeyword("");
    setSearchType("");
    setCurrentPage(0);
    load(0, "", "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId]);

  const list: Board[] = page?.content ?? [];

  const getRowNumber = (index: number, board: Board) => {
    if (board.pinned) return null;
    return (page?.totalElements ?? 0) - currentPage * 10 - index;
  };

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 4.5rem - 48px)" }}>

        {/* 제목 */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4, display: "flex", alignItems: "baseline", gap: 8 }}>
            학교 공지
            <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>전체 {totalAll ?? 0}건</span>
          </h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            {selectedChild?.schoolName
              ? `${selectedChild.schoolName}의 공지사항을 확인합니다.`
              : "학교 공지사항을 확인합니다."}
          </p>
        </div>

        {/* 자녀 탭 (여러 명일 때만 표시) */}
        {children.length > 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, flexShrink: 0 }}>
            {children.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedChildId(c.id);
                  sessionStorage.setItem("selectedChildId", String(c.id));
                  if (c.schoolId) sessionStorage.setItem("selectedSchoolId", String(c.schoolId));
                }}
                style={{
                  padding: "6px 20px",
                  borderRadius: 999,
                  border: selectedChildId === c.id ? "none" : "1px solid #d1d5db",
                  background: selectedChildId === c.id ? "#25A194" : "#fff",
                  color: selectedChildId === c.id ? "#fff" : "#374151",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {c.name}
                {c.schoolName && (
                  <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 6, opacity: 0.8 }}>
                    ({c.schoolName})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* 검색 바 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
          <form
            style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
            onSubmit={(e) => { e.preventDefault(); load(0); }}
          >
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <select
                style={{ padding: "5px 24px 5px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, background: "#fff", appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="">전체</option>
                <option value="writer">작성자</option>
                <option value="title">제목</option>
                <option value="content">내용</option>
                <option value="title_content">제목 + 내용</option>
              </select>
              <i className="ri-arrow-down-s-line" style={{ position: "absolute", right: 4, pointerEvents: "none", fontSize: 16, color: "#6b7280" }} />
            </div>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <i className="bi bi-search" style={{ position: "absolute", left: 8, color: "#9ca3af", fontSize: 13, pointerEvents: "none" }} />
              <input
                style={{ padding: "5px 8px 5px 28px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, minWidth: 180, background: "#fff" }}
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <button
              style={{ padding: "5px 12px", background: "#25A194", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
              type="submit"
            >
              검색
            </button>
            <button
              style={{ padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, cursor: "pointer", color: "#374151", whiteSpace: "nowrap" }}
              type="button"
              onClick={() => { setSearchType(""); setKeyword(""); load(0, "", ""); }}
            >
              초기화
            </button>
            {(keyword || searchType) && page && (
              <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 600, color: "#111827" }}>{page.totalElements}건</span> / 전체 {totalAll ?? 0}건
              </span>
            )}
          </form>
        </div>

        {/* 목록 카드 */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", minHeight: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "6%" }} />
                <col style={{ width: "50%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr>
                  {["번호", "제목", "작성자", "작성일", "조회"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#6b7280", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", textAlign: "left", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "48px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                      {selectedChildId === null ? "자녀 정보를 불러오는 중입니다." : "등록된 게시물이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  list.map((board, i) => (
                    <tr key={board.id} style={{ background: board.pinned ? "#f0fdf4" : undefined }}>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" }}>
                        {board.pinned ? (
                          <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>공지</span>
                        ) : (
                          getRowNumber(i, board)
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, borderBottom: "1px solid #f3f4f6", verticalAlign: "middle", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <Link
                          to={`/board/school-notice/${board.id}`}
                          style={{ color: "#1d4ed8", fontWeight: 500, textDecoration: "none" }}
                        >
                          {board.title}
                        </Link>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle", whiteSpace: "nowrap" }}>{board.writerName}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle", whiteSpace: "nowrap" }}>{board.createDate?.slice(0, 10)}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle", whiteSpace: "nowrap" }}>{board.viewCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 페이지네이션 */}
        {page && page.totalPages >= 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => load(currentPage - 1)}
              disabled={currentPage === 0}
              style={{ width: 28, height: 28, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage === 0 ? "not-allowed" : "pointer", color: currentPage === 0 ? "#d1d5db" : "#374151", fontSize: 12 }}
            >‹</button>
            {Array.from({ length: page.totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => load(i)}
                style={{ width: 28, height: 28, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1px solid ${i === currentPage ? "#25A194" : "#e5e7eb"}`, borderRadius: 6, background: i === currentPage ? "#25A194" : "#fff", color: i === currentPage ? "#fff" : "#374151", cursor: "pointer", fontSize: 12, fontWeight: i === currentPage ? 600 : 400 }}
              >{i + 1}</button>
            ))}
            <button
              onClick={() => load(currentPage + 1)}
              disabled={currentPage >= page.totalPages - 1}
              style={{ width: 28, height: 28, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage >= page.totalPages - 1 ? "not-allowed" : "pointer", color: currentPage >= page.totalPages - 1 ? "#d1d5db" : "#374151", fontSize: 12 }}
            >›</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
