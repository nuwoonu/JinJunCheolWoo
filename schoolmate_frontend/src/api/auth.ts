import axios from "axios";
import { auth } from '@/shared/auth';

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

export type RoleRequestInfo = {
  role: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  schoolId?: number | string;
  schoolName?: string;
};

export type AuthUser = {
  authenticated: boolean;
  uid?: number;
  email?: string;
  name?: string;
  /** primary role (기존 호환용) */
  role?: string;
  /** 보유한 모든 역할 목록 */
  roles?: string[];
  /** ADMIN 역할이거나 SchoolAdminGrant 보유 시 true */
  hasAdminAccess?: boolean;
  /** 역할 신청 목록 (Hub 카드 상태 표시용) */
  roleRequests?: RoleRequestInfo[];
};

export async function getMe(): Promise<AuthUser> {
  const res = await api.get<AuthUser>("/auth/me");
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export default api;
