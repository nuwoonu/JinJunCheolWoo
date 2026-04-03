import { useEffect, useRef, useState } from "react";
// [woo] unused: useNavigate 제거
import { Link } from "react-router-dom";
import AdminLayout from "@/components/layout/admin/AdminLayout";
import admin from "@/api/adminApi";
import { STUDENT_STATUS } from "@/constants/statusConfig";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useCsvUpload } from "@/hooks/useCsvUpload";
import CsvErrorModal from "@/components/CsvErrorModal";

// [joon] 학생 목록
const STATUSES = Object.entries(STUDENT_STATUS).map(([value, cfg], i) => ({
  value,
  label: cfg.label,
  danger: i >= 2, // DROPOUT, EXPELLED, GRADUATED, TRANSFERRED
}));

function formatClass(raw: string | null | undefined) {
  if (!raw || raw === "-") return "-";
  // 백엔드 형식: "2026년 1학년 1반" (이미 변환된 경우) 또는 "2026년 1-1-1" (레거시)
  const legacy = raw.match(/^(\d+)년\s*(\d+)-(\d+)(?:-\d+)?$/);
  if (legacy) return `${legacy[1]}년 ${legacy[2]}학년 ${legacy[3]}반`;
  return raw;
}

function studentStatusBadge(statusName: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    ENROLLED: { bg: "rgba(22,163,74,0.1)", color: "#16a34a", label: "재학" },
    LEAVE_OF_ABSENCE: { bg: "rgba(234,179,8,0.1)", color: "#a16207", label: "휴학" },
    DROPOUT: { bg: "rgba(239,68,68,0.1)", color: "#dc2626", label: "자퇴" },
    EXPELLED: { bg: "rgba(239,68,68,0.1)", color: "#dc2626", label: "제적" },
    GRADUATED: { bg: "rgba(99,102,241,0.1)", color: "#4f46e5", label: "졸업" },
    TRANSFERRED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280", label: "전학" },
  };
  const cfg = map[statusName] ?? { bg: "rgba(107,114,128,0.1)", color: "#6b7280", label: statusName ?? "-" };
  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}

function roleRequestBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    ACTIVE: { bg: "rgba(22,163,74,0.1)", color: "#16a34a", label: "활성" },
    PENDING: { bg: "rgba(14,165,233,0.1)", color: "#0284c7", label: "승인대기" },
    REJECTED: { bg: "rgba(239,68,68,0.1)", color: "#dc2626", label: "거절됨" },
    SUSPENDED: { bg: "rgba(234,179,8,0.1)", color: "#a16207", label: "정지됨" },
  };
  const cfg = map[status] ?? { bg: "rgba(107,114,128,0.1)", color: "#6b7280", label: status };
  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}

