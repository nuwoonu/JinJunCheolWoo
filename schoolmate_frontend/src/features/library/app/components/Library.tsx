import { useEffect, useState, useCallback, type CSSProperties } from "react";
import { useAuth } from "@/shared/contexts/AuthContext"; // [woo]
import { TrendingUp, Star, Calendar, Grid3x3, List, Table } from "lucide-react";
import { Link } from "react-router";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  bookCoverUrl,
  borrowBook,
  createBook,
  getMyBorrowed,
  getMyStats,
  refreshBookCovers,
  searchBooks,
  type BookCategoryCode,
  type BookCreateRequest,
  type BookListItem,
  type BookLoanResponse,
  type ReadingStats,
} from "@/features/library/api/libraryApi";

// [cheol] 프론트 표기용 책 타입 (API 응답 BookListItem의 nullable 필드를 빈 문자열로 정규화)
type Book = Omit<BookListItem, "isbn" | "description" | "coverImage"> & {
  isbn: string;
  description: string;
  coverImage: string;
};

// 보기 형식 타입
type ViewMode = "grid" | "list" | "detail";

// [cheol] "800 문학" 같은 프론트 카테고리 라벨 → 백엔드 enum 코드로 변환
const CATEGORY_LABEL_TO_CODE: Record<string, BookCategoryCode> = {
  "000 총류": "CATEGORY_000",
  "100 철학": "CATEGORY_100",
  "200 종교": "CATEGORY_200",
  "300 사회과학": "CATEGORY_300",
  "400 자연과학": "CATEGORY_400",
  "500 기술과학": "CATEGORY_500",
  "600 예술": "CATEGORY_600",
  "700 언어": "CATEGORY_700",
  "800 문학": "CATEGORY_800",
  "900 역사": "CATEGORY_900",
};

const CATEGORIES = [
  { name: "000 총류", color: "bg-gray-100 text-gray-700", textColor: "text-gray-700", icon: "ri-book-2-line", description: "백과사전, 도서관학" },
  { name: "100 철학", color: "bg-purple-100 text-purple-700", textColor: "text-purple-700", icon: "ri-compass-3-line", description: "철학, 심리학, 윤리학" },
  { name: "200 종교", color: "bg-yellow-100 text-yellow-700", textColor: "text-yellow-700", icon: "ri-quill-pen-line", description: "종교, 신학" },
  { name: "300 사회과학", color: "bg-blue-100 text-blue-700", textColor: "text-blue-700", icon: "ri-government-line", description: "정치, 경제, 사회, 법률" },
  { name: "400 자연과학", color: "bg-green-100 text-green-700", textColor: "text-green-700", icon: "ri-flask-line", description: "수학, 물리, 화학, 생물" },
  { name: "500 기술과학", color: "bg-red-100 text-red-700", textColor: "text-red-700", icon: "ri-settings-3-line", description: "의학, 공학, 농업" },
  { name: "600 예술", color: "bg-pink-100 text-pink-700", textColor: "text-pink-700", icon: "ri-palette-line", description: "미술, 음악, 사진, 체육" },
  { name: "700 언어", color: "bg-indigo-100 text-indigo-700", textColor: "text-indigo-700", icon: "ri-translate-2", description: "한국어, 영어, 외국어" },
  { name: "800 문학", color: "bg-cyan-100 text-cyan-700", textColor: "text-cyan-700", icon: "ri-book-open-line", description: "시, 소설, 수필, 희곡" },
  { name: "900 역사", color: "bg-orange-100 text-orange-700", textColor: "text-orange-700", icon: "ri-history-line", description: "역사, 지리, 열전" },
];

