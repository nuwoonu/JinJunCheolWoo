import { useEffect, useRef, useState } from "react";
import AdminLayout from '@/shared/components/layout/admin/AdminLayout';
import admin from '@/shared/api/adminApi';

const ACCESS_TYPES = [
  { value: "", label: "전체" },
  { value: "LOGIN", label: "로그인" },
  { value: "LOGOUT", label: "로그아웃" },
  { value: "LOGIN_FAIL", label: "로그인 실패" },
];

const typeStyle = (t: string): React.CSSProperties => {
  if (t === "LOGIN") return { background: "#ecfdf5", color: "#065f46", border: "1px solid #6ee7b7", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
  if (t === "LOGOUT") return { background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
  if (t === "LOGIN_FAIL") return { background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
  return { background: "#f3f4f6", color: "#374151", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
};

const typeLabel = (t: string) => ACCESS_TYPES.find((o) => o.value === t)?.label ?? t;

const th: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  fontWeight: 600,
  color: "#6b7280",
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  textAlign: "left",
};

const td: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  color: "#374151",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

export default function AccessLogs() {
  const [page, setPage] = useState<any>(null);
  // [soojin] 전체 건수 표시용 - 초기 로드 시 한 번만 세팅
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const isInitialLoad = useRef(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloading, setDownloading] = useState(false);

  const load = (p = 0) => {
    const params: any = { page: p, size: 20 };
    if (keyword) params.keyword = keyword;
    if (type) params.type = type;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    admin.get("/audit/access", { params }).then((r) => {
      setPage(r.data);
      setCurrentPage(p);
      // [soojin] 초기 로드 시에만 totalAll 세팅
      if (isInitialLoad.current) {
        setTotalAll(r.data.totalElements);
        isInitialLoad.current = false;
      }
    });
  };

  useEffect(() => { load(); }, []);

  const search = (e: React.FormEvent) => { e.preventDefault(); load(0); };

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const params: any = {};
      if (keyword) params.keyword = keyword;
      if (type) params.type = type;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await admin.get("/audit/access/csv", { params, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8;" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `access_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const list: any[] = page?.content ?? [];

  // [soojin] select 커스텀 화살표 공통 스타일
  const selectStyle: React.CSSProperties = {
    padding: "5px 24px 5px 8px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    background: "#fff",
    appearance: "none",
    WebkitAppearance: "none",
    cursor: "pointer",
  };

  const inputStyle: React.CSSProperties = {
    padding: "5px 8px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    background: "#fff",
  };

  return (
    <AdminLayout>
      {/* [soojin] 페이지네이션으로 행 수 제한 - 고정 높이 없이 자연 높이 사용 */}
      <div>
        {/* [soojin] 제목 + 전체 건수 인라인 표시 */}
        <div style={{ marginBottom: 16 }}>
          <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 4, display: "flex", alignItems: "baseline", gap: 8 }}>
            접근 로그
            <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>전체 {totalAll ?? 0}건</span>
          </h6>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>사용자 로그인/로그아웃 기록을 조회합니다.</p>
        </div>

        {/* [soojin] 컨트롤 바: 필터(좌) + CSV 버튼(우), 필터 카드 제거하고 인라인으로 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
          <form style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }} onSubmit={search}>
            {/* 사용자명 검색 input */}
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <i className="bi bi-search" style={{ position: "absolute", left: "8px", color: "#9ca3af", fontSize: "13px", pointerEvents: "none" }} />
              <input
                style={{ ...inputStyle, padding: "5px 8px 5px 28px", minWidth: 150 }}
                placeholder="사용자명 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            {/* 유형 select */}
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <select style={selectStyle} value={type} onChange={(e) => setType(e.target.value)}>
                {ACCESS_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <i className="ri-arrow-down-s-line" style={{ position: "absolute", right: "4px", pointerEvents: "none", fontSize: "16px", color: "#6b7280" }} />
            </div>
            {/* [soojin] 날짜 input에 시작일/종료일 라벨 표시 */}
            <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>시작일</span>
            <input type="date" style={inputStyle} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>종료일</span>
            <input type="date" style={inputStyle} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <button
              type="submit"
              style={{ padding: "5px 12px", background: "#25A194", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              검색
            </button>
            <button
              type="button"
              onClick={() => { setKeyword(""); setType(""); setStartDate(""); setEndDate(""); setTimeout(() => load(0), 0); }}
              style={{ padding: "5px 10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, cursor: "pointer", color: "#374151", whiteSpace: "nowrap" }}
            >
              초기화
            </button>
            {/* [soojin] 검색 중일 때만 필터 결과 건수 표시 */}
            {(keyword || type || startDate || endDate) && page && (
              <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 600, color: "#111827" }}>{page.totalElements}건</span> / 전체 {totalAll ?? 0}건
              </span>
            )}
          </form>
          <button
            onClick={downloadCsv}
            disabled={downloading}
            style={{ padding: "5px 10px", background: "#fff", border: "1px solid #25A194", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#25A194", cursor: downloading ? "default" : "pointer", whiteSpace: "nowrap" }}
          >
            <i className="ri-file-excel-2-line" style={{ marginRight: 4, fontSize: "14px" }} />
            {downloading ? "다운로드 중..." : "CSV 내보내기"}
          </button>
        </div>

        {/* [soojin] 카드: 자연 높이, 가로 스크롤만 허용 */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {/* [soojin] overflowX 래퍼 제거, tableLayout auto, colgroup 제거 → 브라우저 자동 컬럼 분배 */}
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
              <thead>
                <tr>
                  <th style={th}>일시</th>
                  <th style={th}>사용자</th>
                  <th style={{ ...th, textAlign: "center" }}>유형</th>
                  <th style={th}>IP 주소</th>
                  <th style={th}>브라우저 정보</th>
                </tr>
              </thead>
              <tbody>
                {list.map((log: any) => (
                  <tr key={log.id}>
                    <td style={{ ...td, color: "#6b7280" }}>{log.createDate?.replace("T", " ").substring(0, 19)}</td>
                    <td style={{ ...td, fontWeight: 500 }}>{log.actorName}</td>
                    <td style={{ ...td, textAlign: "center" }}>
                      <span style={typeStyle(log.accessType)}>{typeLabel(log.accessType)}</span>
                    </td>
                    <td style={{ ...td, color: "#6b7280" }}>{log.ipAddress}</td>
                    <td style={{ ...td, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis" }} title={log.userAgent}>{log.userAgent}</td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ ...td, textAlign: "center", color: "#9ca3af", padding: "48px 16px", whiteSpace: "normal" }}>접속 기록이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>

        {/* [soojin] 페이지네이션 카드 밖, 우측 정렬, 정사각형 버튼 */}
        {page && page.totalPages >= 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", gap: 4 }}>
            <button
              onClick={() => load(currentPage - 1)}
              disabled={page.first}
              style={{ width: 28, height: 28, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: page.first ? "not-allowed" : "pointer", color: page.first ? "#d1d5db" : "#374151", fontSize: 12 }}
            >
              ‹
            </button>
            {Array.from({ length: page.totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => load(i)}
                style={{ width: 28, height: 28, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1px solid ${i === currentPage ? "#25A194" : "#e5e7eb"}`, borderRadius: 6, background: i === currentPage ? "#25A194" : "#fff", color: i === currentPage ? "#fff" : "#374151", cursor: "pointer", fontSize: 12, fontWeight: i === currentPage ? 600 : 400 }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => load(currentPage + 1)}
              disabled={page.last}
              style={{ width: 28, height: 28, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: page.last ? "not-allowed" : "pointer", color: page.last ? "#d1d5db" : "#374151", fontSize: 12 }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
