import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

// [soojin] 로그인 페이지 왼쪽 패널 슬라이드

function MockCard({
  icon,
  title,
  badge,
  badgeClassName,
  children,
}: {
  icon: string;
  title: string;
  badge?: React.ReactNode;
  badgeClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="lp-mock-card">
      <div className="lp-mock-card-header">
        <span className="lp-mock-card-title">
          <i className={`${icon} lp-icon`} />
          {title}
        </span>
        {badge && <span className={`lp-mock-card-badge${badgeClassName ? ` ${badgeClassName}` : ""}`}>{badge}</span>}
      </div>
      <div className="lp-mock-card-body">{children}</div>
    </div>
  );
}

// ─── 슬라이드 1: 관리자 ──────────────────────────────────────
function AdminSlide() {
  const gradeData = [
    { grade: "1학년", count: 188 },
    { grade: "2학년", count: 172 },
    { grade: "3학년", count: 165 },
  ];
  const maxGradeCount = Math.max(...gradeData.map((row) => row.count));

  return (
    <div className="lp-slide lp-slide-admin">
      <div className="lp-slide-header">
        <span className="lp-role-badge lp-role-admin">관리자</span>
        <h3 className="lp-slide-title lp-slide-title-compact">관리자 대시보드</h3>
        <p className="lp-slide-desc">학교 관리 시스템 현황을 한눈에 확인합니다.</p>
      </div>

      <div className="lp-admin-board">
        <div className="lp-admin-tabs">
          <button type="button" className="lp-admin-tab lp-admin-tab-active lp-admin-tab-student">
            <i className="ri-graduation-cap-line" />
            학생 현황
          </button>
          <button type="button" className="lp-admin-tab">
            <i className="ri-user-star-line" />
            교사 현황
          </button>
          <button type="button" className="lp-admin-tab">
            <i className="ri-user-settings-line" />
            교직원 현황
          </button>
        </div>

        <div className="lp-admin-metrics">
          <div className="lp-admin-metric lp-admin-metric-total">
            <div className="lp-admin-metric-label">전체 학생</div>
            <div className="lp-admin-metric-value">
              <span className="lp-admin-metric-num">525</span>
              <span className="lp-admin-metric-unit">명</span>
            </div>
            <i className="ri-graduation-cap-line lp-admin-metric-watermark" />
          </div>

          <div className="lp-admin-metric">
            <div className="lp-admin-metric-label">활동 중</div>
            <i className="ri-checkbox-circle-fill lp-admin-metric-state lp-admin-metric-state-ok" />
            <div className="lp-admin-metric-value">
              <span className="lp-admin-metric-num">503</span>
              <span className="lp-admin-metric-unit">명</span>
            </div>
            <div className="lp-admin-progress">
              <div className="lp-admin-progress-fill" style={{ width: "96%" }} />
            </div>
            <div className="lp-admin-metric-rate">활동률 95.8%</div>
          </div>

          <div className="lp-admin-metric lp-admin-metric-inactive">
            <div className="lp-admin-metric-label">비활성</div>
            <i className="ri-error-warning-fill lp-admin-metric-state lp-admin-metric-state-off" />
            <div className="lp-admin-metric-value">
              <span className="lp-admin-metric-num">22</span>
              <span className="lp-admin-metric-unit">명</span>
            </div>
            <div className="lp-admin-metric-rate">4.2%</div>
          </div>
        </div>

        <div className="lp-admin-chart">
          <div className="lp-admin-chart-title">학년별 분포</div>
          <div className="lp-admin-bars">
            {gradeData.map((row) => (
              <div key={row.grade} className="lp-admin-bar-col">
                <div
                  className="lp-admin-bar"
                  style={{ height: `${Math.max(20, (row.count / maxGradeCount) * 68)}px` }}
                />
                <div className="lp-admin-bar-count">{row.count}명</div>
                <div className="lp-admin-bar-label">{row.grade}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 슬라이드 2: 교사 ───────────────────────────────────────
function TeacherSlide() {
  return (
    <div className="lp-slide">
      <div className="lp-slide-header">
        <span className="lp-role-badge lp-role-teacher">교사</span>
        <h3 className="lp-slide-title lp-slide-title-compact">선생님 대시보드</h3>
        <p className="lp-slide-desc">알림 · 수업 · 할 일 · 일정을 한 화면에서 확인합니다.</p>
      </div>

      <div className="lp-two-col">
        <MockCard icon="ri-notification-3-line" title="알림 메시지" badge="1" badgeClassName="lp-teacher-alert-badge-wrap">
          <div className="lp-teacher-alert-list">
            {[
              {
                title: "새 학교 공지가 등록되었습니다",
                isNew: true,
                time: "25초 전",
                desc: "최고관리자 | 공지: 공지",
                tone: "highlight",
              },
              {
                title: "새 학교 공지가 등록되었습니다",
                time: "4일 전",
                desc: "최고관리자 | 공지: 공지 작성",
              },
            ].map((n) => (
              <div key={`${n.title}-${n.time}`} className={`lp-teacher-alert-item${n.tone ? ` lp-teacher-alert-item-${n.tone}` : ""}`}>
                <div className="lp-teacher-alert-head">
                  <div className="lp-teacher-alert-title-wrap">
                    <span className="lp-teacher-alert-title">{n.title}</span>
                    {n.isNew && <span className="lp-teacher-alert-new">NEW</span>}
                  </div>
                  <div className="lp-teacher-alert-meta">
                    <span className="lp-teacher-alert-time">{n.time}</span>
                    <i className="ri-close-line" />
                  </div>
                </div>
                <div className="lp-teacher-alert-desc">{n.desc}</div>
              </div>
            ))}
          </div>
        </MockCard>

        <MockCard icon="bi bi-grid" title="바로가기">
          <div className="lp-teacher-shortcut-grid">
            {[
              { icon: "ri-team-line", label: "학급 관리", tone: "class" },
              { icon: "ri-book-open-line", label: "수업 관리", tone: "lesson" },
              { icon: "ri-file-list-3-line", label: "과제 관리", tone: "homework" },
              { icon: "ri-medal-line", label: "성적 관리", tone: "grade" },
            ].map((item) => (
              <button key={item.label} type="button" className={`lp-teacher-shortcut lp-teacher-shortcut-${item.tone}`}>
                <span className="lp-teacher-shortcut-icon-wrap">
                  <i className={`${item.icon} lp-teacher-shortcut-icon`} />
                </span>
                <span className="lp-teacher-shortcut-label">{item.label}</span>
              </button>
            ))}
          </div>
        </MockCard>
      </div>

      <MockCard icon="bi bi-check2-square" title="오늘 할 일">
        {[
          { text: "출결 마감", badge: "일반", c: "#475569", bg: "#e2e8f0" },
          { text: "수업 자료 업로드", badge: "중요", c: "#0f766e", bg: "#ccfbf7" },
          { text: "학부모 상담 준비", badge: "긴급", c: "#c2410c", bg: "#ffedd5" },
        ].map((todo, i) => (
          <div key={todo.text} className="lp-list-row lp-todo-row" style={{ borderBottom: i < 2 ? "1px solid #f3f4f6" : "none" }}>
            <span className="lp-todo-radio" />
            <span className="lp-list-name">{todo.text}</span>
            <span className="lp-chip" style={{ color: todo.c, background: todo.bg }}>{todo.badge}</span>
            <button type="button" className="lp-todo-remove" aria-label={`${todo.text} 삭제`}>
              <i className="ri-close-line" />
            </button>
          </div>
        ))}
      </MockCard>
    </div>
  );
}

// ─── 슬라이드 3: 학부모 ──────────────────────────────────────
function ParentSlide() {
  return (
    <div className="lp-slide lp-slide-parent">
      <div className="lp-slide-header">
        <span className="lp-role-badge lp-role-parent">학부모</span>
        <h3 className="lp-slide-title lp-slide-title-compact">자녀 현황</h3>
        <p className="lp-slide-desc">프로필 · 출결 · 시간표 · 학교 일정을 확인하세요.</p>
      </div>

      <div className="lp-two-col">
        <MockCard icon="ri-parent-line" title="자녀 프로필">
          <div className="lp-parent-profile">
            <div className="lp-parent-profile-top">
              <div className="lp-parent-photo">
                <i className="ri-user-3-fill lp-parent-photo-icon" />
              </div>
              <div className="lp-parent-student-name">학생</div>
              <div className="lp-parent-student-class">1학년 1반 2번</div>
              <div className="lp-parent-attend-pill">출결 2일 기록</div>
            </div>

            <div className="lp-parent-divider" />

            <div className="lp-parent-attend-title">
              {/* [soojin] 출결 현황 아이콘 색상 다른 아이콘과 통일 */}
              <i className="ri-checkbox-circle-line text-primary-600" />
              출결 현황
            </div>

            <div className="lp-parent-attend-grid">
              <div className="lp-parent-attend-item">
                <div className="lp-parent-attend-circle lp-parent-attend-circle-present">30</div>
                <div className="lp-parent-attend-label">출석</div>
              </div>
              <div className="lp-parent-attend-item">
                <div className="lp-parent-attend-circle lp-parent-attend-circle-late">5</div>
                <div className="lp-parent-attend-label">지각</div>
              </div>
              <div className="lp-parent-attend-item">
                <div className="lp-parent-attend-circle lp-parent-attend-circle-absent">1</div>
                <div className="lp-parent-attend-label">결석</div>
              </div>
            </div>
          </div>
        </MockCard>

        <MockCard
          icon="ri-calendar-event-line"
          title="학교 일정"
          badgeClassName="lp-school-cal-badge"
          badge={
            <span className="lp-school-cal-btn">
              <i className="ri-calendar-line" />
              캘린더
            </span>
          }
        >
          <div className="lp-school-schedule-list">
            {[
              { text: "4/6(월) 학부모 공개수업", dday: "D-DAY", danger: true, type: "openclass" },
              { text: "4/8(수) 과학 체험학습", dday: "D-2", type: "fieldtrip" },
              { text: "4/10(금) 1학기 중간고사", dday: "D-4", type: "exam" },
              { text: "4/14(화) 학부모 상담 주간", dday: "D-8", type: "counsel" },
            ].map((row) => (
              <div key={row.text} className={`lp-school-schedule-row lp-school-schedule-row-${row.type}`}>
                <div className="lp-school-schedule-left">
                  <i className="ri-calendar-line" />
                  <span>{row.text}</span>
                </div>
                <span className={`lp-school-dday${row.danger ? " lp-school-dday-danger" : ""}`}>{row.dday}</span>
              </div>
            ))}
          </div>
        </MockCard>
      </div>

      <MockCard icon="ri-file-list-3-line" title="가정통신문">
        {[
          { text: "봄 소풍 준비 안내", isNew: true },
          { text: "학부모 공개수업 안내" },
          { text: "중간고사 가정통신문" },
        ].map((row, i) => (
          <div key={row.text} className="lp-list-row" style={{ borderBottom: i < 2 ? "1px solid #f3f4f6" : "none" }}>
            <span className="lp-event-text">{row.text}</span>
            {row.isNew && <span className="lp-inline-new">NEW</span>}
          </div>
        ))}
      </MockCard>
    </div>
  );
}

// ─── 슬라이드 4: 학생 ───────────────────────────────────────
function StudentSlide() {
  return (
    <div className="lp-slide lp-slide-student">
      <div className="lp-slide-header">
        <span className="lp-role-badge lp-role-student">학생</span>
        <h3 className="lp-slide-title lp-slide-title-compact">학생 대시보드</h3>
        <p className="lp-slide-desc">학급 목표 · 일정 · 과제 · 시간표 · 급식</p>
      </div>

      <div className="lp-two-col">
        <MockCard
          icon="ri-focus-3-line"
          title="이달의 학급 목표"
          badgeClassName="lp-student-goal-badge-wrap"
          badge={<span className="lp-student-goal-badge">2026년 4월</span>}
        >
          <div className="lp-student-goal-wrap">
            <div className="lp-student-goal-month">4월</div>

            <div className="lp-student-goal-box">
              <div className="lp-student-goal-box-title">월간 목표</div>
              <div className="lp-student-goal-box-text">지각 0회 · 독서 2권 완독</div>
            </div>

            <div className="lp-student-goal-section">실천 사항</div>

            <div className="lp-student-goal-list">
              {[
                "매일 20분 영어 단어 복습",
                "수학 오답노트 주 3회 정리",
              ].map((row, i) => (
                <div key={row} className="lp-student-goal-item">
                  <span className="lp-student-goal-num">{i + 1}</span>
                  <span className="lp-student-goal-text">{row}</span>
                </div>
              ))}
            </div>
          </div>
        </MockCard>

        <MockCard
          icon="ri-book-open-line"
          title="오늘의 시간표"
          badgeClassName="lp-student-time-badge-wrap"
          badge={<span className="lp-student-time-badge">목요일</span>}
        >
          <div className="lp-student-time-list">
            {[
              { period: "2교시", subject: "수학", teacher: "김교사 · 3-2반", current: true },
              { period: "3교시", subject: "영어", teacher: "박교사 · 3-2반" },
              { period: "4교시", subject: "과학", teacher: "이교사 · 과학실" },
            ].map((row) => (
              <div
                key={`${row.period}-${row.subject}`}
                className={`lp-student-time-row${row.current ? " lp-student-time-row-current" : ""}`}
              >
                <span className="lp-student-time-period">{row.period}</span>
                <div className="lp-student-time-main">
                  <div className="lp-student-time-subject">{row.subject}</div>
                  <div className="lp-student-time-meta">{row.teacher}</div>
                </div>
              </div>
            ))}
          </div>
        </MockCard>
      </div>

      <MockCard icon="ri-file-list-3-line" title="퀴즈 현황">
        <div className="lp-student-quiz-list">
          {[
            {
              title: "수학 1단원 형성평가",
              subject: "수학",
              teacher: "김교사[수학] 선생님",
              period: "4/8-4/12",
              dday: "D-7",
              status: "응시완료",
              statusTone: "done",
            },
            {
              title: "영어 어휘 확인 퀴즈",
              subject: "영어",
              teacher: "박교사[영어] 선생님",
              period: "4/5-4/9",
              dday: "D-Day",
              status: "미응시",
              statusTone: "pending",
            },
          ].map((quiz, i) => (
            <div key={`${quiz.title}-${quiz.period}`} className="lp-student-quiz-item" style={{ borderBottom: i < 1 ? "1px solid #e5e7eb" : "none" }}>
              <div className="lp-student-quiz-left">
                <div className="lp-student-quiz-title">{quiz.title}</div>
                <div className="lp-student-quiz-meta">
                  <span>{quiz.subject}</span>
                  <span className="lp-student-quiz-sep">|</span>
                  <span>{quiz.teacher}</span>
                  <span className="lp-student-quiz-sep">|</span>
                  <span>{quiz.period}</span>
                </div>
              </div>
              <div className="lp-student-quiz-right">
                <span className="lp-student-quiz-dday">{quiz.dday}</span>
                <span className={`lp-student-quiz-status${quiz.statusTone === "pending" ? " lp-student-quiz-status-pending" : ""}`}>{quiz.status}</span>
              </div>
            </div>
          ))}
        </div>
      </MockCard>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────
const SLIDES = [
  { key: "admin",   component: <AdminSlide /> },
  { key: "teacher", component: <TeacherSlide /> },
  { key: "parent",  component: <ParentSlide /> },
  { key: "student", component: <StudentSlide /> },
];

export default function LoginLeftPanel() {
  const [current, setCurrent] = useState(0);

  // [soojin] 3.5초마다 자동 전환
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="login-left">
      <div className="lp-inner">
        <div className="lp-perspective-wrap">
          <div className="lp-float-wrap">
            <div className="lp-3d-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {SLIDES[current].component}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Dot indicator */}
        <div className="lp-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`lp-dot${i === current ? " lp-dot-active" : ""}`}
              onClick={() => setCurrent(i)}
              aria-label={`슬라이드 ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
