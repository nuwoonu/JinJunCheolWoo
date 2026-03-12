// [woo] JWT 토큰 관리 유틸리티
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const auth = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    // [woo] 브라우저 페이지 이동 시 JwtAuthFilter가 읽을 수 있도록 쿠키에도 저장
    document.cookie = `accessToken=${accessToken}; path=/; SameSite=Strict`;
  },

  clearTokens: (): void => {
    // [woo] 인증과 관련된 특정 키만 제거하여 다크모드 등 사용자 설정은 보존합니다.
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    // [woo] 쿠키 삭제 시 설정했던 path와 SameSite를 명시해야 브라우저가 확실히 삭제합니다.
    document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
  },

  isLoggedIn: (): boolean => !!localStorage.getItem(ACCESS_TOKEN_KEY),
};
