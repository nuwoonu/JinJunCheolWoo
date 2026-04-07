import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import DashboardScheduleWidget from "@/features/dashboard/components/teacher/DashboardScheduleWidget";
import MiniCalendar from "@/shared/components/MiniCalendar";

interface Notice {
  title: string;
  writerName?: string;
  content?: string;
  createDate?: string;
}

// [woo] 알림 메시지 타입
interface NotificationItem {
  id: number;
  title: string;
  content: string;
  senderName: string;
  sentDate: string;
  isRead: boolean;
  actionUrl?: string;
}

interface StudentInfo {
  name: string;
  studentNumber?: number;
}

interface ClassInfo {
  grade: number;
  classNum: number;
  totalStudents: number;
  students: StudentInfo[];
}

interface TeacherDashboardData {
  teacherName?: string;
  teacherSubject?: string;
  classInfo?: ClassInfo;
  notices?: Notice[];
}

interface TodoItem {
  id: number;
  text: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  done: boolean;
  // [woo] 완료 전 원래 우선도 저장용
  _prevBadge?: string;
  _prevBadgeColor?: string;
  _prevBadgeBg?: string;
}

const INITIAL_TODOS: TodoItem[] = [
  { id: 1, text: "중간고사 시험지 제출", badge: "긴급", badgeColor: "#c2410c", badgeBg: "#ffedd5", done: false },
  { id: 2, text: "학부모 상담 준비", badge: "긴급", badgeColor: "#c2410c", badgeBg: "#ffedd5", done: false },
  { id: 3, text: "2학년 3반 과제 채점", badge: "중요", badgeColor: "#0f766e", badgeBg: "#ccfbf7", done: false },
  { id: 4, text: "교직원 회의 참석", badge: "일반", badgeColor: "#6b7280", badgeBg: "#f3f4f6", done: false },
  { id: 5, text: "학급 운영비 정산", badge: "여유", badgeColor: "#1d4ed8", badgeBg: "#dbeafe", done: false },
  { id: 6, text: "다음 주 수업 계획서 작성", badge: "완료", badgeColor: "#6b7280", badgeBg: "#f3f4f6", done: true },
];

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [, setData] = useState<TeacherDashboardData>({});
  // [woo] 실제 알림 API 연동
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  // [woo] localStorage에서 할 일 불러오기 (없으면 초기 데이터 사용)
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem("teacher_todos");
    return saved ? JSON.parse(saved) : INITIAL_TODOS;
  });
  const [newTodo, setNewTodo] = useState("");
  const [showTodoModal, setShowTodoModal] = useState(false);
  // [woo] 할 일 추가 시 우선도 선택
  const [newTodoPriority, setNewTodoPriority] = useState<string>("일반");
  // [woo] 할 일 우선도 필터 (null = 전체)
  const [todoPriorityFilter, setTodoPriorityFilter] = useState<string | null>(null);
  // [woo] 뱃지 클릭 시 우선도 선택 팝업 (해당 todo id)
  const [priorityPopupId, setPriorityPopupId] = useState<number | null>(null);
  // [woo] 할 일 텍스트 인라인 수정
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTodoText, setEditingTodoText] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/teacher")
      .then((res) => setData(res.data))
      .catch(() => {});
    // [woo] 알림 메시지 조회
    api
      .get("/notifications")
      .then((res) => setNotifications(Array.isArray(res.data) ? res.data.slice(0, 10) : []))
      .catch(() => {});
  }, []);

  // [woo] 할 일 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("teacher_todos", JSON.stringify(todos));
  }, [todos]);

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showTodoModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showTodoModal]);

  // [woo] 알림 읽음 처리
  const markRead = (id: number) => {
    api.post(`/notifications/${id}/read`).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  // [woo] 알림 삭제
  const dismissNotification = (id: number) => {
    api.delete(`/notifications/${id}`).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // [woo] 완료 토글 시 badge도 "완료"로 변경 / 해제 시 원래 badge 복원
  const toggleTodo = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (!t.done) {
          return {
            ...t,
            done: true,
            _prevBadge: t.badge,
            _prevBadgeColor: t.badgeColor,
            _prevBadgeBg: t.badgeBg,
            badge: "완료",
            badgeColor: "#6b7280",
            badgeBg: "#f3f4f6",
          };
        }
        return {
          ...t,
          done: false,
          badge: t._prevBadge || "할 일",
          badgeColor: t._prevBadgeColor || "#1d4ed8",
          badgeBg: t._prevBadgeBg || "#dbeafe",
        };
      }),
    );
  };

  // [woo] 뱃지 클릭 시 우선도 선택 변경
  const PRIORITY_LIST = [
    { badge: "긴급", badgeColor: "#c2410c", badgeBg: "#ffedd5" },
    { badge: "중요", badgeColor: "#0f766e", badgeBg: "#ccfbf7" },
    { badge: "일반", badgeColor: "#6b7280", badgeBg: "#f3f4f6" },
    { badge: "여유", badgeColor: "#1d4ed8", badgeBg: "#dbeafe" },
  ];
  const changePriority = (id: number, badge: string) => {
    const p = PRIORITY_LIST.find((x) => x.badge === badge);
    if (!p) return;
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, badge: p.badge, badgeColor: p.badgeColor, badgeBg: p.badgeBg } : t)),
    );
    setPriorityPopupId(null);
  };

  const removeTodo = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const addTodo = () => {
    const text = newTodo.trim();
    if (!text) return;
    // [woo] 선택한 우선도에 맞는 색상 매핑
    const priorityMap: Record<string, { color: string; bg: string }> = {
      긴급: { color: "#c2410c", bg: "#ffedd5" },
      중요: { color: "#0f766e", bg: "#ccfbf7" },
      일반: { color: "#6b7280", bg: "#f3f4f6" },
      여유: { color: "#1d4ed8", bg: "#dbeafe" },
    };
    const p = priorityMap[newTodoPriority] || priorityMap["일반"];
    setTodos((prev) => [
      ...prev,
      {
        id: Date.now(),
        text,
        badge: newTodoPriority,
        badgeColor: p.color,
        badgeBg: p.bg,
        done: false,
      },
    ]);
    setNewTodo("");
    setNewTodoPriority("일반");
    setShowTodoModal(false);
  };

  // [woo] 우선도 필터 옵션
  const PRIORITY_OPTIONS: { label: string; value: string | null; color: string; bg: string }[] = [
    { label: "전체", value: null, color: "#fff", bg: "#25A194" },
    { label: "긴급", value: "긴급", color: "#c2410c", bg: "#ffedd5" },
    { label: "중요", value: "중요", color: "#0f766e", bg: "#ccfbf7" },
    { label: "일반", value: "일반", color: "#6b7280", bg: "#f3f4f6" },
    { label: "여유", value: "여유", color: "#1d4ed8", bg: "#dbeafe" },
  ];

  // [woo] 필터링된 할 일 목록
  const filteredTodos = todoPriorityFilter ? todos.filter((t) => t.badge === todoPriorityFilter) : todos;

  return (
    <DashboardLayout>
      {/* 헤더 */}
      {/* <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">선생님 대시보드</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            {data.teacherSubject && (
              <>
                <span>{data.teacherSubject}</span> |{" "}
              </>
            )}
            <span>{data.teacherName ?? "선생님"}</span>선생
          </p>
        </div>
      </div> */}

      <div>
        <div className="row gy-4">
          {/* [woo] 1. 알림 메시지 — /api/notifications 연동 */}
          <div className="col-xxl-4 col-lg-4">
            <div className="card dash-card" style={{ height: 480 }}>
              <div className="card-body p-0 d-flex flex-column" style={{ height: "100%" }}>
                <div className="d-flex align-items-center gap-8 dash-card-header">
                  <i className="ri-notification-3-line text-primary-600 text-lg" />
                  <h6 className="fw-bold mb-0 text-lg">알림 메시지</h6>
                  {notifications.filter((n) => !n.isRead).length > 0 && (
                    <span
                      className="badge text-white text-xs px-6 py-2 radius-4 fw-semibold"
                      style={{ background: "#ef4444", fontSize: 10 }}
                    >
                      {notifications.filter((n) => !n.isRead).length}
                    </span>
                  )}
                </div>
                <div className="px-16 py-12" style={{ overflowY: "auto", flex: 1 }}>
                  {notifications.length > 0 ? (
                    <div className="d-flex flex-column gap-8">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-12 radius-8"
                          style={{
                            background: n.isRead ? "var(--bg-color, #f9fafb)" : "#f0fdf4",
                            border: `1px solid ${n.isRead ? "var(--border-color, #e5e7eb)" : "#bbf7d0"}`,
                            cursor: n.actionUrl ? "pointer" : "default",
                            opacity: n.isRead ? 0.7 : 1,
                          }}
                          onClick={() => {
                            if (!n.isRead) markRead(n.id);
                            if (n.actionUrl) navigate(n.actionUrl);
                          }}
                        >
                          <div className="d-flex align-items-start justify-content-between gap-8 mb-4">
                            <div className="d-flex align-items-center gap-6 flex-grow-1">
                              <h6 className="text-sm fw-semibold mb-0" style={{ wordBreak: "keep-all" }}>
                                {n.title}
                              </h6>
                              {!n.isRead && (
                                // [soojin] NEW 배지 배경/모양 제거, 글자색만 유지
                                <span style={{ color: "#ef4444", fontSize: 10, fontWeight: 700 }}>
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="d-flex align-items-center gap-6 flex-shrink-0">
                              <span className="text-xs text-secondary-light">{timeAgo(n.sentDate)}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissNotification(n.id);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#9ca3af",
                                  fontSize: 14,
                                  padding: "0 2px",
                                  lineHeight: 1,
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <p className="text-xs mb-0 text-secondary-light">
                            {n.senderName ? `${n.senderName} | ` : ""}
                            {n.content.slice(0, 60)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-32">
                      <p className="text-sm mb-0 text-secondary-light">새로운 알림이 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. 오늘의 수업 일정 */}
          <div className="col-xxl-4 col-lg-4">
            <DashboardScheduleWidget />
          </div>

          {/* 3. 오늘 할 일 */}
          <div className="col-xxl-4 col-lg-4">
            <div className="card dash-card" style={{ height: 480 }}>
              <div className="card-body p-0 d-flex flex-column" style={{ height: "100%" }}>
                <div className="d-flex align-items-center justify-content-between dash-card-header">
                  <div className="d-flex align-items-center gap-8">
                    <i className="ri-checkbox-circle-line text-primary-600 text-lg" />
                    <h6 className="fw-bold mb-0 text-lg">오늘 할 일</h6>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTodoModal(true)}
                    className="text-primary-600 text-md"
                    style={{ lineHeight: 1, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  >
                    할 일 추가
                  </button>
                </div>
                {/* [woo] 우선도 필터 버튼 */}
                <div
                  className="d-flex align-items-center gap-6 px-16 py-12"
                  style={{ flexShrink: 0 }}
                >
                  {PRIORITY_OPTIONS.map((opt) => {
                    const isActive = todoPriorityFilter === opt.value;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => setTodoPriorityFilter(isActive ? null : (opt.value ?? null))}
                        style={{
                          background: isActive ? opt.bg : "#f9fafb",
                          color: isActive ? opt.color : "#6b7280",
                          border: isActive ? `1.5px solid ${opt.color}` : "1.5px solid #e5e7eb",
                          borderRadius: 20,
                          padding: "3px 12px",
                          fontSize: 15,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <div className="px-16 py-12" style={{ overflowY: "auto", flex: 1 }}>
                  <div className="d-flex flex-column">
                    {filteredTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="d-flex align-items-center gap-10 py-9"
                        style={{ borderBottom: "1px solid #f3f4f6" }}
                      >
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: `2px solid ${todo.done ? "#22c55e" : "#d1d5db"}`,
                            background: todo.done ? "#22c55e" : "white",
                            cursor: "pointer",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {todo.done && <i className="ri-check-line" style={{ color: "white", fontSize: 15 }} />}
                        </button>
                        {/* [woo] 할 일 텍스트 — 클릭 시 인라인 수정 */}
                        {editingTodoId === todo.id ? (
                          <input
                            autoFocus
                            className="flex-grow-1"
                            value={editingTodoText}
                            onChange={e => setEditingTodoText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                const text = editingTodoText.trim();
                                if (text) setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, text } : t));
                                setEditingTodoId(null);
                              } else if (e.key === "Escape") {
                                setEditingTodoId(null);
                              }
                            }}
                            onBlur={() => {
                              const text = editingTodoText.trim();
                              if (text) setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, text } : t));
                              setEditingTodoId(null);
                            }}
                            style={{
                              fontSize: 15,
                              color: "#111827",
                              border: "1px solid #d1d5db",
                              borderRadius: 4,
                              padding: "2px 6px",
                              outline: "none",
                              width: "100%",
                            }}
                          />
                        ) : (
                          <span
                            className="flex-grow-1"
                            onClick={() => {
                              if (!todo.done) {
                                setEditingTodoId(todo.id);
                                setEditingTodoText(todo.text);
                              }
                            }}
                            style={{
                              fontSize: 15,
                              color: todo.done ? "#9ca3af" : "#111827",
                              textDecoration: todo.done ? "line-through" : "none",
                              cursor: todo.done ? "default" : "text",
                            }}
                          >
                            {todo.text}
                          </span>
                        )}
                        {/* [woo] 뱃지 클릭 → 우선도 선택 팝업 */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <button
                            onClick={() => !todo.done && setPriorityPopupId(priorityPopupId === todo.id ? null : todo.id)}
                            title={todo.done ? "" : "클릭하여 우선도 변경"}
                            style={{
                              background: todo.badgeBg,
                              color: todo.badgeColor,
                              fontSize: 15,
                              fontWeight: 600,
                              borderRadius: 4,
                              padding: "2px 8px",
                              border: "none",
                              cursor: todo.done ? "default" : "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            {todo.badge}
                          </button>
                          {priorityPopupId === todo.id && !todo.done && (
                            <>
                            {/* [woo] 바깥 클릭 시 팝업 닫기용 오버레이 */}
                            <div
                              onClick={() => setPriorityPopupId(null)}
                              style={{ position: "fixed", inset: 0, zIndex: 9 }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                right: 0,
                                marginTop: 4,
                                background: "white",
                                borderRadius: 8,
                                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                                padding: 4,
                                zIndex: 10,
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                              }}
                            >
                              {PRIORITY_LIST.map((p) => (
                                <button
                                  key={p.badge}
                                  onClick={() => changePriority(todo.id, p.badge)}
                                  style={{
                                    background: todo.badge === p.badge ? p.badgeBg : "transparent",
                                    color: p.badgeColor,
                                    fontSize: 15,
                                    fontWeight: 600,
                                    borderRadius: 4,
                                    padding: "4px 12px",
                                    border: "none",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {p.badge}
                                </button>
                              ))}
                            </div>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => removeTodo(todo.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#d1d5db",
                            fontSize: 15,
                            padding: 0,
                            flexShrink: 0,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 일정 (캘린더) */}
          <div className="col-xxl-6 col-lg-6">
            <div className="card h-100 dash-card">
              <div className="card-body p-0">
                <div className="d-flex align-items-center gap-8 dash-card-header">
                  <i className="ri-calendar-line text-primary-600 text-lg" />
                  <h6 className="fw-bold mb-0 text-lg">일정</h6>
                </div>
                <div className="p-20">
                  <MiniCalendar />
                </div>
                <div className="px-20 py-12 border-top border-neutral-200 d-flex gap-16">
                  <div className="d-flex align-items-center gap-6">
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#0d6efd",
                        display: "inline-block",
                      }}
                    />
                    <span className="text-md" style={{ color: "#6b7280" }}>
                      학교 일정
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-6">
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#25A194",
                        display: "inline-block",
                      }}
                    />
                    <span className="text-md" style={{ color: "#6b7280" }}>
                      개인 일정
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. 빠른 메뉴 */}
          <div className="col-xxl-6 col-lg-6">
            <div className="card h-100 dash-card">
              <div className="card-body p-0 d-flex flex-column">
                <div className="d-flex align-items-center gap-8 dash-card-header">
                  <i className="ri-layout-grid-line" style={{ fontSize: 16, color: "#25A194", lineHeight: 1 }} />
                  <h6 className="fw-bold mb-0 text-lg">바로 가기</h6>
                </div>
                <div className="p-16" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gridTemplateRows: "1fr 1fr",
                      gap: 12,
                      width: "100%",
                      flex: 1,
                    }}
                  >
                    {[
                      {
                        label: "학급 관리",
                        icon: "ri-team-fill",
                        bg: "#f0fdf4",
                        iconBg: "#bbf7d0",
                        iconColor: "#15803d",
                        href: "/teacher/myclass/dashboard",
                      },
                      {
                        label: "수업 관리",
                        icon: "bi-book-fill",
                        bg: "#eff6ff",
                        iconBg: "#bfdbfe",
                        iconColor: "#1d4ed8",
                        href: "/teacher/schedule",
                      },
                      {
                        label: "과제 관리",
                        icon: "bi-clipboard-check-fill",
                        bg: "#fffbeb",
                        iconBg: "#fde68a",
                        iconColor: "#d97706",
                        href: "/homework",
                      },
                      {
                        label: "성적 관리",
                        icon: "bi-mortarboard-fill",
                        bg: "#faf5ff",
                        iconBg: "#e9d5ff",
                        iconColor: "#7c3aed",
                        href: "/exam/result",
                      },
                    ].map((menu) => (
                      <a
                        key={menu.label}
                        href={menu.href}
                        style={{
                          background: menu.bg,
                          borderRadius: 12,
                          padding: "16px",
                          textDecoration: "none",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                          border: "1px solid transparent",
                          height: "100%",
                        }}
                      >
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            background: menu.iconBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <i
                            className={menu.icon.startsWith("ri-") ? menu.icon : `bi ${menu.icon}`}
                            style={{ color: menu.iconColor, fontSize: 22 }}
                          />
                        </div>
                        <span style={{ color: "#374151", fontWeight: 600, fontSize: 16 }}>{menu.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 할 일 추가 모달 */}
      {showTodoModal && (
        <div
          onClick={() => {
            setShowTodoModal(false);
            setNewTodo("");
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 12,
              width: "100%",
              maxWidth: 400,
              margin: "0 16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>할 일 추가</h6>
              <button
                onClick={() => {
                  setShowTodoModal(false);
                  setNewTodo("");
                }}
                style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#6b7280" }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "20px" }}>
              <input
                autoFocus
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTodo()}
                placeholder="할 일을 입력하세요..."
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 16,
                  color: "#111827",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {/* [woo] 우선도 선택 */}
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: "#374151" }}>우선도</span>
                <div className="d-flex gap-6" style={{ marginTop: 6 }}>
                  {(
                    [
                      { label: "긴급", color: "#c2410c", bg: "#ffedd5" },
                      { label: "중요", color: "#0f766e", bg: "#ccfbf7" },
                      { label: "일반", color: "#6b7280", bg: "#f3f4f6" },
                      { label: "여유", color: "#1d4ed8", bg: "#dbeafe" },
                    ] as const
                  ).map((opt) => {
                    const selected = newTodoPriority === opt.label;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setNewTodoPriority(opt.label)}
                        style={{
                          background: selected ? opt.bg : "#f9fafb",
                          color: selected ? opt.color : "#9ca3af",
                          border: selected ? `2px solid ${opt.color}` : "2px solid #e5e7eb",
                          borderRadius: 20,
                          padding: "4px 16px",
                          fontSize: 15,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "0 20px 16px" }}>
              <button
                onClick={() => {
                  setShowTodoModal(false);
                  setNewTodo("");
                }}
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 20px",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                취소
              </button>
              <button
                onClick={addTodo}
                style={{
                  background: "#25A194",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 20px",
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
