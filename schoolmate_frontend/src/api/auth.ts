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

/** SchoolAdminGrant 항목 — SUPER_ADMIN은 schoolId/schoolName 없음 */
export type GrantInfo = {
  grantedRole: string;
  schoolId?: number;
  schoolName?: string;
  schoolCode?: string;
  schoolKind?: string;
  officeOfEducation?: string;
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
  /** grants가 하나라도 있으면 true (어드민 페이지 진입 가능 여부) */
  hasAdminAccess?: boolean;
  /** GrantedRole 목록 (ADMIN이면 SUPER_ADMIN 포함, 그 외 SchoolAdminGrant 레코드) */
  grants?: GrantInfo[];
  /** 역할 신청 목록 (Hub 카드 상태 표시용) */
  roleRequests?: RoleRequestInfo[];
  /** 소셜 로그인 제공자 (null=이메일, "google", "kakao") */
  provider?: string | null;
  /** 프로필 이미지 URL */
  profileImageUrl?: string | null;
};

/** Hub 역할 인스턴스 (role-contexts API 응답) */
export type RoleContext = {
  infoId: number;
  roleType: string;
  schoolId: number | null;
  schoolName: string | null;
  status: string;
  statusDesc: string;
  isPrimary: boolean;
  isActive: boolean;
};

export async function getMe(): Promise<AuthUser> {
  const res = await api.get<AuthUser>("/auth/me");
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

/** 현재 유저의 모든 역할 인스턴스 목록 조회 */
export async function getRoleContexts(): Promise<RoleContext[]> {
  const res = await api.get<{ contexts: RoleContext[] }>("/auth/role-contexts");
  return res.data.contexts;
}

/** 다른 역할 인스턴스로 컨텍스트 전환 → 새 JWT 쌍 반환 */
export async function switchContext(
  infoId: number,
  role: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await api.post<{ accessToken: string; refreshToken: string }>(
    "/auth/switch-context",
    { infoId, role }
  );
  return res.data;
}

/** 역할 인스턴스를 primary(메인)로 지정 */
export async function setPrimaryRole(infoId: number, role: string): Promise<void> {
  await api.patch("/auth/primary-role", { infoId, role });
}

export default api;
