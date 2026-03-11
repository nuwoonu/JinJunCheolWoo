import { useEffect, useState } from "react";
import api from "../../../api/auth";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import DashboardScheduleWidget from "../../../components/teacher/DashboardScheduleWidget";
import MiniCalendar from "../../../components/MiniCalendar";

interface Notice {
  title: string;
  writerName?: string;
  content?: string;
  createDate?: string;
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
}

const INITIAL_TODOS: TodoItem[] = [
  { id: 1, text: "중간고사 시험지 제출", badge: "당장", badgeColor: "#c2410c", badgeBg: "#ffedd5", done: false },
  { id: 2, text: "학부모 상담 준비", badge: "당장", badgeColor: "#c2410c", badgeBg: "#ffedd5", done: false },
  { id: 3, text: "2학년 3반 과제 채점", badge: "당장", badgeColor: "#c2410c", badgeBg: "#ffedd5", done: false },
  { id: 4, text: "교직원 회의 참석", badge: "천천", badgeColor: "#1d4ed8", badgeBg: "#dbeafe", done: false },
  { id: 5, text: "학급 운영비 정산", badge: "느릿", badgeColor: "#15803d", badgeBg: "#dcfce7", done: false },
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
  const [data, setData] = useState<TeacherDashboardData>({});
  const [dismissedNotices, setDismissedNotices] = useState<Set<number>>(new Set());
  const [todos, setTodos] = useState<TodoItem[]>(INITIAL_TODOS);
  const [newTodo, setNewTodo] = useState("");
  const [showTodoModal, setShowTodoModal] = useState(false);

  useEffect(() => {
    api
      .get("/dashboard/teacher")
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  const allNotices = data.notices ?? [];
  const visibleNotices = allNotices.filter((_, i) => !dismissedNotices.has(i));

  const dismissNotice = (originalIdx: number) => {
    setDismissedNotices((prev) => new Set([...prev, originalIdx]));
  };

  const toggleTodo = (id: number) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const removeTodo = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const addTodo = () => {
    const text = newTodo.trim();
    if (!text) return;
    setTodos((prev) => [
      ...prev,
      {
        id: Date.now(),
        text,
        badge: "할 일",
        badgeColor: "#1d4ed8",
        badgeBg: "#dbeafe",
        done: false,
      },
    ]);
    setNewTodo("");
    setShowTodoModal(false);
  };

  return (
    <DashboardLayout>
      {/* 헤더 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
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
      </div>

      <div className="mt-24">
        <div className="row gy-4">
          {/* 1. 알림 메시지 */}
          <div className="col-xxl-4 col-lg-4">
            <div className="card" style={{ height: 480 }}>
              <div className="card-body p-0 d-flex flex-column" style={{ height: "100%" }}>
                <div
                  className="d-flex align-items-center gap-10 px-20 py-16 border-bottom border-neutral-200"
                  style={{ flexShrink: 0 }}
                >
                  <i className="bi bi-bell text-primary-600 text-lg" />
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>알림 메시지</div>
                </div>
                <div className="px-16 py-12" style={{ overflowY: "auto", flex: 1 }}>
                  {visibleNotices.length > 0 ? (
                    <div className="d-flex flex-column gap-8">
                      {visibleNotices.map((notice) => {
                        const originalIdx = allNotices.indexOf(notice);
                        const isNew = originalIdx < 2;
                        return (
                          <div
                            key={originalIdx}
                            className="p-12 radius-8"
                            style={{
                              background: isNew ? "#f0fdf4" : "#f9fafb",
                              border: `1px solid ${isNew ? "#bbf7d0" : "#e5e7eb"}`,
                            }}
                          >
                            <div className="d-flex align-items-start justify-content-between gap-8 mb-4">
                              <div className="d-flex align-items-center gap-6 flex-grow-1">
                                <h6 className="text-sm fw-semibold mb-0" style={{ wordBreak: "keep-all" }}>
                                  {notice.title}
                                </h6>
                                {isNew && (
                                  <span
                                    className="badge text-white text-xs px-6 py-2 radius-4 fw-semibold"
                                    style={{ background: "#ef4444", fontSize: 10 }}
                                  >
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div className="d-flex align-items-center gap-6 flex-shrink-0">
                                <span className="text-xs" style={{ color: "#9ca3af" }}>
                                  {timeAgo(notice.createDate)}
                                </span>
                                <button
                                  onClick={() => dismissNotice(originalIdx)}
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
                            <p className="text-xs mb-0" style={{ color: "#6b7280" }}>
                              {notice.writerName ? `${notice.writerName} | ` : ""}
                              {(notice.content ?? "").slice(0, 60)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-32" style={{ color: "#9ca3af" }}>
                      <p className="text-sm mb-0">새로운 알림이 없습니다.</p>
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
            <div className="card" style={{ height: 480 }}>
              <div className="card-body p-0 d-flex flex-column" style={{ height: "100%" }}>
                <div
                  className="d-flex align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200"
                  style={{ flexShrink: 0 }}
                >
                  <div className="d-flex align-items-center gap-10">
                    <i className="bi bi-check2-square text-primary-600 text-lg" />
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>오늘 할 일</div>
                  </div>
                  <button
                    onClick={() => setShowTodoModal(true)}
                    style={{
                      background: "#25A194",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "5px 14px",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    + 할 일 추가
                  </button>
                </div>
                <div className="px-16 py-12" style={{ overflowY: "auto", flex: 1 }}>
                  <div className="d-flex flex-column">
                    {todos.map((todo) => (
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
                          {todo.done && <i className="bi bi-check" style={{ color: "white", fontSize: 11 }} />}
                        </button>
                        <span
                          className="flex-grow-1"
                          style={{
                            fontSize: 13,
                            color: todo.done ? "#9ca3af" : "#111827",
                            textDecoration: todo.done ? "line-through" : "none",
                          }}
                        >
                          {todo.text}
                        </span>
                        <span
                          style={{
                            background: todo.badgeBg,
                            color: todo.badgeColor,
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 4,
                            padding: "2px 8px",
                            flexShrink: 0,
                          }}
                        >
                          {todo.badge}
                        </span>
                        <button
                          onClick={() => removeTodo(todo.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#d1d5db",
                            fontSize: 13,
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
            <div className="card h-100">
              <div className="card-body p-0">
                <div className="d-flex align-items-center gap-10 px-20 py-16 border-bottom border-neutral-200">
                  <i className="bi bi-calendar3 text-primary-600 text-lg" />
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>일정</div>
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
                    <span className="text-sm" style={{ color: "#6b7280" }}>
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
                    <span className="text-sm" style={{ color: "#6b7280" }}>
                      개인 일정
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. 빠른 메뉴 */}
          <div className="col-xxl-6 col-lg-6">
            <div className="card h-100">
              <div className="card-body p-0 d-flex flex-column">
                <div
                  className="d-flex align-items-center gap-10 px-20 py-16 border-bottom border-neutral-200"
                  style={{ flexShrink: 0 }}
                >
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>바로 가기</div>
                </div>
                <div className="p-16" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 12, width: "100%", flex: 1 }}>
                    {[
                      {
                        label: "학급 관리",
                        icon: "bi-people-fill",
                        bg: "#f0fdf4",
                        iconBg: "#bbf7d0",
                        iconColor: "#15803d",
                        href: "/teacher/myclass",
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
                        href: "/exam",
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
                          <i className={`bi ${menu.icon}`} style={{ color: menu.iconColor, fontSize: 22 }} />
                        </div>
                        <span style={{ color: "#374151", fontWeight: 600, fontSize: 14 }}>{menu.label}</span>
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
                  fontSize: 14,
                  color: "#111827",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
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
                  fontSize: 14,
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
                  fontSize: 14,
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
