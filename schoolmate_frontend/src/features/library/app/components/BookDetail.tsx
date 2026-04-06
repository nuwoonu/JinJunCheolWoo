import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, BookOpen, User, Moon, Star, TrendingUp, MessageSquare, Share2, Heart, Download } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  borrowBook,
  deleteReview,
  getBookDetail,
  getPopularBooks,
  getReviews,
  upsertReview,
  type BookDetail as BookDetailData,
  type BookListItem,
  type BookReviewResponse,
} from "@/features/library/api/libraryApi";

const CATEGORIES = [
  { name: "000 총류", color: "bg-gray-100 text-gray-700" },
  { name: "100 철학", color: "bg-purple-100 text-purple-700" },
  { name: "200 종교", color: "bg-yellow-100 text-yellow-700" },
  { name: "300 사회과학", color: "bg-blue-100 text-blue-700" },
  { name: "400 자연과학", color: "bg-green-100 text-green-700" },
  { name: "500 기술과학", color: "bg-red-100 text-red-700" },
  { name: "600 예술", color: "bg-pink-100 text-pink-700" },
  { name: "700 언어", color: "bg-indigo-100 text-indigo-700" },
  { name: "800 문학", color: "bg-cyan-100 text-cyan-700" },
  { name: "900 역사", color: "bg-orange-100 text-orange-700" },
];

