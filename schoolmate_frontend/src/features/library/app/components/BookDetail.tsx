import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, User, Star, TrendingUp, MessageSquare } from "lucide-react";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  bookCoverUrl,
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
  const [_isLiked, _setIsLiked] = useState(false); void _isLiked; void _setIsLiked;
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
      setRelatedBooks(popular.filter((b) => b.category === category && b.id !== currentId).slice(0, 6));
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
      <DashboardLayout>
        <div className="library-root flex items-center justify-center py-16">
          <Card className="p-8 text-center">
            <p className="text-gray-600">도서 정보를 불러오는 중...</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !book) {
    return (
      <DashboardLayout>
        <div className="library-root flex items-center justify-center py-16">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">책을 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-4">요청하신 책이 존재하지 않습니다.</p>
            <Link to="/library">
              <Button>도서관으로 돌아가기</Button>
            </Link>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="library-root">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/library">
            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600">
              <ArrowLeft className="w-4 h-4" />
              도서관 메인
            </Button>
          </Link>
        </div>
        <main>
          {/* 책 기본 정보 */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* 왼쪽: 책 표지 */}
              <div className="lg:col-span-1">
                <Card className="overflow-hidden sticky top-8">
                  <div className="aspect-2/3 relative bg-gray-100">
                    <ImageWithFallback
                      src={bookCoverUrl(book.id, book.coverImage ?? undefined)}
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
                    {/* <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="w-full" onClick={() => setIsLiked(!isLiked)}>
                        <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                        찜하기
                      </Button>
                    </div> */}
                  </div>
                </Card>
              </div>

              {/* 오른쪽: 책 정보 */}
              <div className="lg:col-span-3 space-y-6">
                {/* 제목 및 저자 */}
                <div className="pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{book.title}</h1>
                    <Badge className={`${CATEGORIES.find((c) => c.name === book.category)?.color ?? ""} text-sm`}>
                      {book.category}
                    </Badge>
                  </div>
                  <p className="text-base text-gray-600 mb-3">{book.author}</p>
                  {book.description && <p className="text-sm text-gray-700 leading-relaxed">{book.description}</p>}

                  {/* 평점 및 통계 */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(book.rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-sm ml-1">{book.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>대출 {book.borrowCount}회</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <MessageSquare className="w-4 h-4" />
                      <span>리뷰 {book.reviewCount}개</span>
                    </div>
                  </div>

                  {/* 해시태그 */}
                  {book.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {book.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* 출판 정보 */}
                <div>
                  <h3 className="font-bold text-sm text-gray-500 mb-3">출판 정보</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">출판사</p>
                      <p className="text-sm font-semibold">{book.publisher ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">출판일</p>
                      <p className="text-sm font-semibold">{book.publishDate ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">ISBN</p>
                      <p className="text-sm font-semibold font-mono">{book.isbn ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">페이지</p>
                      <p className="text-sm font-semibold">{book.pages ? `${book.pages}쪽` : "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">언어</p>
                      <p className="text-sm font-semibold">{book.language ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">재고 상태</p>
                      <Badge variant={book.available ? "default" : "secondary"} className="text-xs">
                        {book.availableCopies}/{book.totalCopies} 권 대출 가능
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 탭 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <Tabs defaultValue="summary" className="space-y-4">
              <div className="pl-1">
                <TabsList className="grid max-w-lg grid-cols-3">
                  <TabsTrigger value="summary">책 소개</TabsTrigger>
                  <TabsTrigger value="author">저자 소개</TabsTrigger>
                  <TabsTrigger value="reviews">독자 리뷰</TabsTrigger>
                </TabsList>
              </div>

              {/* 책 소개 */}
              <TabsContent value="summary">
                <div className="pt-3 px-1">
                  <h3 className="font-bold mb-3 text-gray-700">책 소개</h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {book.summary ?? book.description ?? "등록된 책 소개가 없습니다."}
                  </p>
                </div>
              </TabsContent>

              {/* 저자 소개 */}
              <TabsContent value="author">
                <div className="pt-3 px-1">
                  <h3 className="font-bold mb-3 text-gray-700">저자 소개</h3>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold mb-1">{book.author}</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {book.authorBio ?? "등록된 저자 소개가 없습니다."}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 독자 리뷰 */}
              <TabsContent value="reviews">
                <div className="pt-3 px-1">
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
                                  star <= reviewRating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 mb-2">감상 (선택)</p>
                        <Textarea
                          className="text-black"
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
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(book.rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
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
                              <div className="h-full bg-yellow-500" style={{ width: `${pct}%` }}></div>
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
                      <p className="text-center text-gray-500 py-6">아직 리뷰가 없습니다. 첫 리뷰를 남겨보세요!</p>
                    ) : (
                      reviews.map((review) => (
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
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
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
                          {review.content && <p className="text-gray-700 leading-relaxed ml-13">{review.content}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 연관 도서 추천 */}
          {relatedBooks.length > 0 && (
            <Card className="p-8 mt-8">
              <h3 className="text-xl font-bold mb-6">이 책과 함께 읽으면 좋은 책</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {relatedBooks.map((relatedBook) => (
                  <Link key={relatedBook.id} to={`/library/book/${relatedBook.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="aspect-[2/3] relative bg-gray-100">
                        <ImageWithFallback
                          src={bookCoverUrl(relatedBook.id, relatedBook.coverImage ?? undefined)}
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
    </DashboardLayout>
  );
}
