interface CsvErrorModalProps {
  errors: string[];
  onClose: () => void;
}

/**
 * CSV 대량 등록 실패 항목 표시 모달
 * - errors 배열이 비어있으면 렌더링하지 않음
 */
export default function CsvErrorModal({ errors, onClose }: CsvErrorModalProps) {
  if (errors.length === 0) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 520, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb", background: "#fef2f2" }}>
          <h6 style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#dc2626" }}>
            CSV 등록 실패 항목 ({errors.length}건)
          </h6>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}>✕</button>
        </div>
        <div style={{ padding: "12px 20px", maxHeight: 360, overflowY: "auto" }}>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            아래 항목은 등록에 실패했습니다. 나머지 항목은 정상 처리됐습니다.
          </p>
          <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 6 }}>
            {errors.map((msg, i) => (
              <li key={i} style={{ fontSize: 13, color: "#374151" }}>{msg}</li>
            ))}
          </ul>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 20px", background: "#25A194", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
