import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { type AuthUser, getMe } from '../api/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  refetch: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refetch: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = () => {
    setLoading(true)
    getMe()
      .then(setUser)
      .catch(() => setUser({ authenticated: false }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUser() }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
