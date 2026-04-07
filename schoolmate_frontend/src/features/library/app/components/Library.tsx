import { useEffect, useState } from "react";
import { Search, BookOpen, Clock, TrendingUp, Star, Calendar, Grid3x3, List, Table } from "lucide-react";
import { Link } from "react-router";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
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
  { name: "000 총류", color: "bg-gray-100 text-gray-700", icon: "📚", description: "백과사전, 도서관학" },
  { name: "100 철학", color: "bg-purple-100 text-purple-700", icon: "🤔", description: "철학, 심리학, 윤리학" },
  { name: "200 종교", color: "bg-yellow-100 text-yellow-700", icon: "🙏", description: "종교, 신학" },
  { name: "300 사회과학", color: "bg-blue-100 text-blue-700", icon: "🏛️", description: "정치, 경제, 사회, 법률" },
  { name: "400 자연과학", color: "bg-green-100 text-green-700", icon: "🔬", description: "수학, 물리, 화학, 생물" },
  { name: "500 기술과학", color: "bg-red-100 text-red-700", icon: "⚙️", description: "의학, 공학, 농업" },
  { name: "600 예술", color: "bg-pink-100 text-pink-700", icon: "🎨", description: "미술, 음악, 사진, 체육" },
  { name: "700 언어", color: "bg-indigo-100 text-indigo-700", icon: "🗣️", description: "한국어, 영어, 외국어" },
  { name: "800 문학", color: "bg-cyan-100 text-cyan-700", icon: "📖", description: "시, 소설, 수필, 희곡" },
  { name: "900 역사", color: "bg-orange-100 text-orange-700", icon: "📜", description: "역사, 지리, 열전" },
];

