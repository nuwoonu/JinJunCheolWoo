import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [soojin] /board/teacher - 교직원 게시판 목록 (ClassBoard.tsx 형식으로 재작성)

interface Board {
  id: number;
  title: string;
  content: string;
  writerName: string;
  viewCount: number;
  pinned: boolean;
  createDate: string;
  tag?: string;
  likeCount?: number;
  commentCount?: number;
}

interface BoardStats {
  totalCount: number;
  totalViewCount: number;
  todayCount: number;
}

const SORT_OPTIONS = [
  { label: "최신순", sortBy: "createDate" },
  { label: "조회순", sortBy: "viewCount" },
  { label: "인기순", sortBy: "viewCount" },
] as const;

const FILTER_OPTIONS = [
  { label: "전체", searchType: "ALL" },
  { label: "제목", searchType: "TITLE" },
  { label: "내용", searchType: "CONTENT" },
  { label: "작성자", searchType: "WRITER" },
] as const;

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  질문: { bg: "#eff6ff", color: "#3b82f6" },
  모임: { bg: "#f0fdf4", color: "#16a34a" },
  유머: { bg: "#fefce8", color: "#ca8a04" },
  공지: { bg: "#fef2f2", color: "#ef4444" },
};
function getTagStyle(tag: string) {
  return TAG_COLORS[tag] ?? { bg: "#f3f4f6", color: "#6b7280" };
}

