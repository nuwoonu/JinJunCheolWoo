import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import PrivateRoute from "@/components/PrivateRoute";
import PageLoader from "@/components/PageLoader";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePushSubscription } from "@/hooks/usePushSubscription";
// 공통
import NotFound from "@/pages/error/NotFound";
import Unauthorized from "@/pages/error/Unauthorized";
import Login from "@/pages/auth/Login";
import Hub from "@/pages/auth/Hub";
import Register from "@/pages/auth/Register";
import OAuth2Callback from "@/pages/auth/OAuth2Callback";
import SelectRole from "@/pages/auth/SelectRole";
import SelectInfo from "@/pages/auth/SelectInfo";
import RegisterSchoolSelect from "@/pages/auth/RegisterSchoolSelect";
import Main from "@/pages/Main";
import MainDesign from "@/pages/Main-design";
// [cheol] 학생 관련
import StudentList from "@/pages/cheol/student/StudentList";
import StudentMyInfo from "@/pages/cheol/student/MyInfo";
import StudentGrades from "@/pages/cheol/student/Grades";
import StudentExamSchedule from "@/pages/cheol/student/ExamSchedule";
import StudentExamResult from "@/pages/cheol/student/ExamResult";
// [woo 03-27] 학년 게시판 제거 — 학급 게시판(ClassBoard)으로 대체
// [cheol] 기숙사
import DormitoryRoot from "@/pages/cheol/dormitory/app/components/Root";
import DormitoryAdminRoot from "@/pages/cheol/dormitory/app/components/AdminRoot";
import DormitoryBuildingList from "@/pages/cheol/dormitory/app/components/BuildingList";
import DormitoryFloorList from "@/pages/cheol/dormitory/app/components/FloorList";
import DormitoryRoomView from "@/pages/cheol/dormitory/app/components/RoomView";
// [woo] 교사 관련
import TeacherDashboard from "@/pages/woo/teacher/Dashboard";
import TeacherMyClass from "@/pages/woo/teacher/MyClass";
import TeacherMyClassStudents from "@/pages/woo/teacher/MyClassStudents";
import TeacherSchedulePage from "@/pages/woo/teacher/SchedulePage";
import TeacherScheduleAdd from "@/pages/woo/teacher/ScheduleAdd";
import TeacherScheduleEdit from "@/pages/woo/teacher/ScheduleEdit";
import TeacherList from "@/pages/woo/teacher/TeacherList";
import ParentList from "@/pages/woo/teacher/ParentList";
import TeacherGradeClasses from "@/pages/woo/teacher/GradeClasses";
import GradeInput from "@/pages/woo/teacher/GradeInput";
// [woo] 학부모 성적 조회
import ParentGrades from "@/pages/jin/parent/ParentGrades";

