import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/admin/AdminLayout";
import admin from "@/shared/api/adminApi";
import { TEACHER_STATUS, ROLE_REQUEST_STATUS, STATUS_DEFAULT } from "@/shared/constants/statusConfig";
import { ADMIN_ROUTES } from "@/shared/constants/routes";
import { useCsvUpload } from "@/shared/hooks/useCsvUpload";
import CsvErrorModal from "@/shared/components/CsvErrorModal";

function getStatusBadgeStyle(statusName: string) {
  const key = statusName?.toUpperCase() ?? "";
  if (["TEACHING", "EMPLOYED", "ACTIVE"].includes(key)) return { background: "rgba(22,163,74,0.1)", color: "#16a34a" };
  if (["LEAVE", "DISPATCHED"].includes(key)) return { background: "rgba(234,179,8,0.1)", color: "#ca8a04" };
  if (["RETIRED", "SUSPENDED"].includes(key)) return { background: "rgba(239,68,68,0.1)", color: "#dc2626" };
  return { background: "#f3f4f6", color: "#6b7280" };
}

function getRoleRequestBadgeStyle(status: string) {
  switch (status) {
    case "ACTIVE":
      return { background: "rgba(22,163,74,0.1)", color: "#16a34a" };
    case "PENDING":
      return { background: "rgba(14,165,233,0.1)", color: "#0284c7" };
    case "SUSPENDED":
      return { background: "rgba(234,179,8,0.1)", color: "#ca8a04" };
    case "REJECTED":
      return { background: "rgba(239,68,68,0.1)", color: "#dc2626" };
    default:
      return { background: "#f3f4f6", color: "#6b7280" };
  }
}

const badgeBase: React.CSSProperties = {
  padding: "3px 8px",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  whiteSpace: "nowrap",
};

export default function TeacherList() {
  const [page, setPage] = useState<any>(null);
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const isInitialLoad = useRef(true);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { csvRef, loading, csvErrors, setCsvErrors, triggerUpload, handleFileChange } = useCsvUpload(
    "/teachers/import-csv",
    () => load(0),
  );

  const load = (p = 0) =>
    admin
      .get("/teachers", {
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
  const list = page?.content ?? [];
  const toggleAll = (checked: boolean) => setSelected(checked ? list.map((t: any) => t.uid) : []);
  const toggleOne = (uid: string) =>
    setSelected((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));

  const bulkStatus = async (s: string, label: string) => {
    if (!selected.length) return alert("교사를 선택하세요.");
    if (!confirm(`선택한 ${selected.length}명을 "${label}" 상태로 변경하시겠습니까?`)) return;
    await admin.post("/teachers/bulk-status", null, {
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
            <h5 style={{ color: "#fff", marginTop: 16 }}>교사 데이터를 등록 중입니다...</h5>
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
            교사 목록
            <span style={{ fontSize: 15, fontWeight: 400, color: "#6b7280" }}>전체 {totalAll ?? 0}명</span>
          </h6>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>교사 계정 및 인사 정보를 관리합니다.</p>
        </div>

        {/* [soojin] 컨트롤 바: 검색/필터(좌) + 버튼들(우) 같은 행, 각 input/select 개별 흰배경 */}
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
            {/* [soojin] select 커스텀 화살표 - remixicon 아이콘 사용 */}
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
                {Object.entries(TEACHER_STATUS).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
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
                <option value="dept">부서</option>
                <option value="position">직책</option>
                <option value="subject">담당 과목</option>
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
            {/* [soojin] 검색 입력창 돋보기 아이콘 추가, "..." 제거 */}
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <i
                className="ri-search-line"
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
                  {Object.entries(TEACHER_STATUS).map(([value, { label }]) => (
                    <button
                      key={value}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px 0",
                        background: "none",
                        border: "none",
                        textAlign: "center",
                        fontSize: 13,
                        color: value === "RETIRED" ? "#ef4444" : "#374151",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        bulkStatus(value, label);
                        setShowDropdown(false);
                      }}
                    >
                      {label}
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
              to={ADMIN_ROUTES.TEACHERS.CREATE}
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
              + 신규 교사 등록
            </Link>
          </div>
        </div>

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
          {/* [soojin] overflowX 래퍼 제거, tableLayout auto, colgroup 제거 → 브라우저 자동 컬럼 분배 */}
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
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
                    사번
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
                    이메일
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
                    부서 / 직책
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
                    담당 과목
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
                    재직 상태
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
                {list.map((t: any) => (
                  <tr key={t.uid}>
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
                        checked={selected.includes(t.uid)}
                        onChange={() => toggleOne(t.uid)}
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
                      {t.code}
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
                        to={ADMIN_ROUTES.TEACHERS.DETAIL(t.uid)}
                        style={{ color: "#1d4ed8", fontWeight: 600, textDecoration: "none", fontSize: 14 }}
                      >
                        {t.name}
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
                      {t.email}
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
                      <span>{t.department}</span>
                      <span style={{ color: "#9ca3af", margin: "0 4px" }}>/</span>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{t.position}</span>
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
                      <span
                        style={{
                          padding: "3px 8px",
                          background: "#f3f4f6",
                          color: "#374151",
                          borderRadius: 4,
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.subject}
                      </span>
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
                      {(() => {
                        const cfg = TEACHER_STATUS[t.statusName] ?? STATUS_DEFAULT;
                        return <span style={{ ...badgeBase, ...getStatusBadgeStyle(t.statusName) }}>{cfg.label}</span>;
                      })()}
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
                      {t.roleRequestStatus ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ ...badgeBase, ...getRoleRequestBadgeStyle(t.roleRequestStatus) }}>
                            {(ROLE_REQUEST_STATUS[t.roleRequestStatus] ?? ROLE_REQUEST_STATUS.PENDING).label}
                          </span>
                          {t.roleRequestStatus === "PENDING" && (
                            <>
                              <button
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  border: "none",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  background: "rgba(22,163,74,0.1)",
                                  color: "#16a34a",
                                }}
                                onClick={() => approveRequest(t.roleRequestId)}
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
                                  whiteSpace: "nowrap",
                                  background: "rgba(239,68,68,0.1)",
                                  color: "#dc2626",
                                }}
                                onClick={() => rejectRequest(t.roleRequestId)}
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
                        to={ADMIN_ROUTES.TEACHERS.DETAIL(t.uid)}
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
                      colSpan={9}
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

        {/* [soojin] 페이지네이션 카드 밖, 우측 정렬, 정사각형 버튼 */}
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
