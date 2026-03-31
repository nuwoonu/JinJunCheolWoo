import { useEffect, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import AdminSidebar from '@/components/layout/admin/AdminSidebar'
import AdminHeader from '@/components/layout/admin/AdminHeader'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { useSchool } from '@/context/SchoolContext'
import { useAuth } from '@/contexts/AuthContext'
import { ADMIN_ROUTES } from '@/constants/routes'
import PageLoader from '@/components/PageLoader'

function Layout({ children, msg, error, requireSchool = true }: { children: ReactNode; msg?: string; error?: string; requireSchool?: boolean }) {
  const { isOpen, isCollapsed, closeSidebar } = useSidebar()
  const { selectedSchool, setSelectedSchool } = useSchool()
  const { user, loading } = useAuth()

  const isSuperAdmin = user?.roles?.includes('ADMIN') || user?.role === 'ADMIN'
  const firstGrant = !isSuperAdmin ? user?.grants?.find(g => g.schoolId) : undefined

  // 그랜트 보유자 자동 학교 선택 (setState는 렌더 중 호출 불가라 useEffect 유지)
  useEffect(() => {
    if (!requireSchool || selectedSchool || !firstGrant) return
    setSelectedSchool({
      id: firstGrant.schoolId!,
      name: firstGrant.schoolName!,
      schoolCode: firstGrant.schoolCode ?? '',
      schoolKind: firstGrant.schoolKind ?? '',
      officeOfEducation: firstGrant.officeOfEducation ?? '',
    })
  }, [requireSchool, selectedSchool, firstGrant, setSelectedSchool])

  // 인증 로딩 중 — 스피너로 대기
  if (loading) return <PageLoader />

  // 학교 선택 필요한 경우 — 렌더 타임에 즉시 처리 (useEffect 지연 없음)
  if (requireSchool && !selectedSchool) {
    if (firstGrant) return <PageLoader /> // 자동 선택 useEffect 처리 중
    return <Navigate to={ADMIN_ROUTES.SCHOOL_SELECT} replace />
  }

  return (
    <>
      <AdminHeader />
      <div className={`body-overlay${isOpen ? ' show' : ''}`} onClick={closeSidebar} />
      <AdminSidebar />
      <main className={`dashboard-main${isCollapsed ? ' active' : ''}`}>
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
