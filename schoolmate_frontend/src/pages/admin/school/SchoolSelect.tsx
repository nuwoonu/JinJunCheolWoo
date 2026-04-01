import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/auth";
import admin from "@/api/adminApi";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useSchool, type SelectedSchool } from "@/contexts/SchoolContext";
import AdminTopBar from "@/components/layout/admin/AdminTopBar";
import { useSchoolSearch, type SchoolSummary } from "@/hooks/useSchoolSearch";

function useTheme() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  useEffect(() => {
    const onStorage = () => setIsDark(localStorage.getItem("theme") === "dark");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return { isDark };
}

// [joon] 관리 학교 선택 — 사이드바 없는 독립 페이지

const SCHOOL_KINDS = ["", "초등학교", "중학교", "고등학교", "특수학교", "각종학교"];

export default function SchoolSelect() {
  const navigate = useNavigate();
  const { setSelectedSchool } = useSchool();
  const theme = useTheme();

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
    <div style={{ minHeight: "100dvh" }}>
      {/* 표준 관리자 상단 바 */}
      {/* [soojin] 사이드바 없는 페이지이므로 좌측 상단 로고 표시 */}
      <AdminTopBar position="sticky" sectionBadge="학교 선택" showLogo />

      {/* 본문 */}
      {/* [soojin] scale 제거 — 검색 결과 표시 시 화면이 축소되는 문제 수정 */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <main
          style={{
            width: "100%",
            maxWidth: 820,
            padding: "40px 24px",
            boxSizing: "border-box",
          }}
        >
          {/* 타이틀 */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #25A194, #1a7a6e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <i className="bi bi-building-fill text-white fs-4"></i>
            </div>
            <h3
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: theme.isDark ? "#f3f4f6" : "#1a1a1a",
                marginBottom: 8,
              }}
            >
              관리 학교 선택
            </h3>
            <p
              style={{
                color: theme.isDark ? "#9ca3af" : "#6b7280",
                fontSize: 17,
                margin: "0 0 16px",
              }}
            >
              관리할 학교를 검색하여 선택해 주세요.
            </p>
            {/* NEIS 동기화 버튼 */}
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleSync}
              disabled={syncRunning}
              style={{
                border: `1px solid ${theme.isDark ? "#444" : "#ced4da"}`,
                background: theme.isDark ? "#2d2d2d" : "#f9fafb",
                color: theme.isDark ? "#d1d5db" : "#374151",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                padding: "6px 14px",
              }}
            >
              <i className={`ri-refresh-line me-1${syncRunning ? " spin" : ""}`} />
              {syncRunning ? "동기화 진행 중..." : "학교 DB 동기화 (NEIS)"}
            </button>
          </div>

          {/* 검색 폼 */}
          <div
            style={{
              background: theme.isDark ? "#1e1e1e" : "#fff",
              borderRadius: 16,
              boxShadow: theme.isDark ? "0 4px 6px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.08)",
              padding: "24px 28px",
              marginBottom: 24,
              transition: "background 0.3s",
            }}
          >
            <form onSubmit={handleSearch}>
              <div className="row g-3 align-items-end">
                <div className="col-md-6">
                  <label
                    className="form-label fw-semibold mb-1"
                    style={{
                      fontSize: 13,
                      color: theme.isDark ? "#d1d5db" : "#374151",
                    }}
                  >
                    학교명
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="예) 서울중학교"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      borderRadius: 10,
                      background: theme.isDark ? "#2d2d2d" : "#fff",
                      color: theme.isDark ? "#f3f4f6" : "#1a1a1a",
                      border: theme.isDark ? "1px solid #444" : "1px solid #ced4da",
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <label
                    className="form-label fw-semibold mb-1"
                    style={{
                      fontSize: 13,
                      color: theme.isDark ? "#d1d5db" : "#374151",
                    }}
                  >
                    학교 종류
                  </label>
                  <select
                    className="form-select"
                    value={schoolKind}
                    onChange={(e) => setSchoolKind(e.target.value)}
                    style={{
                      borderRadius: 10,
                      background: theme.isDark ? "#2d2d2d" : "#fff",
                      color: theme.isDark ? "#f3f4f6" : "#1a1a1a",
                      border: theme.isDark ? "1px solid #444" : "1px solid #ced4da",
                    }}
                  >
                    {SCHOOL_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k || "전체"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <button
                    type="submit"
                    className="btn w-100"
                    disabled={loading}
                    style={{
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #25A194, #1a7a6e)",
                      color: "#fff",
                      fontWeight: 600,
                      border: "none",
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" />
                        검색 중
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search me-1"></i>검색
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* 검색 결과 */}
          {searched && (
            <div
              style={{
                background: theme.isDark ? "#1e1e1e" : "#fff",
                borderRadius: 16,
                boxShadow: theme.isDark ? "0 4px 6px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.08)",
                overflow: "hidden",
                transition: "background 0.3s",
              }}
            >
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: `1px solid ${theme.isDark ? "#333" : "#f3f4f6"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: theme.isDark ? "#f3f4f6" : "#1a1a1a",
                  }}
                >
                  검색 결과
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: theme.isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  총 {totalElements.toLocaleString()}개
                </span>
              </div>

              {schools.length === 0 ? (
                <div
                  style={{
                    padding: "48px 24px",
                    textAlign: "center",
                    color: theme.isDark ? "#6b7280" : "#9ca3af",
                  }}
                >
                  <i
                    className="bi bi-building"
                    style={{
                      fontSize: 40,
                      display: "block",
                      marginBottom: 12,
                      opacity: 0.3,
                    }}
                  ></i>
                  검색 결과가 없습니다.
                </div>
              ) : (
                <div className="table-responsive">
                  <table
                    className={`table table-hover mb-0 ${theme.isDark ? "table-dark" : ""}`}
                    style={{ fontSize: 14, background: "transparent" }}
                  >
                    <thead style={{ background: theme.isDark ? "#2d2d2d" : "#f9fafb" }}>
                      <tr>
                        <th
                          style={{
                            padding: "12px 20px",
                            fontWeight: 600,
                            color: theme.isDark ? "#d1d5db" : "#374151",
                            borderBottom: `1px solid ${theme.isDark ? "#444" : "#f3f4f6"}`,
                            background: "transparent",
                          }}
                        >
                          학교명
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            fontWeight: 600,
                            color: theme.isDark ? "#d1d5db" : "#374151",
                            width: 100,
                            borderBottom: `1px solid ${theme.isDark ? "#444" : "#f3f4f6"}`,
                            background: "transparent",
                          }}
                        >
                          종류
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            fontWeight: 600,
                            color: theme.isDark ? "#d1d5db" : "#374151",
                            width: 170,
                            borderBottom: `1px solid ${theme.isDark ? "#444" : "#f3f4f6"}`,
                            background: "transparent",
                          }}
                        >
                          관할 교육청
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            fontWeight: 600,
                            color: theme.isDark ? "#d1d5db" : "#374151",
                            borderBottom: `1px solid ${theme.isDark ? "#444" : "#f3f4f6"}`,
                            background: "transparent",
                          }}
                        >
                          주소
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            fontWeight: 600,
                            color: theme.isDark ? "#d1d5db" : "#374151",
                            width: 90,
                            textAlign: "center",
                            borderBottom: `1px solid ${theme.isDark ? "#444" : "#f3f4f6"}`,
                            background: "transparent",
                          }}
                        >
                          선택
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {schools.map((school) => (
                        <tr key={school.id}>
                          <td
                            style={{
                              padding: "12px 20px",
                              fontWeight: 500,
                              color: theme.isDark ? "#f3f4f6" : "#1a1a1a",
                              borderColor: theme.isDark ? "#333" : "#f3f4f6",
                              background: "transparent",
                            }}
                          >
                            {school.name}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              borderColor: theme.isDark ? "#333" : "#f3f4f6",
                              background: "transparent",
                            }}
                          >
                            <span
                              style={{
                                background: theme.isDark ? "#374151" : "#f3f4f6",
                                color: theme.isDark ? "#e5e7eb" : "#374151",
                                borderRadius: 6,
                                padding: "2px 8px",
                                fontSize: 12,
                                fontWeight: 500,
                              }}
                            >
                              {school.schoolKind ?? "-"}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: theme.isDark ? "#9ca3af" : "#6b7280",
                              fontSize: 13,
                              borderColor: theme.isDark ? "#333" : "#f3f4f6",
                              background: "transparent",
                            }}
                          >
                            {school.officeOfEducation ?? "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: theme.isDark ? "#9ca3af" : "#6b7280",
                              fontSize: 13,
                              maxWidth: 220,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              borderColor: theme.isDark ? "#333" : "#f3f4f6",
                              background: "transparent",
                            }}
                          >
                            {school.address ?? "-"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              textAlign: "center",
                              borderColor: theme.isDark ? "#333" : "#f3f4f6",
                              background: "transparent",
                            }}
                          >
                            <button
                              onClick={() => handleSelect(school)}
                              style={{
                                background: "linear-gradient(135deg, #25A194, #1a7a6e)",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                padding: "5px 14px",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "opacity 0.2s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                              선택
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div
                  style={{
                    padding: "14px 24px",
                    borderTop: `1px solid ${theme.isDark ? "#333" : "#f3f4f6"}`,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <nav>
                    <ul className={`pagination pagination-sm mb-0 ${theme.isDark ? "pagination-dark" : ""}`}>
                      <li className={`page-item${page === 0 ? " disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => fetchSchools(page - 1)}
                          style={{
                            background: theme.isDark ? "#2d2d2d" : undefined,
                            borderColor: theme.isDark ? "#444" : undefined,
                            color: theme.isDark ? "#d1d5db" : undefined,
                          }}
                        >
                          &laquo;
                        </button>
                      </li>
                      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                        const start = Math.max(0, Math.min(page - 4, totalPages - 10));
                        const p = start + i;
                        return (
                          <li key={p} className={`page-item${p === page ? " active" : ""}`}>
                            <button
                              className="page-link"
                              onClick={() => fetchSchools(p)}
                              style={{
                                background: p === page ? "#25A194" : theme.isDark ? "#2d2d2d" : undefined,
                                borderColor: theme.isDark && p !== page ? "#444" : undefined,
                                color: p === page ? "#fff" : theme.isDark ? "#d1d5db" : undefined,
                              }}
                            >
                              {p + 1}
                            </button>
                          </li>
                        );
                      })}
                      <li className={`page-item${page >= totalPages - 1 ? " disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => fetchSchools(page + 1)}
                          style={{
                            background: theme.isDark ? "#2d2d2d" : undefined,
                            borderColor: theme.isDark ? "#444" : undefined,
                            color: theme.isDark ? "#d1d5db" : undefined,
                          }}
                        >
                          &raquo;
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          )}

          {/* 미검색 안내 */}
          {!searched && (
            <div
              style={{
                background: theme.isDark ? "#1e1e1e" : "#fff",
                borderRadius: 16,
                boxShadow: theme.isDark ? "0 4px 6px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.08)",
                padding: "48px 24px",
                textAlign: "center",
                color: theme.isDark ? "#6b7280" : "#9ca3af",
                transition: "background 0.3s",
              }}
            >
              <i
                className="bi bi-search"
                style={{
                  fontSize: 40,
                  display: "block",
                  marginBottom: 12,
                  opacity: 0.3,
                }}
              ></i>
              <p style={{ margin: 0, fontSize: 14 }}>학교명을 입력하고 검색하세요.</p>
              <p style={{ margin: "6px 0 0", fontSize: 13 }}>
                학교 DB가 비어있다면 위의{" "}
                <strong style={{ color: theme.isDark ? "#d1d5db" : "#374151" }}>학교 DB 동기화 (NEIS)</strong> 버튼을
                먼저 실행해 주세요.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
