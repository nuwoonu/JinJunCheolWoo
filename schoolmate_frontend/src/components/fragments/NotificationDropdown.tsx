import { useState, useRef, useEffect, useCallback } from "react";
import api from "../../api/auth";

interface NotificationItem {
  id: number;
  title: string;
  content: string;
  senderName: string;
  sentDate: string;
  isRead: boolean;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
    if (!isOpen) return;
    api
      .get("/notifications")
      .then((res) => setNotifications(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNotifications([]));
  }, [isOpen]);

  function handleRead(id: number, alreadyRead: boolean) {
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

  function handleDelete(e: React.MouseEvent, id: number, isRead: boolean) {
    e.stopPropagation();
    api
      .delete(`/notifications/${id}`)
      .then(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (!isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
      })
      .catch(() => {});
  }

  return (
    <div className="dropdown" style={{ position: "relative" }} ref={ref}>
      <button
        className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center position-relative"
        type="button"
        aria-label="Notification Button"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <iconify-icon
          icon="iconoir:bell"
          className="text-primary-light text-xl"
        />
        {unreadCount > 0 && (
          <span className="w-8-px h-8-px bg-danger-600 position-absolute end-0 top-0 rounded-circle mt-2 me-2" />
        )}
      </button>

      {isOpen && (
        <div
          className="dropdown-menu dropdown-menu-lg p-0 show"
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            left: "auto",
            minWidth: 320,
          }}
        >
          <div className="m-16 py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
            <h6 className="text-lg text-primary-light fw-semibold mb-0">
              알림
            </h6>
            <span className="text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center">
              {notifications.length}
            </span>
          </div>

          <div className="max-h-400-px overflow-y-auto scroll-sm pe-4">
            {notifications.length === 0 ? (
              <p className="px-24 py-12 text-secondary-light">
                새로운 알림이 없습니다.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="px-24 py-12 border-bottom"
                  style={{
                    cursor: n.isRead ? "default" : "pointer",
                    opacity: n.isRead ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}
                  onClick={() => handleRead(n.id, n.isRead)}
                >
                  <div className="d-flex align-items-start gap-12">
                    <div className="w-36-px h-36-px rounded-circle bg-primary-100 d-flex align-items-center justify-content-center flex-shrink-0">
                      <iconify-icon
                        icon="iconoir:bell"
                        className="text-primary-600"
                        style={{ fontSize: 16 }}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <p className="fw-semibold text-sm mb-0">{n.title}</p>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, n.id, n.isRead)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "0 0 0 8px",
                            color: "#9ca3af",
                            lineHeight: 1,
                          }}
                          aria-label="알림 삭제"
                        >
                          <iconify-icon
                            icon="iconoir:xmark"
                            style={{ fontSize: 14 }}
                          />
                        </button>
                      </div>
                      <p
                        className="text-sm text-secondary-light mb-2"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {n.content}
                      </p>
                      <div className="d-flex justify-content-between">
                        <span className="text-xs text-secondary-light">
                          {n.senderName}
                        </span>
                        <span className="text-xs text-secondary-light">
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
  );
}