// [woo] 게시판
import SchoolNotice from "@/pages/woo/board/SchoolNotice";
import SchoolNoticeDetail from "@/pages/woo/board/SchoolNoticeDetail";
import ParentNotice from "@/pages/woo/board/ParentNotice";
import ParentNoticeDetail from "@/pages/woo/board/ParentNoticeDetail";
import ClassDiary from "@/pages/woo/board/ClassDiary";
import ClassDiaryWrite from "@/pages/woo/board/ClassDiaryWrite";
import ClassDiaryDetail from "@/pages/woo/board/ClassDiaryDetail";
// [woo 03-27] 학급 게시판
import ClassBoard from "@/pages/woo/board/ClassBoard";
import ClassBoardWrite from "@/pages/woo/board/ClassBoardWrite";
import ClassBoardDetail from "@/pages/woo/board/ClassBoardDetail";
import ParentBoard from "@/pages/woo/board/ParentBoard";
import ParentBoardDetail from "@/pages/woo/board/ParentBoardDetail";
import TeacherBoard from "@/pages/woo/board/TeacherBoard";
import TeacherBoardDetail from "@/pages/woo/board/TeacherBoardDetail";
// [woo] 과제
import HomeworkList from "@/pages/woo/homework/HomeworkList";
import HomeworkCreate from "@/pages/woo/homework/HomeworkCreate";
import HomeworkDetail from "@/pages/woo/homework/HomeworkDetail";
import HomeworkEdit from "@/pages/woo/homework/HomeworkEdit";
import ParentHomework from "@/pages/woo/homework/ParentHomework";
// [woo] 퀴즈
import QuizCreate from "@/pages/woo/quiz/QuizCreate";
import QuizDetail from "@/pages/woo/quiz/QuizDetail";
import QuizEdit from "@/pages/woo/quiz/QuizEdit";
// [woo] 출결
import StudentAttendance from "@/pages/woo/attendance/StudentAttendance";
import TeacherAttendance from "@/pages/woo/attendance/TeacherAttendance";
import ParentAttendance from "@/pages/woo/attendance/ParentAttendance";
// [jin] 학부모 관련
import ParentDashboard from "@/pages/jin/parent/Dashboard";
import ParentChildrenStatus from "@/pages/jin/parent/ChildrenStatus";
// [jin] 상담
import ConsultationList from "@/pages/jin/consultation/ConsultationList";
import ConsultationReservation from "@/pages/jin/consultation/ConsultationReservation";
// [jin] 학교 일정/갤러리
import SchoolSchedule from "@/pages/jin/school/SchoolSchedule";
import SchoolGallery from "@/pages/jin/school/SchoolGallery";
// [woo] 학급 앨범
import ClassAlbum from "@/pages/woo/album/ClassAlbum";
// [jin] 선생님, 학생 학급 대시보드
import TeacherMyClassDashboard from "@/pages/jin/teacher/MyClassDashboard";
import StudentDashboard from "@/pages/jin/student/StudentDashboard";
// [parkjoon] 관리자 페이지
import { ADMIN_GRANTS } from "@/constants/adminPermissions";
import JoonAdminMain from "@/pages/admin/AdminMain";
import JoonSchoolSelect from "@/pages/admin/school/SchoolSelect";
// import JoonDashboard from "@/pages/admin/Dashboard";
import JoonDashboard from "@/pages/jin/admin/Dashboard";
import JoonStudentList from "@/pages/admin/students/StudentList";
import JoonStudentCreate from "@/pages/admin/students/StudentCreate";
import JoonStudentDetail from "@/pages/admin/students/StudentDetail";
import JoonTeacherList from "@/pages/admin/teachers/TeacherList";
import JoonTeacherCreate from "@/pages/admin/teachers/TeacherCreate";
import JoonTeacherDetail from "@/pages/admin/teachers/TeacherDetail";
import JoonParentList from "@/pages/admin/parents/ParentList";
import JoonParentCreate from "@/pages/admin/parents/ParentCreate";
import JoonParentDetail from "@/pages/admin/parents/ParentDetail";
import JoonStaffList from "@/pages/admin/staffs/StaffList";
import JoonStaffCreate from "@/pages/admin/staffs/StaffCreate";
import JoonStaffDetail from "@/pages/admin/staffs/StaffDetail";
import JoonClassList from "@/pages/admin/classes/ClassList";
import JoonClassCreate from "@/pages/admin/classes/ClassCreate";
import JoonClassDetail from "@/pages/admin/classes/ClassDetail";
import JoonNoticeList from "@/pages/admin/notices/NoticeList";
import JoonNoticeForm from "@/pages/admin/notices/NoticeForm";
import JoonNoticeDetail from "@/pages/admin/notices/NoticeDetail";
import JoonRooms from "@/pages/admin/facilities/Rooms";
import JoonAssets from "@/pages/admin/facilities/Assets";
import JoonSchedule from "@/pages/admin/master/Schedule";
import JoonSubjects from "@/pages/admin/master/Subjects";
import JoonSettings from "@/pages/admin/master/Settings";
import JoonAccessLogs from "@/pages/admin/audit/AccessLogs";
import JoonChangeLogs from "@/pages/admin/audit/ChangeLogs";
import ServiceNoticeList from "@/pages/admin/servicenotices/ServiceNoticeList";
import ServiceNoticeForm from "@/pages/admin/servicenotices/ServiceNoticeForm";
import ServiceNoticeDetail from "@/pages/admin/servicenotices/ServiceNoticeDetail";
import JoonTransfer from "@/pages/admin/Transfer";
import JoonTestMode from "@/pages/admin/TestMode";

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
      <Route path="/main" element={<Main />} />
      <Route path="/main-design" element={<MainDesign />} />
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

      {/* [cheol] 교사 성적 채점 - 학급 선택 */}
      <Route
        path="/teacher/grade-classes"
        element={
          <PrivateRoute allowedRoles={["TEACHER"]}>
            <TeacherGradeClasses />
          </PrivateRoute>
        }
      />
      {/* [woo] 교사 성적 입력 - 학급별 성적 관리 */}
      <Route
        path="/teacher/grade-input/:classroomId"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <GradeInput />
          </PrivateRoute>
        }
      />
      {/* [cheol] 성적/시험 */}
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
      {/* [jin] 교사 학급 대시보드 */}
      <Route
        path="/teacher/myclass/dashboard"
        element={
          <PrivateRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherMyClassDashboard />
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

      {/* [woo] 에러 페이지 - Spring Boot error/403.html, error/404.html 참조 */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
