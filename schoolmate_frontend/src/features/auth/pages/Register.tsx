import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/shared/api/authApi";
import { useAuth } from "@/shared/contexts/AuthContext";
import { auth } from "@/shared/api/auth";
import MainFooter from "@/shared/components/layout/MainFooter";
import "@/shared/styles/register.css";

const roleLabels: Record<string, string> = {
  TEACHER: "교사",
  STUDENT: "학생",
  PARENT: "학부모",
};

const formatCountdown = (sec: number) => {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// 회원가입 3단계: 기본 정보 폼 입력
// state: { role, schoolId?, schoolName? } — SelectInfo / RegisterSchoolSelect 에서 전달
export default function Register() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    role?: string;
    schoolId?: number;
    schoolName?: string;
  } | null;

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
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      setScale(
        Math.min(1, window.innerHeight / containerRef.current.scrollHeight),
      );
    };
    const timer = setTimeout(update, 0);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", update);
    };
  }, [error, success]);

  // 이메일 인증 관련 상태
  const [emailVerificationRequired, setEmailVerificationRequired] =
    useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [verifyMsg, setVerifyMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  // 시스템 설정 로드 (인증 필요 여부)
  useEffect(() => {
    api
      .get("/auth/settings")
      .then((res) =>
        setEmailVerificationRequired(res.data.emailVerificationEnabled ?? true),
      )
      .catch(() => {}); // 실패 시 true(인증 필요)가 기본값 유지
  }, []);

  // 카운트다운 타이머
  useEffect(() => {
    if (!codeSent) return;
    const SECONDS = 5 * 60;
    setCountdown(SECONDS);
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 이메일 변경 시 인증 상태 초기화
  useEffect(() => {
    setEmailVerified(false);
    setCodeSent(false);
    setVerificationCode("");
    setVerifyMsg(null);
    setCountdown(0);
  }, [form.email]);

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
      formatted =
        digits.slice(0, 3) +
        "-" +
        digits.slice(3, 7) +
        "-" +
        digits.slice(7, 11);
    }
    setForm((prev) => ({ ...prev, phoneNumber: formatted }));
  };

  const handleSendCode = async () => {
    if (!form.email) return;
    setSendingCode(true);
    setVerifyMsg(null);
    try {
      await api.post("/auth/register/email/send-code", { email: form.email });
      setCodeSent(true);
      setTimerKey((k) => k + 1);
      setVerifyMsg({ text: "인증 코드가 발송되었습니다.", ok: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setVerifyMsg({ text: msg ?? "코드 발송에 실패했습니다.", ok: false });
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) return;
    setVerifyingCode(true);
    setVerifyMsg(null);
    try {
      await api.post("/auth/register/email/verify", {
        email: form.email,
        code: verificationCode,
      });
      setEmailVerified(true);
      setVerifyMsg({ text: "이메일 인증이 완료되었습니다.", ok: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setVerifyMsg({ text: msg ?? "인증에 실패했습니다.", ok: false });
    } finally {
      setVerifyingCode(false);
    }
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

      const res = await api.post<{
        accessToken: string;
        refreshToken: string;
        role: string;
      }>("/auth/register", body);
      const { accessToken, refreshToken } = res.data;
      auth.setTokens(accessToken, refreshToken);
      document.cookie = `accessToken=${accessToken}; path=/; SameSite=Strict`;

      setSuccess("회원가입이 완료되었습니다. 잠시만 기다려 주세요.");
      setTimeout(() => {
        window.location.href = "/hub";
      }, 1000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      if (
        (err as { response?: { status?: number } })?.response?.status === 409
      ) {
        setError(msg ?? "이미 사용 중인 이메일입니다.");
      } else {
        setError(msg ?? "회원가입에 실패했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  const submitDisabled =
    loading || (emailVerificationRequired && !emailVerified);

  return (
    <>
      <div
        style={{ height: "100dvh", overflow: "hidden", background: "#ffffff" }}
      >
        <div
          className="register-container"
          ref={containerRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
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
                <i className="ri-arrow-left-line" />
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
                <i className="ri-checkbox-circle-fill me-1" />
                사용자 유형 : {roleLabels[role] ?? role}
                {schoolName && (
                  <>
                    &nbsp; &nbsp;
                    <i className="ri-building-line me-1" />
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
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                {/* 이메일 + 인증 */}
                <div className="mb-3">
                  <label className="form-label">이메일 *</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="email"
                      className="form-control"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                    {emailVerificationRequired && !emailVerified && (
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={!form.email || sendingCode}
                        style={{
                          whiteSpace: "nowrap",
                          padding: "0 14px",
                          borderRadius: 8,
                          border: "none",
                          background:
                            !form.email || sendingCode
                              ? "#e5e7eb"
                              : "#25a194",
                          color:
                            !form.email || sendingCode ? "#9ca3af" : "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor:
                            !form.email || sendingCode
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {sendingCode
                          ? "발송 중..."
                          : codeSent
                            ? "재발송"
                            : "인증 코드 발송"}
                      </button>
                    )}
                    {emailVerified && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          color: "#16a34a",
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <i className="ri-checkbox-circle-fill" />
                        인증 완료
                      </span>
                    )}
                  </div>

                  {/* 코드 입력 영역 */}
                  {emailVerificationRequired && codeSent && !emailVerified && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <input
                        type="text"
                        className="form-control"
                        placeholder="6자리 코드 입력"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) =>
                          setVerificationCode(e.target.value.replace(/\D/g, ""))
                        }
                        style={{
                          letterSpacing: 4,
                          textAlign: "center",
                          fontWeight: 700,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          color:
                            countdown === 0
                              ? "#9ca3af"
                              : countdown <= 60
                                ? "#ef4444"
                                : "#6b7280",
                        }}
                      >
                        {countdown > 0 ? formatCountdown(countdown) : "만료됨"}
                      </span>
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={
                          verificationCode.length !== 6 ||
                          countdown === 0 ||
                          verifyingCode
                        }
                        style={{
                          whiteSpace: "nowrap",
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: "none",
                          background:
                            verificationCode.length !== 6 ||
                            countdown === 0 ||
                            verifyingCode
                              ? "#e5e7eb"
                              : "#25a194",
                          color:
                            verificationCode.length !== 6 ||
                            countdown === 0 ||
                            verifyingCode
                              ? "#9ca3af"
                              : "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor:
                            verificationCode.length !== 6 ||
                            countdown === 0 ||
                            verifyingCode
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {verifyingCode ? "확인 중..." : "확인"}
                      </button>
                    </div>
                  )}

                  {/* 인증 메시지 */}
                  {verifyMsg && (
                    <p
                      style={{
                        marginTop: 6,
                        marginBottom: 0,
                        fontSize: 12,
                        color: verifyMsg.ok ? "#16a34a" : "#ef4444",
                      }}
                    >
                      {verifyMsg.text}
                    </p>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">비밀번호 *</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, password: e.target.value }))
                    }
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
                  disabled={submitDisabled}
                  style={{
                    background: submitDisabled
                      ? "#e5e7eb"
                      : "var(--primary-500, #25a194)",
                    color: submitDisabled ? "#9ca3af" : "#fff",
                    borderRadius: 20,
                    boxShadow: submitDisabled
                      ? "none"
                      : "0 4px 15px rgba(37, 161, 148, 0.3)",
                    cursor: submitDisabled ? "not-allowed" : "pointer",
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
