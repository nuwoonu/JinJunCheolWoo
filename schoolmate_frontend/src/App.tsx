import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import { ADMIN_ROUTES } from "./constants/routes";
// 공통
import NotFound from "./pages/error/NotFound";
import Unauthorized from "./pages/error/Unauthorized";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import OAuth2Callback from "./pages/auth/OAuth2Callback";
import SelectRole from "./pages/auth/SelectRole";
import SelectInfo from "./pages/auth/SelectInfo";
import RegisterSchoolSelect from "./pages/auth/RegisterSchoolSelect";
import Main from "./pages/Main";
import UserProfile from "./pages/user/Profile";
// [cheol] 학생 관련
import StudentDashboard from "./pages/cheol/student/Dashboard";
import StudentList from "./pages/cheol/student/StudentList";
import StudentMyInfo from "./pages/cheol/student/MyInfo";
import StudentGrades from "./pages/cheol/student/Grades";
import StudentExamSchedule from "./pages/cheol/student/ExamSchedule";
import StudentExamResult from "./pages/cheol/student/ExamResult";
import GradeBoard from "./pages/cheol/board/GradeBoard";
import GradeBoardDetail from "./pages/cheol/board/GradeBoardDetail";
// [woo] 교사 관련
import TeacherDashboard from "./pages/woo/teacher/Dashboard";
import TeacherMyClass from "./pages/woo/teacher/MyClass";
import TeacherMyClassStudents from "./pages/woo/teacher/MyClassStudents";
import TeacherSchedulePage from "./pages/woo/teacher/SchedulePage";
import TeacherScheduleAdd from "./pages/woo/teacher/ScheduleAdd";
import TeacherScheduleEdit from "./pages/woo/teacher/ScheduleEdit";
import TeacherList from "./pages/woo/teacher/TeacherList";
import ParentList from "./pages/woo/teacher/ParentList";
// [woo] 게시판
import SchoolNotice from "./pages/woo/board/SchoolNotice";
import SchoolNoticeDetail from "./pages/woo/board/SchoolNoticeDetail";
import ParentNotice from "./pages/woo/board/ParentNotice";
import ParentNoticeDetail from "./pages/woo/board/ParentNoticeDetail";
import ParentBoard from "./pages/woo/board/ParentBoard";
import ParentBoardDetail from "./pages/woo/board/ParentBoardDetail";
import TeacherBoard from "./pages/woo/board/TeacherBoard";
import TeacherBoardDetail from "./pages/woo/board/TeacherBoardDetail";
// [woo] 출결
import StudentAttendance from "./pages/woo/attendance/StudentAttendance";
import TeacherAttendance from "./pages/woo/attendance/TeacherAttendance";
// [jin] 학부모 관련
import ParentDashboard from "./pages/jin/parent/Dashboard";
import ParentChildrenStatus from "./pages/jin/parent/ChildrenStatus";
// [jin] 상담
import ConsultationList from "./pages/jin/consultation/ConsultationList";
import ConsultationReservation from "./pages/jin/consultation/ConsultationReservation";
// [jin] 학교 일정/갤러리
import SchoolSchedule from "./pages/jin/school/SchoolSchedule";
import SchoolGallery from "./pages/jin/school/SchoolGallery";
// [parkjoon] 관리자 페이지
import JoonSchoolSelect from "./pages/admin/school/SchoolSelect";
import JoonDashboard from "./pages/admin/Dashboard";
import JoonStudentList from "./pages/admin/students/StudentList";
import JoonStudentCreate from "./pages/admin/students/StudentCreate";
import JoonStudentDetail from "./pages/admin/students/StudentDetail";
import JoonTeacherList from "./pages/admin/teachers/TeacherList";
import JoonTeacherCreate from "./pages/admin/teachers/TeacherCreate";
import JoonTeacherDetail from "./pages/admin/teachers/TeacherDetail";
import JoonParentList from "./pages/admin/parents/ParentList";
import JoonParentCreate from "./pages/admin/parents/ParentCreate";
import JoonParentDetail from "./pages/admin/parents/ParentDetail";
import JoonStaffList from "./pages/admin/staffs/StaffList";
import JoonStaffCreate from "./pages/admin/staffs/StaffCreate";
import JoonStaffDetail from "./pages/admin/staffs/StaffDetail";
import JoonClassList from "./pages/admin/classes/ClassList";
import JoonClassCreate from "./pages/admin/classes/ClassCreate";
import JoonClassDetail from "./pages/admin/classes/ClassDetail";
import JoonNoticeList from "./pages/admin/notices/NoticeList";
import JoonNoticeForm from "./pages/admin/notices/NoticeForm";
import JoonNoticeDetail from "./pages/admin/notices/NoticeDetail";
import JoonRooms from "./pages/admin/facilities/Rooms";
import JoonAssets from "./pages/admin/facilities/Assets";
import JoonSchedule from "./pages/admin/master/Schedule";
import JoonSubjects from "./pages/admin/master/Subjects";
import JoonSettings from "./pages/admin/master/Settings";
import JoonAccessLogs from "./pages/admin/audit/AccessLogs";
import JoonChangeLogs from "./pages/admin/audit/ChangeLogs";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/main" replace />} />
      <Route path="/main" element={<Main />} />
      <Route path="/login" element={<Login />} />
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

      {/* [cheol] 학년 게시판 - PARENT 포함 (학부모 학급 공지 접근) */}
      <Route
        path="/board/grade/:grade"
        element={
          <PrivateRoute
            allowedRoles={["STUDENT", "TEACHER", "ADMIN", "PARENT"]}
          >
            <GradeBoard />
          </PrivateRoute>
        }
      />
      <Route
        path="/board/grade/:grade/:id"
        element={
          <PrivateRoute
            allowedRoles={["STUDENT", "TEACHER", "ADMIN", "PARENT"]}
          >
            <GradeBoardDetail />
          </PrivateRoute>
        }
      />

      {/* [woo] 게시판 */}
      <Route
        path="/board/school-notice"
        element={
          <PrivateRoute
            allowedRoles={["STUDENT", "TEACHER", "ADMIN", "PARENT"]}
          >
            <SchoolNotice />
          </PrivateRoute>
        }
      />
      <Route
        path="/board/school-notice/:id"
        element={
          <PrivateRoute
            allowedRoles={["STUDENT", "TEACHER", "ADMIN", "PARENT"]}
          >
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

      {/* [woo] 프로필 - 전체 역할 */}
      <Route
        path="/user/profile"
        element={
          <PrivateRoute
            allowedRoles={["STUDENT", "TEACHER", "ADMIN", "PARENT"]}
          >
            <UserProfile />
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
      <Route
        path={ADMIN_ROUTES.SCHOOL_SELECT}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonSchoolSelect />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.DASHBOARD}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonDashboard />
          </PrivateRoute>
        }
      />

      {/* [joon] 학생 관리 */}
      <Route
        path={ADMIN_ROUTES.STUDENTS.LIST}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonStudentList />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.STUDENTS.CREATE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonStudentCreate />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.STUDENTS.DETAIL_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonStudentDetail />
          </PrivateRoute>
        }
      />

      {/* [joon] 교사 관리 */}
      <Route
        path={ADMIN_ROUTES.TEACHERS.LIST}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonTeacherList />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.TEACHERS.CREATE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonTeacherCreate />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.TEACHERS.DETAIL_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonTeacherDetail />
          </PrivateRoute>
        }
      />

      {/* [joon] 학부모 관리 */}
      <Route
        path={ADMIN_ROUTES.PARENTS.LIST}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonParentList />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.PARENTS.CREATE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonParentCreate />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.PARENTS.DETAIL_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonParentDetail />
          </PrivateRoute>
        }
      />

      {/* [joon] 교직원 관리 */}
      <Route
        path={ADMIN_ROUTES.STAFFS.LIST}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonStaffList />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.STAFFS.CREATE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonStaffCreate />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.STAFFS.DETAIL_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonStaffDetail />
          </PrivateRoute>
        }
      />

      {/* [joon] 학급 관리 */}
      <Route
        path={ADMIN_ROUTES.CLASSES.LIST}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonClassList />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.CLASSES.CREATE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonClassCreate />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.CLASSES.DETAIL_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonClassDetail />
          </PrivateRoute>
        }
      />

      {/* [joon] 공지사항 관리 */}
      <Route
        path={ADMIN_ROUTES.NOTICES.LIST}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonNoticeList />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.NOTICES.CREATE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonNoticeForm />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.NOTICES.DETAIL_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonNoticeDetail />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.NOTICES.EDIT_PATTERN}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonNoticeForm />
          </PrivateRoute>
        }
      />

      {/* [joon] 시설/기자재 관리 */}
      <Route
        path={ADMIN_ROUTES.FACILITIES}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonRooms />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.ASSETS}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonAssets />
          </PrivateRoute>
        }
      />

      {/* [joon] 기준 정보 관리 */}
      <Route
        path={ADMIN_ROUTES.MASTER.SCHEDULE}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonSchedule />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.MASTER.SUBJECTS}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonSubjects />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.MASTER.SETTINGS}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonSettings />
          </PrivateRoute>
        }
      />

      {/* [joon] 감사 로그 */}
      <Route
        path={ADMIN_ROUTES.AUDIT.ACCESS}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonAccessLogs />
          </PrivateRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.AUDIT.CHANGES}
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <JoonChangeLogs />
          </PrivateRoute>
        }
      />

      {/* [soojin] 학교 일정 / 갤러리 - PARENT, TEACHER, ADMIN, STUDENT */}
      <Route
        path="/school/schedule"
        element={
          <PrivateRoute
            allowedRoles={["STUDENT", "TEACHER", "ADMIN", "PARENT"]}
          >
            <SchoolSchedule />
          </PrivateRoute>
        }
      />
      <Route
        path="/school/gallery"
        element={
          <PrivateRoute
            allowedRoles={["STUDENT", "TEACHER", "ADMIN", "PARENT"]}
          >
            <SchoolGallery />
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
