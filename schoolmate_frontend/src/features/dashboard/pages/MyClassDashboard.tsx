// [jin] 교사 학급 대시보드
// 라우트: /teacher/myclass/dashboard
// 권한: TEACHER, ADMIN
//
// 레이아웃:
//   1행: 우리 반 출결 상태 (col-4) | 이번 주 일정 캘린더 (col-8)
//   2행: 학급 공지사항 (col-8)     | 우리 반 시간표 (col-4)
//   3행: 학급 게시판 (col-8)       | 이달의 학급 목표 (col-4)
//   4행: 우리 반 알림장 (col-4)    | 학급 앨범 (col-8)

import { useEffect, useState } from "react";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

import ClassAttendanceWidget from "@/features/dashboard/components/teacher/ClassAttendanceWidget";
import WeeklyCalendarWidget from "@/features/dashboard/components/student/WeeklyCalendarWidget";
import ClassNoticeWidget from "@/features/dashboard/components/student/ClassNoticeWidget";
import TodayTimetableWidget from "@/features/dashboard/components/student/TodayTimetableWidget";
import ClassBoardWidget from "@/features/dashboard/components/student/ClassBoardWidget";
import ClassGoalEditor from "@/features/dashboard/components/teacher/ClassGoalEditor";
import ClassNotebookWidget from "@/features/dashboard/components/teacher/ClassNotebookWidget";
import ClassAlbumWidget from "@/features/album/components/ClassAlbumWidget";

interface ClassInfo {
  classroomId: number;
  schoolId?: number | null; // [woo] 학교별 NEIS 시간표 조회용
  year: number;
  grade: number;
  classNum: number;
  totalStudents: number;
}

export default function TeacherMyClassDashboard() {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/teacher/myclass")
      .then((res) => {
        const data = res.data;
        if (data.hasClassroom === false) return;
        setClassInfo(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 400 }}>
          <p className="text-secondary-light">불러오는 중...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!classInfo) {
    return (
      <DashboardLayout>
        <div className="card shadow-sm p-80 text-center" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
          <iconify-icon icon="mdi:google-classroom" className="text-secondary-light mb-16" style={{ fontSize: 48 }} />
          <h5 className="text-secondary-light">담당 학급 정보를 불러올 수 없습니다.</h5>
        </div>
      </DashboardLayout>
    );
  }

  const { classroomId, schoolId, grade, classNum } = classInfo;

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">
            {" "}
            {grade}학년 {classNum}반 학급 대시보드
          </h6>
        </div>
      </div>

      {/* 1행: 우리 반 출결 상태 (col-4) | 이번 주 일정 캘린더 (col-8) */}
      <div className="row gy-4 mb-24">
        <div className="col-xl-4 d-flex flex-column">
          <ClassAttendanceWidget grade={grade} classNum={classNum} />
        </div>
        <div className="col-xl-8 d-flex flex-column">
          <WeeklyCalendarWidget />
        </div>
      </div>

      {/* 2행: 우리 반 알림장 (col-8) | 우리 반 시간표 (col-4) */}
      <div className="row gy-4 mb-24" style={{ minHeight: 320 }}>
        <div className="col-xl-8 d-flex flex-column">
          {/* [woo 03-27] 우리반 알림장 위젯 — 더보기 제거, 작성 모달 활성화 */}
          <ClassNotebookWidget classroomId={classroomId} canWrite={true} />
        </div>
        <div className="col-xl-4 d-flex flex-column">
          {/* [woo] TodayTimetableWidget은 grade/classNum/schoolId를 받아 직접 fetch */}
          <TodayTimetableWidget grade={grade} classNum={classNum} schoolId={schoolId} />
        </div>
      </div>

      {/* 3행: 가정통신문 (col-8) | 이달의 학급 목표 (col-4) */}
      <div className="row gy-4 mb-24" style={{ minHeight: 320 }}>
        <div className="col-xl-8 d-flex flex-column">
          {/* [woo] 가정통신문 → API: /board/parent-notice, 더보기: /board/parent-notice */}
          <ClassNoticeWidget classroomId={classroomId} title="가정통신문" apiEndpoint="/board/parent-notice" moreHref="/board/parent-notice" detailPrefix="/board/parent-notice" />
        </div>
        <div className="col-xl-4 d-flex flex-column">
          <ClassGoalEditor classroomId={classroomId} />
        </div>
      </div>

      {/* 4행: 학급 게시판 (col-6) | 학급 앨범 (col-6) */}
      <div className="row gy-4">
        <div className="col-xl-6 d-flex flex-column">
          {/* [woo 03-27] 학급 게시판 → API: /board/class-board (역할별 자동 학급) */}
          <ClassBoardWidget classroomId={classroomId} apiEndpoint="/board/class-board" moreHref="/board/class-board" detailPrefix="/board/class-board" />
        </div>
        <div className="col-xl-6 d-flex flex-column">
          {/* [woo] 학급 앨범 → /school/gallery 라우트 연결 */}
          <ClassAlbumWidget classroomId={classroomId} moreHref="/class/album" />
        </div>
      </div>
    </DashboardLayout>
  );
}
