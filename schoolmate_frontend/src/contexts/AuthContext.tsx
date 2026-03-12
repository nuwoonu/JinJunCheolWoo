import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { type AuthUser, getMe, logout as apiLogout } from "../api/auth";
import { auth } from "../shared/auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refetch: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refetch: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(() => {
    setLoading(true);
    getMe()
      .then(setUser)
      .catch(() => setUser({ authenticated: false }))
      .finally(() => setLoading(false));
  }, []);

  // 로그아웃: 백엔드 refresh token 삭제 → 클라이언트 토큰 정리 → 로그인 페이지 이동
  const signOut = useCallback(() => {
    apiLogout()
      .catch(() => {})
      .finally(() => {
        auth.clearTokens();
        window.location.href = "/login";
      });
  }, []);

  useEffect(() => {
    fetchUser();

    // bfcache에서 페이지 복원 시(브라우저 뒤로가기/앞으로가기) 인증 상태 재확인
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        fetchUser();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, refetch: fetchUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
