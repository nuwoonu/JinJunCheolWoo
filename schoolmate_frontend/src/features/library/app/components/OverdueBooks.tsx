import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, AlertCircle, Search, Clock } from "lucide-react";
import { Link } from "react-router";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  bookCoverUrl,
  getMyOverdue,
  returnLoan,
  type BookLoanResponse,
} from "@/features/library/api/libraryApi";

// [cheol] 연체료 정책: 하루당 100원 (최대 10,000원)
const DAILY_FINE = 100;
const MAX_FINE = 10000;

export default function OverdueBooks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<BookLoanResponse[]>([]);

  const load = async () => {
    try {
      setBooks(await getMyOverdue());
    } catch (err) {
      console.error("[library] 연체 도서 로드 실패", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReturn = async (loanId: number) => {
    try {
      await returnLoan(loanId);
      await load();
      alert("반납 완료되었습니다.");
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((err as any).response?.data ?? "반납에 실패했습니다.")
          : "반납에 실패했습니다.";
      alert(String(msg));
    }
  };

  const calcFine = (overdueDays: number) =>
    Math.min(MAX_FINE, Math.max(0, overdueDays) * DAILY_FINE);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalFine = books.reduce((sum, book) => sum + calcFine(book.overdueDays), 0);
  const totalOverdueDays = books.reduce((sum, book) => sum + book.overdueDays, 0);

  const getOverdueColor = (days: number) => {
    if (days >= 14) return "text-red-700 bg-red-100";
    if (days >= 7) return "text-orange-700 bg-orange-100";
    return "text-yellow-700 bg-yellow-100";
  };

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
        {/* 경고 카드 */}
        <Card className="p-6 mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2 text-red-900">연체 안내</h3>
              <p className="text-sm text-red-800 mb-3">
                연체된 도서를 반납하지 않으면 추가 대출이 제한됩니다. 빠른 시일 내에 반납해 주세요.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">총 연체 일수</p>
                  <p className="text-2xl font-bold text-red-600">{totalOverdueDays}일</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">예상 연체료</p>
                  <p className="text-2xl font-bold text-red-600">{totalFine.toLocaleString()}원</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 검색 */}
        <Card className="p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="도서 제목이나 저자로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* 연체 도서 목록 */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map(book => (
              <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow border-red-200">
                <div className="aspect-[2/3] relative bg-gray-100">
                  <ImageWithFallback
                    src={bookCoverUrl(book.bookId, book.coverImage)}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive" className="bg-red-500 text-white">
                      연체
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-red-500/10"></div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{book.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{book.author}</p>
                  <Badge className="mb-3">{book.category}</Badge>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">대출일</span>
                      <span className="font-semibold">{book.borrowDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">반납 예정일</span>
                      <span className="font-semibold text-red-600">{book.dueDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">연체 일수</span>
                      <span className={`font-bold px-2 py-1 rounded ${getOverdueColor(book.overdueDays)}`}>
                        {book.overdueDays}일
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">예상 연체료</span>
                      <span className="font-bold text-red-600">{calcFine(book.overdueDays).toLocaleString()}원</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-red-500 hover:bg-red-600"
                    size="sm"
                    onClick={() => handleReturn(book.id)}
                  >
                    즉시 반납하기
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">연체된 도서가 없습니다</h3>
            <p className="text-sm text-gray-600">모든 도서를 제때 반납하셨네요. 훌륭해요!</p>
          </Card>
        )}

        {/* 연체 정책 안내 */}
        <Card className="mt-8 p-6 bg-orange-50 border-orange-200">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            연체 정책
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span>연체료는 하루당 100원입니다. (최대 10,000원)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span>연체 중에는 새로운 도서 대출이 불가능합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span>연체 일수만큼 대출이 제한됩니다. (예: 5일 연체 시 5일간 대출 불가)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span>도서 분실 시 동일 도서로 변상하거나 정가의 1.5배를 배상해야 합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span>연체료는 학생증 충전금에서 자동 차감되거나 도서관에서 현금 납부 가능합니다.</span>
            </li>
          </ul>
        </Card>
      </main>
    </div>
    </DashboardLayout>
  );
}
