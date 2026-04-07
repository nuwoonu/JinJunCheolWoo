import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/shared/api/authApi";
import admin from "@/shared/api/adminApi";
import { ADMIN_ROUTES } from "@/shared/constants/routes";
import { useSchool, type SelectedSchool } from "@/shared/contexts/SchoolContext";
import AdminTopBar from "@/shared/components/layout/admin/AdminTopBar";
import { useSchoolSearch, type SchoolSummary } from "@/shared/hooks/useSchoolSearch";

// [joon] 관리 학교 선택 — 사이드바 없는 독립 페이지

const SCHOOL_KINDS = ["", "초등학교", "중학교", "고등학교", "특수학교", "각종학교"];

// [soojin] ServiceNoticeList 스타일로 통일
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
  padding: "14px 16px",
  fontSize: 13,
  color: "#374151",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

export default function SchoolSelect() {
  const navigate = useNavigate();
  const { setSelectedSchool } = useSchool();

  const {
    name,
    setName,
    schoolKind,
    setSchoolKind,
    schools,
    totalPages,
    totalElements,
    page,
    loading,
    searched,
    fetchSchools,
    handleSearch,
    reset,
  } = useSchoolSearch((params) => api.get("/schools", { params }));

  const [syncRunning, setSyncRunning] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkSyncStatus = () => {
    admin
      .get("/schools/sync/status")
      .then((r) => setSyncRunning(r.data.syncing ?? false))
      .catch(() => {});
  };

  useEffect(() => {
    checkSyncStatus();
    pollRef.current = setInterval(checkSyncStatus, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleSelect = (school: SchoolSummary) => {
    const selected: SelectedSchool = {
      id: school.id,
      name: school.name,
      schoolCode: school.schoolCode ?? "",
      schoolKind: school.schoolKind,
      officeOfEducation: school.officeOfEducation,
    };
    setSelectedSchool(selected);
    navigate(ADMIN_ROUTES.DASHBOARD, { replace: true });
  };

  const handleSync = async () => {
    if (
      !window.confirm(
        "학교 정보(NEIS) 동기화를 시작하시겠습니까?\n(데이터가 많아 완료까지 몇 분 정도 소요될 수 있습니다.)",
      )
    )
      return;
    try {
      await admin.post("/schools/sync");
      checkSyncStatus();
    } catch (error: any) {
      if (error.response?.status !== 409) {
        alert("동기화 요청 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* [soojin] 사이드바 없는 페이지이므로 좌측 상단 로고 표시 */}
      <AdminTopBar position="sticky" sectionBadge="학교 선택" showLogo />

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        {/* [soojin] 제목 + 검색 후 건수 인라인 표시 — ServiceNoticeList 스타일로 통일 */}
        <div style={{ marginBottom: 50, textAlign: "center" }}>
          <h3
            style={{
              fontWeight: 650,
              color: "#111827",
              marginBottom: 4,
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              justifyContent: "center",
            }}
          >
            관리 학교 선택
            {searched && (
              <span style={{ fontSize: 15, fontWeight: 400, color: "#6b7280" }}>
                총 {totalElements.toLocaleString()}개
              </span>
            )}
          </h3>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>관리할 학교를 검색하여 선택해 주세요.</p>
        </div>

        {/* [soojin] 컨트롤 바: 검색/초기화(좌) + NEIS 동기화(우) — ServiceNoticeList 컨트롤 바 스타일 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <select
                value={schoolKind}
                onChange={(e) => setSchoolKind(e.target.value)}
                style={{
                  padding: "5px 28px 5px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  background: "#fff",
                  color: "#374151",
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                }}
              >
                {SCHOOL_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k || "전체"}
                  </option>
                ))}
              </select>
              <i
                className="ri-arrow-down-s-line"
                style={{
                  position: "absolute",
                  right: "8px",
                  color: "#9ca3af",
                  fontSize: "12px",
                  pointerEvents: "none",
                }}
              />
            </div>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <i
                className="ri-search-line"
                style={{ position: "absolute", left: "8px", color: "#9ca3af", fontSize: "13px", pointerEvents: "none" }}
              />
              <input
                type="text"
                placeholder="학교명 검색"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  padding: "5px 8px 5px 28px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  minWidth: 200,
                  background: "#fff",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "5px 12px",
                background: "#25A194",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "검색 중..." : "검색"}
            </button>
            <button
              type="button"
              onClick={reset}
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
            >
              초기화
            </button>
          </form>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncRunning}
            style={{
              padding: "5px 12px",
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
              cursor: syncRunning ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <i className={`ri-refresh-line me-1${syncRunning ? " spin" : ""}`} />
            {syncRunning ? "동기화 진행 중..." : "학교 DB 동기화 (NEIS)"}
          </button>
        </div>

        {searched ? (
          <>
            {/* [soojin] 결과 테이블 카드 — ServiceNoticeList 카드 스타일 */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              {/* [soojin] overflowX 래퍼 제거, tableLayout auto, colgroup 제거 → 브라우저 자동 컬럼 분배 */}
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
                  <thead>
                    <tr>
                      <th style={th}>학교명</th>
                      <th style={{ ...th, textAlign: "center" }}>종류</th>
                      <th style={th}>관할 교육청</th>
                      <th style={th}>주소</th>
                      <th style={{ ...th, textAlign: "center" }}>선택</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            ...td,
                            textAlign: "center",
                            color: "#9ca3af",
                            padding: "48px 16px",
                            whiteSpace: "normal",
                          }}
                        >
                          불러오는 중...
                        </td>
                      </tr>
                    ) : schools.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            ...td,
                            textAlign: "center",
                            color: "#9ca3af",
                            padding: "48px 16px",
                            whiteSpace: "normal",
                          }}
                        >
                          검색 결과가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      schools.map((school) => (
                        <tr key={school.id}>
                          <td style={{ ...td, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {school.name}
                          </td>
                          <td style={{ ...td, textAlign: "center" }}>
                            <span
                              style={{
                                background: "#f3f4f6",
                                color: "#374151",
                                borderRadius: 6,
                                padding: "2px 8px",
                                fontSize: 12,
                                fontWeight: 500,
                              }}
                            >
                              {school.schoolKind ?? "-"}
                            </span>
                          </td>
                          <td style={{ ...td, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {school.officeOfEducation ?? "-"}
                          </td>
                          <td style={{ ...td, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {school.address ?? "-"}
                          </td>
                          <td style={{ ...td, textAlign: "center" }}>
                            <button
                              onClick={() => handleSelect(school)}
                              style={{
                                padding: "4px 14px",
                                background: "#25A194",
                                color: "#fff",
                                border: "none",
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              선택
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
            </div>

            {/* [soojin] 페이지네이션 카드 밖, 우측 정렬, 정사각형 버튼 — ServiceNoticeList 스타일 */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", gap: 4 }}>
                <button
                  onClick={() => fetchSchools(page - 1)}
                  disabled={page === 0}
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
                    cursor: page === 0 ? "not-allowed" : "pointer",
                    color: page === 0 ? "#d1d5db" : "#374151",
                    fontSize: 12,
                  }}
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  const start = Math.max(0, Math.min(page - 4, totalPages - 10));
                  const p = start + i;
                  return (
                    <button
                      key={p}
                      onClick={() => fetchSchools(p)}
                      style={{
                        width: 28,
                        height: 28,
                        padding: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${p === page ? "#25A194" : "#e5e7eb"}`,
                        borderRadius: 6,
                        background: p === page ? "#25A194" : "#fff",
                        color: p === page ? "#fff" : "#374151",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: p === page ? 600 : 400,
                      }}
                    >
                      {p + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => fetchSchools(page + 1)}
                  disabled={page >= totalPages - 1}
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
                    cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                    color: page >= totalPages - 1 ? "#d1d5db" : "#374151",
                    fontSize: 12,
                  }}
                >
                  ›
                </button>
              </div>
            )}
          </>
        ) : (
          /* [soojin] 미검색 안내 — 카드 스타일 통일 */
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: "48px 24px",
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            <i className="ri-search-line" style={{ fontSize: 40, display: "block", marginBottom: 12, opacity: 0.3 }}></i>
            <p style={{ margin: 0, fontSize: 14 }}>학교명을 입력하고 검색하세요.</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>
              학교 DB가 비어있다면 우측의 <strong style={{ color: "#374151" }}>학교 DB 동기화 (NEIS)</strong> 버튼을
              먼저 실행해 주세요.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
