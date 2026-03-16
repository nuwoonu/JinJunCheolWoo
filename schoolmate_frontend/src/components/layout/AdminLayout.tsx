import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext'
import { useSchool } from '../../context/SchoolContext'
import { ADMIN_ROUTES } from '../../constants/routes'

function Layout({ children, msg, error }: { children: ReactNode; msg?: string; error?: string }) {
  const { isOpen, isCollapsed, closeSidebar } = useSidebar()
  const { selectedSchool } = useSchool()
  const navigate = useNavigate()

  useEffect(() => {
    if (!selectedSchool) {
      navigate(ADMIN_ROUTES.SCHOOL_SELECT, { replace: true })
    }
  }, [selectedSchool, navigate])

  return (
    <>
      <div className={`body-overlay${isOpen ? ' show' : ''}`} onClick={closeSidebar} />
      <AdminSidebar />
      <main className={`dashboard-main${isCollapsed ? ' active' : ''}`}>
        <AdminHeader />
        <div className="dashboard-main-body">
          {msg && (
            <div
              className="alert alert-dismissible mb-24 px-20 py-12 radius-8"
              role="alert"
              style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--text-primary-light)' }}
            >
              {msg}
              <button
                type="button"
                className="btn-close"
                onClick={(e) => (e.currentTarget.closest('.alert') as HTMLElement)?.remove()}
              />
            </div>
          )}
          {error && (
            <div
              className="alert alert-dismissible mb-24 px-20 py-12 radius-8"
              role="alert"
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626' }}
            >
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={(e) => (e.currentTarget.closest('.alert') as HTMLElement)?.remove()}
              />
            </div>
          )}
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

export default function AdminLayout({ children, msg, error }: { children: ReactNode; msg?: string; error?: string }) {
  return (
    <SidebarProvider>
      <Layout msg={msg} error={error}>{children}</Layout>
    </SidebarProvider>
  )
}
