import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
// [woo] unused: motion 제거
import { useAuth } from "@/shared/contexts/AuthContext";
import { useSidebar } from "@/shared/contexts/SidebarContext";
import { ADMIN_ROUTES } from "@/shared/constants/routes";
import api from "@/shared/api/authApi";

// [woo] 사이드바 서브메뉴 열림 상태 관리
// CSS: .open → 서브메뉴 display:block, .dropdown-open → 화살표 회전
// [soojin] 현재 경로 기반으로 해당 드롭다운 자동 열림
function useSubmenu() {
  const location = useLocation();

  function initOpen(p: string): Record<string, boolean> {
    const r: Record<string, boolean> = {};
    if (p.startsWith("/teacher/myclass") || p.startsWith("/class/album") || p.startsWith("/board/class-board"))
      r.myclass = true;
    if (
      p.startsWith("/student/list") ||
      p.startsWith("/student/myinfo") ||
      p.startsWith("/student/dormitory") ||
      p.startsWith("/library")
    )
      r.student = true;
    // [soojin] 자녀 현황: /parent/children 제거 (헤더 탭으로 이동 예정)
    if (p.startsWith("/attendance/parent") || p.startsWith("/parent/grades") || p.startsWith("/parent/homework"))
      r.parent = true;
    if (p.startsWith("/teacher/list")) r.teacher = true;
    if (p.startsWith("/board/parent-notice") || p.startsWith("/board/parent") || p.startsWith("/teacher/parent"))
      r.parentList = true;
    if (p.startsWith("/board/school-notice")) {
      r.notice = true;
      r.parentNotice = true;
    }
    if (p.startsWith("/board/class-board") || p.startsWith("/board/teacher")) r.board = true;
    if (p.startsWith("/homework") || p.startsWith("/quiz")) r.homework = true;
    if (p.startsWith("/exam") || p.startsWith("/student/grades") || p.startsWith("/teacher/grades")) r.exam = true;
    if (p.startsWith("/attendance/student") || p.startsWith("/attendance/teacher")) r.attendance = true;
    // [soojin] 학교 소식: gallery 제거, 가정통신문 추가
    if (p.startsWith("/school/schedule") || p.startsWith("/board/parent-notice")) r.parentNotice = true;
    // [soojin] 학급 소식 드롭다운 키
    if (p.startsWith("/parent/class/notice") || p.startsWith("/class/album")) r.classNews = true;
    // [soojin] TEACHER 전용 드롭다운 키
    if (p.startsWith("/teacher/schedule") || p.startsWith("/teacher/class-materials")) r.teacherSchedule = true;
    if (p.startsWith("/homework") || p.startsWith("/quiz")) r.teacherHomework = true;
    if (p.startsWith("/homework")) r.teacherHomeworkAssign = true;
    if (p.startsWith("/quiz")) r.teacherHomeworkQuiz = true;
    if (
      p.startsWith("/exam") ||
      p.startsWith("/teacher/grades") ||
      p.startsWith("/teacher/grade-classes") ||
      p.startsWith("/student/list")
    )
      r.teacherExam = true;
    if (p.startsWith("/attendance/student") || p.startsWith("/attendance/teacher")) r.teacherAttendance = true;
    if (p.startsWith("/board/school-notice") || p.startsWith("/school/schedule")) r.teacherNotice = true;
    if (p.startsWith("/teacher/list") || p.startsWith("/board/teacher")) r.teacherStaff = true;
    if (p.startsWith("/consultation")) {
      r.consultation = true;
      r.parentList = true;
    }
    return r;
  }

  const [open, setOpen] = useState<Record<string, boolean>>(() => initOpen(location.pathname));

  useEffect(() => {
    setOpen(initOpen(location.pathname));
  }, [location.pathname]);

  // [soojin] nested=true 시 기존 상태 유지 - 중첩 드롭다운 토글 시 부모가 닫히지 않도록
  const toggle = (key: string, nested?: boolean) =>
    setOpen((prev) => (nested ? { ...prev, [key]: !prev[key] } : { [key]: !prev[key] }));
  return { open, toggle };
}

