import { type ReactNode } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'

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
        <Footer />
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
