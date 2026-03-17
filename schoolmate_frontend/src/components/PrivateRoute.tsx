import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function PrivateRoute({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user?.authenticated) return <Navigate to="/login" replace />
  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
