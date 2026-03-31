import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { getMe } from "@/api/auth";
import { auth } from "@/shared/auth";
import MainFooter from "@/components/layout/MainFooter";

// 이메일 가입: /select-info?source=email → 역할 선택 → 학교 선택 or 폼 입력
// SNS 가입:   /select-info?source=sns  → 역할 선택 → 학교 선택 or 가입 완료
// Hub 역할 추가: /select-info?source=hub → 동일 플로우 진행
export default function SelectInfo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") ?? "sns";

  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasParent, setHasParent] = useState(false);

  // 기존 학부모 역할 여부 확인 (신규 이메일 가입 제외)
  useEffect(() => {
    if (source === "email") return;
    getMe()
      .then((me) => {
        const parentExists =
          me.roleRequests?.some((r) => r.role === "PARENT" && (r.status === "ACTIVE" || r.status === "PENDING")) ??
          false;
        setHasParent(parentExists);
      })
      .catch(() => {});
  }, [source]);

  const allRoles = [
    {
      value: "STUDENT",
      label: "학생",
      icon: "fa-solid fa-graduation-cap",
      desc: "수업 시간표, 성적, 출결 현황을 확인할 수 있습니다.",
    },
    {
      value: "TEACHER",
      label: "교사",
      icon: "fa-solid fa-chalkboard-user",
      desc: "학급 관리, 성적 입력 및 수정, 출결 및 게시판 관리를 할 수 있습니다.",
    },
    {
      value: "PARENT",
      label: "학부모",
      icon: "fa-solid fa-people-roof",
      desc: "자녀의 학교 생활, 성적, 알림을 확인할 수 있습니다.",
    },
  ];

  // 학부모는 이미 보유 중이면 목록에서 제외
  const roles = allRoles.filter((r) => !(r.value === "PARENT" && hasParent));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError("");

    try {
      if (source === "email") {
        // 이메일 가입: API 호출 없이 다음 단계로 이동
        if (selected === "PARENT") {
          navigate("/register", { state: { role: "PARENT" } });
        } else {
          navigate("/register/school-select", { state: { role: selected, source: "email" } });
        }
        setLoading(false);
        return;
      }

      // SNS 가입 / Hub 역할 추가
      if (selected === "PARENT") {
        // 학부모: 학교 선택 없이 바로 역할 확정
        const res = await api.post<{ accessToken?: string; refreshToken?: string; role?: string; status: string }>(
          "/auth/select-role",
          { role: selected },
        );
        // 슈퍼 어드민은 즉시 활성화 → 새 토큰 교체. 일반 사용자는 PENDING → 토큰 유지
        if (res.data.status !== "pending" && res.data.accessToken && res.data.refreshToken) {
          auth.setTokens(res.data.accessToken, res.data.refreshToken);
        }
        navigate("/hub");
      } else {
        // 교사/학생: 학교 선택 단계로 이동
        navigate("/register/school-select", { state: { role: selected, source: source === "hub" ? "hub" : "sns" } });
        setLoading(false);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? "처리 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ height: "100dvh", overflow: "hidden", background: "#ffffff" }}>
        <div className="register-container" style={{ height: "100%" }}>
          {/* 왼쪽 상단 로고 */}
          <a href="/main" className="register-logo">
            <img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" />
          </a>

          {/* 폼 중앙 배치 */}
          <div className="register-body">
            <div className="register-form" style={{ maxWidth: 960 }}>
              <div className="mobile-logo">
                <a href="/main">
                  <img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" />
                </a>
              </div>

              <button
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

              <div className="text-center" style={{ marginBottom: 70 }}>
                <h2 className="register-title">{source === "email" ? "회원가입" : "환영합니다! 👋"}</h2>
                <p style={{ color: "#666", fontSize: 17, margin: 0 }}>사용자 유형을 선택해 주세요.</p>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                {/* [soojin] 역할 카드 가로 배열 */}
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 0 }}>
                  {roles.map((role) => (
                    <div
                      key={role.value}
                      onClick={() => setSelected(role.value)}
                      style={{
                        flex: "1 1 220px",
                        border: `2px solid ${selected === role.value ? "var(--primary-500, #25A194)" : "var(--neutral-200)"}`,
                        borderRadius: 16,
                        padding: 24,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        background:
                          selected === role.value
                            ? "linear-gradient(135deg, rgba(37,161,148,0.07), rgba(37,161,148,0.13))"
                            : "var(--white)",
                        boxShadow:
                          selected === role.value ? "0 4px 12px rgba(37,161,148,0.18)" : "0 1px 4px rgba(0,0,0,0.07)",
                      }}
                    >
                      <div style={{ fontSize: 32, marginBottom: 12, color: "var(--primary-500, #25A194)" }}>
                        <i className={role.icon}></i>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#333" }}>{role.label}</div>
                      <div style={{ fontSize: 14, color: "#666" }}>{role.desc}</div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!selected || loading}
                  style={{
                    display: "block",
                    width: "calc((100% - 32px) / 3)",
                    margin: "50px auto 0",
                    padding: "16px 24px",
                    border: "none",
                    borderRadius: 12,
                    background: !selected || loading ? "#ccc" : "#25A194",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: !selected || loading ? "not-allowed" : "pointer",
                    textAlign: "center",
                    transition: "all 0.3s ease",
                  }}
                >
                  {loading ? "처리 중..." : selected === "PARENT" && source === "sns" ? "선택 완료" : "다음"}
                </button>
              </form>

              {source === "email" && (
                <div className="login-link" style={{ marginTop: 16 }}>
                  이미 계정이 있으신가요? <a href="/login">로그인하기</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <MainFooter />
    </>
  );
}