export default function TeacherBoard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [filterLabel, setFilterLabel] = useState("전체");
  const [searchType, setSearchType] = useState("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [sortLabel, setSortLabel] = useState("최신순");
  const [sortBy, setSortBy] = useState("createDate");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<BoardStats>({ totalCount: 0, totalViewCount: 0, todayCount: 0 });
  const [popularBoards, setPopularBoards] = useState<Board[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  const [selectedTag, setSelectedTag] = useState<string>("");

  const isAdmin = user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";

  const fetchBoards = (p = 0, kw = keyword, st = searchType, sb = sortBy, tg = selectedTag) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), size: "10", searchType: st, sortBy: sb });
    if (kw) params.set("keyword", kw);
    if (tg) params.set("tag", tg);
    api
      .get(`/board/teacher-board?${params}`)
      .then((res) => {
        setBoards(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
        setPage(res.data.currentPage);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchSidebar = () => {
    setSidebarLoading(true);
    Promise.all([
      api.get("/board/stats?boardType=TEACHER_BOARD"),
      api.get("/board/popular?boardType=TEACHER_BOARD&limit=5"),
    ])
      .then(([statsRes, popularRes]) => {
        setStats({
          totalCount: statsRes.data.totalCount ?? 0,
          totalViewCount: statsRes.data.totalViewCount ?? 0,
          todayCount: statsRes.data.todayCount ?? 0,
        });
        setPopularBoards(popularRes.data ?? []);
      })
      .catch(() => {})
      .finally(() => setSidebarLoading(false));
  };

  useEffect(() => {
    fetchBoards(0, "", "ALL", "createDate");
    fetchSidebar();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setKeyword(val);
      fetchBoards(0, val, searchType, sortBy);
    }, 500);
  };

  const handleFilterSelect = (opt: (typeof FILTER_OPTIONS)[number]) => {
    setFilterLabel(opt.label);
    setSearchType(opt.searchType);
    setFilterOpen(false);
    fetchBoards(0, keyword, opt.searchType, sortBy);
  };

  const handleSortSelect = (opt: (typeof SORT_OPTIONS)[number]) => {
    setSortLabel(opt.label);
    setSortBy(opt.sortBy);
    setSortOpen(false);
    fetchBoards(0, keyword, searchType, opt.sortBy);
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    fetchBoards(0, keyword, searchType, sortBy, tag);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 60 * 1000) return "방금 전";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}분 전`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}시간 전`;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const dropdownBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    padding: "0 12px",
    height: "100%",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
  };

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
        <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 0 }}>교직원 게시판</h6>
        {(isTeacher || isAdmin) && (
          <button
            type="button"
            style={{ padding: "5px 12px", background: "#25A194", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => navigate("/board/teacher/write")}
          >
            <i className="ri-edit-line" />
            글쓰기
          </button>
        )}
      </div>

      <div className="row" style={{ alignItems: "flex-start" }}>
        {/* 좌측: 통합 카드 */}
        <div className="col-12 col-xl-8" style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 12rem)" }}>
          <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, borderRadius: 12, overflow: "hidden" }}>

            {/* 검색 영역 */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 0, background: "#fff" }}>
              <div ref={filterRef} style={{ position: "relative", flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setFilterOpen((p) => !p)}
                  style={{ ...dropdownBtnStyle, borderRight: "1px solid #e5e7eb", paddingRight: 14, height: 38 }}
                >
                  {filterLabel}
                  <i className={filterOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} style={{ fontSize: 15, color: "#9ca3af" }} />
                </button>
                {filterOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 200, minWidth: 90, overflow: "hidden" }}>
                    {FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleFilterSelect(opt)}
                        style={{ display: "block", width: "100%", padding: "9px 16px", background: filterLabel === opt.label ? "#eff6ff" : "transparent", border: "none", textAlign: "left", fontSize: 13, fontWeight: filterLabel === opt.label ? 700 : 500, color: filterLabel === opt.label ? "#3b82f6" : "#374151", cursor: "pointer" }}
                        onMouseEnter={(e) => { if (filterLabel !== opt.label) (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
                        onMouseLeave={(e) => { if (filterLabel !== opt.label) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 12px", gap: 8 }}>
                <i className="ri-search-line" style={{ color: "#9ca3af", fontSize: 17, flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchChange}
                  placeholder="검색어를 입력하세요..."
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#374151", background: "transparent" }}
                />
                {searchInput && (
                  <button
                    type="button"
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}
                    onClick={() => { setSearchInput(""); setKeyword(""); fetchBoards(0, "", searchType, sortBy); }}
                  >
                    <i className="ri-close-line" style={{ color: "#9ca3af", fontSize: 16 }} />
                  </button>
                )}
              </div>
            </div>

            {/* 서브 헤더: 태그 탭 + 정렬 */}
            <div style={{ padding: "10px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "#fafafa" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                {(["전체", "질문", "모임", "유머", "공지"] as const).map((tab) => {
                  const isActive = tab === "전체" ? selectedTag === "" : selectedTag === tab;
                  const tagS = tab !== "전체" ? getTagStyle(tab) : null;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => handleTagSelect(tab === "전체" ? "" : tab)}
                      style={{ padding: "3px 10px", borderRadius: 20, border: isActive ? "none" : "1px solid #e5e7eb", fontSize: 12, fontWeight: 600, cursor: "pointer", background: isActive ? (tagS ? tagS.bg : "#3b82f6") : "transparent", color: isActive ? (tagS ? tagS.color : "#fff") : "#9ca3af", transition: "all 0.15s" }}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  총 <b style={{ color: "#3b82f6" }}>{totalElements}</b>건
                </span>
                <div ref={sortRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setSortOpen((p) => !p)}
                    style={{ padding: "4px 10px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    {sortLabel}
                    <i className={sortOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} style={{ fontSize: 14, color: "#9ca3af" }} />
                  </button>
                  {sortOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 200, minWidth: 90, overflow: "hidden" }}>
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleSortSelect(opt)}
                          style={{ display: "block", width: "100%", padding: "9px 16px", background: sortLabel === opt.label ? "#eff6ff" : "transparent", border: "none", textAlign: "left", fontSize: 13, fontWeight: sortLabel === opt.label ? 700 : 500, color: sortLabel === opt.label ? "#3b82f6" : "#374151", cursor: "pointer" }}
                          onMouseEnter={(e) => { if (sortLabel !== opt.label) (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
                          onMouseLeave={(e) => { if (sortLabel !== opt.label) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 피드 리스트 */}
            <div style={{ flex: 1 }}>
              {loading ? (
                <div style={{ height: "100%", minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>불러오는 중...</div>
              ) : boards.length === 0 ? (
                <div style={{ height: "100%", minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ color: "#94a3b8", marginBottom: 0 }}>{keyword ? "검색 결과가 없습니다." : "등록된 게시글이 없습니다."}</p>
                </div>
              ) : (
                <div>
                  {boards.map((board) => {
                    const isNew = Date.now() - new Date(board.createDate).getTime() < 24 * 60 * 60 * 1000;
                    const tagStyle = board.tag ? getTagStyle(board.tag) : null;
                    return (
                      <div
                        key={board.id}
                        style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.15s" }}
                        onClick={() => navigate(`/board/teacher/${board.id}`)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {tagStyle && board.tag && (
                          <div style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: tagStyle.bg, color: tagStyle.color }}>{board.tag}</span>
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          {isNew && (
                            <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 5px", borderRadius: 3, background: "#ef4444", color: "#fff", flexShrink: 0, lineHeight: "14px" }}>N</span>
                          )}
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1.4 }}>{board.title}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#9ca3af" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 2 }}><i className="ri-user-line" style={{ fontSize: 12 }} />{board.writerName}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 2 }}><i className="ri-calendar-line" style={{ fontSize: 12 }} />{formatDate(board.createDate)}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 2 }}><i className="ri-eye-line" style={{ fontSize: 12 }} />{board.viewCount}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 2 }}><i className="ri-heart-line" style={{ fontSize: 12 }} />{board.likeCount ?? 0}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 2 }}><i className="ri-chat-1-line" style={{ fontSize: 12 }} />{board.commentCount ?? 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "16px 0", gap: 2, flexShrink: 0 }}>
              <button onClick={() => fetchBoards(page - 1)} disabled={page === 0} style={{ background: "none", border: "none", cursor: page === 0 ? "not-allowed" : "pointer", color: page === 0 ? "#d1d5db" : "#6b7280", padding: "4px 6px", fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center" }}>
                <i className="ri-arrow-left-s-line" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => fetchBoards(i)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: i === page ? 700 : 400, color: i === page ? "#3b82f6" : "#6b7280", fontSize: i === page ? 15 : 14, padding: "4px 8px", borderBottom: i === page ? "2px solid #3b82f6" : "2px solid transparent" }}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => fetchBoards(page + 1)} disabled={page >= totalPages - 1} style={{ background: "none", border: "none", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", color: page >= totalPages - 1 ? "#d1d5db" : "#6b7280", padding: "4px 6px", fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center" }}>
                <i className="ri-arrow-right-s-line" />
              </button>
            </div>
          </div>
        </div>

        {/* 우측: 인기글 + 통계 사이드바 */}
        <div className="col-12 col-xl-4" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ position: "sticky", top: 90, display: "flex", flexDirection: "column", gap: 16, minHeight: 520 }}>
            {/* 인기글 카드 */}
            <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <i className="ri-fire-fill" style={{ color: "#ef4444", fontSize: 18 }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>인기 게시글</span>
              </div>
              <div style={{ flex: 1 }}>
                {sidebarLoading ? (
                  <div style={{ height: "100%", minHeight: 160, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>불러오는 중...</div>
                ) : popularBoards.length === 0 ? (
                  <div style={{ height: "100%", minHeight: 160, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>게시글이 없습니다.</div>
                ) : (
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {popularBoards.map((board) => (
                      <div
                        key={board.id}
                        style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", cursor: "pointer", transition: "background 0.15s" }}
                        onClick={() => navigate(`/board/teacher/${board.id}`)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{board.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#9ca3af", marginTop: 5 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 2 }}><i className="ri-eye-line" style={{ fontSize: 11 }} />{board.viewCount}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 2 }}><i className="ri-heart-line" style={{ fontSize: 11 }} />{board.likeCount ?? 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 통계 카드 */}
            <div className="card" style={{ borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ri-bar-chart-2-line" style={{ color: "#3b82f6", fontSize: 18 }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>게시판 통계</span>
              </div>
              {sidebarLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", paddingTop: 16, paddingBottom: 16, fontSize: 13 }}>불러오는 중...</div>
              ) : (
                <div style={{ padding: "16px 20px" }}>
                  {[
                    { label: "전체 게시글", value: stats.totalCount, color: "#3b82f6" },
                    { label: "오늘 작성", value: stats.todayCount, color: "#10b981" },
                    { label: "전체 조회", value: stats.totalViewCount, color: "#f97316" },
                  ].map((item, i, arr) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{item.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
