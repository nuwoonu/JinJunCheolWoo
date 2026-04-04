// [soojin] 학생 대시보드 - 4행 그리드 레이아웃 재설계
// 기존 src/pages/cheol/student/Dashboard.tsx 는 건드리지 않고 새로 생성
//
// 레이아웃:
//   1행: 이달의 학급 목표 (col-4) | 이번 주 일정 캘린더 (col-8)
//   2행: 과제/퀴즈 현황 (col-8)   | 오늘의 시간표 (col-4)
//   3행: 우리 반 알림장 (col-8)   | 오늘의 급식 (col-4)
//   4행: 학급 게시판 (col-6)      | 학급 앨범 (col-6)
//
// 데이터 흐름: /api/dashboard/student → student.year, classNum, classroomId 추출 → 각 위젯에 props 전달
// classroomId는 현재 백엔드 미지원 → null fallback 처리 (각 위젯에서 담당)

import { useEffect, useState } from "react";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import ClassGoalWidget from "@/features/dashboard/components/student/ClassGoalWidget";
import WeeklyCalendarWidget from "@/features/dashboard/components/student/WeeklyCalendarWidget";
import ClassNotebookWidget from "@/features/dashboard/components/teacher/ClassNotebookWidget";
import TodayTimetableWidget from "@/features/dashboard/components/student/TodayTimetableWidget";
import ClassBoardWidget from "@/features/dashboard/components/student/ClassBoardWidget";
import TodayMealWidget from "@/features/dashboard/components/student/TodayMealWidget";
import SubmissionStatusWidget from "@/features/dashboard/components/student/SubmissionStatusWidget";
import ClassAlbumWidget from "@/features/album/components/ClassAlbumWidget";

interface StudentInfo {
  userName?: string;
  year?: number;
  classNum?: number;
  studentNumber?: number;
  status?: string;
  classroomId?: number | null;
  schoolId?: number | null;
}

interface DashboardData {
  student?: StudentInfo;
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get("/dashboard/student")
      .then((res) => {
        setData(res.data);
        const s = res.data?.student;
        // [woo] 학급 앨범 등에서 사용할 classroomId를 sessionStorage에 저장
        if (s?.classroomId) {
          sessionStorage.setItem("myClassroomId", String(s.classroomId));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { student } = data;
  const year = student?.year ?? 0;
  const classNum = student?.classNum ?? 0;
  const classroomId = student?.classroomId ?? null;
  const schoolId = student?.schoolId ?? null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 400 }}>
          <p className="text-secondary-light">불러오는 중...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="card shadow-sm p-80 text-center" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
          <i className="ri-user-search-line text-secondary-light mb-16" style={{ fontSize: 48 }} />
          <h5 className="text-secondary-light">학생 정보를 불러올 수 없습니다.</h5>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      {/* <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학생 대시보드</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            어서오세요,{' '}
            <span className="fw-medium">
              {year}학년 {classNum}반 {student.userName}
            </span>
            님
          </p>
        </div>
      </div> */}

      {/* 1행: 이달의 학급 목표 (col-4) | 이번 주 일정 캘린더 (col-8) */}
      <div className="row gy-4 mb-24">
        <div className="col-xl-4">
          <ClassGoalWidget classroomId={classroomId} />
        </div>
        <div className="col-xl-8">
          <WeeklyCalendarWidget />
        </div>
      </div>

      {/* [soojin] 2행 + 3행: 동일한 minHeight로 세로 길이 맞춤
          col에 d-flex flex-column 추가 → 내부 카드 h-100이 col 전체를 채움 */}

      {/* 2행: 과제/퀴즈 현황 (col-8) | 오늘의 시간표 (col-4) */}
      <div className="row gy-4 mb-24" style={{ minHeight: 320 }}>
        <div className="col-xl-8 d-flex flex-column">
          <SubmissionStatusWidget />
        </div>
        <div className="col-xl-4 d-flex flex-column">
          <TodayTimetableWidget grade={year} classNum={classNum} schoolId={schoolId} />
        </div>
      </div>

      {/* 3행: 우리 반 알림장 (col-8) | 오늘의 급식 (col-4) */}
      <div className="row gy-4 mb-24" style={{ minHeight: 320 }}>
        <div className="col-xl-8 d-flex flex-column">
          <ClassNotebookWidget classroomId={classroomId} moreHref="/board/class-diary" />
        </div>
        <div className="col-xl-4 d-flex flex-column">
          <TodayMealWidget schoolId={schoolId} />
        </div>
      </div>

      {/* 4행: 학급 게시판 (col-6) | 학급 앨범 (col-6) */}
      <div className="row gy-4">
        <div className="col-xl-6">
          {/* [woo 03-27] 학급 게시판 → API: /board/class-board (역할별 자동 학급) */}
          <ClassBoardWidget
            classroomId={classroomId}
            apiEndpoint="/board/class-board"
            moreHref="/board/class-board"
            detailPrefix="/board/class-board"
          />
        </div>
        <div className="col-xl-6">
          {/* [woo] 학급 앨범 → /school/gallery 라우트 연결 */}
          <ClassAlbumWidget classroomId={classroomId} moreHref="/class/album" />
        </div>
      </div>
    </DashboardLayout>
  );
}
