import { useState, useEffect } from 'react'
import { useSidebar } from '@/shared/contexts/SidebarContext'
import { useAuth } from '@/shared/contexts/AuthContext'
import NotificationDropdown from '@/features/notification/components/NotificationDropdown'
import ProfileDropdown from '@/features/profile/components/ProfileDropdown'

// [woo] Bootstrap data-bs-toggle 대신 React state로 드롭다운 제어
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

export default function Header({ showLogo }: { showLogo?: boolean } = {}) {
  const { openSidebar } = useSidebar()
  const { user } = useAuth()
  const theme = useTheme()

  // [soojin] 역할별 대시보드 경로 - 사이드바 홈 제거 후 헤더로 이동
  const role = user?.role ?? ''
  const dashboardPath =
    role === 'STUDENT' ? '/student/dashboard'
    : role === 'TEACHER' ? '/teacher/dashboard'
    : role === 'PARENT' ? '/parent/dashboard'
    : '/main'

  return (
    <div className="navbar-header" style={{ borderBottom: "1px solid #e0e0e0" }}>
      <div className="row align-items-center justify-content-between">
        <div className="col-auto">
          <div className="d-flex flex-wrap align-items-center gap-4">
            {/* [woo] 모바일 햄버거 → openSidebar (React state) */}
            <button type="button" className="sidebar-mobile-toggle" aria-label="Sidebar Mobile Toggler Button" onClick={openSidebar}>
              <iconify-icon icon="heroicons:bars-3-solid" className="icon" />
            </button>
            {showLogo && (
              <a href="/main" style={{ lineHeight: 0 }}>
                <img src="/images/schoolmateLogo.png" alt="SchoolMate" width="160" height="37" />
              </a>
            )}
          </div>
        </div>
        <div className="col-auto">
          <div className="d-flex flex-wrap align-items-center gap-3">
            {/* [woo] 검색바를 오른쪽 정렬 */}
            <form className="navbar-search">
              <input type="text" className="bg-transparent" name="search" placeholder="Search" />
              <iconify-icon icon="ion:search-outline" className="icon" />
            </form>
            {/* [soojin] 홈 아이콘 - 사이드바에서 헤더로 이동, 역할별 대시보드로 이동 */}
            {user?.authenticated && (
              <a href={dashboardPath} className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center" aria-label="홈" style={{ textDecoration: 'none' }}>
                <iconify-icon icon="ri:home-4-line" className="text-primary-light text-xl" />
              </a>
            )}
            {/* [woo] 다크모드 토글 - useTheme hook으로 제어 */}
            <button type="button" onClick={theme.toggle} className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center" aria-label="Dark & Light Mode Button">
              <iconify-icon icon={theme.isDark ? 'ri:sun-line' : 'ri:moon-line'} className="text-primary-light text-xl" />
            </button>

            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </div>
  )
}
