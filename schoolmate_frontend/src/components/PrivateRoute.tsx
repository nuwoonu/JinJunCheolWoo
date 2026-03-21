import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import PageLoader from '@/components/PageLoader'

interface Props {
  children: React.ReactNode
  allowedRoles?: string[]
  /**
   * 어드민 페이지 전용: 접근에 필요한 GrantedRole 목록 (adminPermissions.ts의 ADMIN_GRANTS 사용)
   * - ADMIN role(UserRole.ADMIN) 사용자는 requiredGrants 체크 없이 항상 통과
   * - GrantedRole 위임 권한자는 user.grants에서 일치하는 항목이 있어야 접근 가능
   * - allowedRoles와 함께 사용 시 role 또는 grant 둘 중 하나라도 만족하면 통과
   */
  requiredGrants?: readonly string[]
}

export default function PrivateRoute({ children, allowedRoles, requiredGrants }: Props) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!user?.authenticated) return <Navigate to="/login" replace />

  const userRoles = user.roles && user.roles.length > 0
    ? user.roles
    : user.role ? [user.role] : []

  const isSuperAdmin = userRoles.includes('ADMIN')

  // role 기반 체크
  if (allowedRoles) {
    const hasRoleAccess = userRoles.some(r => allowedRoles.includes(r))
    // allowedRoles에 ADMIN이 포함된 경우, GrantedRole 보유자도 접근 허용 (기존 호환)
    const hasGrantAccess = allowedRoles.includes('ADMIN') && !!user.hasAdminAccess
    if (!hasRoleAccess && !hasGrantAccess) return <Navigate to="/unauthorized" replace />
  }

  // grant 기반 세분화 체크 (어드민 페이지 전용)
  if (requiredGrants) {
    // ADMIN role은 모든 어드민 페이지 접근 허용
    if (!isSuperAdmin) {
      const userGrantRoles = (user.grants ?? []).map(g => g.grantedRole)
      const hasGrantAccess = userGrantRoles.some(g => requiredGrants.includes(g))
      if (!hasGrantAccess) return <Navigate to="/unauthorized" replace />
    }
  }

  return <>{children}</>
}
