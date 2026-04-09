import { Routes, Route, Navigate } from "react-router-dom";
import "@/shared/styles/dashboard-card.css"; // [soojin] 대시보드 카드 공통 스타일
import "@/features/library/styles/index.css"; // [cheol] 도서관 Tailwind 스타일
import { useEffect } from "react";
import PrivateRoute from "@/shared/components/PrivateRoute";
import PageLoader from "@/shared/components/PageLoader";
import { ADMIN_ROUTES } from "@/shared/constants/routes";
import { useSchool } from "@/shared/contexts/SchoolContext";
import { useAuth } from "@/shared/contexts/AuthContext";
import { usePushSubscription } from "@/shared/hooks/usePushSubscription";
// 공통
import NotFound from "@/pages/error/NotFound";
import Unauthorized from "@/pages/error/Unauthorized";
import Login from "@/features/auth/pages/Login";
import Hub from "@/features/auth/pages/Hub";
import Register from "@/features/auth/pages/Register";
import OAuth2Callback from "@/features/auth/pages/OAuth2Callback";
import SelectRole from "@/features/auth/pages/SelectRole";
import SelectInfo from "@/features/auth/pages/SelectInfo";
import RegisterSchoolSelect from "@/features/auth/pages/RegisterSchoolSelect";
import MainDesign from "@/pages/Main-design";
import SchoolSearchPage from "@/pages/SchoolSearchPage"; // [soojin] 학교 찾기 독립 페이지
import ServiceNoticePage from "@/pages/ServiceNoticePage"; // [soojin] 공지사항 독립 페이지
// [cheol] 학생 관련
import StudentList from "@/features/student/pages/StudentList";
import StudentMyInfo from "@/features/student/pages/MyInfo";
import StudentGrades from "@/features/student/pages/Grades";
import StudentExamSchedule from "@/features/student/pages/ExamSchedule";
import StudentExamResult from "@/features/student/pages/ExamResult";
// [woo 03-27] 학년 게시판 제거 — 학급 게시판(ClassBoard)으로 대체
// [cheol] 기숙사
import DormitoryRoot from "@/features/dormitory/app/components/Root";
import DormitoryAdminRoot from "@/features/dormitory/app/components/AdminRoot";
import DormitoryBuildingList from "@/features/dormitory/app/components/BuildingList";
import DormitoryFloorList from "@/features/dormitory/app/components/FloorList";
import DormitoryRoomView from "@/features/dormitory/app/components/RoomView";
// [woo] 교사 관련
import TeacherDashboard from "@/features/dashboard/pages/TeacherDashboard";
import TeacherMyClass from "@/features/teacher/pages/MyClass";
import TeacherMyClassStudents from "@/features/teacher/pages/MyClassStudents";
import DailyNoteInput from "@/features/teacher/pages/DailyNoteInput";
import TeacherSchedulePage from "@/features/schedule/pages/SchedulePage";
import TeacherScheduleAdd from "@/features/schedule/pages/ScheduleAdd";
import TeacherScheduleEdit from "@/features/schedule/pages/ScheduleEdit";
import TeacherList from "@/features/teacher/pages/TeacherList";
import ParentList from "@/features/teacher/pages/ParentList";
import TeacherClassNotice from "@/features/teacher/pages/TeacherClassNotice";
import ClassMaterials from "@/features/teacher/pages/ClassMaterials"; // [soojin] 수업 자료 관리
// [woo] 성적
import GradeSections from "@/features/teacher/pages/GradeSections";
import GradeEntry from "@/features/teacher/pages/GradeEntry";
import GradeEntryInput from "@/features/teacher/pages/GradeEntryInput";
import GradeSummaryList from "@/features/teacher/pages/GradeSummaryList";
import ParentGrades from "@/features/parent/pages/ParentGrades";

