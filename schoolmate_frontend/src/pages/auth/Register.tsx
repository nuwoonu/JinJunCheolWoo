import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/shared/auth";
import MainFooter from "@/components/layout/MainFooter";
import "../../styles/register.css";

const roleLabels: Record<string, string> = {
  TEACHER: "교사",
  STUDENT: "학생",
  PARENT: "학부모",
};

// 회원가입 3단계: 기본 정보 폼 입력
// state: { role, schoolId?, schoolName? } — SelectInfo / RegisterSchoolSelect 에서 전달
export default function Register() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { role?: string; schoolId?: number; schoolName?: string } | null;

  useEffect(() => {
    if (!authLoading && user?.authenticated && user.role) {
      window.location.href = "/hub";
    }
  }, [user, authLoading]);

  const role = state?.role ?? "";
  const schoolId = state?.schoolId ?? null;
  const schoolName = state?.schoolName ?? null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", phoneNumber: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      setScale(Math.min(1, window.innerHeight / containerRef.current.scrollHeight));
    };
    const timer = setTimeout(update, 0);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", update);
    };
  }, [error, success]);

  // role이 없으면 select-info로 보냄
  if (!authLoading && !role) {
    window.location.replace("/select-info?source=email");
    return null;
  }

  const handlePhoneInput = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    let formatted = digits;
    if (digits.length > 3 && digits.length <= 7) {
      formatted = digits.slice(0, 3) + "-" + digits.slice(3);
    } else if (digits.length > 7) {
      formatted = digits.slice(0, 3) + "-" + digits.slice(3, 7) + "-" + digits.slice(7, 11);
    }
    setForm((prev) => ({ ...prev, phoneNumber: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const body: Record<string, string | number> = {
        name: form.name,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber,
        role,
      };
      if (schoolId) body.schoolId = schoolId;

      const res = await api.post<{ accessToken: string; refreshToken: string; role: string }>("/auth/register", body);
      const { accessToken, refreshToken, role: _returnedRole } = res.data;
      auth.setTokens(accessToken, refreshToken);
      document.cookie = `accessToken=${accessToken}; path=/; SameSite=Strict`;

      setSuccess("회원가입이 완료되었습니다. 잠시만 기다려 주세요.");
      setTimeout(() => {
        window.location.href = "/hub";
      }, 1000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if ((err as { response?: { status?: number } })?.response?.status === 409) {
        setError(msg ?? "이미 사용 중인 이메일입니다.");
      } else {
        setError(msg ?? "회원가입에 실패했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <>
      <div style={{ height: "100dvh", overflow: "hidden", background: "#ffffff" }}>
        <div
          className="register-container"
          ref={containerRef}
          style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
        >
          {/* 왼쪽 상단 로고 */}
          <a href="/main" className="register-logo">
            <img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" />
          </a>

          {/* 폼 중앙 배치 */}
          <div className="register-body">
            <div className="register-form">
              <div className="mobile-logo">
                <a href="/main">
                  <img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" />
                </a>
              </div>

              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  color: "#666",
                  fontSize: 14,
                  cursor: "pointer",
                  padding: "4px 0",
                  marginBottom: 16,
                }}
              >
                <i className="fa-solid fa-arrow-left" />
                이전으로
              </button>

              <div className="text-center mb-4">
                <h2 className="register-title">기본 정보 입력</h2>
              </div>

              {/* 선택된 역할 / 학교 표시 */}
              <div
                style={{
                  marginBottom: 8,
                  padding: "10px 16px",
                  fontSize: 17,
                  color: "#25a194",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                <i className="fa-solid fa-circle-check me-1" />
                사용자 유형 : {roleLabels[role] ?? role}
                {schoolName && (
                  <>
                    &nbsp; &nbsp;
                    <i className="fa-solid fa-building me-1" />
                    {schoolName}
                  </>
                )}
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">이름 *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">이메일 *</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">비밀번호 *</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">전화번호</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="010-0000-0000"
                    value={form.phoneNumber}
                    onChange={(e) => handlePhoneInput(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn w-100"
                  disabled={loading}
                  style={{
                    background: "#25a194",
                    color: "#fff",
                    padding: "16px 24px",
                    borderRadius: 12,
                    boxShadow: "0 4px 15px rgba(37, 161, 148, 0.3)",
                    marginTop: 16,
                  }}
                >
                  {loading ? "가입 중..." : "가입하기"}
                </button>
              </form>

              <div className="login-link" style={{ marginTop: 16 }}>
                이미 계정이 있으신가요? <a href="/login">로그인하기</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MainFooter />
    </>
  );
}
