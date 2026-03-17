import { useState, useEffect } from "react";
import api from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_ROUTES } from "@/constants/routes";
import "../../styles/login.css";

const roleRedirects: Record<string, string> = {
  ADMIN: ADMIN_ROUTES.MAIN,
  TEACHER: "/teacher/dashboard",
  STUDENT: "/student/dashboard",
  PARENT: "/parent/dashboard",
};

export default function Login() {
  // [woo] 이미 로그인된 상태면 해당 대시보드로 자동 리다이렉트
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    // [woo] authLoading 완료 후 체크 (로딩 중엔 user가 null이라 오탐 방지)
    // [woo] 로그아웃 후 /login 접근 시: 토큰 없음 → getMe() unauthenticated → 조건 미충족 → 리다이렉트 안 함
    if (!authLoading && user?.authenticated && user.role) {
      window.location.href = roleRedirects[user.role] ?? "/";
    }
  }, [user, authLoading]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // [woo] @가 없으면 학부모 전화번호 로그인 → 자동으로 @schoolmate.kr 붙임
      const loginEmail = email.includes("@") ? email : email + "@schoolmate.kr";
      const res = await api.post<{ accessToken: string; refreshToken: string; role: string }>("/auth/login", {
        email: loginEmail,
        password,
      });
      const { accessToken, refreshToken, role } = res.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      // [woo] 브라우저 페이지 이동 시 JwtAuthFilter가 읽을 수 있도록 쿠키에도 저장
      document.cookie = `accessToken=${accessToken}; path=/; SameSite=Strict`;

      const roleRedirects: Record<string, string> = {
        ADMIN: ADMIN_ROUTES.MAIN,
        TEACHER: "/teacher/dashboard",
        STUDENT: "/student/dashboard",
        PARENT: "/parent/dashboard",
      };
      // [woo] role에 해당하는 경로가 없으면(null/undefined) 기본값 '/'로 이동
      window.location.href = roleRedirects[role] ?? "/";
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-container">
        {/* 왼쪽 - 로고 */}
        <div className="login-left">
          <img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" />
        </div>

        {/* 오른쪽 - 폼 */}
        <div className="login-right">
          <div className="login-form-wrapper">
            {/* 모바일 로고 */}
            <div className="mobile-logo">
              <img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="error-message">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>{error}</span>
              </div>
            )}

            {/* 로그인 폼 */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  이메일
                </label>
                <input
                  type="text"
                  id="email"
                  className="form-input"
                  placeholder="이메일 또는 전화번호를 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  비밀번호
                </label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="form-input"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword((prev) => !prev)}>
                    <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>

              <div className="form-options">
                <div className="form-check">
                  <input type="checkbox" id="remember" className="form-check-input" />
                  <label htmlFor="remember" className="form-check-label">
                    로그인 상태 유지
                  </label>
                </div>
                <a href="#" className="forgot-link">
                  비밀번호 찾기
                </a>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>

            {/* 구분선 */}
            <div className="divider">
              <span>또는</span>
            </div>

            {/* 소셜 로그인 */}
            <div className="social-buttons">
              <a href="/oauth2/authorization/google" className="btn-social">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                구글로 계속하기
              </a>
              <a href="/oauth2/authorization/kakao" className="btn-social btn-kakao">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.718 1.805 5.104 4.516 6.441-.199.748-.72 2.712-.825 3.131-.129.516.189.508.398.37.164-.109 2.612-1.773 3.674-2.492.717.099 1.455.151 2.237.151 5.523 0 10-3.463 10-7.691S17.523 3 12 3z" />
                </svg>
                카카오톡으로 계속하기
              </a>
            </div>

            <div className="register-link">
              계정이 없으신가요? <a href="/register">회원가입</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
