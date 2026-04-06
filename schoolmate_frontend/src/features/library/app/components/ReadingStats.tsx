import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, BookOpen, User, Moon, TrendingUp, Target, Calendar, Award } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from "recharts";
import { getMyStats, type ReadingStats as ReadingStatsData } from "@/features/library/api/libraryApi";

// 카테고리별 색상 (도넛 차트)
const CATEGORY_COLORS = ["#06b6d4", "#10b981", "#f97316", "#a855f7", "#6b7280", "#ef4444", "#3b82f6", "#f59e0b", "#84cc16", "#ec4899"];

// 주간 독서 시간 (아직 백엔드에서 집계하지 않는 항목 — 향후 확장)
const weeklyReadingTime = [
  { day: "월", hours: 0 },
  { day: "화", hours: 0 },
  { day: "수", hours: 0 },
  { day: "목", hours: 0 },
  { day: "금", hours: 0 },
  { day: "토", hours: 0 },
  { day: "일", hours: 0 }
];

export default function ReadingStats() {
  const [stats, setStats] = useState<ReadingStatsData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setStats(await getMyStats());
      } catch (err) {
        console.error("[library] 독서 통계 로드 실패", err);
      }
    })();
  }, []);

  const currentMonthBooks = stats?.currentMonthBooks ?? 0;
  const monthlyGoal = stats?.monthlyGoal ?? 5;
  const totalBooksThisYear = stats?.totalBooksThisYear ?? 0;
  const averageRating = Number((stats?.averageRating ?? 0).toFixed(1));
  const goalProgress = stats?.goalProgress ?? 0;

  const monthlyReadingData = stats?.monthlyReading ?? [];

  const categoryData = (stats?.categoryDistribution ?? []).map((c, idx) => ({
    name: c.name,
    value: c.value,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }));

  const goalProgressData = [
    { name: "목표 달성", value: goalProgress, fill: "#3b82f6" },
  ];

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
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">독서 통계</h1>
                <p className="text-sm text-gray-500">나의 독서 활동을 분석해보세요</p>
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
        {/* 요약 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">올해 읽은 책</p>
                <p className="text-3xl font-bold">{totalBooksThisYear}권</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">이번 달</p>
                <p className="text-3xl font-bold">{currentMonthBooks}권</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm mb-1">목표 달성률</p>
                <p className="text-3xl font-bold">{goalProgress}%</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">평균 평점</p>
                <p className="text-3xl font-bold">{averageRating}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 월별 독서량 */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              월별 독서량 추이
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyReadingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="books" fill="#3b82f6" name="읽은 책" radius={[8, 8, 0, 0]} />
                <Bar dataKey="goal" fill="#e5e7eb" name="목표" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>분석:</strong> 11월에 가장 많은 독서를 하셨네요! 
                평균적으로 월 4.7권을 읽고 계십니다.
              </p>
            </div>
          </Card>

          {/* 카테고리별 분포 */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              카테고리별 독서 분포
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>분석:</strong> 문학 장르를 가장 선호하시네요! 
                다양한 분야의 책을 읽어보는 것도 추천드립니다.
              </p>
            </div>
          </Card>
        </div>

        {/* 추가 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 독서 목표 진행률 */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              이번 달 목표 달성률
            </h3>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  barSize={20}
                  data={goalProgressData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-4xl font-bold fill-gray-900"
                  >
                    {goalProgress}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center mt-4">
                <p className="text-lg font-semibold text-gray-900">
                  {currentMonthBooks}권 / {monthlyGoal}권
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  목표까지 {monthlyGoal - currentMonthBooks}권 남았습니다!
                </p>
              </div>
            </div>
          </Card>

          {/* 주간 독서 시간 */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              주간 독서 시간
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyReadingTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#a855f7"
                  strokeWidth={3}
                  name="독서 시간 (시간)"
                  dot={{ r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>분석:</strong> 주말에 독서 시간이 증가하는 패턴을 보입니다. 
                일주일 평균 2시간의 독서를 하고 계십니다.
              </p>
            </div>
          </Card>
        </div>

        {/* 독서 뱃지 */}
        <Card className="mt-6 p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            획득한 독서 뱃지
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <p className="font-semibold text-sm">독서광</p>
              <p className="text-xs text-gray-600">30권 달성</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-8 h-8 text-white" />
              </div>
              <p className="font-semibold text-sm">목표 달성</p>
              <p className="text-xs text-gray-600">3개월 연속</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <p className="font-semibold text-sm">꾸준함</p>
              <p className="text-xs text-gray-600">매일 독서</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-semibold text-sm text-gray-500">???</p>
              <p className="text-xs text-gray-500">50권에 도전!</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