// [woo] 게시판
import SchoolNotice from "@/features/board/pages/SchoolNotice";
import SchoolNoticeDetail from "@/features/board/pages/SchoolNoticeDetail";
import ParentNotice from "@/features/board/pages/ParentNotice";
import ParentNoticeDetail from "@/features/board/pages/ParentNoticeDetail";
import ParentSchoolNotice from "@/features/board/pages/ParentSchoolNotice";
import ClassDiary from "@/features/board/pages/ClassDiary";
import ClassDiaryWrite from "@/features/board/pages/ClassDiaryWrite";
import ClassDiaryDetail from "@/features/board/pages/ClassDiaryDetail";
// [woo 03-27] 학급 게시판
import ClassBoard from "@/features/board/pages/ClassBoard";
import ClassBoardWrite from "@/features/board/pages/ClassBoardWrite";
import ClassBoardDetail from "@/features/board/pages/ClassBoardDetail";
import ParentBoard from "@/features/board/pages/ParentBoard";
import ParentBoardWrite from "@/features/board/pages/ParentBoardWrite";
import ParentBoardDetail from "@/features/board/pages/ParentBoardDetail";
import TeacherBoard from "@/features/board/pages/TeacherBoard";
import TeacherBoardWrite from "@/features/board/pages/TeacherBoardWrite";
import TeacherBoardDetail from "@/features/board/pages/TeacherBoardDetail";
// [woo] 과제
import HomeworkList from "@/features/homework/pages/HomeworkList";
import HomeworkCreate from "@/features/homework/pages/HomeworkCreate";
import HomeworkDetail from "@/features/homework/pages/HomeworkDetail";
import HomeworkEdit from "@/features/homework/pages/HomeworkEdit";
import ParentHomework from "@/features/homework/pages/ParentHomework";
// [woo] 퀴즈
import QuizCreate from "@/features/quiz/pages/QuizCreate";
import QuizDetail from "@/features/quiz/pages/QuizDetail";
import QuizEdit from "@/features/quiz/pages/QuizEdit";
// [woo] 출결
import StudentAttendance from "@/features/attendance/pages/StudentAttendance";
import TeacherAttendance from "@/features/attendance/pages/TeacherAttendance";
import ParentAttendance from "@/features/attendance/pages/ParentAttendance";
// [jin] 학부모 관련
import ParentDashboard from "@/features/dashboard/pages/ParentDashboard";
import ParentChildrenStatus from "@/features/parent/pages/ChildrenStatus";
// [jin] 상담
import ConsultationList from "@/features/consultation/pages/ConsultationList";
import ConsultationReservation from "@/features/consultation/pages/ConsultationReservation";
// [jin] 학교 일정/갤러리
import SchoolSchedule from "@/features/calendar/pages/SchoolSchedule";
import SchoolGallery from "@/features/album/pages/SchoolGallery";
// [woo] 학급 앨범
import ClassAlbum from "@/features/album/pages/ClassAlbum";
// [jin] 선생님, 학생 학급 대시보드
import TeacherMyClassDashboard from "@/features/dashboard/pages/MyClassDashboard";
import StudentDashboard from "@/features/dashboard/pages/StudentDashboard";
// [parkjoon] 관리자 페이지
import { ADMIN_GRANTS } from "@/shared/constants/adminPermissions";
import JoonAdminMain from "@/features/admin/pages/AdminMain";
import JoonSchoolSelect from "@/features/admin/pages/school/SchoolSelect";
// import JoonDashboard from "@/features/admin/pages/Dashboard";
import JoonDashboard from "@/features/admin/pages/Dashboard";
import JoonStudentList from "@/features/admin/pages/students/StudentList";
import JoonStudentCreate from "@/features/admin/pages/students/StudentCreate";
import JoonStudentDetail from "@/features/admin/pages/students/StudentDetail";
import JoonTeacherList from "@/features/admin/pages/teachers/TeacherList";
import JoonTeacherCreate from "@/features/admin/pages/teachers/TeacherCreate";
import JoonTeacherDetail from "@/features/admin/pages/teachers/TeacherDetail";
import JoonParentList from "@/features/admin/pages/parents/ParentList";
import JoonParentCreate from "@/features/admin/pages/parents/ParentCreate";
import JoonParentDetail from "@/features/admin/pages/parents/ParentDetail";
import JoonStaffList from "@/features/admin/pages/staffs/StaffList";
import JoonStaffCreate from "@/features/admin/pages/staffs/StaffCreate";
import JoonStaffDetail from "@/features/admin/pages/staffs/StaffDetail";
import JoonClassList from "@/features/admin/pages/classes/ClassList";
import JoonClassCreate from "@/features/admin/pages/classes/ClassCreate";
import JoonClassDetail from "@/features/admin/pages/classes/ClassDetail";
import JoonNoticeList from "@/features/admin/pages/notices/NoticeList";
import JoonNoticeForm from "@/features/admin/pages/notices/NoticeForm";
import JoonNoticeDetail from "@/features/admin/pages/notices/NoticeDetail";
import JoonRooms from "@/features/admin/pages/facilities/Rooms";
import JoonAssets from "@/features/admin/pages/facilities/Assets";
import JoonSchedule from "@/features/admin/pages/master/Schedule";
import JoonSubjects from "@/features/admin/pages/master/Subjects";
import JoonSettings from "@/features/admin/pages/master/Settings";
import JoonAccessLogs from "@/features/admin/pages/audit/AccessLogs";
import JoonChangeLogs from "@/features/admin/pages/audit/ChangeLogs";
import ServiceNoticeList from "@/features/admin/pages/servicenotices/ServiceNoticeList";
import ServiceNoticeForm from "@/features/admin/pages/servicenotices/ServiceNoticeForm";
import ServiceNoticeDetail from "@/features/admin/pages/servicenotices/ServiceNoticeDetail";
import JoonTransfer from "@/features/admin/pages/Transfer";
import JoonTestMode from "@/features/admin/pages/TestMode";
import AbilityClasses from "./pages/cheol/teacher/AbilityClasses";
import AbilityStudents from "./pages/cheol/teacher/AbilityStudents";
// [cheol] 도서관
import LibraryPage from "@/features/library/app/components/Library";
import LibraryBookDetail from "@/features/library/app/components/BookDetail";
import LibraryBorrowedBooks from "@/features/library/app/components/BorrowedBooks";
import LibraryOverdueBooks from "@/features/library/app/components/OverdueBooks";
import LibraryReadingStats from "@/features/library/app/components/ReadingStats";
// [cheol] 기숙사 관리 (교사)
import DormitoryManagement from "@/features/dormitory/pages/DormitoryManagement";