export default function BookDetail() {
  const { bookId } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const [book, setBook] = useState<BookDetailData | null>(null);
  const [reviews, setReviews] = useState<BookReviewResponse[]>([]);
  const [relatedBooks, setRelatedBooks] = useState<BookListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 리뷰 작성 UI 상태
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadBook = async () => {
    if (!bookId) return;
    try {
      setLoading(true);
      const detail = await getBookDetail(bookId);
      setBook(detail);
      setNotFound(false);
    } catch (err) {
      console.error("[library] 도서 상세 로드 실패", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!bookId) return;
    try {
      const list = await getReviews(bookId);
      setReviews(list);
    } catch (err) {
      console.error("[library] 리뷰 로드 실패", err);
    }
  };

  const loadRelated = async (category: string, currentId: number) => {
    try {
      const popular = await getPopularBooks(20);
      setRelatedBooks(
        popular.filter((b) => b.category === category && b.id !== currentId).slice(0, 6)
      );
    } catch (err) {
      console.error("[library] 연관 도서 로드 실패", err);
    }
  };

  useEffect(() => {
    loadBook();
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  useEffect(() => {
    if (book) {
      loadRelated(book.category, book.id);
    }
  }, [book]);

  const handleBorrow = async () => {
    if (!book) return;
    try {
      await borrowBook(book.id);
      alert("대출이 완료되었습니다.");
      await loadBook();
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((err as any).response?.data ?? "대출에 실패했습니다.")
          : "대출에 실패했습니다.";
      alert(String(msg));
    }
  };

  const handleSubmitReview = async () => {
    if (!book) return;
    if (reviewRating < 1 || reviewRating > 5) {
      alert("평점은 1~5 사이로 선택해주세요.");
      return;
    }
    try {
      setReviewSubmitting(true);
      await upsertReview(book.id, { rating: reviewRating, content: reviewContent.trim() || null });
      await loadReviews();
      await loadBook(); // 평균 평점/리뷰 수 갱신
      setReviewFormOpen(false);
      setReviewContent("");
      setReviewRating(5);
      alert("리뷰가 등록되었습니다.");
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((err as any).response?.data ?? "리뷰 등록에 실패했습니다.")
          : "리뷰 등록에 실패했습니다.";
      alert(String(msg));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!book) return;
    if (!confirm("이 리뷰를 삭제하시겠습니까?")) return;
    try {
      await deleteReview(book.id, reviewId);
      await loadReviews();
      await loadBook();
    } catch (err) {
      console.error("[library] 리뷰 삭제 실패", err);
      alert("리뷰 삭제에 실패했습니다.");
    }
  };

  // 평점 분포 계산
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { star, count, pct };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-600">도서 정보를 불러오는 중...</p>
        </Card>
      </div>
    );
  }

  if (notFound || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">책을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">요청하신 책이 존재하지 않습니다.</p>
          <Link to="/library">
            <Button>도서관으로 돌아가기</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="library-root min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/library">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">도서 상세정보</h1>
                <p className="text-sm text-gray-500">Schoolympic 도서관</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Moon className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold">홍길동</p>
                  <p className="text-xs text-gray-500">2학년 3반</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 책 기본 정보 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* 왼쪽: 책 표지 */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden sticky top-8">
              <div className="aspect-[2/3] relative bg-gray-100">
                <ImageWithFallback
                  src={book.coverImage ?? ""}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                {!book.available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge className="text-lg py-2 px-4">대출중</Badge>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-3">
                <Button
                  className="w-full h-12 text-base"
                  disabled={!book.available}
                  variant={book.available ? "default" : "secondary"}
                  onClick={handleBorrow}
                >
                  {book.available ? "대출하기" : "대출 불가"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                    찜하기
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    공유
                  </Button>
                </div>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  전자책 다운로드
                </Button>
              </div>
            </Card>
          </div>

          {/* 오른쪽: 책 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 제목 및 저자 */}
            <Card className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl font-bold">{book.title}</h1>
                    <Badge className={`${CATEGORIES.find(c => c.name === book.category)?.color ?? ""} text-sm`}>
                      {book.category}
                    </Badge>
                  </div>
                  <p className="text-xl text-gray-600 mb-4">{book.author}</p>
                  {book.description && (
                    <p className="text-gray-700 leading-relaxed">{book.description}</p>
                  )}
                </div>
              </div>

              {/* 평점 및 통계 */}
              <div className="flex items-center gap-6 py-4 border-y border-gray-200 my-6">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(book.rating)
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-2xl font-bold">{book.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="w-5 h-5" />
                  <span>대출 {book.borrowCount}회</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MessageSquare className="w-5 h-5" />
                  <span>리뷰 {book.reviewCount}개</span>
                </div>
              </div>

              {/* 해시태그 */}
              {book.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {book.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-sm">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            {/* 출판 정보 */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">출판 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">출판사</p>
                  <p className="font-semibold">{book.publisher ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">출판일</p>
                  <p className="font-semibold">{book.publishDate ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">ISBN</p>
                  <p className="font-semibold font-mono text-sm">{book.isbn ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">페이지</p>
                  <p className="font-semibold">{book.pages ? `${book.pages}쪽` : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">언어</p>
                  <p className="font-semibold">{book.language ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">재고 상태</p>
                  <Badge variant={book.available ? "default" : "secondary"}>
                    {book.availableCopies}/{book.totalCopies} 권 대출 가능
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 탭 섹션 */}
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="summary">책 소개</TabsTrigger>
            <TabsTrigger value="author">저자 소개</TabsTrigger>
            <TabsTrigger value="reviews">독자 리뷰</TabsTrigger>
          </TabsList>

          {/* 책 소개 */}
          <TabsContent value="summary">
            <Card className="p-8">
              <h3 className="text-xl font-bold mb-4">책 소개</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {book.summary ?? book.description ?? "등록된 책 소개가 없습니다."}
              </p>
            </Card>
          </TabsContent>

          {/* 저자 소개 */}
          <TabsContent value="author">
            <Card className="p-8">
              <h3 className="text-xl font-bold mb-4">저자 소개</h3>
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold mb-2">{book.author}</h4>
                  <p className="text-gray-700 leading-relaxed">
                    {book.authorBio ?? "등록된 저자 소개가 없습니다."}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 독자 리뷰 */}
          <TabsContent value="reviews">
            <Card className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">독자 리뷰</h3>
                <Button onClick={() => setReviewFormOpen((v) => !v)}>
                  {reviewFormOpen ? "작성 취소" : "리뷰 작성하기"}
                </Button>
              </div>

              {/* 리뷰 작성 폼 */}
              {reviewFormOpen && (
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
                  <h4 className="font-bold mb-3">리뷰 작성</h4>
                  <div className="mb-3">
                    <p className="text-sm text-gray-700 mb-2">평점</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= reviewRating
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-gray-700 mb-2">감상 (선택)</p>
                    <Textarea
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder="이 책에 대한 생각을 공유해주세요."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setReviewFormOpen(false);
                        setReviewContent("");
                        setReviewRating(5);
                      }}
                    >
                      취소
                    </Button>
                    <Button onClick={handleSubmitReview} disabled={reviewSubmitting}>
                      {reviewSubmitting ? "등록 중..." : "등록"}
                    </Button>
                  </div>
                </div>
              )}

              {/* 리뷰 통계 */}
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600 mb-1">{book.rating.toFixed(1)}</p>
                    <div className="flex mb-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(book.rating)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">{reviews.length}개의 리뷰</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {ratingDistribution.map(({ star, count, pct }) => (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-12">{star}점</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-12">{count}개</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 리뷰 목록 */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-center text-gray-500 py-6">
                    아직 리뷰가 없습니다. 첫 리뷰를 남겨보세요!
                  </p>
                ) : (
                  reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{review.studentName}</p>
                            <p className="text-xs text-gray-500">{review.createDate?.slice(0, 10)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex mb-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= review.rating
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      {review.content && (
                        <p className="text-gray-700 leading-relaxed ml-13">{review.content}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 연관 도서 추천 */}
        {relatedBooks.length > 0 && (
          <Card className="p-8 mt-8">
            <h3 className="text-xl font-bold mb-6">이 책과 함께 읽으면 좋은 책</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedBooks.map(relatedBook => (
                <Link key={relatedBook.id} to={`/library/book/${relatedBook.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-[2/3] relative bg-gray-100">
                      <ImageWithFallback
                        src={relatedBook.coverImage ?? ""}
                        alt={relatedBook.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-sm line-clamp-2 mb-1">{relatedBook.title}</h4>
                      <p className="text-xs text-gray-600 truncate">{relatedBook.author}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-semibold">{relatedBook.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
