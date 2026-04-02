import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_ROUTES } from "@/constants/routes";
import api from "@/api/auth";
import AdminTopBar from "@/components/layout/admin/AdminTopBar";

interface SeedResult {
  [key: string]: unknown;
}

export default function TestMode() {
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    if (
      !window.confirm(
        "테스트 데이터를 생성합니다.\n이미 존재하는 데이터는 건너뜁니다.\n계속하시겠습니까?"
      )
    )
      return;

    setSeeding(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post<SeedResult>("/admin/test/seed");
      setResult(res.data);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "데이터 생성 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div>
      <AdminTopBar position="sticky" showBackButton showLogo />

      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "40px 24px",
          boxSizing: "border-box",
        }}
      >
        {/* 헤더 */}
        <div className="mb-32">
          <button
            type="button"
            onClick={() => navigate(ADMIN_ROUTES.MAIN)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              fontSize: 14,
              padding: 0,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <i className="ri-arrow-left-line" /> 관리자 메인으로
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i className="ri-flask-line" style={{ fontSize: 20, color: "#fff" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
                테스트 데이터 생성
              </h3>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                개발·테스트 환경 전용 — 운영 환경에서는 사용하지 마세요.
              </p>
            </div>
          </div>
        </div>

        {/* 안내 카드 */}
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
          }}
        >
          <div style={{ fontWeight: 600, color: "#92400e", marginBottom: 8 }}>
            <i className="ri-information-line me-1" /> 생성되는 데이터
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#78350f", fontSize: 14, lineHeight: 1.8 }}>
            <li>대상 학교: <strong>테스트1학교</strong>, <strong>테스트2학교</strong> (테스트 전용 가상 학교)</li>
            <li>각 학교 학기 1개 (현재 연도 3/1 ~ 다음해 3/1)</li>
            <li>각 학교 학급 10개 (학년별 배분)</li>
            <li>각 학교 학생 20명, 교사 10명 (SCHOOL_ADMIN 1명 포함), 교직원 5명</li>
            <li>양교 학생을 자녀로 가진 학부모 20명</li>
            <li>초기 비밀번호: <code>Test1234!</code></li>
            <li>이미 존재하는 데이터는 건너뜁니다 (재실행 안전)</li>
          </ul>
        </div>

        {/* 실행 버튼 */}
        {!result && (
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 10,
              border: "none",
              background: seeding ? "#d1d5db" : "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: seeding ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 0.2s",
            }}
          >
            {seeding ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                />
                데이터 생성 중...
              </>
            ) : (
              <>
                <i className="ri-database-2-line" />
                임의 정보 채워넣기
              </>
            )}
          </button>
        )}

        {/* 오류 */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "14px 18px",
              color: "#dc2626",
              fontSize: 14,
              marginTop: 16,
            }}
          >
            <i className="ri-error-warning-line me-1" />
            {error}
          </div>
        )}

        {/* 결과 */}
        {result && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 12,
              padding: "20px 24px",
              marginTop: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
                color: "#166534",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              <i className="ri-checkbox-circle-line" style={{ fontSize: 22 }} />
              데이터 생성 완료
            </div>

            {Object.entries(result).map(([school, data]) => (
              <div key={school} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#15803d",
                    marginBottom: 8,
                    fontSize: 14,
                  }}
                >
                  <i className="ri-building-line me-1" />
                  {school}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: 8,
                  }}
                >
                  {data &&
                    typeof data === "object" &&
                    Object.entries(data as Record<string, unknown>).map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          background: "#fff",
                          border: "1px solid #d1fae5",
                          borderRadius: 8,
                          padding: "8px 12px",
                          fontSize: 13,
                        }}
                      >
                        <span style={{ color: "#6b7280" }}>{k}: </span>
                        <strong style={{ color: "#111827" }}>{String(v)}</strong>
                      </div>
                    ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setResult(null)}
              style={{
                marginTop: 8,
                background: "none",
                border: "1px solid #86efac",
                borderRadius: 8,
                padding: "8px 16px",
                cursor: "pointer",
                color: "#166534",
                fontSize: 13,
              }}
            >
              다시 실행
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
