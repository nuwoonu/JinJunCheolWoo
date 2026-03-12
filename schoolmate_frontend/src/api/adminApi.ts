// [joon] 관리자 API - /api/admin/* 호출 (vite proxy: /api → 8080)
import axios from "axios";
import { auth } from "../shared/auth";

const BASE = "/api/admin";

// axios 인스턴스 - auth 유틸리티를 통한 JWT 자동 첨부
const admin = axios.create({ baseURL: BASE });

admin.interceptors.request.use((cfg) => {
  const token = auth.getAccessToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

admin.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = auth.getRefreshToken();
      if (refresh) {
        try {
          const res = await axios.post("/api/auth/refresh", {
            refreshToken: refresh,
          });
          const newToken = res.data.accessToken;
          auth.setTokens(newToken, res.data.refreshToken || refresh);
          err.config.headers.Authorization = `Bearer ${newToken}`;
          return admin.request(err.config);
        } catch {
          auth.clearTokens();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  },
);

export default admin;
