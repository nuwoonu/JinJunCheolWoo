// [woo] 인증 API (로그인, 로그아웃, 내 정보)
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/api/client";

export type AuthUser = {
  authenticated: boolean;
  uid?: number;
  email?: string;
  name?: string;
  role?: string;
  phoneNumber?: string; // [woo] 역할별 Info 엔티티 phone (로그인 시 /auth/me 응답)
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

// [woo] 로그인 → 토큰 저장
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/login", data);
  const { accessToken, refreshToken } = res.data;
  await AsyncStorage.setItem("accessToken", accessToken);
  await AsyncStorage.setItem("refreshToken", refreshToken);
  return res.data;
}

// [woo] 내 정보 조회
export async function getMe(): Promise<AuthUser> {
  const res = await api.get<AuthUser>("/auth/me");
  return res.data;
}

// [woo] 로그아웃 → 토큰 삭제
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
  }
}
