// [woo] 인증 상태 전역 관리 Context
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthUser, getMe, login as apiLogin, logout as apiLogout, LoginRequest } from "@/api/auth";
import { registerLocalNotifications, unregisterLocalNotifications, saveBaseUrl } from "@/utils/notifications";
import { BASE_URL } from "@/api/client";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const me = await getMe();
      setUser(me.authenticated ? me : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // [woo] 로그인 완료 → saveBaseUrl 먼저 → FCM 토큰 등록
  useEffect(() => {
    if (user?.authenticated) {
      (async () => {
        await saveBaseUrl(BASE_URL);
        await registerLocalNotifications();
      })().catch((e) => console.warn("[woo] 알림 등록 실패:", e));
    }
  }, [user?.authenticated]);

  useEffect(() => {
    refresh();
  }, []);

  const login = async (data: LoginRequest) => {
    await apiLogin(data);
    await refresh();
  };

  const logout = async () => {
    await apiLogout();
    await unregisterLocalNotifications();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
