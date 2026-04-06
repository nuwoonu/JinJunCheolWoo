import { useState, useEffect } from "react";
import { useSchoolSearch, type SchoolSummary } from "@/shared/hooks/useSchoolSearch";
import api from "@/shared/api/authApi";

const SCHOOL_KIND_OPTIONS = [
  { value: "", label: "전체" },
  { value: "초등학교", label: "초등학교" },
  { value: "중학교", label: "중학교" },
  { value: "고등학교", label: "고등학교" },
  { value: "특수학교", label: "특수학교" },
];

// [soojin] Main-design.tsx 의 학교 찾기 섹션을 독립 페이지로 분리
export default function SchoolSearchPage() {
  const schoolSearch = useSchoolSearch((params) => api.get("/schools", { params }), 5);
  const [selectedSchool, setSelectedSchool] = useState<SchoolSummary | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        :root {
          --teal: #1A9EA0; --teal-dark: #157A7C; --teal-deeper: #0E5F61;
          --teal-light: #E0F5F5; --teal-pale: #F0FAFA;
          --navy: #0F2B3C; --slate: #3A5568; --warm-gray: #6B7B8D;
          --light-gray: #F4F7F9; --white: #FFFFFF;
          --shadow-sm: 0 2px 8px rgba(15,43,60,0.06);
          --shadow-md: 0 8px 32px rgba(15,43,60,0.08);
          --radius: 16px;
        }
        html, body { margin: 0; padding: 0; }
        .sm-root {
          font-family: var(--app-font-sans); color: var(--navy); background: var(--white);
          display: flex; flex-direction: column; min-height: 100vh;
        }
        .sm-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          height: 64px; background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(26,158,160,0.08);
          display: flex; align-items: center; transition: box-shadow 0.3s;
        }
        .sm-nav.scrolled { box-shadow: var(--shadow-sm); }
        .nav-link-tab {
          color: var(--slate); font-weight: 500; padding: 6px 14px;
          border-radius: 8px; text-decoration: none; font-size: 0.92rem;
          transition: color 0.2s; cursor: pointer; background: none; border: none;
          font-family: var(--app-font-sans);
        }
        .nav-link-tab:hover { color: var(--teal); }
        .nav-link-tab.active { color: var(--teal); font-weight: 700; }
        .btn-login-nav { color: var(--slate); font-weight: 500; text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
        .btn-login-nav:hover { color: var(--teal); }
        .btn-register-nav {
          color: var(--white); font-weight: 600; font-size: 0.9rem;
          background: var(--teal-dark); padding: 9px 20px;
          border-radius: 50px; text-decoration: none; transition: all 0.2s;
        }
        .btn-register-nav:hover { background: var(--teal-deeper); transform: translateY(-1px); }
        .page-hero {
          padding: 56px 48px 32px;
          text-align: center;
        }
        .page-hero h3 { font-size: 2.4rem; font-weight: 800; margin-bottom: 12px; letter-spacing: -1px; color: var(--navy); }
        .page-hero p { font-size: 1.05rem; color: var(--warm-gray); margin: 0; }
        .page-content { flex: 1; min-height: calc(100vh - 64px); } /* [soojin] footer 뷰포트 밖으로 밀기 */
        .page-body { max-width: 1100px; margin: 0 auto; padding: 32px 48px 64px; }
        .school-search-box { background: var(--white); border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow-md); }
        .school-result-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-radius: 10px; cursor: pointer;
          transition: all 0.2s; border: 1px solid #eaeaea; margin-bottom: 8px; background: var(--white);
        }
        .school-result-item:hover, .school-result-item.sel { background: var(--teal-pale); border-color: var(--teal); }
        .school-info-card { background: var(--teal-dark); border-radius: var(--radius); padding: 28px; color: var(--white); }
        .school-info-item { background: rgba(255,255,255,0.15); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; }
        .school-info-label { font-size: 0.76rem; color: rgba(255,255,255,0.72); margin-bottom: 3px; }
        .school-info-value { font-size: 0.92rem; font-weight: 600; }
        .main-footer {
          background: #fafafa; color: var(--warm-gray);
          border-top: 1px solid #ebebeb;
          padding: 40px 24px; text-align: center; font-size: 0.82rem; line-height: 1.8;
        }
        .footer-links { display: flex; justify-content: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .footer-links a { color: var(--slate); text-decoration: none; font-size: 0.82rem; }
        .footer-links a:hover { color: var(--teal); }
        .footer-divider { width: 1px; height: 14px; background: #d1d5db; align-self: center; }
        .footer-info { margin-bottom: 12px; line-height: 1.9; color: var(--warm-gray); }
        .footer-copy { font-size: 0.78rem; color: #9ca3af; }
      `}</style>

      <div className="sm-root">
        {/* NAV */}
        <nav className={`sm-nav${isScrolled ? " scrolled" : ""}`}>
          <div style={{ width: "100%", padding: "0 24px", boxSizing: "border-box", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="d-flex align-items-center gap-3">
              <a href="/main" style={{ lineHeight: 0 }}>
                <img src="/images/schoolmateLogo.png" alt="SchoolMate" width="160" height="37" />
              </a>
              <div className="d-none d-md-flex gap-1 ms-2">
                <a href="/main#features" className="nav-link-tab">서비스 소개</a>
                <a href="/school-search" className="nav-link-tab active">학교 찾기</a>
                <a href="/service-notice" className="nav-link-tab">공지사항</a>
              </div>
            </div>
            <div className="d-flex gap-3 align-items-center">
              <a href="/login" className="btn-login-nav">
                <i className="fa-solid fa-arrow-right-to-bracket me-1" />로그인
              </a>
              <a href="/register" className="btn-register-nav">
                <i className="fa-solid fa-user-plus me-1" />회원가입
              </a>
            </div>
          </div>
        </nav>
        <div style={{ height: 64 }} />

        {/* [soojin] flex: 1 래퍼 — footer를 아래로 밀기 */}
        <div className="page-content">
          {/* 페이지 헤더 */}
          <div className="page-hero">
            <h3>학교 찾기</h3>
            <p>학교명 또는 종류로 검색하고 상세 정보를 확인하세요</p>
          </div>

          {/* 콘텐츠 */}
          <div className="page-body">
            <div className="row g-4 justify-content-center">
              <div className="col-lg-5">
                <div className="school-search-box">
                  <form onSubmit={schoolSearch.handleSearch}>
                    <input
                      type="text"
                      className="form-control mb-4"
                      placeholder="학교명을 입력하세요"
                      value={schoolSearch.name}
                      onChange={(e) => schoolSearch.setName(e.target.value)}
                      style={{ borderRadius: 10 }}
                    />
                    <div className="d-flex gap-2 mb-2">
                      <select
                        className="form-select"
                        value={schoolSearch.schoolKind}
                        onChange={(e) => schoolSearch.setSchoolKind(e.target.value)}
                        style={{ borderRadius: 10 }}
                      >
                        {SCHOOL_KIND_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="btn flex-shrink-0"
                        style={{ background: "var(--teal)", color: "#fff", borderRadius: 50, fontWeight: 600, minWidth: 70 }}
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
                                <div style={{ fontWeight: 600, color: "var(--navy)", fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {school.name}
                                </div>
                                <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: 2 }}>
                                  {school.schoolKind} · {school.officeOfEducation}
                                </div>
                              </div>
                              <i className="ri-arrow-right-s-line" style={{ color: selectedSchool?.id === school.id ? "var(--teal)" : "#d1d5db", fontSize: 18, flexShrink: 0 }} />
                            </div>
                          ))}
                          {schoolSearch.totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-2 gap-1">
                              <button className="btn btn-sm btn-outline-secondary" disabled={schoolSearch.page === 0} onClick={() => schoolSearch.fetchSchools(schoolSearch.page - 1)}>이전</button>
                              <span style={{ lineHeight: "30px", fontSize: "0.82rem", color: "#6b7280", padding: "0 6px" }}>
                                {schoolSearch.page + 1} / {schoolSearch.totalPages}
                              </span>
                              <button className="btn btn-sm btn-outline-secondary" disabled={schoolSearch.page >= schoolSearch.totalPages - 1} onClick={() => schoolSearch.fetchSchools(schoolSearch.page + 1)}>다음</button>
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
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className="ri-building-2-line" style={{ fontSize: 24 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, lineHeight: 1.2 }}>{selectedSchool.name}</div>
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
                          <a href={selectedSchool.homepage} target="_blank" rel="noopener noreferrer" style={{ color: "#fff", textDecoration: "underline" }}>
                            {selectedSchool.homepage}
                          </a>
                        ) : "—"}
                      </div>
                    </div>
                    <div className="school-info-item">
                      <div className="school-info-label">주소</div>
                      <div className="school-info-value" style={{ fontSize: "0.88rem" }}>{selectedSchool.address || "—"}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ minHeight: 240, border: "2px dashed rgba(26,158,160,0.25)", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af", gap: 10 }}>
                    <i className="ri-building-2-line" style={{ fontSize: 40, color: "var(--teal-light)" }} />
                    <div style={{ fontSize: "0.9rem", textAlign: "center" }}>
                      좌측에서 학교를 검색 후 클릭하면<br />상세 정보가 표시됩니다.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="main-footer">
          <div className="container">
            <div className="footer-links">
              <a href="/privacy">개인정보처리방침</a>
              <div className="footer-divider" />
              <a href="/terms">이용약관</a>
              <div className="footer-divider" />
              <a href="/contact">문의하기</a>
            </div>
            <div className="footer-info">
              <span>(주)스쿨메이트 &nbsp;|&nbsp; 대표: 진준철우</span><br />
              <span>주소: 서울특별시 종로구 종로12길 15 코아빌딩 2층</span><br />
              <span>이메일: contact@schoolmate.kr &nbsp;|&nbsp; 전화: 0507-1430-7001</span>
            </div>
            <div className="footer-copy">Copyright 2026 SchoolMate. All Rights Reserved.</div>
          </div>
        </footer>
      </div>
    </>
  );
}
