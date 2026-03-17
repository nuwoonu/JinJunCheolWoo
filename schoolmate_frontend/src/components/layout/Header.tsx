import { useState, useRef, useEffect, useCallback } from 'react'
import { useSidebar } from '../../contexts/SidebarContext'
import api from '../../api/auth'

// [woo] Bootstrap data-bs-toggle 대신 React state로 드롭다운 제어
function useDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return { isOpen, toggle: () => setIsOpen(prev => !prev), close: () => setIsOpen(false), ref }
}

// [woo] 다크모드 토글 - app.js 제거 후 React로 대체
// html[data-theme="dark"] CSS 선택자 기반, localStorage에 저장
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // [woo] 초기 로드 시 저장된 테마 적용
  useEffect(() => {
    const saved = localStorage.getItem('theme') ?? 'light'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  return { isDark, toggle: () => setIsDark(prev => !prev) }
}

interface NotificationItem {
  id: number
  title: string
  content: string
  senderName: string
  sentDate: string
  isRead: boolean
}

export default function Header() {
  const { openSidebar } = useSidebar()
  const notif = useDropdown()
  const theme = useTheme()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // [woo] 읽지 않은 알림 수 조회 (30초마다 폴링)
  const fetchUnreadCount = useCallback(() => {
    api.get('/notifications/unread-count')
      .then(res => setUnreadCount(res.data.count ?? 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const timer = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(timer)
  }, [fetchUnreadCount])

  // [woo] 드롭다운 열릴 때 알림 목록만 fetch
  useEffect(() => {
    if (!notif.isOpen) return
    api.get('/notifications')
      .then(res => {
        const data = res.data
        setNotifications(Array.isArray(data) ? data : [])
      })
      .catch(() => setNotifications([]))
  }, [notif.isOpen])

  // [woo] 알림 항목 클릭 → 해당 알림만 읽음 처리
  function handleReadNotification(id: number, alreadyRead: boolean) {
    if (alreadyRead) return
    api.post(`/notifications/${id}/read`)
      .then(() => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      })
      .catch(() => {})
  }

  return (
    <div className="navbar-header shadow-1">
      <div className="row align-items-center justify-content-between">
        <div className="col-auto">
          <div className="d-flex flex-wrap align-items-center gap-4">
            {/* [woo] 모바일 햄버거 → openSidebar (React state) */}
            <button type="button" className="sidebar-mobile-toggle" aria-label="Sidebar Mobile Toggler Button" onClick={openSidebar}>
              <iconify-icon icon="heroicons:bars-3-solid" className="icon" />
            </button>
          </div>
        </div>
        <div className="col-auto">
          <div className="d-flex flex-wrap align-items-center gap-3">
            {/* [woo] 검색바를 오른쪽 정렬 */}
            <form className="navbar-search">
              <input type="text" className="bg-transparent" name="search" placeholder="Search" />
              <iconify-icon icon="ion:search-outline" className="icon" />
            </form>
            {/* [woo] 다크모드 토글 - useTheme hook으로 제어 */}
            <button type="button" onClick={theme.toggle} className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center" aria-label="Dark & Light Mode Button">
              <iconify-icon icon={theme.isDark ? 'ri:sun-line' : 'ri:moon-line'} className="text-primary-light text-xl" />
            </button>

            {/* [woo] 알림 드롭다운 - React state */}
            <div className="dropdown" style={{ position: 'relative' }} ref={notif.ref}>
              <button
                className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center position-relative"
                type="button"
                aria-label="Notification Button"
                onClick={notif.toggle}
              >
                <iconify-icon icon="iconoir:bell" className="text-primary-light text-xl" />
                {/* [woo] 읽지 않은 알림 있을 때만 빨간 점 표시 */}
                {unreadCount > 0 && (
                  <span className="w-8-px h-8-px bg-danger-600 position-absolute end-0 top-0 rounded-circle mt-2 me-2" />
                )}
              </button>
              {notif.isOpen && (
                <div
                  className="dropdown-menu dropdown-menu-lg p-0 show"
                  style={{ position: 'absolute', top: '100%', right: 0, left: 'auto', minWidth: 320 }}
                >
                  <div className="m-16 py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                    <h6 className="text-lg text-primary-light fw-semibold mb-0">알림</h6>
                    <span className="text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center">
                      {notifications.length}
                    </span>
                  </div>
                  <div className="max-h-400-px overflow-y-auto scroll-sm pe-4">
                    {notifications.length === 0 ? (
                      <p className="px-24 py-12 text-secondary-light">새로운 알림이 없습니다.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="px-24 py-12 border-bottom" style={{ cursor: n.isRead ? 'default' : 'pointer' }} onClick={() => handleReadNotification(n.id, n.isRead)}>
                          <div className="d-flex align-items-start gap-12">
                            <div className="w-36-px h-36-px rounded-circle bg-primary-100 d-flex align-items-center justify-content-center flex-shrink-0">
                              <iconify-icon icon="iconoir:bell" className="text-primary-600" style={{ fontSize: 16 }} />
                            </div>
                            <div className="flex-grow-1">
                              <p className="fw-semibold text-sm mb-2">{n.title}</p>
                              <p className="text-sm text-secondary-light mb-2" style={{ whiteSpace: 'pre-line' }}>{n.content}</p>
                              <div className="d-flex justify-content-between">
                                <span className="text-xs text-secondary-light">{n.senderName}</span>
                                <span className="text-xs text-secondary-light">{n.sentDate}</span>
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
  )
}
