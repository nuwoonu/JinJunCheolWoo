import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';
import { useSchool, type SelectedSchool } from '@/context/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import NotificationDropdown from '@/components/fragments/NotificationDropdown';

// [joon] 관리 학교 선택 — 사이드바 없는 독립 페이지

interface SchoolSummary {
  id: number;
  name: string;
  schoolCode: string;
  schoolKind: string;
  officeOfEducation: string;
  address: string;
}

interface PageResponse {
  content: SchoolSummary[];
  totalPages: number;
  totalElements: number;
  number: number;
}

const SCHOOL_KINDS = [
  "",
  "초등학교",
  "중학교",
  "고등학교",
  "특수학교",
  "각종학교",
];

// 다크모드 훅 (AdminHeader와 동일한 로직)
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const saved = localStorage.getItem("theme") ?? "light";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  return { isDark, toggle: () => setIsDark((prev) => !prev) };
}

export default function SchoolSelect() {
  const navigate = useNavigate();
  const { setSelectedSchool } = useSchool();
  const { signOut } = useAuth();
  const theme = useTheme(); // 다크모드 객체 생성

  const [name, setName] = useState("");
  const [schoolKind, setSchoolKind] = useState("");
  const [schools, setSchools] = useState<SchoolSummary[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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

  const fetchSchools = (pageNum = 0) => {
    setLoading(true);
    admin
      .get("/schools", {
        params: {
          name: name.trim() || undefined,
          schoolKind: schoolKind || undefined,
          page: pageNum,
          size: 10,
          sort: "name,asc",
        },
      })
      .then((r) => {
        const data: PageResponse = r.data;
        setSchools(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
        setPage(data.number);
        setSearched(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSchools(0);
  };

  const handleSelect = (school: SchoolSummary) => {
    const selected: SelectedSchool = {
      id: school.id,
      name: school.name,
      schoolCode: school.schoolCode,
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
    <div
      style={{
        minHeight: "100vh",
        background: theme.isDark ? "#121212" : "#f8fafc",
        transition: "background 0.3s",
      }}
    >
      {/* 상단 헤더 */}
      <header
        style={{
          background: theme.isDark ? "#1e1e1e" : "#fff",
          borderBottom: `1px solid ${theme.isDark ? "#333" : "#e5e7eb"}`,
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            to={ADMIN_ROUTES.MAIN}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: theme.isDark ? "#9ca3af" : "#6b7280",
              textDecoration: "none",
              padding: "4px 8px",
              borderRadius: 8,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = theme.isDark ? "#2d2d2d" : "#f3f4f6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <i className="ri-arrow-left-line" style={{ fontSize: 16 }} />
            <span>관리자 메뉴</span>
          </Link>
          <div style={{ width: 1, height: 20, background: theme.isDark ? "#444" : "#e5e7eb" }} />
          <img
            src="/images/schoolmateLogo.png"
            alt="SchoolMate"
            style={{ height: 32, width: "auto" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* 다크모드 토글 버튼 추가 */}
          <button
            type="button"
            onClick={theme.toggle}
            className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center me-2 border-0"
            aria-label="Dark & Light Mode Button"
          >
            <iconify-icon
              icon={theme.isDark ? "ri:sun-line" : "ri:moon-line"}
              className="text-primary-light text-xl"
            />
          </button>
          <NotificationDropdown />
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={handleSync}
            disabled={syncRunning}
            style={{
              fontSize: 13,
              borderColor: theme.isDark ? "#555" : undefined,
              color: theme.isDark ? "#ccc" : undefined,
            }}
          >
            <i className="bi bi-arrow-repeat me-1"></i>
            {syncRunning ? "동기화 진행 중..." : "학교 DB 동기화 (NEIS)"}
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={signOut}
            style={{ fontSize: 13 }}
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            로그아웃
          </button>
        </div>
      </header>

      {/* 본문 */}
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px" }}>
        {/* 타이틀 */}
        <div className="text-center mb-40">
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
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: theme.isDark ? "#f3f4f6" : "#1a1a1a",
              marginBottom: 8,
            }}
          >
            관리 학교 선택
          </h2>
          <p
            style={{
              color: theme.isDark ? "#9ca3af" : "#6b7280",
              fontSize: 14,
              margin: 0,
            }}
          >
            관리할 학교를 검색하여 선택해 주세요.
          </p>
        </div>

        {/* 검색 폼 */}
        <div
          style={{
            background: theme.isDark ? "#1e1e1e" : "#fff",
            borderRadius: 16,
            boxShadow: theme.isDark
              ? "0 4px 6px rgba(0,0,0,0.3)"
              : "0 1px 4px rgba(0,0,0,0.08)",
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
                    border: theme.isDark
                      ? "1px solid #444"
                      : "1px solid #ced4da",
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
                    border: theme.isDark
                      ? "1px solid #444"
                      : "1px solid #ced4da",
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
              boxShadow: theme.isDark
                ? "0 4px 6px rgba(0,0,0,0.3)"
                : "0 1px 4px rgba(0,0,0,0.08)",
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
                  <thead
                    style={{ background: theme.isDark ? "#2d2d2d" : "#f9fafb" }}
                  >
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
                              background:
                                "linear-gradient(135deg, #25A194, #1a7a6e)",
                              color: "#fff",
                              border: "none",
                              borderRadius: 8,
                              padding: "5px 14px",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "opacity 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.opacity = "0.85")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.opacity = "1")
                            }
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
                  <ul
                    className={`pagination pagination-sm mb-0 ${theme.isDark ? "pagination-dark" : ""}`}
                  >
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
                    {Array.from(
                      { length: Math.min(totalPages, 10) },
                      (_, i) => {
                        const start = Math.max(
                          0,
                          Math.min(page - 4, totalPages - 10),
                        );
                        const p = start + i;
                        return (
                          <li
                            key={p}
                            className={`page-item${p === page ? " active" : ""}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => fetchSchools(p)}
                              style={{
                                background:
                                  p === page
                                    ? "#25A194"
                                    : theme.isDark
                                      ? "#2d2d2d"
                                      : undefined,
                                borderColor:
                                  theme.isDark && p !== page
                                    ? "#444"
                                    : undefined,
                                color:
                                  p === page
                                    ? "#fff"
                                    : theme.isDark
                                      ? "#d1d5db"
                                      : undefined,
                              }}
                            >
                              {p + 1}
                            </button>
                          </li>
                        );
                      },
                    )}
                    <li
                      className={`page-item${page >= totalPages - 1 ? " disabled" : ""}`}
                    >
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
              boxShadow: theme.isDark
                ? "0 4px 6px rgba(0,0,0,0.3)"
                : "0 1px 4px rgba(0,0,0,0.08)",
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
            <p style={{ margin: 0, fontSize: 14 }}>
              학교명을 입력하고 검색하세요.
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              학교 DB가 비어있다면 상단의{" "}
              <strong style={{ color: theme.isDark ? "#d1d5db" : "#374151" }}>
                학교 DB 동기화 (NEIS)
              </strong>{" "}
              버튼을 먼저 실행해 주세요.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
