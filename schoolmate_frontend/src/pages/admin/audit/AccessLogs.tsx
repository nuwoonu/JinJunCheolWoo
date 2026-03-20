import { useEffect, useState } from "react";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';

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
  fontSize: 12,
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

  return (
    <AdminLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>시스템 접속 기록</h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>사용자 로그인/로그아웃 기록을 조회합니다.</p>
        </div>
        <button
          onClick={downloadCsv}
          disabled={downloading}
          style={{ padding: "8px 16px", background: "#fff", border: "1px solid #22c55e", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#16a34a", cursor: downloading ? "default" : "pointer", whiteSpace: "nowrap" }}
        >
          {downloading ? "다운로드 중..." : "CSV 내보내기"}
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16, marginBottom: 16 }}>
        <form onSubmit={search}>
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>사용자명 검색</label>
              <input className="form-control form-control-sm" placeholder="사용자명..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>유형</label>
              <select className="form-select form-select-sm" value={type} onChange={(e) => setType(e.target.value)}>
                {ACCESS_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>시작일</label>
              <input type="date" className="form-control form-control-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>종료일</label>
              <input type="date" className="form-control form-control-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="col-md-auto">
              <div style={{ display: "flex", gap: 6 }}>
                <button type="submit" style={{ padding: "6px 14px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, color: "#fff", cursor: "pointer" }}>검색</button>
                <button
                  type="button"
                  onClick={() => { setKeyword(""); setType(""); setStartDate(""); setEndDate(""); setTimeout(() => load(0), 0); }}
                  style={{ padding: "6px 14px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#374151", cursor: "pointer" }}
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 160 }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 140 }} />
            <col />
          </colgroup>
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
                <td colSpan={5} style={{ ...td, textAlign: "center", color: "#9ca3af", padding: "40px 0", whiteSpace: "normal" }}>접속 기록이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>

        {page && page.totalPages > 1 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", borderTop: "1px solid #f3f4f6", gap: 6 }}>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => load(currentPage - 1)} disabled={page.first} style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: page.first ? "#d1d5db" : "#374151", cursor: page.first ? "default" : "pointer", fontSize: 13 }}>‹</button>
              {Array.from({ length: page.totalPages }, (_, i) => (
                <button key={i} onClick={() => load(i)} style={{ padding: "6px 12px", border: "1px solid", borderColor: i === currentPage ? "#25A194" : "#e5e7eb", borderRadius: 6, background: i === currentPage ? "#25A194" : "#fff", color: i === currentPage ? "#fff" : "#374151", cursor: "pointer", fontSize: 13, fontWeight: i === currentPage ? 600 : 400, minWidth: 36 }}>{i + 1}</button>
              ))}
              <button onClick={() => load(currentPage + 1)} disabled={page.last} style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: page.last ? "#d1d5db" : "#374151", cursor: page.last ? "default" : "pointer", fontSize: 13 }}>›</button>
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>총 {page.totalElements}건</div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
