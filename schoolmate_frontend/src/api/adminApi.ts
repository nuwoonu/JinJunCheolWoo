// [joon] 관리자 API - /api/admin/* 호출 (vite proxy: /api → 8080)
import axios from "axios";

const BASE = "/api/admin";

// axios 인스턴스 - localStorage JWT 자동 첨부
const admin = axios.create({ baseURL: BASE });

admin.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("accessToken");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

admin.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem("refreshToken");
      if (refresh) {
        try {
          const res = await axios.post("/api/auth/refresh", {
            refreshToken: refresh,
          });
          const newToken = res.data.accessToken;
          localStorage.setItem("accessToken", newToken);
          err.config.headers.Authorization = `Bearer ${newToken}`;
          return admin.request(err.config);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  },
);

export default admin;
