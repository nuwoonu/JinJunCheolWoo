import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/contexts/AuthContext";

// [soojin] 학부모 전용 "돌아가기" 버튼 — parent/children/status 로 이동
// PARENT 역할이 아니면 렌더링하지 않음
export default function ParentBackButton() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user?.role !== "PARENT") return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/parent/children/status")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 12px",
        background: "#fff",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        fontSize: 13,
        color: "#374151",
        cursor: "pointer",
        fontWeight: 500,
        flexShrink: 0,
      }}
    >
      <i className="ri ri-home-4-line" style={{ fontSize: 14 }} />
      돌아가기
    </button>
  );
}
