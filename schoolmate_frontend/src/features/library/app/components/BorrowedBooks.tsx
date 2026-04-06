import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, BookOpen, Calendar, User, Moon, Search, Filter } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  extendLoan,
  getMyBorrowed,
  returnLoan,
  type BookLoanResponse,
} from "@/features/library/api/libraryApi";

export default function BorrowedBooks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<BookLoanResponse[]>([]);

  const loadBorrowed = async () => {
    try {
      const data = await getMyBorrowed();
      setBooks(data);
    } catch (err) {
      console.error("[library] 대출 목록 로드 실패", err);
    }
  };

  useEffect(() => {
    loadBorrowed();
  }, []);

  const handleReturn = async (loanId: number) => {
    try {
      await returnLoan(loanId);
      await loadBorrowed();
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

  const handleExtend = async (loanId: number) => {
    try {
      await extendLoan(loanId);
      await loadBorrowed();
      alert("대출 기간이 7일 연장되었습니다.");
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((err as any).response?.data ?? "연장에 실패했습니다.")
          : "연장에 실패했습니다.";
      alert(String(msg));
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDueDateColor = (days: number) => {
    if (days <= 3) return "text-red-600 bg-red-50";
    if (days <= 7) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

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
                <h1 className="text-2xl font-bold text-gray-900">대출중인 도서</h1>
                <p className="text-sm text-gray-500">현재 {books.length}권을 대출 중입니다</p>
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
        {/* 검색 및 필터 */}
        <Card className="p-6 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="도서 제목이나 저자로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              필터
            </Button>
          </div>
        </Card>

        {/* 대출 도서 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map(book => (
            <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[2/3] relative bg-gray-100">
                <ImageWithFallback
                  src={book.coverImage ?? ""}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge
                    variant="secondary"
                    className={book.status === "OVERDUE" ? "bg-red-500 text-white" : "bg-blue-500 text-white"}
                  >
                    {book.status === "OVERDUE" ? "연체" : "대출중"}
                  </Badge>
                </div>
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
                    <span className="font-semibold">{book.dueDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">남은 기간</span>
                    <span className={`font-bold px-2 py-1 rounded ${getDueDateColor(book.remainingDays)}`}>
                      {book.remainingDays >= 0 ? `${book.remainingDays}일` : `${-book.remainingDays}일 연체`}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" size="sm" onClick={() => handleReturn(book.id)}>
                    반납하기
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    size="sm"
                    disabled={book.extensionCount >= 1 || book.status === "OVERDUE"}
                    onClick={() => handleExtend(book.id)}
                  >
                    연장하기
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 대출 안내 */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            대출 안내
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>대출 기간은 14일이며, 1회에 한해 7일 연장이 가능합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>연체 시 연체일 수만큼 대출이 제한됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>최대 5권까지 동시 대출이 가능합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>반납일 3일 전 알림 메시지를 발송해 드립니다.</span>
            </li>
          </ul>
        </Card>
      </main>
    </div>
  );
}
