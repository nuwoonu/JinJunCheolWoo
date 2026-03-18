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
    // roles 배열 우선, 없으면 role(단일) 폴백
    const userRoles = user.roles && user.roles.length > 0
      ? user.roles
      : user.role ? [user.role] : []

    const hasAccess = userRoles.some(r => allowedRoles.includes(r))
    if (!hasAccess) return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
