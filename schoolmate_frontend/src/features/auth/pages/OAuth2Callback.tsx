import { useEffect, useState } from "react";
import { auth } from '@/shared/api/auth';

// [woo] OAuth2 소셜 로그인 콜백 페이지
// 백엔드가 리다이렉트한 URL: /oauth2/callback?accessToken=...&refreshToken=...&role=...
export default function OAuth2Callback() {
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const role = params.get("role");
    const error = params.get("error");

    if (error) {
      setErrorMsg("소셜 로그인 중 오류가 발생했습니다: " + error);
      setStatus("error");
      return;
    }

    if (!accessToken || !refreshToken || !role) {
      setErrorMsg("로그인 정보가 올바르지 않습니다.");
      setStatus("error");
      return;
    }

    auth.setTokens(accessToken, refreshToken);

    // GUEST는 역할 선택 페이지로, 나머지는 Hub로 이동
    if (role === "GUEST") {
      window.location.href = "/select-info?source=sns";
    } else {
      window.location.href = "/hub";
    }
  }, []);

  if (status === "error") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={styles.title}>로그인 실패</h2>
          <p style={styles.message}>{errorMsg}</p>
          <a href="/login" style={styles.btn}>
            로그인 페이지로 이동
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.spinner}></div>
        <p style={styles.message}>로그인 처리 중...</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#f3f4f6",
  },
  card: {
    background: "white",
    borderRadius: 12,
    padding: "48px 40px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    textAlign: "center",
    maxWidth: 400,
    width: "100%",
  },
  title: { color: "#111827", marginBottom: 8, fontSize: 20 },
  message: { color: "#6b7280", marginBottom: 24, fontSize: 15 },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #e5e7eb",
    borderTop: "3px solid #25A194",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto 20px",
  },
  btn: {
    display: "inline-block",
    background: "#25A194",
    color: "white",
    padding: "10px 24px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
  },
};