export default function StudentList() {
  const [page, setPage] = useState<any>(null);
  // [soojin] 전체 인원 수 저장 (초기 로드 시 1회만 세팅) - TeacherList 패턴 통일
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const isInitialLoad = useRef(true);
  const [status, setStatus] = useState("");
  // [soojin] type 기본값 ""(전체)로 변경 - TeacherList 패턴 통일
  const [type, setType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { csvRef, loading, csvErrors, setCsvErrors, triggerUpload, handleFileChange } = useCsvUpload(
    "/students/import-csv",
    () => load(0),
  );

  const load = (p = 0) =>
    admin
      .get("/students", {
        params: {
          status: status || undefined,
          type,
          keyword: keyword || undefined,
          page: p,
          size: 10,
        },
      })
      .then((r) => {
        setPage(r.data);
        setCurrentPage(p);
        // [soojin] 최초 로드 시에만 전체 인원 수 저장
        if (isInitialLoad.current) {
          setTotalAll(r.data.totalElements);
          isInitialLoad.current = false;
        }
      });

  useEffect(() => {
    load();
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    load(0);
  };

  const toggleAll = (checked: boolean) => setSelected(checked ? (page?.content ?? []).map((s: any) => s.uid) : []);
  const toggleOne = (uid: string) =>
    setSelected((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));

  const bulkStatus = async (s: string, label: string) => {
    if (!selected.length) return alert("학생을 선택하세요.");
    if (!confirm(`선택한 ${selected.length}명을 "${label}" 상태로 변경하시겠습니까?`)) return;
    await admin.post("/students/bulk-status", null, {
      params: { uids: selected, status: s },
    });
    setSelected([]);
    load(currentPage);
  };

  const approveRequest = async (requestId: number) => {
    await admin.post(`/role-requests/${requestId}/approve`);
    load(currentPage);
  };

  const rejectRequest = async (requestId: number) => {
    const reason = window.prompt("거절 사유를 입력하세요.");
    if (reason === null) return;
    await admin.post(`/role-requests/${requestId}/reject`, { reason });
    load(currentPage);
  };

  const list = page?.content ?? [];

  return (
    <AdminLayout>
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div className="spinner-border text-light" style={{ width: "3rem", height: "3rem" }} />
            <h5 style={{ color: "#fff", marginTop: 16 }}>데이터 처리 중입니다...</h5>
          </div>
        </div>
      )}

      <CsvErrorModal errors={csvErrors} onClose={() => setCsvErrors([])} />

      {/* [soojin] 테이블이 화면 높이를 꽉 채우도록 flex column 컨테이너 */}
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 4.5rem - 48px)" }}>
        {/* [soojin] 제목 + 전체 인원 수 인라인 표시 */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h6
            style={{
              fontWeight: 700,
              color: "#111827",
              marginBottom: 4,
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            학생 목록
            <span style={{ fontSize: 15, fontWeight: 400, color: "#6b7280" }}>전체 {totalAll ?? 0}명</span>
          </h6>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>학생 계정 및 학적 정보를 관리합니다.</p>
        </div>

        {/* [soojin] 컨트롤 바: 검색/필터(좌) + 버튼들(우) 같은 행 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            gap: 12,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <form style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }} onSubmit={search}>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <select
                style={{
                  padding: "5px 24px 5px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  background: "#fff",
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">모든 상태</option>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <i
                className="ri-arrow-down-s-line"
                style={{
                  position: "absolute",
                  right: "4px",
                  pointerEvents: "none",
                  fontSize: "16px",
                  color: "#6b7280",
                }}
              />
            </div>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <select
                style={{
                  padding: "5px 24px 5px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  background: "#fff",
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                }}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">전체</option>
                <option value="name">이름</option>
                <option value="email">이메일</option>
                <option value="idNum">학번</option>
              </select>
              <i
                className="ri-arrow-down-s-line"
                style={{
                  position: "absolute",
                  right: "4px",
                  pointerEvents: "none",
                  fontSize: "16px",
                  color: "#6b7280",
                }}
              />
            </div>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <i
                className="bi bi-search"
                style={{ position: "absolute", left: "8px", color: "#9ca3af", fontSize: "13px", pointerEvents: "none" }}
              />
              <input
                style={{
                  padding: "5px 8px 5px 28px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  minWidth: 150,
                  background: "#fff",
                }}
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <button
              style={{
                padding: "5px 12px",
                background: "#25A194",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              type="submit"
            >
              검색
            </button>
            <button
              style={{
                padding: "5px 10px",
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
              type="button"
              onClick={() => {
                setStatus("");
                setType("");
                setKeyword("");
                load(0);
              }}
            >
              초기화
            </button>
            {/* [soojin] 검색 중일 때만 필터 결과 건수 표시 */}
            {(status || keyword) && page && (
              <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 600, color: "#111827" }}>{page.totalElements}명</span> / 전체 {totalAll ?? 0}
                명
              </span>
            )}
          </form>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input type="file" ref={csvRef} accept=".csv" style={{ display: "none" }} onChange={handleFileChange} />
            <div style={{ position: "relative" }}>
              <button
                type="button"
                style={{
                  padding: "5px 10px",
                  background: "#fff",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                  color: "#374151",
                  whiteSpace: "nowrap",
                }}
                onClick={() => setShowDropdown((v) => !v)}
              >
                선택 상태 변경{" "}
                <i className="ri-arrow-down-s-line" style={{ fontSize: "14px", verticalAlign: "middle" }} />
              </button>
              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    zIndex: 100,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    width: "100%",
                    marginTop: 4,
                    overflow: "hidden",
                  }}
                >
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px 0",
                        background: "none",
                        border: "none",
                        textAlign: "center",
                        fontSize: 13,
                        color: s.danger ? "#ef4444" : "#374151",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        bulkStatus(s.value, s.label);
                        setShowDropdown(false);
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              style={{
                padding: "5px 10px",
                background: "#fff",
                border: "1px solid #25A194",
                borderRadius: 8,
                fontSize: 13,
                cursor: "pointer",
                color: "#25A194",
                whiteSpace: "nowrap",
              }}
              onClick={triggerUpload}
            >
              <i className="ri-file-excel-2-line" style={{ marginRight: 4, fontSize: "14px" }} />
              CSV 등록
            </button>
            <Link
              to={ADMIN_ROUTES.STUDENTS.CREATE}
              style={{
                padding: "5px 12px",
                background: "#25A194",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                whiteSpace: "nowrap",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              + 신규 학생 등록
            </Link>
          </div>
        </div>

        {/* [soojin] 카드: flex:1로 남은 공간 꽉 채움 */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", minHeight: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: 50 }} />
                <col style={{ width: 140 }} />
                <col style={{ width: 110 }} />
                <col />
                <col style={{ width: 160 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 160 }} />
                <col style={{ width: 100 }} />
              </colgroup>
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6b7280",
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      textAlign: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      style={{ borderColor: "#6b7280" }}
                      onChange={(e) => toggleAll(e.target.checked)}
                      checked={selected.length > 0 && selected.length === list.length}
                    />
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6b7280",
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                    }}
                  >
                    학번
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6b7280",
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                    }}
                  >
                    이름
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6b7280",
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                    }}
                  >
                    계정 (이메일)
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6b7280",
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                    }}
                  >
                    최근 소속 정보
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6b7280",
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                    }}
                  >
                    학적 상태
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6b7280",
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                    }}
                  >
                    승인 상태
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6b7280",
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                    }}
                  >
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((s: any) => (
                  <tr key={s.uid}>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#374151",
                        borderBottom: "1px solid #f3f4f6",
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}
                    >
                      <input
                        type="checkbox"
                        className="form-check-input"
                        style={{ borderColor: "#6b7280" }}
                        checked={selected.includes(s.uid)}
                        onChange={() => toggleOne(s.uid)}
                      />
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#6b7280",
                        borderBottom: "1px solid #f3f4f6",
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      {s.code ?? "-"}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#374151",
                        borderBottom: "1px solid #f3f4f6",
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      <Link
                        to={ADMIN_ROUTES.STUDENTS.DETAIL(s.uid)}
                        style={{ color: "#1d4ed8", fontWeight: 600, textDecoration: "none", fontSize: 14 }}
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#374151",
                        borderBottom: "1px solid #f3f4f6",
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.email}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#6b7280",
                        borderBottom: "1px solid #f3f4f6",
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      {formatClass(s.latestClass)}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#374151",
                        borderBottom: "1px solid #f3f4f6",
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      {studentStatusBadge(s.statusName)}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#374151",
                        borderBottom: "1px solid #f3f4f6",
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      {s.roleRequestStatus ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {roleRequestBadge(s.roleRequestStatus)}
                          {s.roleRequestStatus === "PENDING" && (
                            <>
                              <button
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  border: "none",
                                  cursor: "pointer",
                                  background: "rgba(22,163,74,0.1)",
                                  color: "#16a34a",
                                }}
                                onClick={() => approveRequest(s.roleRequestId)}
                              >
                                승인
                              </button>
                              <button
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  border: "none",
                                  cursor: "pointer",
                                  background: "rgba(239,68,68,0.1)",
                                  color: "#dc2626",
                                }}
                                onClick={() => rejectRequest(s.roleRequestId)}
                              >
                                거절
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: 13 }}>-</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 13,
                        color: "#374151",
                        borderBottom: "1px solid #f3f4f6",
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      <Link
                        to={ADMIN_ROUTES.STUDENTS.DETAIL(s.uid)}
                        style={{
                          padding: "5px 12px",
                          background: "#fff",
                          border: "1px solid #d1d5db",
                          borderRadius: 6,
                          fontSize: 13,
                          color: "#374151",
                          textDecoration: "none",
                          display: "inline-block",
                        }}
                      >
                        상세보기
                      </Link>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ padding: "48px 16px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}
                    >
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* [soojin] 페이지네이션 카드 밖, 우측 정렬, 28×28 정사각형 버튼 */}
        {page && page.totalPages >= 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => load(currentPage - 1)}
              disabled={page.first}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
                cursor: page.first ? "not-allowed" : "pointer",
                color: page.first ? "#d1d5db" : "#374151",
                fontSize: 12,
              }}
            >
              ‹
            </button>
            {Array.from({ length: page.totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => load(i)}
                style={{
                  width: 28,
                  height: 28,
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${i === currentPage ? "#25A194" : "#e5e7eb"}`,
                  borderRadius: 6,
                  background: i === currentPage ? "#25A194" : "#fff",
                  color: i === currentPage ? "#fff" : "#374151",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: i === currentPage ? 600 : 400,
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => load(currentPage + 1)}
              disabled={page.last}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
                cursor: page.last ? "not-allowed" : "pointer",
                color: page.last ? "#d1d5db" : "#374151",
                fontSize: 12,
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