// [woo] 열린 상태일 때 'open dropdown-open' 두 클래스 모두 붙여야 CSS가 작동함
function dc(isOpen: boolean) {
  return `dropdown${isOpen ? " open dropdown-open" : ""}`;
}

// [soojin] 현재 페이지 링크만 primary 색상으로 표시, 나머지는 기본 색 유지
function SNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink to={to} end style={({ isActive }) => (isActive ? { color: "#25A194" } : {})}>
      {children}
    </NavLink>
  );
}

// [soojin] 학생 대시보드 사이드바 프로필 패널용 학생 정보 타입
interface StudentProfile {
  userName?: string;
  year?: number;
  classNum?: number;
  studentNumber?: number;
  status?: string;
  profileImageUrl?: string;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "승인대기",
  ENROLLED: "재학",
  LEAVE_OF_ABSENCE: "휴학",
  DROPOUT: "자퇴",
  EXPELLED: "제적",
  GRADUATED: "졸업",
  TRANSFERRED: "전학",
};

export default function Sidebar() {
  const { user } = useAuth();
  const { open, toggle } = useSubmenu();
  const { isOpen, isCollapsed, closeSidebar, toggleCollapse } = useSidebar();
  const role = user?.role ?? "";
  const location = useLocation();

  // [soojin] /student/dashboard 페이지에서만 학생 프로필 패널 표시
  // 다른 페이지(교사/학부모 대시보드 포함)에서는 표시하지 않음
  const isStudentDashboard = location.pathname === "/student/dashboard";
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    if (!isStudentDashboard) return;
    api
      .get("/dashboard/student")
      .then((res) => {
        const s = res.data?.student;
        const imgUrl = res.data?.profileImageUrl;
        if (s) setStudentProfile({ ...s, profileImageUrl: imgUrl });
      })
      .catch(() => {});
  }, [isStudentDashboard]);

  // [woo] 학생일 때 대시보드 API에서 프로필 정보 + 출결 통계 가져오기
  const [, setStudentInfo] = useState<StudentProfile | null>(null);
  const [, setProfileImageUrl] = useState<string | null>(null);
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({});
  // [woo] 교사/학생 소속 학교 이름
  const [schoolName, setSchoolName] = useState<string | null>(null);
  // [soojin] 담임 학급 배정 여부 - null: 로딩 중, false: 미배정, true: 배정됨
  const [hasClassroom, setHasClassroom] = useState<boolean | null>(null);

  useEffect(() => {
    if (role === "STUDENT" && user?.authenticated) {
      api
        .get("/dashboard/student")
        .then((res) => {
          setStudentInfo(res.data?.student ?? null);
          setProfileImageUrl(res.data?.profileImageUrl ?? null);
          setSchoolName(res.data?.student?.schoolName ?? null);
        })
        .catch(() => {});

      // [woo] 출결 통계 조회
      api
        .get("/attendance/my/summary")
        .then((res) => {
          setAttendanceCounts(res.data ?? {});
        })
        .catch(() => {});
    }

    // [woo] 교사일 때 소속 학교 이름 조회
    if (role === "TEACHER" && user?.authenticated) {
      api
        .get("/dashboard/teacher")
        .then((res) => {
          setSchoolName(res.data?.schoolName ?? null);
          // [soojin] classInfo 존재 여부로 담임 학급 배정 확인 - 미배정 시 classInfo: null
          setHasClassroom(!!res.data?.classInfo);
        })
        .catch(() => {
          setHasClassroom(false);
        });
    }
  }, [role, user?.authenticated]);

  const has = (...roles: string[]) => roles.includes(role);

  return (
    // [woo] isOpen → sidebar-open (모바일 슬라이드), isCollapsed → active (데스크탑 접힘)
    <aside
      className={`sidebar${isOpen ? " sidebar-open" : ""}${isCollapsed ? " active" : ""}`}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <button type="button" className="sidebar-close-btn" onClick={closeSidebar}>
        <iconify-icon icon="radix-icons:cross-2" />
      </button>

      {/* [soojin] 사이드바 로고 + 접기 버튼 영역
          - 펼친 상태(isCollapsed=false): 로고 + ri-contract-left-line 아이콘 표시
          - 접힌 상태(isCollapsed=true): 로고 숨기고 ri-contract-right-line 아이콘만 표시 */}
      <div>
        <div
          className="sidebar-logo d-flex align-items-center justify-content-between"
          style={{ paddingInlineStart: "1.5rem", paddingInlineEnd: "1.5rem" }}
        >
          {!isCollapsed && (
            <a href="/main">
              <img src="/images/schoolmateLogo.png" alt="홈" className="light-logo" width="160" height="37" />
              <img src="/images/schoolmateLogo.png" alt="홈" className="dark-logo" width="160" height="37" />
              <img src="/images/schoolmateLogo.png" alt="홈" className="logo-icon" />
            </a>
          )}
          {/* [soojin] 접기/펼치기 버튼 - 접힌 상태에서 아이콘 방향 전환 + 수평 중앙 정렬 */}
          <button
            type="button"
            className="text-xxl d-xl-flex d-none line-height-1 sidebar-toggle text-neutral-500"
            aria-label="Collapse Sidebar"
            onClick={toggleCollapse}
            style={
              isCollapsed
                ? { left: "50%", right: "auto", top: "2.25rem", transform: "translateX(-50%) translateY(-50%)" }
                : {}
            }
          >
            <i className={isCollapsed ? "ri-contract-right-line" : "ri-contract-left-line"} />
          </button>
        </div>
      </div>

      {/* [soojin] 학생 대시보드 전용 프로필 패널
          /student/dashboard 경로일 때만 렌더링 (다른 역할 대시보드에서는 표시 안 함) */}
      {isStudentDashboard && studentProfile && !isCollapsed && (
        <div className="mx-16 mt-16 mb-12 p-16 bg-neutral-50 radius-12 text-center position-relative">
          {/* 프로필 이미지 */}
          <div className="w-120-px h-120-px rounded-circle mx-auto mb-16 overflow-hidden border border-4 border-white shadow-sm">
            {studentProfile.profileImageUrl ? (
              <img
                src={studentProfile.profileImageUrl}
                alt="프로필"
                className="w-100 h-100"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="w-100 h-100 bg-primary-100 d-flex align-items-center justify-content-center">
                <i className="ri-user-3-line text-primary-600" style={{ fontSize: 48 }} />
              </div>
            )}
          </div>
          {/* 이름 */}
          <p className="fw-bold text-sm mb-2 text-dark">{studentProfile.userName}</p>
          {/* 학년/반/번호 */}
          <p className="text-xs text-secondary-light mb-8">
            {studentProfile.year}학년 {studentProfile.classNum}반 {studentProfile.studentNumber}번
          </p>
          {/* 재학 배지 */}
          <span className="badge bg-success-600 px-10 py-4 rounded-pill text-xs mb-12 d-inline-block">
            {studentProfile.status ? (STATUS_LABEL[studentProfile.status] ?? studentProfile.status) : "재학"}
          </span>
          {/* [woo] 출결 현황 */}
          <div className="border-top pt-20 mb-2">
            <div className="d-flex justify-content-around text-center">
              <div>
                <div className="w-36-px h-36-px rounded-circle bg-success-600 d-flex align-items-center justify-content-center mx-auto mb-4">
                  <span className="text-white fw-bold text-xs">{attendanceCounts.PRESENT ?? 0}</span>
                </div>
                <span className="text-xs text-secondary-light">출석</span>
              </div>
              <div>
                <div className="w-36-px h-36-px rounded-circle bg-warning-main d-flex align-items-center justify-content-center mx-auto mb-4">
                  <span className="text-white fw-bold text-xs">{attendanceCounts.LATE ?? 0}</span>
                </div>
                <span className="text-xs text-secondary-light">지각</span>
              </div>
              <div>
                <div className="w-36-px h-36-px rounded-circle bg-danger-main d-flex align-items-center justify-content-center mx-auto mb-4">
                  <span className="text-white fw-bold text-xs">{attendanceCounts.ABSENT ?? 0}</span>
                </div>
                <span className="text-xs text-secondary-light">결석</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sidebar-menu-area" style={{ flex: 1, height: 0, minHeight: 0 }}>
        <ul className="sidebar-menu" id="sidebar-menu">
          {/* [soojin] TEACHER 전용 사이드바 - 기존 산발적 섹션을 순서대로 통합 */}
          {has("TEACHER") && (
            <>
              {/* 수업 관리 */}
              <li className={dc(open.teacherSchedule)}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("teacherSchedule");
                  }}
                >
                  <i className="ri-calendar-schedule-line" />
                  <span>수업 관리</span>
                </a>
                <ul className="sidebar-submenu">
                  <li>
                    <SNavLink to="/teacher/schedule">
                      <i className="ri-circle-fill circle-icon w-auto" /> 수업 일정
                    </SNavLink>
                  </li>
                  <li>
                    <SNavLink to="/teacher/class-materials">
                      <i className="ri-circle-fill circle-icon w-auto" /> 수업 자료
                    </SNavLink>
                  </li>
                </ul>
              </li>

              {/* 학급 관리 - 담임만 */}
              {hasClassroom && (
                <li className={dc(open.myclass)}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggle("myclass");
                    }}
                  >
                    <i className="ri-team-line" />
                    <span>학급 관리</span>
                  </a>
                  <ul className="sidebar-submenu">
                    {/* [soojin] 학급 현황 + 학생 관리 페이지 통합 → 학급 현황 메뉴 제거 */}
                    <li>
                      <SNavLink to="/teacher/myclass/students">
                        <i className="ri-circle-fill circle-icon w-auto" /> 학생 관리
                      </SNavLink>
                    </li>
                    <li>
                      <SNavLink to="/teacher/myclass/notice">
                        <i className="ri-circle-fill circle-icon w-auto" /> 우리 반 알림장
                      </SNavLink>
                    </li>
                    <li>
                      <SNavLink to="/class/album">
                        <i className="ri-circle-fill circle-icon w-auto" /> 학급 앨범
                      </SNavLink>
                    </li>
                    <li>
                      <SNavLink to="/board/class-board">
                        <i className="ri-circle-fill circle-icon w-auto" /> 학급 게시판
                      </SNavLink>
                    </li>
                  </ul>
                </li>
              )}

              {/* 학부모 - 담임만 */}
              {hasClassroom && (
                <li className={dc(open.parentList)}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggle("parentList");
                    }}
                  >
                    <i className="ri-user-heart-line" />
                    <span>학부모</span>
                  </a>
                  <ul className="sidebar-submenu">
                    <li>
                      <SNavLink to="/teacher/parent/list">
                        <i className="ri-circle-fill circle-icon w-auto" /> 학부모 목록
                      </SNavLink>
                    </li>
                    <li>
                      <SNavLink to="/consultation">
                        <i className="ri-circle-fill circle-icon w-auto" /> 학부모 상담
                      </SNavLink>
                    </li>
                    <li>
                      <SNavLink to="/board/parent-notice">
                        <i className="ri-circle-fill circle-icon w-auto" /> 가정통신문
                      </SNavLink>
                    </li>
                    <li>
                      <SNavLink to="/board/parent">
                        <i className="ri-circle-fill circle-icon w-auto" /> 학부모 게시판
                      </SNavLink>
                    </li>
                  </ul>
                </li>
              )}

              {/* [soojin] 과제/퀴즈 - 중첩 드롭다운 제거, 과제 관리/퀴즈 관리 직접 링크로 단순화 */}
              <li className={dc(open.teacherHomework)}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("teacherHomework");
                  }}
                >
                  <i className="ri-draft-line" />
                  <span>과제/퀴즈</span>
                </a>
                <ul className="sidebar-submenu">
                  <li>
                    <SNavLink to="/homework">
                      <i className="ri-circle-fill circle-icon w-auto" /> 과제 관리
                    </SNavLink>
                  </li>
                  <li>
                    <SNavLink to="/quiz">
                      <i className="ri-circle-fill circle-icon w-auto" /> 퀴즈 관리
                    </SNavLink>
                  </li>
                </ul>
              </li>

              {/* 평가 */}
              <li className={dc(open.teacherExam)}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("teacherExam");
                  }}
                >
                  <i className="ri-survey-line" />
                  <span>평가</span>
                </a>
                <ul className="sidebar-submenu">
                  <li>
                    <SNavLink to="/teacher/grades">
                      <i className="ri-circle-fill circle-icon w-auto" /> 성적 입력
                    </SNavLink>
                  </li>
                  <li>
                    <SNavLink to="/teacher/ability-classes">
                      <i className="ri-circle-fill circle-icon w-auto" /> 학생 세부능력
                    </SNavLink>
                  </li>
                  <li>
                    <SNavLink to="/teacher/grades/summary">
                      <i className="ri-circle-fill circle-icon w-auto" /> 성적 현황
                    </SNavLink>
                  </li>
                </ul>
              </li>

              {/* 출결 */}
              <li className={dc(open.teacherAttendance)}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("teacherAttendance");
                  }}
                >
                  <i className="ri-calendar-check-line" />
                  <span>출결</span>
                </a>
                <ul className="sidebar-submenu">
                  {hasClassroom && (
                    <li>
                      <SNavLink to="/attendance/student">
                        <i className="ri-circle-fill circle-icon w-auto" /> 학생 출결
                      </SNavLink>
                    </li>
                  )}
                  <li>
                    <SNavLink to="/attendance/teacher">
                      <i className="ri-circle-fill circle-icon w-auto" /> 교사 출결
                    </SNavLink>
                  </li>
                </ul>
              </li>

              {/* 공지사항 */}
              <li className={dc(open.teacherNotice)}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("teacherNotice");
                  }}
                >
                  <i className="ri-megaphone-line" />
                  <span>공지사항</span>
                </a>
                <ul className="sidebar-submenu">
                  <li>
                    <SNavLink to="/board/school-notice">
                      <i className="ri-circle-fill circle-icon w-auto" /> 학교 공지
                    </SNavLink>
                  </li>
                  <li>
                    <SNavLink to="/school/schedule">
                      <i className="ri-circle-fill circle-icon w-auto" /> 학교 일정
                    </SNavLink>
                  </li>
                </ul>
              </li>

              {/* 교직원 */}
              <li className={dc(open.teacherStaff)}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle("teacherStaff");
                  }}
                >
                  <i className="ri-user-follow-line" />
                  <span>교직원</span>
                </a>
                <ul className="sidebar-submenu">
                  <li>
                    <SNavLink to="/teacher/list">
                      <i className="ri-circle-fill circle-icon w-auto" /> 교직원 목록
                    </SNavLink>
                  </li>
                  <li>
                    <SNavLink to="/board/teacher">
                      <i className="ri-circle-fill circle-icon w-auto" /> 교직원 게시판
                    </SNavLink>
                  </li>
                </ul>
              </li>

              {/* 도서관 */}
              <li>
                <SNavLink to="/library">
                  <i className="ri-book-open-line" />
                  <span>도서관</span>
                </SNavLink>
              </li>

              {/* 기숙사 관리 */}
              <li>
                <SNavLink to="/teacher/dormitory">
                  <i className="ri-building-line" />
                  <span>기숙사 관리</span>
                </SNavLink>
              </li>
            </>
          )}

          {/* 학생 - STUDENT (TEACHER는 나의 학급에 학생 리스트 포함) */}
          {has("STUDENT") && (
            <li className={dc(open.student)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("student");
                }}
              >
                <i className="ri-graduation-cap-line" />
                <span>학생</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to="/student/list">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학생 리스트
                  </SNavLink>
                </li>
                {/* [cheol] 학생 본인 정보 페이지 */}
                <li>
                  <SNavLink to="/student/myinfo">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학생세부사항
                  </SNavLink>
                </li>

                <li>
                  <Link to="/student/dormitory">
                    <i className="ri-circle-fill circle-icon w-auto" /> 기숙사
                  </Link>
                </li>
                <li>
                  <SNavLink to="/library">
                    <i className="ri-circle-fill circle-icon w-auto" /> 도서관
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}

          {/* 자녀 현황 - PARENT */}
          {/* [soojin] "나의 자녀" → "자녀 현황", 자녀 현황 서브 항목 제거 (헤더 대시보드 탭으로 이동 예정) */}
          {has("PARENT") && (
            <li className={dc(open.parent)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("parent");
                }}
              >
                <i className="ri-id-card-line" />
                <span>자녀 현황</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to="/attendance/parent">
                    <i className="ri-circle-fill circle-icon w-auto" /> 출결 현황
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to="/parent/grades">
                    <i className="ri-circle-fill circle-icon w-auto" /> 성적 조회
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to="/parent/homework">
                    <i className="ri-circle-fill circle-icon w-auto" /> 과제 현황
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}

          {/* 공지사항 - ADMIN, STUDENT (TEACHER는 별도 블록) */}
          {has("ADMIN", "STUDENT") && (
            <li className={dc(open.notice)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("notice");
                }}
              >
                <i className="ri-megaphone-line" />
                <span>공지사항</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to="/board/school-notice">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학교 공지
                  </SNavLink>
                </li>
                {/* [soojin] 담임/미담임 교사 모두 학사일정 표시 */}
                {has("TEACHER", "ADMIN", "STUDENT") && (
                  <li>
                    <SNavLink to="/school/schedule">
                      <i className="ri-circle-fill circle-icon w-auto" /> 학교 일정
                    </SNavLink>
                  </li>
                )}
              </ul>
            </li>
          )}

          {/* 게시판 - STUDENT, ADMIN (TEACHER는 별도 블록) */}
          {has("STUDENT", "ADMIN") && (
            <li className={dc(open.board)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("board");
                }}
              >
                <i className="ri-article-line" />
                <span>게시판</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to="/board/class-board">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학급 게시판
                  </SNavLink>
                </li>
                {has("ADMIN") && (
                  <li>
                    <SNavLink to="/board/teacher">
                      <i className="ri-circle-fill circle-icon w-auto" /> 교직원 게시판
                    </SNavLink>
                  </li>
                )}
              </ul>
            </li>
          )}

          {/* [joon] ADMIN 전용 관리 메뉴 */}
          {has("ADMIN") && (
            <li>
              <SNavLink to={ADMIN_ROUTES.DASHBOARD}>
                <i className="ri-layout-grid-line" />
                <span>관리자 대시보드</span>
              </SNavLink>
            </li>
          )}
          {has("ADMIN") && (
            <li className={dc(open.adminUsers)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("adminUsers");
                }}
              >
                <i className="ri-group-line" />
                <span>구성원 관리</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to={ADMIN_ROUTES.STUDENTS.LIST}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 학생 관리
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to={ADMIN_ROUTES.TEACHERS.LIST}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 교사 관리
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to={ADMIN_ROUTES.PARENTS.LIST}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 학부모 관리
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to={ADMIN_ROUTES.STAFFS.LIST}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 교직원 관리
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}
          {has("ADMIN") && (
            <li className={dc(open.adminClasses)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("adminClasses");
                }}
              >
                <i className="ri-building-2-line" />
                <span>학급 관리</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to={ADMIN_ROUTES.CLASSES.LIST}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 학급 목록
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to={ADMIN_ROUTES.CLASSES.CREATE}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 학급 생성
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}
          {has("ADMIN") && (
            <li>
              <SNavLink to={ADMIN_ROUTES.NOTICES.LIST}>
                <i className="ri-megaphone-line" />
                <span>공지사항 관리</span>
              </SNavLink>
            </li>
          )}
          {has("ADMIN") && (
            <li className={dc(open.adminFacilities)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("adminFacilities");
                }}
              >
                <i className="ri-store-2-line" />
                <span>시설/기자재</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to={ADMIN_ROUTES.FACILITIES}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 시설 관리
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to={ADMIN_ROUTES.ASSETS}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 기자재 관리
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}
          {has("ADMIN") && (
            <li className={dc(open.adminMaster)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("adminMaster");
                }}
              >
                <i className="ri-settings-3-line" />
                <span>기준 정보</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to={ADMIN_ROUTES.MASTER.SCHEDULE}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 학사 일정
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to={ADMIN_ROUTES.MASTER.SUBJECTS}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 교과목
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to={ADMIN_ROUTES.MASTER.SETTINGS}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 시스템 설정
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}

          {/* 과제/퀴즈 - STUDENT, ADMIN (TEACHER는 별도 블록) */}
          {has("STUDENT", "ADMIN") && (
            <li className={dc(open.homework)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("homework");
                }}
              >
                <i className="ri-draft-line" />
                <span>과제 / 퀴즈</span>
              </a>
              <ul className="sidebar-submenu">
                {has("ADMIN") && (
                  <li>
                    <SNavLink to="/homework/create">
                      <i className="ri-circle-fill circle-icon w-auto" /> 과제 출제
                    </SNavLink>
                  </li>
                )}
                <li>
                  <SNavLink to="/homework">
                    <i className="ri-circle-fill circle-icon w-auto" /> 과제 목록
                  </SNavLink>
                </li>
                {has("ADMIN") && (
                  <li>
                    <SNavLink to="/quiz/create">
                      <i className="ri-circle-fill circle-icon w-auto" /> 퀴즈 출제
                    </SNavLink>
                  </li>
                )}
                <li>
                  <SNavLink to="/quiz">
                    <i className="ri-circle-fill circle-icon w-auto" /> 퀴즈 목록
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}

          {/* 시험/성적 - STUDENT, ADMIN (TEACHER는 별도 블록) */}
          {has("STUDENT", "ADMIN") && (
            <li className={dc(open.exam)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("exam");
                }}
              >
                <i className="ri-survey-line" />
                <span>시험/성적</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to="/student/grades">
                    <i className="ri-circle-fill circle-icon w-auto" /> 성적 조회
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}

          {/* 출결 관리 - ADMIN (TEACHER는 별도 블록) */}
          {has("ADMIN") && (
            <li className={dc(open.attendance)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("attendance");
                }}
              >
                <i className="ri-calendar-check-line" />
                <span>출결 관리</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to="/attendance/student">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학생 출결
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to="/attendance/teacher">
                    <i className="ri-circle-fill circle-icon w-auto" /> 교사 출결
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}

          {/* 학교 소식 - PARENT */}
          {/* [soojin] "공지사항" → "학교 소식", 학교 갤러리 제거, 순서 변경 */}
          {has("PARENT") && (
            <li className={dc(open.parentNotice)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("parentNotice");
                }}
              >
                <i className="ri-megaphone-line" />
                <span>학교 소식</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to="/board/school-notice">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학교 공지
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to="/school/schedule">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학교 일정
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to="/board/parent-notice">
                    <i className="ri-circle-fill circle-icon w-auto" /> 가정통신문
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}

          {/* 학급 소식 - PARENT */}
          {/* [soojin] 신규 섹션: 학급 알림장 + 학급 앨범 */}
          {has("PARENT") && (
            <li className={dc(open.classNews)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("classNews");
                }}
              >
                <i className="ri-article-line" />
                <span>학급 소식</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to="/parent/class/notice">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학급 알림장
                  </SNavLink>
                </li>
                <li>
                  <SNavLink to="/class/album">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학급 앨범
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}

          {/* 상담 - PARENT */}
          {has("PARENT") && (
            <li className={dc(open.consultation)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("consultation");
                }}
              >
                <i className="ri-customer-service-2-line" />
                <span>상담</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <SNavLink to="/consultation/reservation">
                    <i className="ri-circle-fill circle-icon w-auto" /> 상담 신청
                  </SNavLink>
                </li>
              </ul>
            </li>
          )}
        </ul>
      </div>

      {/* 교사/학생 사이드바 하단 - 소속 학교 표시 */}
      {has("TEACHER", "STUDENT") && schoolName && !isCollapsed && (
        <div className="border-top border-neutral-200 px-16 py-12">
          <div
            className="text-secondary-light d-flex align-items-center gap-6"
            style={{
              fontSize: 12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={schoolName}
          >
            <i className="ri-building-line text-primary-600" style={{ fontSize: 14, flexShrink: 0 }} />
            {schoolName}
          </div>
        </div>
      )}
    </aside>
  );
}
