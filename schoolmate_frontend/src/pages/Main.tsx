import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageLoader from "@/components/PageLoader";
import { useSchoolSearch, type SchoolSummary } from "@/hooks/useSchoolSearch";
import api from "@/api/auth";

interface ServiceNotice {
  id: number;
  title: string;
  writerName: string;
  viewCount: number;
  isPinned: boolean;
  createDate: string;
}

interface ServiceNoticeDetail extends ServiceNotice {
  content: string;
  updateDate: string;
}

const SCHOOL_KIND_OPTIONS = [
  { value: "", label: "전체" },
  { value: "초등학교", label: "초등학교" },
  { value: "중학교", label: "중학교" },
  { value: "고등학교", label: "고등학교" },
  { value: "특수학교", label: "특수학교" },
];

const P = "#25a194";
const NAV_H = 64;

export default function Main() {
  const { user, loading } = useAuth();

  const schoolSearch = useSchoolSearch((params) => api.get("/schools", { params }), 5);
  const [selectedSchool, setSelectedSchool] = useState<SchoolSummary | null>(null);

  const [notices, setNotices] = useState<ServiceNotice[]>([]);
  const [noticePage, setNoticePage] = useState(0);
  const [noticeTotalPages, setNoticeTotalPages] = useState(1);
  const [noticeTotalElements, setNoticeTotalElements] = useState(0);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<ServiceNoticeDetail | null>(null);
  const [noticeDetailLoading, setNoticeDetailLoading] = useState(false);

  useEffect(() => {
    fetchNotices(0);
  }, []);

  const fetchNotices = (p = 0) => {
    setNoticeLoading(true);
    api
      .get(`/service-notices?page=${p}&size=10`)
      .then((res) => {
        setNotices(res.data.content);
        setNoticeTotalPages(res.data.totalPages);
        setNoticeTotalElements(res.data.totalElements);
        setNoticePage(res.data.number ?? p);
      })
      .catch(() => {})
      .finally(() => setNoticeLoading(false));
  };

  const openNotice = (id: number) => {
    setNoticeDetailLoading(true);
    api
      .get(`/service-notices/${id}`)
      .then((res) => setSelectedNotice(res.data))
      .catch(() => {})
      .finally(() => setNoticeDetailLoading(false));
  };

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) return <PageLoader />;
  if (user?.authenticated) return <Navigate to="/hub" replace />;

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; }
        .main-root { font-family: 'Pretendard', 'Noto Sans KR', sans-serif; }

        /* ── 네비게이션 ── */
        .main-nav {
          height: ${NAV_H}px;
          background: #fff;
          border-bottom: 1px solid #e8ecec;
          display: flex; align-items: center;
          position: sticky; top: 0; z-index: 100;
        }
        .nav-link-tab {
          color: #555; font-weight: 500; padding: 6px 14px;
          border-radius: 8px; text-decoration: none; font-size: 0.95rem;
          transition: color 0.2s; cursor: pointer; background: none; border: none;
        }
        .nav-link-tab:hover { color: ${P}; background: none; }
        .btn-login-nav { color: #333; font-weight: 500; text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
        .btn-login-nav:hover { color: ${P}; }
        .btn-register-nav {
          color: #fff; font-weight: 600; font-size: 0.9rem;
          background: linear-gradient(135deg, ${P}, #1a7a6e);
          padding: 8px 18px; border-radius: 20px; text-decoration: none;
          box-shadow: 0 3px 12px rgba(37,161,148,0.3); transition: all 0.2s;
        }
        .btn-register-nav:hover { transform: translateY(-1px); box-shadow: 0 5px 18px rgba(37,161,148,0.4); }

        /* ── 공통 ── */
        .section-tag {
          display: inline-block;
          background: rgba(37,161,148,0.1); color: ${P};
          font-size: 0.78rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
          padding: 5px 12px; border-radius: 20px; margin-bottom: 14px;
        }
        .section-title { font-size: 2rem; font-weight: 800; color: #1a2e2c; margin-bottom: 12px; }
        .section-desc { font-size: 0.95rem; color: #6b7280; line-height: 1.8; }

        /* ── 섹션 1: 히어로 ── */
        .hero-wrap { background: ${P}; padding: 0; overflow: hidden; min-height: calc(100vh - ${NAV_H}px); display: flex; align-items: center; }
        .hero-title { color: #fff; font-size: 3rem; font-weight: 800; margin-bottom: 1.2rem; line-height: 1.25; }
        .hero-desc { color: rgba(255,255,255,0.85); font-size: 1rem; line-height: 1.9; margin-bottom: 2rem; }
        .hero-btn-primary {
          background: #fff; color: ${P}; font-weight: 700;
          padding: 14px 32px; border-radius: 30px; text-decoration: none;
          transition: all 0.3s; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: inline-block;
        }
        .hero-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
        .hero-avatars { display: flex; align-items: flex-end; gap: 14px; height: 340px; }
        .avatar-pill {
          border-radius: 100px;
          display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
          padding-bottom: 22px; overflow: hidden;
        }
        .pill-1 { width: 120px; height: 240px; background: rgba(255,255,255,0.18); }
        .pill-2 { width: 120px; height: 320px; background: rgba(255,255,255,0.25); }
        .pill-3 { width: 120px; height: 270px; background: rgba(255,255,255,0.15); }
        .avatar-emoji { font-size: 62px; line-height: 1; margin-bottom: 10px; }
        .avatar-label { color: rgba(255,255,255,0.95); font-size: 0.88rem; font-weight: 700; letter-spacing: 0.5px; }

        /* ── 섹션 2: 기능 소개 ── */
        .feature-card {
          background: #fff; border-radius: 18px; padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          transition: all 0.3s; height: 100%; border: 1px solid #f0f0f0;
        }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 10px 36px rgba(37,161,148,0.14); }
        .feature-icon-wrap {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }

        /* ── 섹션 3: 역할별 ── */
        .role-card {
          border-radius: 14px; padding: 28px 24px;
          border: 2px solid #f0f0f0; transition: all 0.3s; height: 100%; background: #fff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .role-card:hover { border-color: ${P}; }
        .role-feature-list { list-style: none; padding: 0; margin: 0; }
        .role-feature-list li {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 0.88rem; color: #4b5563; padding: 5px 0;
          border-bottom: 1px solid #f4f4f4;
        }
        .role-feature-list li:last-child { border-bottom: none; }

        /* ── 섹션 4: 학교 찾기 ── */
        .school-search-box { background: #fff; border-radius: 14px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
        .school-result-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-radius: 10px; cursor: pointer;
          transition: all 0.2s; border: 1px solid #eaeaea; margin-bottom: 7px; background: #fff;
        }
        .school-result-item:hover, .school-result-item.sel { background: rgba(37,161,148,0.08); border-color: ${P}; }
        .school-info-card {
          background: linear-gradient(135deg, ${P}, #1a7a6e);
          border-radius: 14px; padding: 28px; color: #fff;
        }
        .school-info-item { background: rgba(255,255,255,0.15); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; }
        .school-info-label { font-size: 0.76rem; color: rgba(255,255,255,0.72); margin-bottom: 3px; }
        .school-info-value { font-size: 0.92rem; font-weight: 600; }

        /* ── 섹션 5: 공지사항 ── */
        .notice-wrap { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
        .notice-hd { padding: 18px 24px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .notice-row { display: flex; align-items: center; padding: 13px 24px; border-bottom: 1px solid #f8f8f8; cursor: pointer; transition: background 0.18s; gap: 14px; }
        .notice-row:hover { background: #f0faf9; }
        .notice-row:last-child { border-bottom: none; }
        .notice-pin { background: #ff4444; color: #fff; font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 5px; white-space: nowrap; }
        .notice-title { flex: 1; font-size: 0.92rem; font-weight: 500; color: #1a2e2c; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .notice-meta { font-size: 0.78rem; color: #9ca3af; white-space: nowrap; }

        /* ── footer ── */
        .main-footer { background: #fafafa; color: rgba(0,0,0,0.55); padding: 36px 0 24px; }
        .footer-links { display: flex; justify-content: center; gap: 24px; margin-bottom: 20px; }
        .footer-links a { color: rgba(0,0,0,0.6); text-decoration: none; font-size: 0.85rem; transition: color 0.2s; }
        .footer-links a:hover { color: #000; }
        .footer-divider { width: 1px; background: rgba(0,0,0,0.15); }
        .footer-info { text-align: center; font-size: 0.8rem; line-height: 1.9; margin-bottom: 20px; }
        .footer-copy { font-size: 0.75rem; text-align: center; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 16px; color: rgba(0,0,0,0.35); }

        @media (max-width: 992px) { .hero-title { font-size: 2.2rem; } .section-title { font-size: 1.7rem; } }
      `}</style>

      <div className="main-root">
        {/* ── 네비게이션 ── */}
        <nav className="main-nav">
          <div className="container d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <a href="#hero" onClick={scrollTo("hero")} style={{ lineHeight: 0 }}>
                <img src="/images/schoolmateLogo.png" alt="SchoolMate" width="160" height="37" />
              </a>
              <div className="d-none d-md-flex gap-1 ms-2">
                <button className="nav-link-tab" onClick={scrollTo("features")}>
                  서비스 소개
                </button>
                <button className="nav-link-tab" onClick={scrollTo("school")}>
                  학교 찾기
                </button>
                <button className="nav-link-tab" onClick={scrollTo("notice")}>
                  공지사항
                </button>
              </div>
            </div>
            <div className="d-flex gap-3 align-items-center">
              <a href="/login" className="btn-login-nav">
                <i className="fa-solid fa-arrow-right-to-bracket me-1" />
                로그인
              </a>
              <a href="/register" className="btn-register-nav">
                <i className="fa-solid fa-user-plus me-1" />
                회원가입
              </a>
            </div>
          </div>
        </nav>

        {/* ════ 섹션 1: 히어로 (teal) ════ */}
        <section id="hero" className="hero-wrap">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-6 py-5">
                <p
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "0.9rem",
                    letterSpacing: "0.5px",
                    marginBottom: 14,
                  }}
                >
                  스마트한 학급 관리의 시작
                </p>
                <h1 className="hero-title">School Mate</h1>
                <div
                  style={{
                    marginBottom: "1.4rem",
                    color: "#1a2e2c",
                    fontWeight: 700,
                    fontSize: "1.15rem",
                    lineHeight: 1.8,
                  }}
                >
                  학생, 교사, 학부모를 위한
                  <br />
                  통합 학급 관리 플랫폼
                </div>
                <p className="hero-desc">
                  출결 관리부터 성적 확인, 학급 소통까지
                  <br />
                  SchoolMate와 함께하세요.
                </p>
                <a href="/register" className="hero-btn-primary">
                  무료로 시작하기 →
                </a>
              </div>
              <div className="col-lg-6 d-none d-lg-flex justify-content-center align-items-center">
                <img
                  src="/images/hero-illustration.svg"
                  alt="hero illustration"
                  style={{ width: "100%", maxWidth: 520 }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ════ 섹션 2: 기능 소개 (white) ════ */}
        <section id="features" style={{ background: "#fff", padding: "80px 0", minHeight: `calc(100vh - ${NAV_H}px)`, display: "flex", alignItems: "center" }}>
          <div className="container">
            <div className="row align-items-center g-5">
              <div className="col-lg-4">
                <span className="section-tag">서비스 소개</span>
                <h2 className="section-title">
                  SchoolMate에서
                  <br />
                  제공하는 기능,
                  <br />
                  어떤 것이 있나요?
                </h2>
                <p className="section-desc">출결·성적·과제·상담·일정을 하나의 시스템에서 통합 관리합니다.</p>
              </div>
              <div className="col-lg-8">
                <div className="row g-3">
                  {[
                    {
                      icon: "ri-stack-line",
                      color: P,
                      bg: "rgba(37,161,148,0.11)",
                      title: "통합 관리",
                      desc: "출결·성적·과제·상담·일정·갤러리를 한 플랫폼에서 관리합니다.",
                      emoji: "📊",
                    },
                    {
                      icon: "ri-user-settings-line",
                      color: "#6d4ca5",
                      bg: "rgba(109,76,165,0.09)",
                      title: "역할 기반 시스템",
                      desc: "관리자·교사·학생·학부모 각 역할에 맞는 전용 화면을 제공합니다.",
                      emoji: "👥",
                    },
                    {
                      icon: "ri-layout-2-line",
                      color: "#10b981",
                      bg: "rgba(16,185,129,0.09)",
                      title: "쉬운 UI",
                      desc: "복잡한 메뉴를 최소화하여 누구나 쉽게 사용할 수 있습니다.",
                      emoji: "✨",
                    },
                    {
                      icon: "ri-notification-3-line",
                      color: "#f59e0b",
                      bg: "rgba(245,158,11,0.09)",
                      title: "실시간 알림",
                      desc: "출결, 과제, 상담 변경 사항을 즉시 알림으로 확인하세요.",
                      emoji: "🔔",
                    },
                  ].map((f) => (
                    <div key={f.title} className="col-sm-6">
                      <div className="feature-card d-flex gap-3 align-items-start">
                        <div className="feature-icon-wrap flex-shrink-0" style={{ background: f.bg }}>
                          <i className={f.icon} style={{ fontSize: 22, color: f.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1a2e2c", marginBottom: 5 }}>
                            {f.title}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.6 }}>{f.desc}</div>
                        </div>
                        <div style={{ fontSize: 28, flexShrink: 0, opacity: 0.4 }}>{f.emoji}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════ 섹션 3: 역할별 서비스 (light teal) ════ */}
        <section style={{ background: "#f0faf9", padding: "80px 0", minHeight: `calc(100vh - ${NAV_H}px)`, display: "flex", alignItems: "center" }}>
          <div className="container">
            <div className="text-center mb-5">
              <span className="section-tag">역할별 서비스</span>
              <h2 className="section-title">역할에 맞는 맞춤 기능을 제공합니다</h2>
              <p className="section-desc">관리자, 교사, 학부모, 학생 모두를 위한 전용 대시보드</p>
            </div>
            <div className="row g-3">
              {[
                {
                  icon: "ri-shield-user-line",
                  color: "#ef4444",
                  bg: "#fee2e2",
                  label: "관리자",
                  badge: "Admin",
                  items: ["권한 관리", "학사 데이터 관리", "공지 관리", "교직원 정보 관리"],
                },
                {
                  icon: "ri-book-open-line",
                  color: "#f59e0b",
                  bg: "#fef3c7",
                  label: "교사",
                  badge: "Teacher",
                  items: ["교사 전용 대시보드", "출결·성적·과제 관리", "학급 관리", "학부모 상담 관리"],
                },
                {
                  icon: "ri-heart-2-line",
                  color: "#8b5cf6",
                  bg: "#ede9fe",
                  label: "학부모",
                  badge: "Parents",
                  items: ["자녀 선택", "자녀 학습·생활 현황", "상담 신청", "학부모 게시판"],
                },
                {
                  icon: "ri-graduation-cap-line",
                  color: P,
                  bg: "rgba(37,161,148,0.1)",
                  label: "학생",
                  badge: "Student",
                  items: ["개인 학습 대시보드", "과제·일정 확인", "성적 관리", "학생 게시판"],
                },
              ].map((r) => (
                <div key={r.label} className="col-md-6 col-lg-3">
                  <div className="role-card">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className={r.icon} style={{ fontSize: 24, color: r.color }} />
                      <div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 8,
                            background: r.bg,
                            color: r.color,
                          }}
                        >
                          {r.badge}
                        </span>
                        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1a2e2c", marginTop: 2 }}>
                          {r.label}
                        </div>
                      </div>
                    </div>
                    <ul className="role-feature-list">
                      {r.items.map((it) => (
                        <li key={it}>
                          <i className="ri-check-line" style={{ color: P, marginTop: 2 }} />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ 섹션 4: 학교 찾기 (white) ════ */}
        <section id="school" style={{ background: "#fff", padding: "80px 0", minHeight: `calc(100vh - ${NAV_H}px)`, display: "flex", alignItems: "center" }}>
          <div className="container">
            <div className="text-center mb-4">
              <span className="section-tag">학교 찾기</span>
              <h2 className="section-title">우리 학교를 찾아보세요</h2>
              <p className="section-desc">학교명 또는 종류로 검색하고 상세 정보를 확인하세요</p>
            </div>
            <div className="row g-4 justify-content-center">
              <div className="col-lg-5">
                <div className="school-search-box">
                  <form onSubmit={schoolSearch.handleSearch}>
                    <input
                      type="text"
                      className="form-control mb-2"
                      placeholder="학교명을 입력하세요"
                      value={schoolSearch.name}
                      onChange={(e) => schoolSearch.setName(e.target.value)}
                      style={{ borderRadius: 8 }}
                    />
                    <div className="d-flex gap-2 mb-2">
                      <select
                        className="form-select"
                        value={schoolSearch.schoolKind}
                        onChange={(e) => schoolSearch.setSchoolKind(e.target.value)}
                        style={{ borderRadius: 8 }}
                      >
                        {SCHOOL_KIND_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="btn flex-shrink-0"
                        style={{ background: P, color: "#fff", borderRadius: 8, fontWeight: 600, minWidth: 64 }}
                        disabled={schoolSearch.loading}
                      >
                        {schoolSearch.loading ? "..." : "검색"}
                      </button>
                    </div>
                  </form>
                  {schoolSearch.searched && (
                    <div style={{ marginTop: 14 }}>
                      {schoolSearch.schools.length === 0 ? (
                        <div className="text-center py-4 text-secondary" style={{ fontSize: "0.9rem" }}>
                          검색 결과가 없습니다.
                        </div>
                      ) : (
                        <>
                          <small className="text-secondary px-1 d-block mb-2">총 {schoolSearch.totalElements}개</small>
                          {schoolSearch.schools.map((school) => (
                            <div
                              key={school.id}
                              className={`school-result-item${selectedSchool?.id === school.id ? " sel" : ""}`}
                              onClick={() => setSelectedSchool(school)}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    color: "#1a2e2c",
                                    fontSize: "0.92rem",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {school.name}
                                </div>
                                <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: 2 }}>
                                  {school.schoolKind} · {school.officeOfEducation}
                                </div>
                              </div>
                              <i
                                className="ri-arrow-right-s-line"
                                style={{
                                  color: selectedSchool?.id === school.id ? P : "#d1d5db",
                                  fontSize: 18,
                                  flexShrink: 0,
                                }}
                              />
                            </div>
                          ))}
                          {schoolSearch.totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-2 gap-1">
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                disabled={schoolSearch.page === 0}
                                onClick={() => schoolSearch.fetchSchools(schoolSearch.page - 1)}
                              >
                                이전
                              </button>
                              <span
                                style={{ lineHeight: "30px", fontSize: "0.82rem", color: "#6b7280", padding: "0 6px" }}
                              >
                                {schoolSearch.page + 1} / {schoolSearch.totalPages}
                              </span>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                disabled={schoolSearch.page >= schoolSearch.totalPages - 1}
                                onClick={() => schoolSearch.fetchSchools(schoolSearch.page + 1)}
                              >
                                다음
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-lg-7">
                {selectedSchool ? (
                  <div className="school-info-card">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <i className="ri-building-2-line" style={{ fontSize: 24 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, lineHeight: 1.2 }}>
                          {selectedSchool.name}
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.72)", marginTop: 3 }}>
                          {selectedSchool.schoolKind} · {selectedSchool.officeOfEducation}
                        </div>
                      </div>
                    </div>
                    <div className="school-info-item">
                      <div className="school-info-label">전화번호</div>
                      <div className="school-info-value">{selectedSchool.phoneNumber || "—"}</div>
                    </div>
                    <div className="school-info-item">
                      <div className="school-info-label">홈페이지</div>
                      <div className="school-info-value" style={{ wordBreak: "break-all" }}>
                        {selectedSchool.homepage ? (
                          <a
                            href={selectedSchool.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#fff", textDecoration: "underline" }}
                          >
                            {selectedSchool.homepage}
                          </a>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                    <div className="school-info-item">
                      <div className="school-info-label">주소</div>
                      <div className="school-info-value" style={{ fontSize: "0.88rem" }}>
                        {selectedSchool.address || "—"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      minHeight: 240,
                      border: "2px dashed #d1e8e6",
                      borderRadius: 14,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9ca3af",
                      gap: 10,
                    }}
                  >
                    <i className="ri-building-2-line" style={{ fontSize: 40, color: "#c5dedd" }} />
                    <div style={{ fontSize: "0.9rem", textAlign: "center" }}>
                      좌측에서 학교를 검색 후 클릭하면
                      <br />
                      상세 정보가 표시됩니다.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ════ 섹션 5: 공지사항 (light gray) ════ */}
        <section id="notice" style={{ background: "#f8fafc", padding: "80px 0", minHeight: `calc(100vh - ${NAV_H}px)`, display: "flex", alignItems: "center" }}>
          <div className="container">
            <div className="text-center mb-4">
              <span className="section-tag">공지사항</span>
              <h2 className="section-title">SchoolMate 소식</h2>
              <p className="section-desc">서비스 업데이트 및 중요 공지를 확인하세요</p>
            </div>
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="notice-wrap">
                  <div className="notice-hd">
                    <span style={{ fontWeight: 700, color: "#1a2e2c", fontSize: "0.95rem" }}>전체 공지</span>
                    <span style={{ fontSize: "0.82rem", color: "#9ca3af" }}>총 {noticeTotalElements}건</span>
                  </div>
                  {noticeLoading ? (
                    <div className="text-center py-5 text-secondary">불러오는 중...</div>
                  ) : notices.length === 0 ? (
                    <div className="text-center py-5 text-secondary">등록된 공지사항이 없습니다.</div>
                  ) : (
                    notices.map((n) => (
                      <div key={n.id} className="notice-row" onClick={() => openNotice(n.id)}>
                        {n.isPinned && <span className="notice-pin">공지</span>}
                        <span className="notice-title">{n.title}</span>
                        <span className="notice-meta">
                          {n.writerName} · {n.createDate?.slice(0, 10)}
                        </span>
                        <i className="ri-arrow-right-s-line" style={{ color: "#d1d5db", fontSize: 17 }} />
                      </div>
                    ))
                  )}
                  {noticeTotalPages > 1 && (
                    <div className="d-flex justify-content-center py-3 gap-1">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled={noticePage === 0}
                        onClick={() => fetchNotices(noticePage - 1)}
                      >
                        이전
                      </button>
                      {Array.from({ length: noticeTotalPages }, (_, i) => (
                        <button
                          key={i}
                          className="btn btn-sm"
                          style={
                            i === noticePage
                              ? { background: P, color: "#fff", border: "none" }
                              : { border: "1px solid #dee2e6", color: "#555" }
                          }
                          onClick={() => fetchNotices(i)}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled={noticePage >= noticeTotalPages - 1}
                        onClick={() => fetchNotices(noticePage + 1)}
                      >
                        다음
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════ footer (dark) ════ */}
        <footer className="main-footer">
          <div className="container">
            {/* 약관 링크 */}
            <div className="footer-links">
              <a href="/privacy">개인정보처리방침</a>
              <div className="footer-divider" />
              <a href="/terms">이용약관</a>
              <div className="footer-divider" />
              <a href="/contact">문의하기</a>
            </div>

            {/* 운영사 정보 */}
            <div className="footer-info">
              <span>(주)스쿨메이트 &nbsp;|&nbsp; 대표: 진준철우</span>
              <br />
              <span>주소: 서울특별시 종로구 종로12길 15 코아빌딩 2층</span>
              <br />
              <span>이메일: contact@schoolmate.kr &nbsp;|&nbsp; 전화: 0507-1430-7001</span>
            </div>

            {/* 저작권 */}
            <div className="footer-copy">Copyright 2026 SchoolMate. All Rights Reserved.</div>
          </div>
        </footer>
      </div>

      {/* 공지 상세 모달 */}
      {(selectedNotice || noticeDetailLoading) && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedNotice(null);
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: 14 }}>
              {noticeDetailLoading ? (
                <div className="modal-body text-center py-5">
                  <div className="spinner-border" style={{ color: P }} />
                </div>
              ) : (
                selectedNotice && (
                  <>
                    <div className="modal-header" style={{ borderBottom: "1px solid #f0f0f0", padding: "18px 24px" }}>
                      <div>
                        {selectedNotice.isPinned && <span className="notice-pin me-2">공지</span>}
                        <span style={{ fontWeight: 700, color: "#1a2e2c", fontSize: "1.05rem" }}>
                          {selectedNotice.title}
                        </span>
                        <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 5 }}>
                          {selectedNotice.writerName} · {selectedNotice.createDate?.slice(0, 10)} · 조회{" "}
                          {selectedNotice.viewCount}
                        </div>
                      </div>
                      <button type="button" className="btn-close" onClick={() => setSelectedNotice(null)} />
                    </div>
                    <div
                      className="modal-body"
                      style={{
                        padding: "24px",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.9,
                        color: "#374151",
                        fontSize: "0.93rem",
                      }}
                    >
                      {selectedNotice.content}
                    </div>
                    <div className="modal-footer" style={{ borderTop: "1px solid #f0f0f0", padding: "14px 24px" }}>
                      <button
                        className="btn"
                        style={{ background: P, color: "#fff", borderRadius: 8 }}
                        onClick={() => setSelectedNotice(null)}
                      >
                        닫기
                      </button>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
