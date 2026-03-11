import { type ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext'

// [woo] SidebarContext를 읽어 body/overlay에 클래스 적용하는 내부 레이아웃
function Layout({ children }: { children: ReactNode }) {
  const { isOpen, isCollapsed, closeSidebar } = useSidebar()

  return (
    <>
      {/* [woo] isOpen → overlay 표시, 클릭 시 사이드바 닫기 */}
      <div
        className={`body-overlay${isOpen ? ' show' : ''}`}
        onClick={closeSidebar}
      />

      {/* [woo] isOpen → sidebar-open, isCollapsed → active */}
      <Sidebar />

      <main className={`dashboard-main${isCollapsed ? ' active' : ''}`}>
        <Header />
        <div className="dashboard-main-body">
          {children}
        </div>
        <footer className="d-footer">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <p className="mb-0">Copyright 2026 SchoolMate. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Layout>{children}</Layout>
    </SidebarProvider>
  )
}
