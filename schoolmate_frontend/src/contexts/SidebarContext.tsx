import { createContext, useContext, useState, type ReactNode } from 'react'

// [woo] 사이드바 모바일 열림 / 데스크탑 접힘 상태를 React state로 관리
interface SidebarContextType {
  isOpen: boolean       // 모바일: 사이드바 슬라이드 오픈
  isCollapsed: boolean  // 데스크탑: 사이드바 접힘
  openSidebar: () => void
  closeSidebar: () => void
  toggleCollapse: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  isCollapsed: false,
  openSidebar: () => {},
  closeSidebar: () => {},
  toggleCollapse: () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  // [soojin] 페이지 이동 후에도 접힘 상태 유지되도록 localStorage에서 초기값 로드
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true')

  return (
    <SidebarContext.Provider value={{
      isOpen,
      isCollapsed,
      openSidebar: () => setIsOpen(true),
      closeSidebar: () => setIsOpen(false),
      toggleCollapse: () => setIsCollapsed(prev => {
        const next = !prev
        localStorage.setItem('sidebarCollapsed', String(next))
        return next
      }),
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