function SchoolSelectGuard() {
  const { selectedSchool, setSelectedSchool } = useSchool();
  const { user, loading } = useAuth();

  const isSuperAdmin = user?.roles?.includes("ADMIN") || user?.role === "ADMIN";
  const firstGrant = !isSuperAdmin ? user?.grants?.find((g) => g.schoolId) : undefined;
  const shouldAutoSelect = !!firstGrant && !selectedSchool;

  useEffect(() => {
    if (!shouldAutoSelect || !firstGrant) return;
    setSelectedSchool({
      id: firstGrant.schoolId!,
      name: firstGrant.schoolName!,
      schoolCode: firstGrant.schoolCode ?? "",
      schoolKind: firstGrant.schoolKind ?? "",
      officeOfEducation: firstGrant.officeOfEducation ?? "",
    });
  }, [shouldAutoSelect]);

  if (loading) return <PageLoader />;
  if (selectedSchool) return <Navigate to={ADMIN_ROUTES.DASHBOARD} replace />;
  if (shouldAutoSelect) return <PageLoader />;
  return <JoonSchoolSelect />;
}

function App() {
  const { user } = useAuth();
  usePushSubscription(user?.authenticated === true);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/hub" replace />} />
      <Route path="/main" element={<MainDesign />} /> {/* [soojin] Main-design을 Main 화면으로 변경 */}
      <Route path="/main-design" element={<MainDesign />} />
      <Route path="/school-search" element={<SchoolSearchPage />} /> {/* [soojin] 학교 찾기 독립 페이지 */}
      <Route path="/service-notice" element={<ServiceNoticePage />} /> {/* [soojin] 공지사항 독립 페이지 */}
      <Route path="/login" element={<Login />} />
      <Route path="/hub" element={<Hub />} />
      {/* [woo] OAuth2 소셜 로그인 콜백 - 토큰 저장 후 역할별 대시보드로 이동 */}
      <Route path="/oauth2/callback" element={<OAuth2Callback />} />
      <Route path="/register" element={<Register />} />
      {/* 회원가입 - 역할 선택 (이메일/SNS 공통) */}
      <Route path="/select-info" element={<SelectInfo />} />
      {/* 회원가입 - 학교 선택 (교사/학생) */}
      <Route path="/register/school-select" element={<RegisterSchoolSelect />} />
      {/* [woo] OAuth2 GUEST 유저 역할 선택 페이지 (하위 호환 유지) */}
      <Route path="/select-role" element={<SelectRole />} />
      {/* 학생 */}
      <Route
        path="/student/dashboard"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "ADMIN"]}>
            <StudentDashboard />
          </PrivateRoute>
        }
      />
      {/* [woo] 학생 리스트 - STUDENT, TEACHER, ADMIN 공용 */}
      <Route
        path="/student/list"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <StudentList />
          </PrivateRoute>
        }
      />
      {/* [cheol] 학생 본인 정보 */}
      <Route
        path="/student/myinfo"
        element={
          <PrivateRoute allowedRoles={["STUDENT"]}>
            <StudentMyInfo />
          </PrivateRoute>
        }
      />
      {/* [cheol] 기숙사 */}
      <Route
        path="/student/dormitory"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "ADMIN", "TEACHER"]}>
            <DormitoryRoot />
          </PrivateRoute>
        }
      >
        <Route index element={<DormitoryBuildingList />} />
        <Route path="building/:buildingId" element={<DormitoryFloorList />} />
        <Route path="building/:buildingId/room/:roomNumber" element={<DormitoryRoomView />} />
      </Route>
      {/* [woo] 교사 성적 입력 - 분반 목록 */}
      <Route
        path="/teacher/grades"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <GradeSections />
          </PrivateRoute>
        }
      />
      {/* [cheol] 교사 세부능력 - 학급 선택 */}
      <Route
        path="/teacher/ability-classes"
        element={
          <PrivateRoute allowedRoles={["TEACHER"]}>
            <AbilityClasses />
          </PrivateRoute>
        }
      />
      {/* [cheol] 교사 세부능력 - 학생 목록 및 입력 */}
      <Route
        path="/teacher/ability-students"
        element={
          <PrivateRoute allowedRoles={["TEACHER"]}>
            <AbilityStudents />
          </PrivateRoute>
        }
      />
      {/* [cheol] 성적/시험 */}
      {/* [woo] 교사 성적 요약 - 분반 목록 */}
      <Route
        path="/teacher/grades/summary"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <GradeSummaryList />
          </PrivateRoute>
        }
      />
      {/* [woo] 교사 성적 입력 - 분반별 점수 입력 */}
      <Route
        path="/teacher/grades/section/:sectionId"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <GradeEntryInput />
          </PrivateRoute>
        }
      />
      {/* [woo] 교사 성적 대시보드 - 분반별 요약 */}
      <Route
        path="/teacher/grades/section/:sectionId/summary"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <GradeEntry />
          </PrivateRoute>
        }
      />
      {/* [woo] 학생 성적 조회 */}
      <Route
        path="/student/grades"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "ADMIN"]}>
            <StudentGrades />
          </PrivateRoute>
        }
      />
      {/* [cheol] 성적/시험 — 기존 /exam 경로 호환 */}
      <Route
        path="/exam"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <StudentGrades />
          </PrivateRoute>
        }
      />
      <Route
        path="/exam/schedule"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <StudentExamSchedule />
          </PrivateRoute>
        }
      />
      <Route
        path="/exam/result"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <StudentExamResult />
          </PrivateRoute>
        }
      />
      {/* [woo] 과제 */}
      <Route
        path="/homework"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <HomeworkList />
          </PrivateRoute>
        }
      />
      <Route
        path="/homework/create"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <HomeworkCreate />
          </PrivateRoute>
        }
      />
      <Route
        path="/homework/:id"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <HomeworkDetail />
          </PrivateRoute>
        }
      />
      {/* [woo] 과제 수정 (교사/관리자 전용) */}
      <Route
        path="/homework/:id/edit"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <HomeworkEdit />
          </PrivateRoute>
        }
      />
      {/* [woo] 학부모 자녀 과제 조회 */}
      <Route
        path="/parent/homework"
        element={
          <PrivateRoute allowedRoles={["PARENT", "ADMIN"]}>
            <ParentHomework />
          </PrivateRoute>
        }
      />
      {/* [soojin] 퀴즈 목록 전용 라우트 - 사이드바에서 직접 진입 */}
      <Route
        path="/quiz"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <HomeworkList />
          </PrivateRoute>
        }
      />
      <Route
        path="/quiz/create"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <QuizCreate />
          </PrivateRoute>
        }
      />
      <Route
        path="/quiz/:id"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <QuizDetail />
          </PrivateRoute>
        }
      />
      {/* [woo] 퀴즈 수정 (교사/관리자 전용) */}
      <Route
        path="/quiz/:id/edit"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <QuizEdit />
          </PrivateRoute>
        }
      />
      {/* [woo] 교사 페이지 */}
      <Route
        path="/teacher/dashboard"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/myclass"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherMyClass />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/myclass/students"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherMyClassStudents />
          </PrivateRoute>
        }
      />
      {/* [woo] 교사 학생 일일 메모 입력 */}
      <Route
        path="/teacher/daily-note"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <DailyNoteInput />
          </PrivateRoute>
        }
      />
      {/* [jin] 교사 학급 대시보드 */}
      <Route
        path="/teacher/myclass/dashboard"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherMyClassDashboard />
          </PrivateRoute>
        }
      />
      {/* [woo] 우리반 알림장 (교사 사이드바 연결) */}
      <Route
        path="/teacher/myclass/notice"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherClassNotice />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/myclass/notice/:id"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <ClassDiaryDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/schedule"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherSchedulePage />
          </PrivateRoute>
        }
      />
      {/* [soojin] 수업 자료 관리 */}
      <Route
        path="/teacher/class-materials"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <ClassMaterials />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/list"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherList />
          </PrivateRoute>
        }
      />
      {/* [woo] 학부모 목록 (교사/관리자용) */}
      <Route
        path="/teacher/parent/list"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <ParentList />
          </PrivateRoute>
        }
      />
      {/* [woo 03-27] 학년 게시판 제거 — 학급 게시판(ClassBoard)으로 대체 */}
      {/* [woo] 게시판 */}
      <Route
        path="/board/school-notice"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN", "PARENT"]}>
            <SchoolNotice />
          </PrivateRoute>
        }
      />
      <Route
        path="/board/school-notice/:id"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN", "PARENT"]}>
            <SchoolNoticeDetail />
          </PrivateRoute>
        }
      />
      {/* [parkjoon] 학부모용 학교 공지 — 자녀 탭으로 학교별 필터링 */}
      <Route
        path="/parent/school-notice"
        element={
          <PrivateRoute allowedRoles={["PARENT"]}>
            <ParentSchoolNotice />
          </PrivateRoute>
        }
      />
      {/* [woo] 학부모 공지 */}
      <Route
        path="/board/parent-notice"
        element={
          <PrivateRoute allowedRoles={["PARENT", "TEACHER", "ADMIN"]}>
            <ParentNotice />
          </PrivateRoute>
        }
      />
      <Route
        path="/board/parent-notice/:id"
        element={
          <PrivateRoute allowedRoles={["PARENT", "TEACHER", "ADMIN"]}>
            <ParentNoticeDetail />
          </PrivateRoute>
        }
      />
      {/* [woo] 학부모 학급 알림장 / [soojin] STUDENT 추가 - 학생 사이드바 학급 알림장 메뉴 연결 */}
      <Route
        path="/parent/class/notice"
        element={
          <PrivateRoute allowedRoles={["PARENT", "STUDENT", "ADMIN"]}>
            <ClassDiary />
          </PrivateRoute>
        }
      />
      <Route
        path="/parent/class/notice/:id"
        element={
          <PrivateRoute allowedRoles={["PARENT", "STUDENT", "ADMIN"]}>
            <ClassDiaryDetail />
          </PrivateRoute>
        }
      />
      {/* [woo] 우리반 알림장 */}
      <Route
        path="/board/class-diary"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "PARENT", "ADMIN"]}>
            <ClassDiary />
          </PrivateRoute>
        }
      />
      <Route
        path="/board/class-diary/write"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <ClassDiaryWrite />
          </PrivateRoute>
        }
      />
      <Route
        path="/board/class-diary/:id"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "PARENT", "ADMIN"]}>
            <ClassDiaryDetail />
          </PrivateRoute>
        }
      />
      {/* [woo 03-27] 학급 게시판 */}
      <Route
        path="/board/class-board"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <ClassBoard />
          </PrivateRoute>
        }
      />
      <Route
        path="/board/class-board/write"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <ClassBoardWrite />
          </PrivateRoute>
        }
      />
      <Route
        path="/board/class-board/:id"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <ClassBoardDetail />
          </PrivateRoute>
        }
      />
      {/* [woo] 학부모 자유게시판 */}
      <Route
        path="/board/parent"
        element={
          <PrivateRoute allowedRoles={["PARENT", "TEACHER", "ADMIN"]}>
            <ParentBoard />
          </PrivateRoute>
        }
      />
      {/* [soojin] 학부모 게시판 글쓰기 — 별도 페이지 */}
      <Route
        path="/board/parent/write"
        element={
          <PrivateRoute allowedRoles={["PARENT", "TEACHER", "ADMIN"]}>
            <ParentBoardWrite />
          </PrivateRoute>
        }
      />
      <Route
        path="/board/parent/:id"
        element={
          <PrivateRoute allowedRoles={["PARENT", "TEACHER", "ADMIN"]}>
            <ParentBoardDetail />
          </PrivateRoute>
        }
      />
      {/* 학부모 */}
      <Route
        path="/parent/dashboard"
        element={
          <PrivateRoute allowedRoles={["PARENT", "ADMIN"]}>
            <ParentDashboard />
          </PrivateRoute>
        }
      />
      {/* [woo] 학부모 자녀현황 - soojin/mychildren/status 마이그레이션 */}
      <Route
        path="/parent/children/status"
        element={
          <PrivateRoute allowedRoles={["PARENT", "ADMIN"]}>
            <ParentChildrenStatus />
          </PrivateRoute>
        }
      />
      {/* [woo] 학부모 자녀 성적 조회 */}
      <Route
        path="/parent/grades"
        element={
          <PrivateRoute allowedRoles={["PARENT", "ADMIN"]}>
            <ParentGrades />
          </PrivateRoute>
        }
      />
      {/* [woo] 교직원 게시판 */}
      <Route
        path="/board/teacher"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherBoard />
          </PrivateRoute>
        }
      />
      {/* [soojin] 교직원 게시판 글쓰기 — 별도 페이지 */}
      <Route
        path="/board/teacher/write"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherBoardWrite />
          </PrivateRoute>
        }
      />
      <Route
        path="/board/teacher/:id"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherBoardDetail />
          </PrivateRoute>
        }
      />
      {/* [woo] 수업 일정 추가/수정 (TimetableApp 링크) */}
      <Route
        path="/teacher/schedule/add"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherScheduleAdd />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/schedule/edit/:id"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherScheduleEdit />
          </PrivateRoute>
        }
      />
      {/* [woo] 출결 관리 */}
      <Route
        path="/attendance/student"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <StudentAttendance />
          </PrivateRoute>
        }
      />
      <Route
        path="/attendance/teacher"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherAttendance />
          </PrivateRoute>
        }
      />
      {/* [woo] 학부모 자녀 출결 현황 */}
      <Route
        path="/attendance/parent"
        element={
          <PrivateRoute allowedRoles={["PARENT", "ADMIN"]}>
            <ParentAttendance />
          </PrivateRoute>
        }
      />
      {/* [soojin] 상담 신청 예약 (캘린더) */}
      <Route
        path="/consultation/reservation"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "PARENT", "ADMIN"]}>
            <ConsultationReservation />
          </PrivateRoute>
        }
      />
      {/* [soojin] 상담 예약 목록 */}
      <Route
        path="/consultation"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "PARENT", "ADMIN"]}>
            <ConsultationList />
          </PrivateRoute>
        }
      />
      {/* [joon] parkjoon 관리자 페이지 - /admin/... */}
      {/* requiredGrants: ADMIN role이면 항상 통과, GrantedRole 위임자는 해당 grant 보유 시 통과 */}
      <Route
        path={ADMIN_ROUTES.MAIN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.DASHBOARD}>
            <JoonAdminMain />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.SCHOOL_SELECT}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.DASHBOARD}>
            <SchoolSelectGuard />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.DASHBOARD}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.DASHBOARD}>
            <JoonDashboard />
          </PrivateRoute>
        }
      />
      {/* [joon] 학생 관리 */}
      <Route
        path={ADMIN_ROUTES.STUDENTS.LIST}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.STUDENTS}>
            <JoonStudentList />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.STUDENTS.CREATE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.STUDENTS}>
            <JoonStudentCreate />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.STUDENTS.DETAIL_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.STUDENTS}>
            <JoonStudentDetail />
          </PrivateRoute>
        }
      />
      {/* [joon] 교사 관리 */}
      <Route
        path={ADMIN_ROUTES.TEACHERS.LIST}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.TEACHERS}>
            <JoonTeacherList />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.TEACHERS.CREATE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.TEACHERS}>
            <JoonTeacherCreate />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.TEACHERS.DETAIL_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.TEACHERS}>
            <JoonTeacherDetail />
          </PrivateRoute>
        }
      />
      {/* [joon] 학부모 관리 */}
      <Route
        path={ADMIN_ROUTES.PARENTS.LIST}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.PARENTS}>
            <JoonParentList />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.PARENTS.CREATE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.PARENTS}>
            <JoonParentCreate />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.PARENTS.DETAIL_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.PARENTS}>
            <JoonParentDetail />
          </PrivateRoute>
        }
      />
      {/* [joon] 교직원 관리 */}
      <Route
        path={ADMIN_ROUTES.STAFFS.LIST}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.STAFFS}>
            <JoonStaffList />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.STAFFS.CREATE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.STAFFS}>
            <JoonStaffCreate />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.STAFFS.DETAIL_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.STAFFS}>
            <JoonStaffDetail />
          </PrivateRoute>
        }
      />
      {/* [joon] 전입 처리 */}
      <Route
        path={ADMIN_ROUTES.TRANSFER}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.STUDENTS}>
            <JoonTransfer />
          </PrivateRoute>
        }
      />
      {/* [joon] 테스트 데이터 생성 (SUPER_ADMIN + testMode 활성화 시) */}
      <Route
        path={ADMIN_ROUTES.TEST_MODE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonTestMode />
          </PrivateRoute>
        }
      />
      {/* [joon] 학급 관리 */}
      <Route
        path={ADMIN_ROUTES.CLASSES.LIST}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.CLASSES}>
            <JoonClassList />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.CLASSES.CREATE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.CLASSES}>
            <JoonClassCreate />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.CLASSES.DETAIL_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.CLASSES}>
            <JoonClassDetail />
          </PrivateRoute>
        }
      />
      {/* [joon] 공지사항 관리 */}
      <Route
        path={ADMIN_ROUTES.NOTICES.LIST}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.NOTICES}>
            <JoonNoticeList />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.NOTICES.CREATE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.NOTICES}>
            <JoonNoticeForm />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.NOTICES.DETAIL_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.NOTICES}>
            <JoonNoticeDetail />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.NOTICES.EDIT_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.NOTICES}>
            <JoonNoticeForm />
          </PrivateRoute>
        }
      />
      {/* [joon] 시설/기자재 관리 */}
      <Route
        path={ADMIN_ROUTES.FACILITIES}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.FACILITIES}>
            <JoonRooms />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.ASSETS}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.ASSETS}>
            <JoonAssets />
          </PrivateRoute>
        }
      />
      {/* [cheol] 기숙사 관리 (관리자 영역) */}
      <Route
        path={ADMIN_ROUTES.DORMITORY}
        element={
          <PrivateRoute allowedRoles={["ADMIN", "TEACHER", "STAFF"]} requiredGrants={ADMIN_GRANTS.DORMITORY}>
            <DormitoryAdminRoot />
          </PrivateRoute>
        }
      >
        <Route index element={<DormitoryBuildingList />} />
        <Route path="building/:buildingId" element={<DormitoryFloorList />} />
        <Route path="building/:buildingId/room/:roomNumber" element={<DormitoryRoomView />} />
      </Route>
      {/* [joon] 기준 정보 관리 (SUPER_ADMIN 전용) */}
      <Route
        path={ADMIN_ROUTES.MASTER.SCHEDULE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.SCHEDULE}>
            <JoonSchedule />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.MASTER.SUBJECTS}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.SUBJECTS}>
            <JoonSubjects />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.MASTER.SETTINGS}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.SETTINGS}>
            <JoonSettings />
          </PrivateRoute>
        }
      />
      {/* [joon] 감사 로그 (SUPER_ADMIN 전용) */}
      <Route
        path={ADMIN_ROUTES.AUDIT.ACCESS}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.AUDIT}>
            <JoonAccessLogs />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.AUDIT.CHANGES}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]} requiredGrants={ADMIN_GRANTS.AUDIT}>
            <JoonChangeLogs />
          </PrivateRoute>
        }
      />
      {/* 서비스 공지 관리 (SUPER_ADMIN 전용) */}
      <Route
        path={ADMIN_ROUTES.SERVICE_NOTICES.LIST}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <ServiceNoticeList />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.SERVICE_NOTICES.CREATE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <ServiceNoticeForm />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.SERVICE_NOTICES.DETAIL_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <ServiceNoticeDetail />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.SERVICE_NOTICES.EDIT_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <ServiceNoticeForm />
          </PrivateRoute>
        }
      />
      {/* [soojin] 학교 일정 / 갤러리 - PARENT, TEACHER, ADMIN, STUDENT */}
      <Route
        path="/school/schedule"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN", "PARENT"]}>
            <SchoolSchedule />
          </PrivateRoute>
        }
      />
      <Route
        path="/school/gallery"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN", "PARENT"]}>
            <SchoolGallery />
          </PrivateRoute>
        }
      />
      {/* [woo] 학급 앨범 */}
      <Route
        path="/class/album"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN", "PARENT"]}>
            <ClassAlbum />
          </PrivateRoute>
        }
      />
      {/* [cheol] 도서관 */}
      <Route
        path="/library"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <LibraryPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/library/book/:bookId"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <LibraryBookDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/library/borrowed"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <LibraryBorrowedBooks />
          </PrivateRoute>
        }
      />
      <Route
        path="/library/overdue"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <LibraryOverdueBooks />
          </PrivateRoute>
        }
      />
      <Route
        path="/library/stats"
        element={
          <PrivateRoute allowedRoles={["STUDENT", "TEACHER", "ADMIN"]}>
            <LibraryReadingStats />
          </PrivateRoute>
        }
      />
      {/* [cheol] 기숙사 관리 (교사) */}
      <Route
        path="/teacher/dormitory"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <DormitoryManagement />
          </PrivateRoute>
        }
      />
      {/* [woo] 에러 페이지 - Spring Boot error/403.html, error/404.html 참조 */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
