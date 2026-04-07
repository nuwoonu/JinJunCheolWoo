import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/shared/api/authApi";
import { useSchool } from "@/shared/contexts/SchoolContext";

interface NotificationItem {
  id: number;
  title: string;
  content: string;
  senderName: string;
  sentDate: string;
  isRead: boolean;
  actionUrl?: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { setSelectedSchool } = useSchool();

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

  const MAX_DISPLAY = 50;

  useEffect(() => {
    if (!isOpen) return;
    api
      .get("/notifications")
      .then((res) => {
        const data: NotificationItem[] = Array.isArray(res.data) ? res.data : [];
        setNotifications(data.slice(0, MAX_DISPLAY));
      })
      .catch(() => setNotifications([]));
  }, [isOpen]);

  async function handleClick(n: NotificationItem) {
    // 읽음 처리
    if (!n.isRead) {
      api
        .post(`/notifications/${n.id}/read`)
        .then(() => {
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === n.id ? { ...item, isRead: true } : item,
            ),
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        })
        .catch(() => {});
    }

    // actionUrl이 있으면 이동
    if (n.actionUrl) {
      setIsOpen(false);
      const url = new URL(n.actionUrl, window.location.origin);
      const schoolId = url.searchParams.get("schoolId");
      const path = url.pathname;

      if (schoolId) {
        try {
          const res = await api.get(`/admin/schools/${schoolId}`);
          const s = res.data;
          setSelectedSchool({
            id: s.id,
            name: s.name,
            schoolCode: s.schoolCode,
            schoolKind: s.schoolKind,
            officeOfEducation: s.officeOfEducation,
          });
        } catch {
          // 학교 정보 조회 실패 시 그냥 이동
        }
      }

      navigate(path);
    }
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
        <i className="ri-notification-3-line text-primary-light text-xl"></i>
        {unreadCount > 0 && (
          <span
            className="position-absolute bg-danger-600 rounded-pill d-flex align-items-center justify-content-center text-white"
            style={{
              top: 1,
              right: 1,
              minWidth: 16,
              height: 16,
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
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
            <div className="d-flex align-items-center gap-8">
              {unreadCount > 0 && (
                <span className="badge bg-danger-100 text-danger-600 fw-semibold" style={{ fontSize: 12 }}>
                  미열람 {unreadCount}
                </span>
              )}
              <span className="text-primary-600 fw-semibold text-sm">
                전체 {notifications.length}
              </span>
            </div>
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
                    cursor: n.actionUrl || !n.isRead ? "pointer" : "default",
                    opacity: n.isRead ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}
                  onClick={() => handleClick(n)}
                >
                  <div className="d-flex align-items-start gap-12">
                    <div className="w-36-px h-36-px rounded-circle bg-primary-100 d-flex align-items-center justify-content-center flex-shrink-0">
                      <i className="ri-notification-3-line text-primary-600" style={{ fontSize: 16 }}></i>
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
                          <i className="ri-close-line" style={{ fontSize: 14 }}></i>
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
