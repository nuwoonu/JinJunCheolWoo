import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function PrivateRoute({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user?.authenticated) return <Navigate to="/login" replace />

  if (allowedRoles) {
    const userRoles = user.roles && user.roles.length > 0
      ? user.roles
      : user.role ? [user.role] : []

    const hasRoleAccess = userRoles.some(r => allowedRoles.includes(r))
    // allowedRoles에 ADMIN이 포함된 경우, GrantedRole 보유자도 어드민 페이지 접근 허용
    const hasGrantAccess = allowedRoles.includes('ADMIN') && !!user.hasAdminAccess

    if (!hasRoleAccess && !hasGrantAccess) return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