export default function Library() {
  const { user } = useAuth(); // [woo]
  const isTeacherOrAdmin = user?.role === "TEACHER" || user?.role === "ADMIN"; // [woo]

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<BookLoanResponse[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // [woo]
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // [cheol] 백엔드 ListResponse → 프론트 Book으로 보정 (isbn/description 빈 문자열 디폴트)
  const mapToBook = (item: BookListItem): Book => ({
    ...item,
    isbn: item.isbn ?? "",
    description: item.description ?? "",
    coverImage: item.coverImage ?? "",
  });

  // [cheol] 검색어/카테고리 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, selectedCategory]);

  // [cheol] 도서 목록 로드 (검색어/카테고리/페이지 변경 시)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const categoryCode = selectedCategory ? CATEGORY_LABEL_TO_CODE[selectedCategory] : undefined;
        const res = await searchBooks({
          keyword: searchQuery || undefined,
          category: categoryCode,
          page: currentPage,
          size: 10,
        });
        if (!cancelled) {
          setBooks(res.content.map(mapToBook));
          setTotalPages(res.totalPages);
          setTotalElements(res.totalElements);
        }
      } catch (err) {
        console.error("[library] 도서 목록 로드 실패", err);
        if (!cancelled) {
          setBooks([]);
          setTotalPages(0);
          setTotalElements(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, selectedCategory, currentPage]);

  // [cheol] 내 대출/통계 로드 (최초 1회)
  useEffect(() => {
    (async () => {
      try {
        const [loans, readingStats] = await Promise.all([getMyBorrowed(), getMyStats()]);
        setBorrowRecords(loans);
        setStats(readingStats);
      } catch (err) {
        console.error("[library] 대출/통계 로드 실패", err);
      }
    })();
  }, []);

  const filteredBooks = books;

  // [woo] 테스트용 도서 20권 — Naver 책 API로 표지 자동 조회되도록 ISBN 정비
  const SEED_BOOKS: BookCreateRequest[] = [
    {
      title: "82년생 김지영",
      author: "조남주",
      category: "CATEGORY_800",
      totalCopies: 3,
      isbn: "9788937473135",
      description: "한국 사회 여성의 삶을 섬세하게 그려낸 소설.",
      publisher: "민음사",
    },
    {
      title: "노르웨이의 숲",
      author: "무라카미 하루키",
      category: "CATEGORY_800",
      totalCopies: 2,
      isbn: "9788937434488",
      description: "상실과 성장을 그린 하루키의 대표작.",
      publisher: "민음사",
    },
    {
      title: "1984",
      author: "조지 오웰",
      category: "CATEGORY_800",
      totalCopies: 3,
      isbn: "9788937460777",
      description: "전체주의 디스토피아를 그린 20세기 고전.",
      publisher: "민음사",
    },
    {
      title: "군주론",
      author: "마키아벨리",
      category: "CATEGORY_300",
      totalCopies: 2,
      isbn: "9791185480152",
      description: "정치 권력의 본질을 분석한 르네상스 시대의 고전.",
      publisher: "롱런",
    },
    {
      title: "국부론",
      author: "애덤 스미스",
      category: "CATEGORY_300",
      totalCopies: 2,
      isbn: "9788937603600",
      description: "근대 경제학의 출발점이 된 고전 경제학 저서.",
      publisher: "비봉출판사",
    },
    {
      title: "클린 코드",
      author: "로버트 마틴",
      category: "CATEGORY_500",
      totalCopies: 3,
      isbn: "9788966260959",
      description: "읽기 좋은 코드를 작성하는 실용적인 방법론.",
      publisher: "인사이트",
    },
    {
      title: "논어",
      author: "공자",
      category: "CATEGORY_100",
      totalCopies: 2,
      isbn: "9791173578922",
      description: "공자와 제자들의 대화를 기록한 유교 경전.",
      publisher: "아르테",
    },
    {
      title: "명상록",
      author: "마르쿠스 아우렐리우스",
      category: "CATEGORY_100",
      totalCopies: 2,
      isbn: "9788982030680",
      description: "로마 황제가 쓴 스토아 철학의 정수.",
      publisher: "육문사",
    },
    {
      title: "반지의 제왕",
      author: "J.R.R. 톨킨",
      category: "CATEGORY_800",
      totalCopies: 3,
      isbn: "9788950922382",
      description: "중간계를 배경으로 한 판타지 대서사시.",
      publisher: "아르테",
    },
    {
      title: "설국",
      author: "가와바타 야스나리",
      category: "CATEGORY_800",
      totalCopies: 2,
      isbn: "9788937460616",
      description: "일본 노벨문학상 수상 작가의 서정적 소설.",
      publisher: "민음사",
    },
    {
      title: "설민석의 조선왕조실록",
      author: "설민석",
      category: "CATEGORY_900",
      totalCopies: 2,
      isbn: "9788933870693",
      description: "대한민국이 선택한 역사 이야기.",
      publisher: "세계사",
    },
    {
      title: "세계사 편력",
      author: "자와할랄 네루",
      category: "CATEGORY_900",
      totalCopies: 2,
      isbn: "9788956450490",
      description: "감옥에서 딸에게 쓴 편지로 이루어진 세계사.",
      publisher: "일빛",
    },
    {
      title: "블랙홀과 시간여행",
      author: "킵 손",
      category: "CATEGORY_400",
      totalCopies: 2,
      isbn: "9791189653101",
      description: "상대성 이론과 블랙홀 물리학을 대중적으로 설명.",
      publisher: "반니",
    },
    {
      title: "종의 기원",
      author: "찰스 다윈",
      category: "CATEGORY_400",
      totalCopies: 2,
      isbn: "9791197534362",
      description: "자연선택에 의한 진화론을 체계화한 과학의 고전.",
      publisher: "런치박스",
    },
    {
      title: "성경 (개역개정)",
      author: "대한성서공회",
      category: "CATEGORY_200",
      totalCopies: 3,
      isbn: "9788953717343",
      description: "기독교 경전 개역개정판.",
      publisher: "아가페출판사",
    },
    {
      title: "법화경",
      author: "석가모니",
      category: "CATEGORY_200",
      totalCopies: 2,
      isbn: "9788996899648",
      description: "대승불교의 핵심 경전.",
      publisher: "불사리탑",
    },
    {
      title: "해리 포터와 마법사의 돌",
      author: "조앤 K. 롤링",
      category: "CATEGORY_800",
      totalCopies: 3,
      isbn: "9791193790403",
      description: "마법사 해리 포터의 호그와트 입학과 첫 번째 모험.",
      publisher: "문학수첩",
    },
    {
      title: "사피엔스",
      author: "유발 하라리",
      category: "CATEGORY_300",
      totalCopies: 3,
      isbn: "9788934972464",
      description: "유인원에서 사이보그까지, 인간 역사의 대담하고 위대한 질문.",
      publisher: "김영사",
    },
    {
      title: "현대 사회학",
      author: "앤서니 기든스",
      category: "CATEGORY_300",
      totalCopies: 2,
      isbn: "9788932471747",
      description: "현대 사회학 이론과 주요 개념을 체계적으로 정리.",
      publisher: "을유문화사",
    },
    {
      title: "파친코",
      author: "이민진",
      category: "CATEGORY_800",
      totalCopies: 3,
      isbn: "9791168340510",
      description: "재일 한국인 가족의 4대에 걸친 서사를 담은 소설.",
      publisher: "인플루엔셜",
    },
  ];

  // [woo] 순차 처리 — 동시 요청 시 Naver API rate limit(429) 발생하므로 1건씩 처리
  const handleSeedBooks = async () => {
    if (!confirm("테스트용 도서 20권을 DB에 추가하시겠습니까?")) return;
    setIsSeeding(true);
    try {
      for (const book of SEED_BOOKS) {
        try {
          await createBook(book);
        } catch {
          // ISBN 중복 등 개별 오류는 건너뜀
        }
      }
      const page = await searchBooks({ page: 0, size: 60 });
      setBooks(page.content.map(mapToBook));
      alert("도서 추가 완료!");
    } catch (err) {
      console.error("[library] 테스트 도서 추가 실패", err);
      alert("도서 추가에 실패했습니다.");
    } finally {
      setIsSeeding(false);
    }
  };

  // [woo] 표지 이미지 일괄 업데이트
  const handleRefreshCovers = useCallback(async () => {
    if (!confirm("표지 이미지가 없는 책들을 네이버 책 API로 자동 업데이트합니다. 계속할까요?")) return;
    setIsRefreshing(true);
    try {
      const { updatedCount } = await refreshBookCovers();
      const page = await searchBooks({
        keyword: searchQuery || undefined,
        category: selectedCategory ? CATEGORY_LABEL_TO_CODE[selectedCategory] : undefined,
        page: currentPage,
        size: 10,
      });
      setBooks(page.content.map(mapToBook));
      alert(`표지 이미지 업데이트 완료: ${updatedCount}권`);
    } catch (err) {
      console.error("[library] 표지 업데이트 실패", err);
      alert("표지 이미지 업데이트에 실패했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedCategory, currentPage]);

  // [cheol] 대출하기 - 실제 API 호출 후 목록 재조회
  const handleBorrow = async (bookId: number) => {
    try {
      await borrowBook(bookId);
      // 재고/대출 목록/통계 갱신
      const [page, loans, readingStats] = await Promise.all([
        searchBooks({
          keyword: searchQuery || undefined,
          category: selectedCategory ? CATEGORY_LABEL_TO_CODE[selectedCategory] : undefined,
          page: 0,
          size: 60,
        }),
        getMyBorrowed(),
        getMyStats(),
      ]);
      setBooks(page.content.map(mapToBook));
      setBorrowRecords(loans);
      setStats(readingStats);
      alert("대출이 완료되었습니다.");
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((err as any).response?.data ?? "대출에 실패했습니다.")
          : "대출에 실패했습니다.";
      alert(String(message));
    }
  };

  // 통계 계산 (stats API가 도착하기 전에는 대출 목록에서 계산)
  const borrowedCount = stats?.activeLoans ?? borrowRecords.filter((r) => r.status === "BORROWED").length;
  const overdueCount = stats?.overdueCount ?? borrowRecords.filter((r) => r.status === "OVERDUE").length;
  const readThisMonth = stats?.currentMonthBooks ?? 0;
  const monthlyGoal = stats?.monthlyGoal ?? 5;
  const libraryRootStyle = { "--primary": "#25A194" } as CSSProperties;
  const topStatsCards = [
    {
      key: "borrowed",
      label: "대출중인 도서",
      value: `${borrowedCount}권`,
      icon: "ri-book-open-line",
      to: "/library/borrowed",
      borderColor: "#bfdbfe",
      background: "#eff6ff",
      iconBackground: "rgba(37, 99, 235, 0.12)",
      iconColor: "#2563eb",
      valueColor: "#1d4ed8",
    },
    {
      key: "monthly",
      label: "이번 달 독서량",
      value: `${readThisMonth}권`,
      icon: "ri-line-chart-line",
      to: "/library/stats",
      borderColor: "#bbf7d0",
      background: "#f0fdf4",
      iconBackground: "rgba(22, 163, 74, 0.12)",
      iconColor: "#16a34a",
      valueColor: "#15803d",
    },
    {
      key: "overdue",
      label: "연체 도서",
      value: `${overdueCount}권`,
      icon: "ri-alarm-warning-line",
      to: "/library/overdue",
      borderColor: "#fecaca",
      background: "#fff7ed",
      iconBackground: "rgba(239, 68, 68, 0.12)",
      iconColor: "#dc2626",
      valueColor: "#dc2626",
    },
    {
      key: "goal",
      label: "독서 목표",
      value: `${readThisMonth}/${monthlyGoal}권`,
      icon: "ri-medal-2-line",
      to: "/library/stats",
      borderColor: "#99f6e4",
      background: "#f0fdfa",
      iconBackground: "rgba(13, 148, 136, 0.14)",
      iconColor: "#0f766e",
      valueColor: "#0f766e",
    },
  ];

  return (
    <DashboardLayout>
      <div className="library-root" style={libraryRootStyle}>
        <div className="flex justify-between items-start gap-3 mb-4 flex-wrap">
          <div>
            <div
              className="library-page-title"
              style={{
                marginBottom: 4,
              }}
            >
              도서관
            </div>
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>학교 도서를 검색하고 대출 현황을 확인합니다.</p>
          </div>
          <div className="flex gap-2">
            {/* [woo] 교사/관리자만 표지 자동 업데이트 버튼 표시 */}
            {isTeacherOrAdmin && (
              <Button
                onClick={handleRefreshCovers}
                disabled={isRefreshing}
                className="bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs px-3 py-1.5"
              >
                {isRefreshing ? "업데이트 중..." : "표지 자동 업데이트"}
              </Button>
            )}
            <Button
              onClick={handleSeedBooks}
              disabled={isSeeding}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs px-3 py-1.5"
            >
              {isSeeding ? "추가 중..." : "[테스트] 도서 20권 DB 추가"}
            </Button>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <main>
          {/* 통계 카드 */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {topStatsCards.map((card) => (
                <Link key={card.key} to={card.to} className="block">
                  <div
                    className="w-full cursor-pointer hover:shadow-md transition-shadow"
                    style={{
                      width: "100%",
                      padding: "0.875rem 1rem",
                      borderRadius: "0.75rem",
                      border: `1px solid ${card.borderColor}`,
                      background: card.background,
                      boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: card.iconBackground,
                          color: card.iconColor,
                          fontSize: 14,
                        }}
                      >
                        <i className={card.icon} />
                      </span>
                      <p style={{ fontSize: "0.75rem", color: card.iconColor, marginBottom: 0, fontWeight: 600 }}>{card.label}</p>
                    </div>
                    <p
                      style={{
                        fontWeight: 700,
                        color: card.valueColor,
                        fontSize: "1.25rem",
                        lineHeight: 1.1,
                        marginBottom: 0,
                        textAlign: "right",
                      }}
                    >
                      {card.value}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 카테고리와 검색 */}
          <Card className="p-6 mb-8">
            <div className="flex flex-col gap-4">
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <i
                  className="ri-search-line"
                  style={{ position: "absolute", left: 8, color: "#9ca3af", fontSize: 13, pointerEvents: "none" }}
                />
                <input
                  type="text"
                  style={{
                    padding: "9px 8px 9px 28px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                    width: "100%",
                    background: "#fff",
                    color: "#111827",
                  }}
                  placeholder="책 제목이나 저자로 검색하세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  전체
                </Button>
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.name}
                    variant={selectedCategory === cat.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={selectedCategory === cat.name ? "" : cat.color}
                  >
                    <span
                      className={`mr-1 inline-flex items-center text-base leading-none ${
                        selectedCategory === cat.name ? "text-white" : cat.textColor
                      }`}
                    >
                      <i className={cat.icon} />
                    </span>
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* 탭 콘텐츠 */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <Tabs defaultValue="catalog" className="space-y-4">
              <div className="pl-1">
                <TabsList className="grid max-w-xs grid-cols-3">
                  <TabsTrigger value="catalog">도서 목록</TabsTrigger>
                  <TabsTrigger value="borrowed">대출 현황</TabsTrigger>
                  <TabsTrigger value="popular">인기 도서</TabsTrigger>
                </TabsList>
              </div>

            {/* 도서 목록 */}
            <TabsContent value="catalog" className="space-y-4">
                {/* 보기 형식 선택 버튼 */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">총 {totalElements}권의 도서</p>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-8 px-3"
                    >
                      <Grid3x3 className="w-4 h-4 mr-1" />
                      <span className="text-xs">아이콘</span>
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8 px-3"
                    >
                      <List className="w-4 h-4 mr-1" />
                      <span className="text-xs">목록</span>
                    </Button>
                    <Button
                      variant={viewMode === "detail" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("detail")}
                      className="h-8 px-3"
                    >
                      <Table className="w-4 h-4 mr-1" />
                      <span className="text-xs">자세히</span>
                    </Button>
                  </div>
                </div>

                {/* 그리드 보기 (아이콘) */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredBooks.map((book) => (
                      <Link key={book.id} to={`/library/book/${book.id}`}>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full cursor-pointer">
                          <div className="aspect-[2/3] relative bg-gray-100">
                            <ImageWithFallback
                              src={bookCoverUrl(book.id, book.coverImage) ?? undefined}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                            {!book.available && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Badge variant="secondary" className="text-xs">
                                  대출중
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="p-3 flex flex-col flex-1">
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm mb-0.5 line-clamp-2">{book.title}</h3>
                                <p className="text-xs text-gray-600 truncate">{book.author}</p>
                              </div>
                              <Badge
                                className={`${CATEGORIES.find((c) => c.name === book.category)?.color} text-xs flex-shrink-0`}
                              >
                                {book.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{book.description}</p>
                            <div className="flex items-center justify-between text-xs mb-2 mt-auto">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span className="font-semibold">{book.rating}</span>
                              </div>
                              <span className="text-gray-500">대출 {book.borrowCount}회</span>
                            </div>
                            <Button
                              className="w-full h-8 text-xs"
                              disabled={!book.available}
                              variant={book.available ? "default" : "secondary"}
                              onClick={(e) => {
                                e.preventDefault();
                                handleBorrow(book.id);
                              }}
                            >
                              {book.available ? "대출하기" : "대출 불가"}
                            </Button>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}

                {/* 목록 보기 */}
                {viewMode === "list" && (
                  <Card className="overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {filteredBooks.map((book) => (
                        <Link key={book.id} to={`/library/book/${book.id}`}>
                          <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                <ImageWithFallback
                                  src={bookCoverUrl(book.id, book.coverImage) ?? undefined}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-sm">{book.title}</h3>
                                  <Badge
                                    className={`${CATEGORIES.find((c) => c.name === book.category)?.color} text-xs`}
                                  >
                                    {book.category}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mb-1">{book.author}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">{book.description}</p>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="text-right">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm font-semibold">{book.rating}</span>
                                  </div>
                                  <span className="text-xs text-gray-500">대출 {book.borrowCount}회</span>
                                </div>
                                <Button
                                  size="sm"
                                  className="h-8"
                                  disabled={!book.available}
                                  variant={book.available ? "default" : "secondary"}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleBorrow(book.id);
                                  }}
                                >
                                  {book.available ? "대출하기" : "대출 불가"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Card>
                )}

                {/* 자세히 보기 (테이블) */}
                {viewMode === "detail" && (
                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">표지</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">제목</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">저자</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">카테고리</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">ISBN</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">평점</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">대출횟수</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">상태</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">작업</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredBooks.map((book) => (
                            <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="w-10 h-14 bg-gray-200 rounded overflow-hidden">
                                  <ImageWithFallback
                                    src={bookCoverUrl(book.id, book.coverImage) ?? undefined}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-sm">{book.title}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">{book.description}</p>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{book.author}</td>
                              <td className="px-4 py-3">
                                <Badge className={`${CATEGORIES.find((c) => c.name === book.category)?.color} text-xs`}>
                                  {book.category}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600 font-mono">{book.isbn}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-sm font-semibold">{book.rating}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{book.borrowCount}회</td>
                              <td className="px-4 py-3">
                                <Badge variant={book.available ? "default" : "secondary"} className="text-xs">
                                  {book.available ? "대출가능" : "대출중"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  disabled={!book.available}
                                  variant={book.available ? "default" : "secondary"}
                                  onClick={() => handleBorrow(book.id)}
                                >
                                  {book.available ? "대출" : "불가"}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center gap-2 pt-4 mt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="h-8 px-3 text-xs"
                      >
                        이전
                      </Button>

                      {(() => {
                        const pages: (number | "...")[] = [];
                        if (totalPages <= 7) {
                          for (let i = 0; i < totalPages; i++) pages.push(i);
                        } else {
                          pages.push(0);
                          if (currentPage > 2) pages.push("...");
                          for (
                            let i = Math.max(1, currentPage - 1);
                            i <= Math.min(totalPages - 2, currentPage + 1);
                            i++
                          ) {
                            pages.push(i);
                          }
                          if (currentPage < totalPages - 3) pages.push("...");
                          pages.push(totalPages - 1);
                        }
                        return pages.map((p, idx) =>
                          p === "..." ? (
                            <span key={`el-${idx}`} className="px-1 text-xs text-gray-400">
                              …
                            </span>
                          ) : (
                            <Button
                              key={p}
                              variant={currentPage === p ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0 text-xs"
                              onClick={() => setCurrentPage(p as number)}
                            >
                              {(p as number) + 1}
                            </Button>
                          ),
                        );
                      })()}

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages - 1}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="h-8 px-3 text-xs"
                      >
                        다음
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      {currentPage + 1} / {totalPages} 페이지
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* 대출 현황 */}
              <TabsContent value="borrowed" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    나의 대출 현황
                  </h3>
                  <div className="space-y-3">
                    {borrowRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold mb-1">{record.title}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>대출일: {record.borrowDate}</span>
                            <span>반납일: {record.dueDate}</span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            record.status === "RETURNED"
                              ? "secondary"
                              : record.status === "OVERDUE"
                                ? "destructive"
                                : "default"
                          }
                        >
                          {record.status === "BORROWED" ? "대출중" : record.status === "RETURNED" ? "반납완료" : "연체"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* 대출 통계 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="font-bold mb-4">월별 독서 통계</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">3월</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: "67%" }}></div>
                          </div>
                          <span className="text-sm font-semibold">5권</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">2월</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: "80%" }}></div>
                          </div>
                          <span className="text-sm font-semibold">6권</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">1월</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: "53%" }}></div>
                          </div>
                          <span className="text-sm font-semibold">4권</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-bold mb-4">선호 카테고리</h3>
                    <div className="space-y-3">
                      {CATEGORIES.slice(0, 4).map((cat, index) => (
                        <div key={cat.name} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center text-base leading-none ${cat.textColor}`}>
                              <i className={cat.icon} />
                            </span>
                            <span className="text-sm">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${cat.color.split(" ")[0].replace("bg-", "bg-").replace("-100", "-500")}`}
                                style={{ width: `${(4 - index) * 25}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold">{4 - index}권</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* 인기 도서 */}
              <TabsContent value="popular" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    이번 주 인기 도서
                  </h3>
                  <div className="space-y-4">
                    {books
                      .sort((a, b) => b.borrowCount - a.borrowCount)
                      .slice(0, 5)
                      .map((book, index) => (
                        <div
                          key={book.id}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="w-16 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            <ImageWithFallback
                              src={bookCoverUrl(book.id, book.coverImage) ?? undefined}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold mb-1">{book.title}</h4>
                            <p className="text-sm text-gray-600">{book.author}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={CATEGORIES.find((c) => c.name === book.category)?.color}>
                                {book.category}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-semibold">{book.rating}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">대출</p>
                            <p className="text-lg font-bold text-blue-600">{book.borrowCount}회</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>

                {/* 추천 도서 */}
                <Card className="p-6 bg-blue-50 border border-blue-100">
                  <h3 className="text-lg font-bold mb-4">사서 추천 도서</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex gap-3">
                        <div className="w-20 h-28 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src="https://images.unsplash.com/photo-1752243751485-28462bdee57a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"
                            alt="추천 도서"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold mb-1">사피엔스</h4>
                          <p className="text-sm text-gray-600 mb-2">유발 하라리</p>
                          <p className="text-xs text-gray-500 mb-2">인류의 역사를 새롭게 조망하는 흥미진진한 책</p>
                          <Button size="sm">자세히 보기</Button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex gap-3">
                        <div className="w-20 h-28 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src="https://images.unsplash.com/photo-1725870475677-7dc91efe9f93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"
                            alt="추천 도서"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold mb-1">코스모스</h4>
                          <p className="text-sm text-gray-600 mb-2">칼 세이건</p>
                          <p className="text-xs text-gray-500 mb-2">우주의 신비를 탐구하는 과학 고전</p>
                          <Button size="sm">자세히 보기</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
