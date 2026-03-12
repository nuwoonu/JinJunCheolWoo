import axios from "axios";
import { auth } from "../shared/auth";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// localStorage의 JWT를 Authorization 헤더에 자동 추가
api.interceptors.request.use((config) => {
  const token = auth.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type AuthUser = {
  authenticated: boolean;
  uid?: number;
  email?: string;
  name?: string;
  role?: string;
};

export async function getMe(): Promise<AuthUser> {
  const res = await api.get<AuthUser>("/auth/me");
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export default api;
