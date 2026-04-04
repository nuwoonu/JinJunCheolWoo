import { useEffect, useRef, useState } from "react";
import AdminLayout from '@/shared/components/layout/admin/AdminLayout';
import admin from '@/shared/api/adminApi';

// [soojin] 작업 유형 select 옵션 추가 (기존 text input → select로 교체)
const ACTION_TYPES = [
  { value: "", label: "전체" },
  { value: "CREATE", label: "CREATE" },
  { value: "UPDATE", label: "UPDATE" },
  { value: "DELETE", label: "DELETE" },
];

const actionStyle = (t: string): React.CSSProperties => {
  if (t === "CREATE") return { background: "#ecfdf5", color: "#065f46", border: "1px solid #6ee7b7", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
  if (t === "UPDATE") return { background: "#eff6ff", color: "#1e40af", border: "1px solid #93c5fd", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
  if (t === "DELETE") return { background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
  return { background: "#f3f4f6", color: "#374151", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 };
};

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

export default function ChangeLogs() {
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
    admin.get("/audit/changes", { params }).then((r) => {
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
      const res = await admin.get("/audit/changes/csv", { params, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8;" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `change_logs_${new Date().toISOString().slice(0, 10)}.csv`;
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
      {/* [soojin] 테이블이 화면 높이를 꽉 채우도록 flex column 컨테이너 */}
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 4.5rem - 48px)" }}>
        {/* [soojin] 제목 + 전체 건수 인라인 표시 */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h6 style={{ fontWeight: 700, color: "#111827", marginBottom: 4, display: "flex", alignItems: "baseline", gap: 8 }}>
            변경 로그
            <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>전체 {totalAll ?? 0}건</span>
          </h6>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>관리자에 의한 데이터 변경 내역을 조회합니다.</p>
        </div>

        {/* [soojin] 컨트롤 바: 필터(좌) + CSV 버튼(우), 필터 카드 제거하고 인라인으로 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
          <form style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }} onSubmit={search}>
            {/* 키워드 검색 input */}
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <i className="bi bi-search" style={{ position: "absolute", left: "8px", color: "#9ca3af", fontSize: "13px", pointerEvents: "none" }} />
              <input
                style={{ ...inputStyle, padding: "5px 8px 5px 28px", minWidth: 150 }}
                placeholder="작업자, 대상 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            {/* 작업 유형 select - 기존 text input에서 select로 교체 */}
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <select style={selectStyle} value={type} onChange={(e) => setType(e.target.value)}>
                {ACTION_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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

        {/* [soojin] 카드: flex:1로 남은 공간 채우기 */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* [soojin] 스크롤 div: 내부에서만 스크롤 */}
          <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", minHeight: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              {/* [soojin] 작업 유형, 대상 컬럼 폭 확대 */}
              <colgroup>
                <col style={{ width: 160 }} />
                <col style={{ width: 150 }} />
                <col style={{ width: 160 }} />
                <col style={{ width: 200 }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th style={th}>일시</th>
                  <th style={th}>작업자</th>
                  <th style={{ ...th, textAlign: "center" }}>작업 유형</th>
                  <th style={th}>대상</th>
                  <th style={th}>상세 내용</th>
                </tr>
              </thead>
              <tbody>
                {list.map((log: any) => (
                  <tr key={log.id}>
                    <td style={{ ...td, color: "#6b7280" }}>{log.createDate?.replace("T", " ").substring(0, 19)}</td>
                    <td style={{ ...td, fontWeight: 500 }}>{log.actorName}</td>
                    <td style={{ ...td, textAlign: "center" }}>
                      <span style={actionStyle(log.actionType)}>{log.actionType}</span>
                    </td>
                    <td style={td}>{log.target}</td>
                    <td style={{ ...td, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis" }}>{log.description}</td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ ...td, textAlign: "center", color: "#9ca3af", padding: "48px 16px", whiteSpace: "normal" }}>변경 이력이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* [soojin] 페이지네이션 카드 밖, 우측 정렬, 정사각형 버튼 */}
        {page && page.totalPages >= 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", gap: 4, flexShrink: 0 }}>
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
