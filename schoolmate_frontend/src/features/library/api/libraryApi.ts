// [cheol] 도서관 API 클라이언트
// - JWT Authorization 헤더는 공용 axios(api)가 자동 첨부합니다.
// - 학교 컨텍스트는 백엔드 JwtAuthFilter가 토큰에서 읽어 SchoolContextHolder에 세팅하므로
//   별도로 X-School-Id 헤더를 붙일 필요가 없습니다.

import api from "@/shared/api/api";

// ────────────────────────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────────────────────────

export type BookCategoryCode =
  | "CATEGORY_000"
  | "CATEGORY_100"
  | "CATEGORY_200"
  | "CATEGORY_300"
  | "CATEGORY_400"
  | "CATEGORY_500"
  | "CATEGORY_600"
  | "CATEGORY_700"
  | "CATEGORY_800"
  | "CATEGORY_900";

export type BookLoanStatus = "BORROWED" | "RETURNED" | "OVERDUE";

export interface BookListItem {
  id: number;
  title: string;
  author: string;
  category: string; // "800 문학"
  isbn?: string | null;
  coverImage?: string | null;
  description?: string | null;
  totalCopies: number;
  availableCopies: number;
  borrowCount: number;
  rating: number;
  available: boolean;
}

export interface BookDetail extends BookListItem {
  publisher?: string | null;
  publishDate?: string | null;
  pages?: number | null;
  language?: string | null;
  summary?: string | null;
  authorBio?: string | null;
  tags: string[];
  reviewCount: number;
}

export interface BookLoanResponse {
  id: number;
  bookId: number;
  title: string;
  author: string;
  category: string;
  coverImage?: string | null;
  isbn?: string | null;
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  extensionCount: number;
  status: BookLoanStatus;
  remainingDays: number;
  overdueDays: number;
}

export interface BookReviewResponse {
  id: number;
  bookId: number;
  studentInfoId: number;
  studentName: string;
  rating: number;
  content: string | null;
  createDate: string;
  updateDate: string;
}

export interface ReadingStats {
  totalBooksThisYear: number;
  currentMonthBooks: number;
  monthlyGoal: number;
  goalProgress: number;
  averageRating: number;
  activeLoans: number;
  overdueCount: number;
  monthlyReading: { month: string; books: number; goal: number }[];
  categoryDistribution: { name: string; value: number }[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ────────────────────────────────────────────────────────────────────
// 유틸리티
// ────────────────────────────────────────────────────────────────────

/**
 * coverImage URL 반환. 없으면 null 반환 (더미 이미지 미사용).
 */
export function bookCoverUrl(_id: number, coverImage?: string | null): string | null {
  return coverImage || null;
}

// ────────────────────────────────────────────────────────────────────
// 도서 카탈로그
// ────────────────────────────────────────────────────────────────────

export interface BookCreateRequest {
  title: string;
  author: string;
  category: BookCategoryCode;
  totalCopies: number;
  isbn?: string;
  publisher?: string;
  publishDate?: string; // "YYYY-MM-DD"
  pages?: number;
  language?: string;
  description?: string;
  summary?: string;
  authorBio?: string;
  tags?: string;
  coverImage?: string;
}

export async function createBook(body: BookCreateRequest): Promise<BookListItem> {
  const res = await api.post("/api/library/books", body);
  return res.data;
}

export async function searchBooks(params: {
  keyword?: string;
  category?: BookCategoryCode;
  page?: number;
  size?: number;
}): Promise<PageResponse<BookListItem>> {
  const res = await api.get("/api/library/books", { params });
  return res.data;
}

export async function getPopularBooks(limit = 10): Promise<BookListItem[]> {
  const res = await api.get("/api/library/books/popular", { params: { limit } });
  return res.data;
}

export async function getRecentBooks(limit = 10): Promise<BookListItem[]> {
  const res = await api.get("/api/library/books/recent", { params: { limit } });
  return res.data;
}

export async function getBookDetail(bookId: number | string): Promise<BookDetail> {
  const res = await api.get(`/api/library/books/${bookId}`);
  return res.data;
}

// ────────────────────────────────────────────────────────────────────
// 대출/반납/연장
// ────────────────────────────────────────────────────────────────────

export async function borrowBook(bookId: number): Promise<BookLoanResponse> {
  const res = await api.post("/api/library/loans", { bookId });
  return res.data;
}

export async function returnLoan(loanId: number): Promise<BookLoanResponse> {
  const res = await api.post(`/api/library/loans/${loanId}/return`);
  return res.data;
}

export async function extendLoan(loanId: number): Promise<BookLoanResponse> {
  const res = await api.post(`/api/library/loans/${loanId}/extend`);
  return res.data;
}

export async function getMyBorrowed(): Promise<BookLoanResponse[]> {
  const res = await api.get("/api/library/loans/my/borrowed");
  return res.data;
}

export async function getMyOverdue(): Promise<BookLoanResponse[]> {
  const res = await api.get("/api/library/loans/my/overdue");
  return res.data;
}

export async function getMyHistory(): Promise<BookLoanResponse[]> {
  const res = await api.get("/api/library/loans/my/history");
  return res.data;
}

export async function getMyStats(): Promise<ReadingStats> {
  const res = await api.get("/api/library/loans/my/stats");
  return res.data;
}

// ────────────────────────────────────────────────────────────────────
// 리뷰
// ────────────────────────────────────────────────────────────────────

export async function getReviews(bookId: number | string): Promise<BookReviewResponse[]> {
  const res = await api.get(`/api/library/books/${bookId}/reviews`);
  return res.data;
}

export async function upsertReview(
  bookId: number | string,
  body: { rating: number; content?: string | null }
): Promise<BookReviewResponse> {
  const res = await api.post(`/api/library/books/${bookId}/reviews`, body);
  return res.data;
}

export async function deleteReview(
  bookId: number | string,
  reviewId: number
): Promise<void> {
  await api.delete(`/api/library/books/${bookId}/reviews/${reviewId}`);
}

// [woo] 표지 이미지 일괄 업데이트 (교사/관리자 전용)
export async function refreshBookCovers(): Promise<{ updatedCount: number }> {
  const res = await api.post("/api/library/books/refresh-covers");
  return res.data;
}
