import { useState, useRef, useEffect, useCallback } from "react";
import api from "../../api/auth";

function useDropdown() {
  const [isOpen, setIsOpen] = useState(false);
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

  return {
    isOpen,
    toggle: () => setIsOpen((prev) => !prev),
    close: () => setIsOpen(false),
    ref,
  };
}

function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const saved = localStorage.getItem("theme") ?? "light";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  return { isDark, toggle: () => setIsDark((prev) => !prev) };
}

interface NotificationItem {
  id: number;
  title: string;
  content: string;
  senderName: string;
  sentDate: string;
  isRead: boolean;
}

// [joon] 공통 트랜지션 스타일 정의 (부드러운 다크모드 전환용)
const smoothTransition =
  "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease";

export default function AdminHeader() {
  const notif = useDropdown();
  const theme = useTheme();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(() => {
    api
      .get("/notifications/unread-count")
      .then((res) => setUnreadCount(res.data.count ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(timer);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!notif.isOpen) return;
    api
      .get("/notifications")
      .then((res) => {
        const data = res.data;
        setNotifications(Array.isArray(data) ? data : []);
      })
      .catch(() => setNotifications([]));
  }, [notif.isOpen]);

  function handleReadNotification(id: number, alreadyRead: boolean) {
    if (alreadyRead) return;
    api
      .post(`/notifications/${id}/read`)
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      })
      .catch(() => {});
  }

  return (
    <div
      className="navbar-header shadow-1"
      style={{ transition: smoothTransition }}
    >
      <div className="row align-items-center justify-content-end">
        <div className="col-auto">
          <div className="d-flex flex-wrap align-items-center gap-3">
            {/* 다크모드 토글 버튼 */}
            <button
              type="button"
              onClick={theme.toggle}
              className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
              aria-label="Dark & Light Mode Button"
              style={{ transition: smoothTransition }}
            >
              <iconify-icon
                icon={theme.isDark ? "ri:sun-line" : "ri:moon-line"}
                className="text-primary-light text-xl"
                style={{ transition: "color 0.3s ease" }}
              />
            </button>

            {/* 알림 버튼 영역 */}
            <div
              className="dropdown"
              style={{ position: "relative" }}
              ref={notif.ref}
            >
              <button
                className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center position-relative"
                type="button"
                aria-label="Notification Button"
                onClick={notif.toggle}
                style={{ transition: smoothTransition }}
              >
                <iconify-icon
                  icon="iconoir:bell"
                  className="text-primary-light text-xl"
                  style={{ transition: "color 0.3s ease" }}
                />
                {unreadCount > 0 && (
                  <span
                    className="w-8-px h-8-px bg-danger-600 position-absolute end-0 top-0 rounded-circle mt-2 me-2"
                    style={{ transition: smoothTransition }}
                  />
                )}
              </button>

              {/* 알림 드롭다운 메뉴 */}
              {notif.isOpen && (
                <div
                  className="dropdown-menu dropdown-menu-lg p-0 show"
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    left: "auto",
                    minWidth: 320,
                    transition: smoothTransition,
                  }}
                >
                  <div
                    className="m-16 py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2"
                    style={{ transition: smoothTransition }}
                  >
                    <h6
                      className="text-lg text-primary-light fw-semibold mb-0"
                      style={{ transition: "color 0.3s ease" }}
                    >
                      알림
                    </h6>
                    <span
                      className="text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center"
                      style={{ transition: smoothTransition }}
                    >
                      {notifications.length}
                    </span>
                  </div>
                  <div className="max-h-400-px overflow-y-auto scroll-sm pe-4">
                    {notifications.length === 0 ? (
                      <p
                        className="px-24 py-12 text-secondary-light"
                        style={{ transition: "color 0.3s ease" }}
                      >
                        새로운 알림이 없습니다.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="px-24 py-12 border-bottom"
                          style={{
                            cursor: n.isRead ? "default" : "pointer",
                            transition: smoothTransition,
                          }}
                          onClick={() => handleReadNotification(n.id, n.isRead)}
                          onMouseEnter={(e) => {
                            if (!n.isRead)
                              e.currentTarget.style.opacity = "0.7";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "1";
                          }}
                        >
                          <div className="d-flex align-items-start gap-12">
                            <div
                              className="w-36-px h-36-px rounded-circle bg-primary-100 d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ transition: smoothTransition }}
                            >
                              <iconify-icon
                                icon="iconoir:bell"
                                className="text-primary-600"
                                style={{
                                  fontSize: 16,
                                  transition: "color 0.3s ease",
                                }}
                              />
                            </div>
                            <div className="flex-grow-1">
                              <p
                                className="fw-semibold text-sm mb-2"
                                style={{ transition: "color 0.3s ease" }}
                              >
                                {n.title}
                              </p>
                              <p
                                className="text-sm text-secondary-light mb-2"
                                style={{
                                  whiteSpace: "pre-line",
                                  transition: "color 0.3s ease",
                                }}
                              >
                                {n.content}
                              </p>
                              <div className="d-flex justify-content-between">
                                <span
                                  className="text-xs text-secondary-light"
                                  style={{ transition: "color 0.3s ease" }}
                                >
                                  {n.senderName}
                                </span>
                                <span
                                  className="text-xs text-secondary-light"
                                  style={{ transition: "color 0.3s ease" }}
                                >
                                  {n.sentDate}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
