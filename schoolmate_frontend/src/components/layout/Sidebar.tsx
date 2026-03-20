import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { ADMIN_ROUTES } from "@/constants/routes";
import api from "@/api/auth";

// [woo] 사이드바 서브메뉴 열림 상태 관리
// CSS: .open → 서브메뉴 display:block, .dropdown-open → 화살표 회전 + 배경색
function useSubmenu() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  // [woo] 아코디언: 다른 메뉴 열 때 이전 메뉴 자동 닫힘
  const toggle = (key: string) => setOpen((prev) => ({ [key]: !prev[key] }));
  return { open, toggle };
}

// [woo] 열린 상태일 때 'open dropdown-open' 두 클래스 모두 붙여야 CSS가 작동함
function dc(isOpen: boolean) {
  return `dropdown${isOpen ? " open dropdown-open" : ""}`;
}

// [woo] 사이드바 내 프로필 드롭다운 - Bootstrap JS 없이 React state로 제어
function useProfileDropdown() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return { isOpen, toggle: () => setIsOpen((prev) => !prev), ref };
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
  const { user, signOut } = useAuth();
  const { open, toggle } = useSubmenu();
  const { isOpen, isCollapsed, closeSidebar, toggleCollapse } = useSidebar();
  const profile = useProfileDropdown();
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
  const ROLE_LABEL: Record<string, string> = {
    STUDENT: "학생",
    TEACHER: "선생님",
    PARENT: "학부모",
    ADMIN: "관리자",
  };

  // [woo] 학생일 때 대시보드 API에서 프로필 정보 + 출결 통계 가져오기
  const [studentInfo, setStudentInfo] = useState<StudentProfile | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({});
  // [woo] 교사일 때 소속 학교 이름
  const [schoolName, setSchoolName] = useState<string | null>(null);

  useEffect(() => {
    if (role === "STUDENT" && user?.authenticated) {
      api
        .get("/dashboard/student")
        .then((res) => {
          setStudentInfo(res.data?.student ?? null);
          setProfileImageUrl(res.data?.profileImageUrl ?? null);
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
        })
        .catch(() => {});
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
        <div className="sidebar-logo d-flex align-items-center justify-content-between">
          {!isCollapsed && (
            <a href="/main">
              <img src="/images/schoolmateLogo.png" alt="홈" className="light-logo" width="173" height="40" />
              <img src="/images/schoolmateLogo.png" alt="홈" className="dark-logo" width="173" height="40" />
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

      {/* 사용자 프로필 드롭다운
          [soojin] 학생 대시보드에서는 아래 프로필 패널로 대체하므로 숨김 */}
      {!isStudentDashboard && user?.authenticated && (
        <div className="mx-16 py-12">
          {/* [woo] 프로필 드롭다운 - React state로 제어 (Bootstrap JS 불필요) */}
          <div className="dropdown profile-dropdown" ref={profile.ref}>
            <button
              type="button"
              className="profile-dropdown__button d-flex align-items-center justify-content-between p-10 w-100 overflow-hidden bg-neutral-50 radius-12"
              onClick={profile.toggle}
            >
              <span className="d-flex align-items-start gap-10">
                <img
                  src="/images/thumbs/leave-request-img2.png"
                  alt="Thumbnail"
                  className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                />
                <span className="profile-dropdown__contents">
                  <span className="h6 mb-0 text-md d-block text-primary-light">{user.name ?? user.email}</span>
                  <span className="text-secondary-light text-sm mb-0 d-block">{ROLE_LABEL[role] ?? role}</span>
                </span>
              </span>
              <span className="profile-dropdown__icon pe-8 text-xl d-flex line-height-1">
                <i className={`ri-arrow-${profile.isOpen ? "down" : "right"}-s-line`} />
              </span>
            </button>
            <ul className={`dropdown-menu dropdown-menu-lg-end border p-12${profile.isOpen ? " show" : ""}`}>
              <li>
                <Link
                  to="/user/profile"
                  className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                >
                  <i className="ri-user-3-line" /> 나의 프로필
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6 w-100 border-0 bg-transparent"
                  onClick={signOut}
                >
                  <i className="ri-shut-down-line" /> 로그아웃
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* [soojin] 학생 대시보드 전용 프로필 패널
          /student/dashboard 경로일 때만 렌더링 (다른 역할 대시보드에서는 표시 안 함) */}
      {isStudentDashboard && studentProfile && !isCollapsed && (
        <div className="mx-16 mt-16 mb-12 p-16 bg-neutral-50 radius-12 text-center position-relative">
          {/* [soojin] 프로필 페이지 링크 - 패널 우측 상단
              d-flex 없이 인라인 단일 링크로 처리 (분리된 요소처럼 보이는 현상 방지) */}
          <Link
            to="/user/profile"
            className="position-absolute text-xs text-primary-600"
            style={{ top: 10, right: 12 }}
          >
            <i className="ri-user-3-line me-4" />
            프로필
          </Link>
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
          {/* [woo] 홈 - 역할별 대시보드로 이동 (a href로 강제 이동) */}
          {user?.authenticated &&
            (() => {
              const dashboardPath =
                role === "STUDENT"
                  ? "/student/dashboard"
                  : role === "TEACHER"
                    ? "/teacher/dashboard"
                    : role === "PARENT"
                      ? "/parent/dashboard"
                      : "/main";
              return (
                <li>
                  <a href={dashboardPath}>
                    <i className="ri-home-4-line" />
                    <span>홈</span>
                  </a>
                </li>
              );
            })()}

          {/* 나의 학급 - TEACHER */}
          {has("TEACHER") && (
            <li className={dc(open.myclass)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("myclass");
                }}
              >
                <i className="ri-team-line" />
                <span>나의 학급</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <Link to="/teacher/myclass">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학급 현황
                  </Link>
                </li>
                <li>
                  <Link to="/teacher/myclass/students">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학생 관리
                  </Link>
                </li>
                {/* [cheol] 기숙사 */}
                <li>
                  <Link to="/student/dormitory">
                    <i className="ri-circle-fill circle-icon w-auto" /> 기숙사
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {/* 수업 일정 - TEACHER */}
          {has("TEACHER") && (
            <li>
              <Link to="/teacher/schedule">
                <i className="ri-calendar-schedule-line" />
                <span>나의 수업 일정</span>
              </Link>
            </li>
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
                  <Link to="/student/list">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학생 리스트
                  </Link>
                </li>
                {/* [cheol] 학생 본인 정보 페이지 */}
                <li>
                  <Link to="/student/myinfo">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학생세부사항
                  </Link>
                </li>
                {/* [cheol] 기숙사 */}
                <li>
                  <Link to="/student/dormitory">
                    <i className="ri-circle-fill circle-icon w-auto" /> 기숙사
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {/* 자녀 관리 - PARENT */}
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
                <span>나의 자녀</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <Link to="/parent/children/status">
                    <i className="ri-circle-fill circle-icon w-auto" /> 출결 현황
                  </Link>
                </li>
                <li>
                  <Link to="/parent/dashboard">
                    <i className="ri-circle-fill circle-icon w-auto" /> 성적 조회
                  </Link>
                </li>
                {/* [woo] 학부모 자녀 과제 조회 */}
                <li>
                  <Link to="/parent/homework">
                    <i className="ri-circle-fill circle-icon w-auto" /> 과제 현황
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {/* 선생님 - TEACHER */}
          {has("TEACHER") && (
            <li className={dc(open.teacher)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("teacher");
                }}
              >
                <i className="ri-user-follow-line" />
                <span>교직원</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <Link to="/teacher/list">
                    <i className="ri-circle-fill circle-icon w-auto" /> 교직원 목록
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {/* 학부모 목록 - TEACHER, ADMIN */}
          {has("TEACHER", "ADMIN") && (
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
                  <Link to="/board/parent-notice">
                    <i className="ri-circle-fill circle-icon w-auto" /> 가정통신문
                  </Link>
                </li>
                <li>
                  <Link to="/board/parent">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학부모 게시판
                  </Link>
                </li>
                <li>
                  <Link to="/teacher/parent/list">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학부모 목록
                  </Link>
                </li>
                {has("TEACHER") && (
                  <li>
                    <Link to="/consultation">
                      <i className="ri-circle-fill circle-icon w-auto" /> 학부모 상담
                    </Link>
                  </li>
                )}
              </ul>
            </li>
          )}

          {/* 공지사항 - TEACHER, ADMIN, STUDENT */}
          {has("TEACHER", "ADMIN", "STUDENT") && (
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
                  <Link to="/board/school-notice">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학교 공지
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {/* 게시판 - STUDENT, TEACHER, ADMIN */}
          {has("STUDENT", "TEACHER", "ADMIN") && (
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
                {/* [cheol] 학생 본인 학년으로 이동, TEACHER/ADMIN은 1학년 기본 */}
                <li>
                  <Link to={role === "STUDENT" ? `/board/grade/1` : "/board/grade/1"}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 학년 게시판
                  </Link>
                </li>
                {has("TEACHER", "ADMIN") && (
                  <li>
                    <Link to="/board/teacher">
                      <i className="ri-circle-fill circle-icon w-auto" /> 교직원 게시판
                    </Link>
                  </li>
                )}
              </ul>
            </li>
          )}

          {/* [joon] ADMIN 전용 관리 메뉴 */}
          {has("ADMIN") && (
            <li>
              <Link to={ADMIN_ROUTES.DASHBOARD}>
                <i className="ri-layout-grid-line" />
                <span>관리자 대시보드</span>
              </Link>
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
                  <Link to={ADMIN_ROUTES.STUDENTS.LIST}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 학생 관리
                  </Link>
                </li>
                <li>
                  <Link to={ADMIN_ROUTES.TEACHERS.LIST}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 교사 관리
                  </Link>
                </li>
                <li>
                  <Link to={ADMIN_ROUTES.PARENTS.LIST}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 학부모 관리
                  </Link>
                </li>
                <li>
                  <Link to={ADMIN_ROUTES.STAFFS.LIST}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 교직원 관리
                  </Link>
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
                  <Link to={ADMIN_ROUTES.CLASSES.LIST}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 학급 목록
                  </Link>
                </li>
                <li>
                  <Link to={ADMIN_ROUTES.CLASSES.CREATE}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 학급 생성
                  </Link>
                </li>
              </ul>
            </li>
          )}
          {has("ADMIN") && (
            <li>
              <Link to={ADMIN_ROUTES.NOTICES.LIST}>
                <i className="ri-megaphone-line" />
                <span>공지사항 관리</span>
              </Link>
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
                  <Link to={ADMIN_ROUTES.FACILITIES}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 시설 관리
                  </Link>
                </li>
                <li>
                  <Link to={ADMIN_ROUTES.ASSETS}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 기자재 관리
                  </Link>
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
                  <Link to={ADMIN_ROUTES.MASTER.SCHEDULE}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 학사 일정
                  </Link>
                </li>
                <li>
                  <Link to={ADMIN_ROUTES.MASTER.SUBJECTS}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 교과목
                  </Link>
                </li>
                <li>
                  <Link to={ADMIN_ROUTES.MASTER.SETTINGS}>
                    <i className="ri-circle-fill circle-icon w-auto" /> 시스템 설정
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {/* [woo] 과제/퀴즈 - STUDENT, TEACHER, ADMIN */}
          {has("STUDENT", "TEACHER", "ADMIN") && (
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
                {/* [woo] 과제 출제 - 교사/관리자만 표시 */}
                {has("TEACHER", "ADMIN") && (
                  <li>
                    <Link to="/homework/create">
                      <i className="ri-circle-fill circle-icon w-auto" /> 과제 출제
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/homework">
                    <i className="ri-circle-fill circle-icon w-auto" /> 과제 목록
                  </Link>
                </li>
                {has("TEACHER", "ADMIN") && (
                  <li>
                    <Link to="/quiz/create">
                      <i className="ri-circle-fill circle-icon w-auto" /> 퀴즈 출제
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/homework?tab=quiz">
                    <i className="ri-circle-fill circle-icon w-auto" /> 퀴즈 목록
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {/* [cheol] 시험/성적 - STUDENT, TEACHER, ADMIN */}
          {has("STUDENT", "TEACHER", "ADMIN") && (
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
                {/* [cheol] 성적/시험 관련 React 페이지 */}
                {has("TEACHER") && (
                  <li>
                    {/* [cheol] 교사: 학급 선택 페이지 → 학생리스트 순서로 이동 */}
                    <Link to="/teacher/grade-classes">
                      <i className="ri-circle-fill circle-icon w-auto" /> 성적 채점
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/exam/schedule">
                    <i className="ri-circle-fill circle-icon w-auto" /> 시험 일정
                  </Link>
                </li>
                {has("TEACHER") ? (
                  <li>
                    {/* [cheol] 교사: 자기 반 학생 성적 확인 모드 */}
                    <Link to="/student/list?mode=view">
                      <i className="ri-circle-fill circle-icon w-auto" /> 성적 결과
                    </Link>
                  </li>
                ) : (
                  <li>
                    <Link to="/exam/result">
                      <i className="ri-circle-fill circle-icon w-auto" /> 성적 결과
                    </Link>
                  </li>
                )}
              </ul>
            </li>
          )}

          {/* 출결 관리 - TEACHER, ADMIN */}
          {has("TEACHER", "ADMIN") && (
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
                  <Link to="/attendance/student">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학생 출결
                  </Link>
                </li>
                <li>
                  <Link to="/attendance/teacher">
                    <i className="ri-circle-fill circle-icon w-auto" /> 교사 출결
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {/* [soojin] 학부모 공지사항 - PARENT, ADMIN */}
          {has("PARENT", "ADMIN") && (
            <li className={dc(open.parentNotice)}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggle("parentNotice");
                }}
              >
                <i className="ri-megaphone-line" />
                <span>공지사항</span>
              </a>
              <ul className="sidebar-submenu">
                <li>
                  <Link to="/board/parent-notice">
                    <i className="ri-circle-fill circle-icon w-auto" /> 가정통신문
                  </Link>
                </li>
                <li>
                  <Link to="/board/school-notice">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학교 공지
                  </Link>
                </li>
                <li>
                  <Link to="/board/grade/1">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학급 공지
                  </Link>
                </li>
                <li>
                  <Link to="/school/gallery">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학교 갤러리
                  </Link>
                </li>
                <li>
                  <Link to="/school/schedule">
                    <i className="ri-circle-fill circle-icon w-auto" /> 학교 일정
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {/* [soojin] 상담 - PARENT */}
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
                  <Link to="/consultation/reservation">
                    <i className="ri-circle-fill circle-icon w-auto" /> 상담 신청
                  </Link>
                </li>
              </ul>
            </li>
          )}
        </ul>
      </div>

      {/* [woo] 교사 사이드바 하단 - 소속 학교 표시 */}
      {has("TEACHER") && schoolName && !isCollapsed && (
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

      {/* 로그아웃 - 학생 대시보드에서만 사이드바 맨 하단에 표시 */}
      {isStudentDashboard && !isCollapsed && (
        <div className="px-16 pb-16">
          <button
            type="button"
            className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-6"
            onClick={signOut}
          >
            <i className="ri-shut-down-line" />
            <span>로그아웃</span>
          </button>
        </div>
      )}
    </aside>
  );
}
