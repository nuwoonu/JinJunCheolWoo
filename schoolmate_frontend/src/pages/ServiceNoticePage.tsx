import { useState, useEffect } from "react";
import api from "@/shared/api/authApi";
import "react-quill-new/dist/quill.snow.css";

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

// [soojin] Main-design.tsx 의 공지사항 섹션을 독립 페이지로 분리
export default function ServiceNoticePage() {
  const [notices, setNotices] = useState<ServiceNotice[]>([]);
  const [noticePage, setNoticePage] = useState(0);
  const [noticeTotalPages, setNoticeTotalPages] = useState(1);
  const [noticeTotalElements, setNoticeTotalElements] = useState(0);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<ServiceNoticeDetail | null>(null);
  const [noticeDetailLoading, setNoticeDetailLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    fetchNotices(0);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fetchNotices = (p = 0) => {
    setNoticeLoading(true);
    api
      .get(`/service-notices?page=${p}&size=15`)
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

  return (
    <>
      <style>{`
        :root {
          --teal: #1A9EA0; --teal-dark: #157A7C; --teal-deeper: #0E5F61;
          --teal-light: #E0F5F5; --teal-pale: #F0FAFA;
          --navy: #0F2B3C; --slate: #3A5568; --warm-gray: #6B7B8D;
          --light-gray: #F4F7F9; --white: #FFFFFF;
          --accent-coral: #FF6B5B;
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
        .page-body { max-width: 900px; margin: 0 auto; padding: 32px 48px 64px; }
        .notice-wrap { background: var(--white); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-md); }
        .notice-hd { padding: 18px 24px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .notice-row {
          display: flex; align-items: center; padding: 13px 24px;
          border-bottom: 1px solid #f8f8f8; cursor: pointer;
          transition: background 0.18s; gap: 14px;
        }
        .notice-row:hover { background: var(--teal-pale); }
        .notice-row:last-child { border-bottom: none; }
        .notice-pin { background: var(--accent-coral); color: var(--white); font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 5px; white-space: nowrap; }
        .notice-title { flex: 1; font-size: 0.92rem; font-weight: 500; color: var(--navy); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .notice-meta { font-size: 0.78rem; color: #9ca3af; white-space: nowrap; }
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
                <a href="/school-search" className="nav-link-tab">학교 찾기</a>
                <a href="/service-notice" className="nav-link-tab active">공지사항</a>
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
            <h3>공지사항</h3>
            <p>서비스 업데이트 및 중요 공지를 확인하세요</p>
          </div>

          {/* 콘텐츠 */}
          <div className="page-body">
            <div className="notice-wrap">
              <div className="notice-hd">
                <span style={{ fontWeight: 700, color: "var(--navy)", fontSize: "0.95rem" }}>전체 공지</span>
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
                    <span className="notice-meta">{n.writerName} · {n.createDate?.slice(0, 10)}</span>
                    <i className="ri-arrow-right-s-line" style={{ color: "#d1d5db", fontSize: 17 }} />
                  </div>
                ))
              )}
              {noticeTotalPages > 1 && (
                <div className="d-flex justify-content-center py-3 gap-1">
                  <button className="btn btn-sm btn-outline-secondary" disabled={noticePage === 0} onClick={() => fetchNotices(noticePage - 1)}>이전</button>
                  {Array.from({ length: noticeTotalPages }, (_, i) => (
                    <button
                      key={i}
                      className="btn btn-sm"
                      style={i === noticePage ? { background: "var(--teal)", color: "#fff", border: "none" } : { border: "1px solid #dee2e6", color: "#555" }}
                      onClick={() => fetchNotices(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button className="btn btn-sm btn-outline-secondary" disabled={noticePage >= noticeTotalPages - 1} onClick={() => fetchNotices(noticePage + 1)}>다음</button>
                </div>
              )}
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

      {/* 공지 상세 모달 */}
      {(selectedNotice || noticeDetailLoading) && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedNotice(null); }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: 16 }}>
              {noticeDetailLoading ? (
                <div className="modal-body text-center py-5">
                  <div className="spinner-border" style={{ color: "var(--teal)" }} />
                </div>
              ) : (
                selectedNotice && (
                  <>
                    <div className="modal-header" style={{ borderBottom: "1px solid #f0f0f0", padding: "18px 24px" }}>
                      <div>
                        {selectedNotice.isPinned && <span className="notice-pin me-2">공지</span>}
                        <span style={{ fontWeight: 700, color: "var(--navy)", fontSize: "1.05rem" }}>{selectedNotice.title}</span>
                        <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 5 }}>
                          {selectedNotice.writerName} · {selectedNotice.createDate?.slice(0, 10)} · 조회 {selectedNotice.viewCount}
                        </div>
                      </div>
                      <button type="button" className="btn-close" onClick={() => setSelectedNotice(null)} />
                    </div>
                    <div
                      className="modal-body ql-editor"
                      style={{ padding: "24px", lineHeight: 1.9, color: "#374151", fontSize: "0.93rem" }}
                      dangerouslySetInnerHTML={{ __html: selectedNotice.content }}
                    />
                    <div className="modal-footer" style={{ borderTop: "1px solid #f0f0f0", padding: "14px 24px" }}>
                      <button className="btn" style={{ background: "var(--teal)", color: "#fff", borderRadius: 50 }} onClick={() => setSelectedNotice(null)}>닫기</button>
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