export default function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<BookLoanResponse[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isSeeding, setIsSeeding] = useState(false);
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

  // [cheol] 테스트용 도서 20권 일괄 등록
  const SEED_BOOKS: BookCreateRequest[] = [
    {
      title: "82년생 김지영",
      author: "조남주",
      category: "CATEGORY_800",
      totalCopies: 3,
      isbn: "9788936434267",
      description: "한국 사회 여성의 삶을 섬세하게 그려낸 소설.",
      publisher: "민음사",
    },
    {
      title: "노르웨이의 숲",
      author: "무라카미 하루키",
      category: "CATEGORY_800",
      totalCopies: 2,
      isbn: "9788937460449",
      description: "상실과 성장을 그린 하루키의 대표작.",
      publisher: "문학동네",
    },
    {
      title: "1984",
      author: "조지 오웰",
      category: "CATEGORY_800",
      totalCopies: 3,
      isbn: "9788937460197",
      description: "전체주의 디스토피아를 그린 20세기 고전.",
      publisher: "민음사",
    },
    {
      title: "군주론",
      author: "마키아벨리",
      category: "CATEGORY_300",
      totalCopies: 2,
      isbn: "9788937460371",
      description: "정치 권력의 본질을 분석한 르네상스 시대의 고전.",
      publisher: "까치",
    },
    {
      title: "국부론",
      author: "애덤 스미스",
      category: "CATEGORY_300",
      totalCopies: 2,
      isbn: "9788960013513",
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
      isbn: "9788937460166",
      description: "공자와 제자들의 대화를 기록한 유교 경전.",
      publisher: "을유문화사",
    },
    {
      title: "명상록",
      author: "마르쿠스 아우렐리우스",
      category: "CATEGORY_100",
      totalCopies: 2,
      isbn: "9788937462818",
      description: "로마 황제가 쓴 스토아 철학의 정수.",
      publisher: "동서문화사",
    },
    {
      title: "반지의 제왕",
      author: "J.R.R. 톨킨",
      category: "CATEGORY_800",
      totalCopies: 3,
      isbn: "9788936434311",
      description: "중간계를 배경으로 한 판타지 대서사시.",
      publisher: "씨앤톡",
    },
    {
      title: "설국",
      author: "가와바타 야스나리",
      category: "CATEGORY_800",
      totalCopies: 2,
      isbn: "9788937460548",
      description: "일본 노벨문학상 수상 작가의 서정적 소설.",
      publisher: "민음사",
    },
    {
      title: "조선왕조실록",
      author: "조선시대 사관",
      category: "CATEGORY_900",
      totalCopies: 1,
      isbn: "9788958620389",
      description: "조선 태조부터 철종까지의 역사적 기록.",
      publisher: "한국학중앙연구원",
    },
    {
      title: "세계사 편력",
      author: "자와할랄 네루",
      category: "CATEGORY_900",
      totalCopies: 2,
      isbn: "9788960010604",
      description: "감옥에서 딸에게 쓴 편지로 이루어진 세계사.",
      publisher: "일빛",
    },
    {
      title: "블랙홀과 시간여행",
      author: "킵 손",
      category: "CATEGORY_400",
      totalCopies: 2,
      isbn: "9788987090634",
      description: "상대성 이론과 블랙홀 물리학을 대중적으로 설명.",
      publisher: "이지북",
    },
    {
      title: "종의 기원",
      author: "찰스 다윈",
      category: "CATEGORY_400",
      totalCopies: 2,
      isbn: "9788937462825",
      description: "자연선택에 의한 진화론을 체계화한 과학의 고전.",
      publisher: "을유문화사",
    },
    {
      title: "성경 (개역개정)",
      author: "대한성서공회",
      category: "CATEGORY_200",
      totalCopies: 3,
      isbn: "9788941214298",
      description: "기독교 경전 개역개정판.",
      publisher: "대한성서공회",
    },
    {
      title: "법화경",
      author: "석가모니",
      category: "CATEGORY_200",
      totalCopies: 2,
      isbn: "9788974798291",
      description: "대승불교의 핵심 경전.",
      publisher: "동국역경원",
    },
    {
      title: "한국어 문법론",
      author: "이익섭",
      category: "CATEGORY_700",
      totalCopies: 2,
      isbn: "9788971806579",
      description: "한국어 문법의 체계를 종합적으로 다룬 표준 교재.",
      publisher: "학연사",
    },
    {
      title: "현대음악의 이해",
      author: "폴 그리피스",
      category: "CATEGORY_600",
      totalCopies: 1,
      isbn: "9788991626232",
      description: "20세기 현대음악의 흐름을 개관하는 입문서.",
      publisher: "이화여대출판부",
    },
    {
      title: "사회학의 이해",
      author: "앤서니 기든스",
      category: "CATEGORY_300",
      totalCopies: 2,
      isbn: "9788946049109",
      description: "현대 사회학 이론과 주요 개념을 체계적으로 정리.",
      publisher: "을유문화사",
    },
    {
      title: "파친코",
      author: "이민진",
      category: "CATEGORY_800",
      totalCopies: 3,
      isbn: "9791165210113",
      description: "재일 한국인 가족의 4대에 걸친 서사를 담은 소설.",
      publisher: "인플루엔셜",
    },
  ];

  const handleSeedBooks = async () => {
    if (!confirm("테스트용 도서 20권을 DB에 추가하시겠습니까?")) return;
    setIsSeeding(true);
    try {
      await Promise.all(SEED_BOOKS.map((book) => createBook(book)));
      const page = await searchBooks({ page: 0, size: 60 });
      setBooks(page.content.map(mapToBook));
      alert("도서 20권이 성공적으로 추가되었습니다.");
    } catch (err) {
      console.error("[library] 테스트 도서 추가 실패", err);
      alert("일부 도서 추가에 실패했습니다. 콘솔을 확인하세요.");
    } finally {
      setIsSeeding(false);
    }
  };

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

  return (
    <DashboardLayout>
      <div className="library-root">
        {/* [테스트] 도서 추가 버튼 */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={handleSeedBooks}
            disabled={isSeeding}
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5"
          >
            {isSeeding ? "추가 중..." : "[테스트] 도서 20권 DB 추가"}
          </Button>
        </div>

        {/* 메인 콘텐츠 */}
        <main>
          {/* 통계 카드 */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link to="/library/borrowed" className="block">
                <Card className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs">대출중인 도서</p>
                      <p className="text-2xl font-bold">{borrowedCount}</p>
                    </div>
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to="/library/stats" className="block">
                <Card className="p-3 bg-gradient-to-br from-green-500 to-green-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-xs">이번 달 독서량</p>
                      <p className="text-2xl font-bold">{readThisMonth}</p>
                    </div>
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to="/library/overdue" className="block">
                <Card className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-xs">연체 도서</p>
                      <p className="text-2xl font-bold">{overdueCount}</p>
                    </div>
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              </Link>

              <Link to="/library/stats" className="block">
                <Card className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-xs">독서 목표</p>
                      <p className="text-2xl font-bold">
                        {readThisMonth}/{monthlyGoal}
                      </p>
                    </div>
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>

          {/* 카테고리와 검색 */}
          <Card className="p-6 mb-8">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-7 transform -translate-y-1/2 text-red-600 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="책 제목이나 저자로 검색하세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-black"
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
                    <span className="mr-1">{cat.icon}</span>
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
                              src={bookCoverUrl(book.id, book.coverImage)}
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
                                  src={bookCoverUrl(book.id, book.coverImage)}
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
                                    src={bookCoverUrl(book.id, book.coverImage)}
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
                            <span>{cat.icon}</span>
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
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="w-16 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            <ImageWithFallback
                              src={bookCoverUrl(book.id, book.coverImage)}
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
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-0">
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
