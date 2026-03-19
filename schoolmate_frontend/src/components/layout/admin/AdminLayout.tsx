import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '@/components/layout/admin/AdminSidebar'
import AdminHeader from '@/components/layout/admin/AdminHeader'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { useSchool } from '@/context/SchoolContext'
import { useAuth } from '@/contexts/AuthContext'
import { ADMIN_ROUTES } from '@/constants/routes'

function Layout({ children, msg, error, requireSchool = true }: { children: ReactNode; msg?: string; error?: string; requireSchool?: boolean }) {
  const { isOpen, isCollapsed, closeSidebar } = useSidebar()
  const { selectedSchool, setSelectedSchool } = useSchool()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!requireSchool || selectedSchool) return

    const isSuperAdmin = user?.roles?.includes('ADMIN') || user?.role === 'ADMIN'
    if (!isSuperAdmin) {
      // 그랜트 보유자는 첫 번째 그랜트 학교를 자동 선택
      const firstGrant = user?.grants?.find(g => g.schoolId)
      if (firstGrant?.schoolId && firstGrant.schoolName) {
        setSelectedSchool({
          id: firstGrant.schoolId,
          name: firstGrant.schoolName,
          schoolCode: firstGrant.schoolCode ?? '',
          schoolKind: firstGrant.schoolKind ?? '',
          officeOfEducation: firstGrant.officeOfEducation ?? '',
        })
        return
      }
    }

    navigate(ADMIN_ROUTES.SCHOOL_SELECT, { replace: true })
  }, [requireSchool, selectedSchool, user, setSelectedSchool, navigate])

  return (
    <>
      <AdminHeader />
      <div className={`body-overlay${isOpen ? ' show' : ''}`} onClick={closeSidebar} />
      <AdminSidebar />
      <main className={`dashboard-main${isCollapsed ? ' active' : ''}`} style={{ paddingTop: '4.5rem' }}>
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

export default function AdminLayout({ children, msg, error, requireSchool = true }: { children: ReactNode; msg?: string; error?: string; requireSchool?: boolean }) {
  return (
    <SidebarProvider>
      <Layout msg={msg} error={error} requireSchool={requireSchool}>{children}</Layout>
    </SidebarProvider>
  )
}
