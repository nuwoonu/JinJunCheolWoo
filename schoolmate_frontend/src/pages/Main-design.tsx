import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/contexts/AuthContext";
import PageLoader from "@/shared/components/PageLoader";
import { useSchoolSearch, type SchoolSummary } from "@/shared/hooks/useSchoolSearch";
import api from "@/shared/api/authApi";

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

type TabKey = "admin" | "teacher" | "parent" | "student";

const TAB_DATA: { key: TabKey; label: string; emoji: string; items: { emoji: string; title: string; desc: string }[] }[] = [
  {
    key: "admin",
    label: "관리자",
    emoji: "🔧",
    items: [
      { emoji: "🔑", title: "권한 관리", desc: "사용자별 접근 권한을 세밀하게 설정하고 관리합니다." },
      { emoji: "🗄️", title: "학사 데이터 관리", desc: "학교 전체 학사 데이터를 한 곳에서 체계적으로 관리합니다." },
      { emoji: "📢", title: "공지 관리", desc: "학교 공지사항을 작성하고 대상별로 발송합니다." },
      { emoji: "👔", title: "교직원 정보 관리", desc: "교직원 정보를 등록·수정하고 담당 업무를 배정합니다." },
    ],
  },
  {
    key: "teacher",
    label: "교사",
    emoji: "👩‍🏫",
    items: [
      { emoji: "📊", title: "교사 전용 대시보드", desc: "담당 학급 현황을 한눈에 파악하는 맞춤 대시보드를 제공합니다." },
      { emoji: "✅", title: "출결 / 성적 / 과제 관리", desc: "출석 체크, 성적 입력, 과제 배포와 제출 확인을 한 곳에서 처리합니다." },
      { emoji: "🏫", title: "학급 관리", desc: "학급 구성원을 관리하고 학급별 활동을 기록합니다." },
      { emoji: "💬", title: "학부모 상담 관리", desc: "상담 일정을 관리하고 상담 기록을 체계적으로 보관합니다." },
    ],
  },
  {
    key: "parent",
    label: "학부모",
    emoji: "👨‍👩‍👧",
    items: [
      { emoji: "👧", title: "자녀 선택", desc: "하나의 계정으로 여러 자녀를 전환하며 관리할 수 있습니다." },
      { emoji: "📈", title: "자녀 학습 / 생활 현황", desc: "자녀의 출석, 성적, 과제 현황을 실시간으로 확인합니다." },
      { emoji: "🗓️", title: "상담 신청", desc: "담임 교사에게 간편하게 상담을 신청하고 일정을 조율합니다." },
      { emoji: "💭", title: "학부모 게시판", desc: "같은 학교 학부모들과 정보를 나누는 소통 공간입니다." },
    ],
  },
  {
    key: "student",
    label: "학생",
    emoji: "🎒",
    items: [
      { emoji: "📖", title: "개인 학습 대시보드", desc: "나의 학습 진행 상황과 성적 변화를 시각적으로 확인합니다." },
      { emoji: "📝", title: "과제 / 일정 확인", desc: "제출해야 할 과제와 다가오는 일정을 한눈에 확인합니다." },
      { emoji: "🎓", title: "학급 보드", desc: "우리 반 공지사항과 활동을 한 곳에서 확인하는 공간입니다." },
      { emoji: "🗨️", title: "학생 게시판", desc: "학교 생활에 대해 자유롭게 소통하는 학생 전용 게시판입니다." },
    ],
  },
];

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

  const [activeTab, setActiveTab] = useState<TabKey>("admin");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    fetchNotices(0);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const checkReveal = () => {
      document.querySelectorAll<Element>(".reveal:not(.visible)").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) {
          el.classList.add("visible");
        }
      });
    };
    checkReveal();
    window.addEventListener("scroll", checkReveal, { passive: true });
    return () => window.removeEventListener("scroll", checkReveal);
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
        :root {
          --teal: #1A9EA0;
          --teal-dark: #157A7C;
          --teal-deeper: #0E5F61;
          --teal-light: #E0F5F5;
          --teal-pale: #F0FAFA;
          --navy: #0F2B3C;
          --navy-light: #1A3D52;
          --slate: #3A5568;
          --warm-gray: #6B7B8D;
          --light-gray: #F4F7F9;
          --white: #FFFFFF;
          --accent-coral: #FF6B5B;
          --accent-amber: #F5A623;
          --accent-mint: #4ECDC4;
          --shadow-sm: 0 2px 8px rgba(15,43,60,0.06);
          --shadow-md: 0 8px 32px rgba(15,43,60,0.08);
          --shadow-lg: 0 16px 48px rgba(15,43,60,0.12);
          --shadow-xl: 0 24px 64px rgba(15,43,60,0.16);
          --radius: 16px;
          --radius-lg: 24px;
          --radius-xl: 32px;
        }

        html, body { margin: 0; padding: 0; }
        .sm-root {
          font-family: 'Noto Sans KR', sans-serif;
          color: var(--navy);
          background: var(--white);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }
        .outfit { font-family: 'Outfit', sans-serif; }

        /* ── 공통 섹션 ── */
        .sm-section { padding: 120px 48px; }
        .sm-inner { max-width: 1200px; margin: 0 auto; }

        .section-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--teal-light);
          color: var(--teal-dark);
          font-size: 0.82rem;
          font-weight: 600;
          padding: 6px 16px;
          border-radius: 50px;
          margin-bottom: 20px;
          letter-spacing: 0.5px;
        }
        .section-label::before {
          content: '';
          width: 6px; height: 6px;
          background: var(--teal);
          border-radius: 50%;
        }
        .sm-section-title {
          font-size: 2.8rem;
          font-weight: 800;
          line-height: 1.3;
          letter-spacing: -1px;
          margin-bottom: 16px;
        }
        .sm-section-title .hl { color: var(--teal); }
        .sm-section-desc {
          font-size: 1.1rem;
          color: var(--warm-gray);
          line-height: 1.7;
          max-width: 560px;
        }

        /* ── 스크롤 reveal ── */
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-d1 { transition-delay: 0.1s; }
        .reveal-d2 { transition-delay: 0.2s; }
        .reveal-d3 { transition-delay: 0.3s; }
        .reveal-d4 { transition-delay: 0.4s; }
        .reveal-d5 { transition-delay: 0.5s; }

        /* ── NAV ── */
        .sm-nav {
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 64px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(26,158,160,0.08);
          display: flex;
          align-items: center;
          transition: box-shadow 0.3s;
        }
        .sm-nav.scrolled { box-shadow: var(--shadow-sm); }
        .nav-link-tab {
          color: var(--slate);
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.92rem;
          transition: color 0.2s;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'Noto Sans KR', sans-serif;
        }
        .nav-link-tab:hover { color: var(--teal); }
        .btn-login-nav {
          color: var(--slate);
          font-weight: 500;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        .btn-login-nav:hover { color: var(--teal); }
        .btn-register-nav {
          color: var(--white);
          font-weight: 600;
          font-size: 0.9rem;
          background: var(--teal-dark);
          padding: 9px 20px;
          border-radius: 50px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-register-nav:hover { background: var(--teal-deeper); transform: translateY(-1px); }

        /* ── HERO ── */
        .hero-wrap {
          background: #25a194; /* [soojin] Main.tsx 히어로 바탕색(#25a194)으로 변경 */
          min-height: 100vh;
          display: flex;
          align-items: flex-start;
          padding-top: 80px;
          padding-bottom: 80px;
          position: relative;
          overflow: hidden;
        }
        .hero-wrap::before {
          content: '';
          position: absolute;
          top: -30%; right: -20%;
          width: 800px; height: 800px;
          background: rgba(78,205,196,0.15);
          border-radius: 50%;
          pointer-events: none;
        }
        .hero-wrap::after {
          content: '';
          position: absolute;
          bottom: -20%; left: -10%;
          width: 600px; height: 600px;
          background: rgba(255,255,255,0.03);
          border-radius: 50%;
          pointer-events: none;
        }
        .hero-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
          width: 100%;
        }
        .hero-text {
          color: var(--white);
          text-align: center;
          margin-bottom: 48px;
        }
        .hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 4.2rem;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -2px;
          margin-bottom: 8px;
          color: var(--white);
        }
        .hero-subtitle {
          font-size: 2.2rem;
          font-weight: 700;
          line-height: 1.3;
          margin-bottom: 24px;
          letter-spacing: -0.5px;
          color: var(--white);
        }
        .hero-desc {
          font-size: 1.1rem;
          line-height: 1.8;
          color: rgba(255,255,255,0.8);
          margin-bottom: 40px;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
        }
        .hero-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .btn-hero-primary {
          background: var(--white);
          color: var(--teal-dark);
          padding: 15px 36px;
          border-radius: 50px;
          font-size: 1rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); color: var(--teal-dark); }
        .btn-hero-secondary {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.25);
          color: var(--white);
          padding: 15px 36px;
          border-radius: 50px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s;
        }
        .btn-hero-secondary:hover { background: rgba(255,255,255,0.2); color: var(--white); }

        /* 브라우저 목업 */
        .hero-mockup {
          position: relative;
          width: 100%;
          max-width: 900px;
        }
        .mockup-container {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: var(--radius-xl);
          padding: 20px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.2);
        }
        .mockup-window {
          background: var(--white);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }
        .mockup-bar {
          background: var(--light-gray);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mockup-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
        }
        .mockup-dot:nth-child(1) { background: #FF6B6B; }
        .mockup-dot:nth-child(2) { background: #F5A623; }
        .mockup-dot:nth-child(3) { background: #4ECDC4; }
        .mockup-url {
          flex: 1;
          background: var(--white);
          border-radius: 6px;
          padding: 5px 12px;
          font-size: 0.75rem;
          color: var(--warm-gray);
          margin-left: 8px;
        }
        .mockup-body {
          padding: 24px;
          min-height: 400px;
          background: var(--white);
        }
        .mock-dashboard {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 16px;
          height: 360px;
        }
        .mock-sidebar {
          background: var(--teal-pale);
          border-radius: 12px;
          padding: 18px;
        }
        .mock-sidebar-item {
          height: 10px;
          background: var(--teal-light);
          border-radius: 4px;
          margin-bottom: 16px;
        }
        .mock-sidebar-item.active { background: var(--teal); opacity: 0.6; }
        .mock-main { display: grid; grid-template-rows: auto 1fr; gap: 12px; }
        .mock-header-row { display: flex; gap: 10px; }
        .mock-stat {
          flex: 1;
          background: var(--teal-pale);
          border-radius: 10px;
          padding: 16px;
          position: relative;
          overflow: hidden;
        }
        .mock-stat::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: var(--teal);
          border-radius: 0 0 10px 10px;
        }
        .mock-stat-label { width: 50%; height: 6px; background: var(--warm-gray); opacity: 0.2; border-radius: 3px; margin-bottom: 8px; }
        .mock-stat-value { width: 70%; height: 12px; background: var(--teal); opacity: 0.3; border-radius: 4px; }
        .mock-content {
          background: var(--light-gray);
          border-radius: 10px;
          padding: 14px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .mock-card { background: var(--white); border-radius: 8px; padding: 14px; box-shadow: var(--shadow-sm); }
        .mock-card-line { height: 7px; background: var(--teal-light); border-radius: 3px; margin-bottom: 9px; }
        .mock-card-line:last-child { margin-bottom: 0; width: 60%; }

        /* 플로팅 카드 */
        @keyframes floatUp {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .hero-float {
          position: absolute;
          background: rgba(255,255,255,0.96);
          border-radius: 14px;
          padding: 14px 18px;
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--navy);
          z-index: 2;
        }
        .hero-float.float-1 { top: -10px; right: -20px; animation: floatUp 3s ease-in-out infinite; }
        .hero-float.float-2 { bottom: 40px; left: -30px; animation: floatUp 3s ease-in-out 1.5s infinite; }
        .float-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .float-icon.teal { background: var(--teal-light); }
        .float-icon.coral { background: #FFF0EE; }

        /* ── PAIN POINTS ── */
        .pain-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 48px;
        }
        .pain-card {
          background: var(--white);
          border-radius: var(--radius);
          padding: 36px 28px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
          border: 1px solid transparent;
        }
        .pain-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: rgba(26,158,160,0.15); }
        .pain-tag {
          position: absolute;
          top: 16px; right: 16px;
          background: #FFF0EE;
          color: var(--accent-coral);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 50px;
        }
        .pain-icon {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: #FFF0EE;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 20px;
        }
        .pain-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: var(--navy); }
        .pain-card p { font-size: 0.92rem; color: var(--warm-gray); line-height: 1.6; margin: 0; }

        /* ── SYSTEM OVERVIEW ── */
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
          margin-top: 56px;
        }
        .overview-card {
          background: var(--teal-pale);
          border: 1px solid rgba(26,158,160,0.1);
          border-radius: var(--radius-lg);
          padding: 48px 32px 40px;
          transition: all 0.4s;
          position: relative;
          overflow: hidden;
        }
        .overview-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: var(--teal-dark);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .overview-card:hover::before { opacity: 1; }
        .overview-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); }
        .overview-icon {
          width: 72px; height: 72px;
          border-radius: 20px;
          background: var(--teal-light);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 2rem;
        }
        .overview-card h3 { font-size: 1.3rem; font-weight: 800; margin-bottom: 6px; color: var(--navy); text-align: center; }
        .overview-card-sub { font-size: 0.85rem; color: var(--teal); font-weight: 600; margin-bottom: 16px; text-align: center; }
        .overview-card p { font-size: 0.95rem; color: var(--warm-gray); line-height: 1.7; text-align: center; margin: 0; }

        /* ── ROLE FEATURES ── */
        .features-tabs {
          display: inline-flex;
          gap: 6px;
          margin-top: 48px;
          margin-bottom: 32px;
          background: var(--white);
          padding: 6px;
          border-radius: 50px;
        }
        .tab-btn {
          padding: 11px 26px;
          border-radius: 50px;
          border: none;
          background: transparent;
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--warm-gray);
          cursor: pointer;
          transition: all 0.3s;
        }
        .tab-btn.active {
          background: var(--teal-dark);
          color: var(--white);
          box-shadow: 0 4px 16px rgba(26,158,160,0.3);
        }
        .tab-btn:hover:not(.active) { color: var(--teal); }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          animation: fadeSlideUp 0.4s ease;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .feature-item {
          background: var(--white);
          border-radius: var(--radius);
          padding: 28px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          transition: all 0.3s;
          border: 1px solid transparent;
        }
        .feature-item:hover { border-color: rgba(26,158,160,0.15); box-shadow: var(--shadow-sm); transform: translateX(4px); }
        .feature-dot {
          width: 40px; height: 40px;
          min-width: 40px;
          border-radius: 12px;
          background: var(--teal-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .feature-item h4 { font-size: 1rem; font-weight: 700; margin-bottom: 4px; color: var(--navy); }
        .feature-item p { font-size: 0.88rem; color: var(--warm-gray); line-height: 1.5; margin: 0; }

        /* ── DASHBOARD PREVIEW ── */
        .preview-section { background: var(--navy); position: relative; overflow: hidden; }
        .preview-section::before {
          content: '';
          position: absolute;
          top: -200px; left: 50%;
          transform: translateX(-50%);
          width: 1000px; height: 1000px;
          background: rgba(26,158,160,0.08);
          border-radius: 50%;
          pointer-events: none;
        }
        .preview-section .section-label { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
        .preview-section .section-label::before { background: rgba(255,255,255,0.5); }
        .preview-section .sm-section-title { color: var(--white); }
        .preview-section .sm-section-desc { color: rgba(255,255,255,0.6); margin: 0 auto 48px; }
        .preview-mockup-large {
          max-width: 900px;
          margin: 0 auto;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: var(--radius-xl);
          padding: 20px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.3);
          position: relative;
          z-index: 1;
        }
        .preview-screen { background: var(--white); border-radius: var(--radius); overflow: hidden; }
        .preview-topbar {
          background: var(--teal-pale);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(26,158,160,0.1);
        }
        .preview-logo-sm { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.9rem; color: var(--teal-dark); }
        .preview-nav-items { display: flex; gap: 20px; margin-left: 24px; }
        .preview-nav-item { width: 48px; height: 8px; background: var(--teal-light); border-radius: 4px; }
        .preview-nav-item.active { background: var(--teal); width: 60px; }
        .preview-body-mock {
          padding: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
          min-height: 260px;
        }
        .preview-widget { background: var(--light-gray); border-radius: 12px; padding: 18px; }
        .preview-widget.tall { grid-row: span 2; }
        .pw-title { width: 60%; height: 8px; background: var(--warm-gray); opacity: 0.15; border-radius: 4px; margin-bottom: 14px; }
        .pw-bar { height: 10px; background: var(--teal-light); border-radius: 5px; margin-bottom: 7px; }
        .pw-circle { width: 64px; height: 64px; border-radius: 50%; border: 5px solid var(--teal-light); border-top-color: var(--teal); margin: 16px auto; }
        .pw-row { display: flex; gap: 6px; margin-bottom: 6px; }
        .pw-cell { flex: 1; height: 20px; background: var(--teal-pale); border-radius: 5px; }
        .pw-cell.h { background: var(--teal-light); height: 17px; }
        .preview-features-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 48px;
          position: relative;
          z-index: 1;
        }
        .preview-feat { text-align: center; }
        .preview-feat-icon {
          width: 48px; height: 48px;
          border-radius: 14px;
          background: rgba(26,158,160,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 1.3rem;
        }
        .preview-feat h4 { font-size: 1rem; font-weight: 700; margin-bottom: 6px; color: var(--white); }
        .preview-feat p { font-size: 0.85rem; color: rgba(255,255,255,0.5); line-height: 1.5; margin: 0; }

        /* ── COMPARISON ── */
        .compare-container {
          display: grid;
          grid-template-columns: 1fr 60px 1fr;
          align-items: center;
          margin-top: 56px;
        }
        .compare-col { border-radius: var(--radius-lg); padding: 40px 36px; }
        .compare-col.before { background: #FFF8F7; border: 1px solid #FFE8E5; }
        .compare-col.after { background: var(--teal-pale); border: 1px solid rgba(26,158,160,0.15); }
        .compare-col h3 { font-size: 1.3rem; font-weight: 800; margin-bottom: 28px; display: flex; align-items: center; gap: 10px; }
        .compare-col.before h3 { color: var(--accent-coral); }
        .compare-col.after h3 { color: var(--teal-dark); }
        .compare-item {
          padding: 15px 0;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.95rem;
          color: var(--slate);
        }
        .compare-item:last-child { border-bottom: none; }
        .ci-icon {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .before .ci-icon { background: #FFE8E5; color: var(--accent-coral); }
        .after .ci-icon { background: var(--teal-light); color: var(--teal-dark); }
        .compare-arrow { display: flex; align-items: center; justify-content: center; }
        .arrow-circle {
          width: 52px; height: 52px;
          border-radius: 50%;
          background: var(--teal-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--white);
          font-size: 1.4rem;
          box-shadow: 0 4px 20px rgba(26,158,160,0.3);
        }

        /* ── KEY FEATURES (roadmap) ── */
        .roadmap-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          margin-top: 56px;
        }
        .roadmap-card {
          background: var(--white);
          border-radius: var(--radius);
          padding: 32px 20px;
          text-align: center;
          position: relative;
          transition: all 0.3s;
          border: 1px solid transparent;
        }
        .roadmap-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: rgba(26,158,160,0.15); }
        .roadmap-num { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 900; color: var(--teal-light); margin-bottom: 12px; }
        .roadmap-icon {
          width: 48px; height: 48px;
          border-radius: 14px;
          background: var(--teal-light);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 1.3rem;
        }
        .roadmap-card h4 { font-size: 0.95rem; font-weight: 700; margin-bottom: 8px; color: var(--navy); }
        .roadmap-card p { font-size: 0.82rem; color: var(--warm-gray); line-height: 1.5; margin: 0; }

        /* ── SCHOOL SEARCH ── */
        .school-search-box { background: var(--white); border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow-md); }
        .school-result-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-radius: 10px; cursor: pointer;
          transition: all 0.2s; border: 1px solid #eaeaea; margin-bottom: 8px; background: var(--white);
        }
        .school-result-item:hover, .school-result-item.sel { background: var(--teal-pale); border-color: var(--teal); }
        .school-info-card {
          background: var(--teal-dark);
          border-radius: var(--radius); padding: 28px; color: var(--white);
        }
        .school-info-item { background: rgba(255,255,255,0.15); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; }
        .school-info-label { font-size: 0.76rem; color: rgba(255,255,255,0.72); margin-bottom: 3px; }
        .school-info-value { font-size: 0.92rem; font-weight: 600; }

        /* ── NOTICE ── */
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

        /* ── CTA ── */
        .cta-section {
          background: var(--teal);
          text-align: center;
          padding: 100px 48px;
          position: relative;
          overflow: hidden;
        }
        .cta-section::before {
          content: '';
          position: absolute;
          top: -100px; right: -100px;
          width: 400px; height: 400px;
          background: rgba(255,255,255,0.04);
          border-radius: 50%;
          pointer-events: none;
        }
        .cta-eyebrow { font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-bottom: 16px; font-weight: 500; }
        .cta-title {
          font-size: 3rem; font-weight: 900;
          color: var(--white); line-height: 1.3;
          letter-spacing: -1px; margin-bottom: 20px;
        }
        .cta-desc { font-size: 1.1rem; color: rgba(255,255,255,0.7); margin-bottom: 40px; line-height: 1.7; }
        .cta-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .btn-cta-primary {
          background: var(--white); color: var(--teal-dark);
          padding: 17px 40px; border-radius: 50px;
          font-size: 1.05rem; font-weight: 700;
          text-decoration: none; transition: all 0.3s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.2); color: var(--teal-dark); }
        .btn-cta-secondary {
          background: transparent;
          border: 2px solid rgba(255,255,255,0.3);
          color: var(--white);
          padding: 15px 40px; border-radius: 50px;
          font-size: 1.05rem; font-weight: 600;
          text-decoration: none; transition: all 0.3s;
        }
        .btn-cta-secondary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.5); color: var(--white); }

        /* ── FOOTER ── */
        .main-footer { background: #fafafa; color: rgba(0,0,0,0.55); padding: 36px 0 24px; }
        .footer-links { display: flex; justify-content: center; gap: 24px; margin-bottom: 20px; }
        .footer-links a { color: rgba(0,0,0,0.6); text-decoration: none; font-size: 0.85rem; transition: color 0.2s; }
        .footer-links a:hover { color: #000; }
        .footer-divider { width: 1px; background: rgba(0,0,0,0.15); }
        .footer-info { text-align: center; font-size: 0.8rem; line-height: 1.9; margin-bottom: 20px; }
        .footer-copy { font-size: 0.75rem; text-align: center; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 16px; color: rgba(0,0,0,0.35); }

        /* ── 반응형 ── */
        @media (max-width: 1024px) {
          .sm-section { padding: 80px 32px; }
          .hero-inner { padding: 0 32px; }
          .hero-title { font-size: 3rem; }
          .hero-subtitle { font-size: 1.8rem; }
          .sm-section-title { font-size: 2.2rem; }
          .pain-grid { grid-template-columns: 1fr; max-width: 480px; margin-left: auto; margin-right: auto; }
          .overview-grid { grid-template-columns: 1fr; max-width: 480px; margin-left: auto; margin-right: auto; }
          .features-grid { grid-template-columns: 1fr; }
          .compare-container { grid-template-columns: 1fr; gap: 20px; }
          .compare-arrow { transform: rotate(90deg); }
          .roadmap-grid { grid-template-columns: repeat(2, 1fr); }
          .preview-body-mock { grid-template-columns: 1fr 1fr; }
          .preview-features-row { grid-template-columns: 1fr; max-width: 400px; margin-left: auto; margin-right: auto; }
        }
        @media (max-width: 640px) {
          .sm-section { padding: 64px 20px; }
          .hero-inner { padding: 0 20px; }
          .hero-title { font-size: 2.4rem; }
          .hero-subtitle { font-size: 1.4rem; }
          .sm-section-title { font-size: 1.8rem; }
          .hero-buttons { flex-direction: column; align-items: center; }
          .features-tabs { flex-wrap: wrap; border-radius: var(--radius); }
          .tab-btn { padding: 9px 16px; font-size: 0.85rem; }
          .roadmap-grid { grid-template-columns: 1fr; }
          .cta-title { font-size: 2rem; }
          .cta-buttons { flex-direction: column; align-items: center; }
          .cta-section { padding: 64px 20px; }
          .hero-float.float-1 { right: -5px; top: -5px; }
          .hero-float.float-2 { left: -5px; bottom: 20px; }
        }
      `}</style>

      <div className="sm-root">

        {/* ════ NAV ════ */}
        <nav className={`sm-nav${isScrolled ? " scrolled" : ""}`}>
          <div style={{ width: '100%', padding: '0 24px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="d-flex align-items-center gap-3">
              <a href="#hero" onClick={scrollTo("hero")} style={{ lineHeight: 0 }}>
                <img src="/images/schoolmateLogo.png" alt="SchoolMate" width="160" height="37" />
              </a>
              <div className="d-none d-md-flex gap-1 ms-2">
                <button className="nav-link-tab" onClick={scrollTo("features")}>서비스 소개</button>
                <button className="nav-link-tab" onClick={scrollTo("school")}>학교 찾기</button>
                <button className="nav-link-tab" onClick={scrollTo("notice")}>공지사항</button>
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

        {/* ════ 섹션 1: HERO ════ */}
        <section id="hero" className="hero-wrap" style={{ background: "#25a194" }}> {/* [soojin] Main.tsx 히어로 바탕색(#25a194)으로 변경 */}
          <div className="hero-inner">
            <div className="hero-text" style={{ color: "#ffffff" }}>
              <h1 className="hero-title outfit" style={{ color: "#ffffff" }}>School Mate</h1>
              <h2 className="hero-subtitle" style={{ color: "#ffffff" }}>통합 학사 관리 플랫폼</h2>
              <p className="hero-desc" style={{ color: "rgba(255,255,255,0.8)" }}>
                교사, 학생, 학부모를 하나의 플랫폼으로 연결합니다.
                출결, 성적, 과제, 상담, 일정까지 — 모든 학사 정보를 한 곳에서 관리하세요.
              </p>
              <div className="hero-buttons">
                <a href="/register" className="btn-hero-primary">무료로 시작하기 →</a>
                <a href="#preview" onClick={scrollTo("preview")} className="btn-hero-secondary">미리보기</a>
              </div>
            </div>

            <div className="hero-mockup">
              {/* 플로팅 카드 */}
              <div className="hero-float float-1">
                <div className="float-icon teal">📊</div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--warm-gray)" }}>오늘 출석률</div>
                  <div style={{ color: "var(--teal)", fontWeight: 800 }}>98.2%</div>
                </div>
              </div>
              <div className="hero-float float-2">
                <div className="float-icon coral">🔔</div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--warm-gray)" }}>새 알림</div>
                  <div style={{ color: "var(--accent-coral)", fontWeight: 800 }}>3건 도착</div>
                </div>
              </div>

              {/* 브라우저 목업 */}
              <div className="mockup-container">
                <div className="mockup-window">
                  <div className="mockup-bar">
                    <div className="mockup-dot" />
                    <div className="mockup-dot" />
                    <div className="mockup-dot" />
                    <div className="mockup-url">schoolmate.kr/dashboard</div>
                  </div>
                  <div className="mockup-body">
                    <div className="mock-dashboard">
                      <div className="mock-sidebar">
                        <div className="mock-sidebar-item active" style={{ width: "70%" }} />
                        <div className="mock-sidebar-item" style={{ width: "90%" }} />
                        <div className="mock-sidebar-item" style={{ width: "60%" }} />
                        <div className="mock-sidebar-item" style={{ width: "80%" }} />
                        <div className="mock-sidebar-item" style={{ width: "50%" }} />
                      </div>
                      <div className="mock-main">
                        <div className="mock-header-row">
                          <div className="mock-stat">
                            <div className="mock-stat-label" />
                            <div className="mock-stat-value" />
                          </div>
                          <div className="mock-stat">
                            <div className="mock-stat-label" />
                            <div className="mock-stat-value" style={{ background: "var(--accent-mint)" }} />
                          </div>
                          <div className="mock-stat">
                            <div className="mock-stat-label" />
                            <div className="mock-stat-value" style={{ background: "var(--accent-amber)" }} />
                          </div>
                        </div>
                        <div className="mock-content">
                          <div className="mock-card">
                            <div className="mock-card-line" />
                            <div className="mock-card-line" />
                            <div className="mock-card-line" />
                          </div>
                          <div className="mock-card">
                            <div className="mock-card-line" style={{ background: "var(--accent-mint)", opacity: 0.3 }} />
                            <div className="mock-card-line" />
                            <div className="mock-card-line" />
                          </div>
                          <div className="mock-card">
                            <div className="mock-card-line" />
                            <div className="mock-card-line" style={{ background: "var(--accent-amber)", opacity: 0.3 }} />
                            <div className="mock-card-line" />
                          </div>
                          <div className="mock-card">
                            <div className="mock-card-line" />
                            <div className="mock-card-line" />
                            <div className="mock-card-line" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════ 섹션 2: PAIN POINTS ════ */}
        <section className="sm-section" style={{ background: "var(--light-gray)" }}>
          <div className="sm-inner">
            <div className="reveal">
              <div className="section-label">PROBLEM</div>
              <h2 className="sm-section-title">
                기존 학사 시스템,
                <br />
                <span className="hl">이런 불편함</span> 느끼셨나요?
              </h2>
              <p className="sm-section-desc">
                학교마다 다른 앱, 복잡한 메뉴, 흩어진 정보. 학부모와 교사 모두가 겪고 있는 문제입니다.
              </p>
            </div>
            <div className="pain-grid">
              {[
                { tag: "불편", emoji: "📱", title: "학교마다 다른 앱", desc: "자녀가 다른 학교에 다니면 앱도 따로, 회원가입도 따로. 매번 두 개의 앱을 번갈아 확인해야 합니다.", delay: "reveal-d1" },
                { tag: "복잡", emoji: "🧭", title: "직관적이지 않은 메뉴", desc: "어디서 성적을 보는지, 출결은 어떻게 확인하는지 — 메뉴 구조가 복잡해서 원하는 정보를 찾기 어렵습니다.", delay: "reveal-d2" },
                { tag: "비효율", emoji: "🔀", title: "흩어진 학사 정보", desc: "출결은 여기, 성적은 저기, 공지는 또 다른 곳. 하나로 통합되지 않아 중요한 정보를 놓치기 쉽습니다.", delay: "reveal-d3" },
              ].map((c) => (
                <div key={c.title} className={`pain-card reveal ${c.delay}`}>
                  <div className="pain-tag">{c.tag}</div>
                  <div className="pain-icon">{c.emoji}</div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ 섹션 3: SYSTEM OVERVIEW ════ */}
        <section id="features" className="sm-section" style={{ background: "var(--white)", textAlign: "center" }}>
          <div className="sm-inner">
            <div className="reveal">
              <div className="section-label">SYSTEM OVERVIEW</div>
              <h2 className="sm-section-title">
                School Mate가
                <br />
                <span className="hl">해결합니다</span>
              </h2>
              <p className="sm-section-desc" style={{ margin: "0 auto" }}>
                교사, 학생, 학부모를 하나의 플랫폼으로 연결하는 교육 관리 시스템
              </p>
            </div>
            <div className="overview-grid">
              {[
                { emoji: "📋", title: "통합 관리", sub: "All-in-One Management", desc: "출결, 성적, 과제, 상담, 일정 — 모든 정보를 하나의 시스템에서 통합 관리합니다.", delay: "reveal-d1" },
                { emoji: "👥", title: "역할 기반 시스템", sub: "Role-Based Access", desc: "사용자 역할에 따라 맞춤형 화면을 제공합니다. 교사, 학생, 학부모 전용 대시보드로 각자 필요한 정보만 빠르게.", delay: "reveal-d2" },
                { emoji: "✨", title: "쉬운 UI", sub: "Intuitive Interface", desc: "누구나 쉽게 사용할 수 있는 직관적인 화면 구성. 복잡한 메뉴를 최소화했습니다.", delay: "reveal-d3" },
              ].map((c) => (
                <div key={c.title} className={`overview-card reveal ${c.delay}`}>
                  <div className="overview-icon">{c.emoji}</div>
                  <h3>{c.title}</h3>
                  <div className="overview-card-sub">{c.sub}</div>
                  <p>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ 섹션 4: ROLE-BASED FEATURES ════ */}
        <section className="sm-section" style={{ background: "var(--light-gray)" }}>
          <div className="sm-inner">
            <div className="reveal">
              <div className="section-label">FEATURES</div>
              <h2 className="sm-section-title">
                역할별 <span className="hl">맞춤 기능</span>
              </h2>
              <p className="sm-section-desc">각 사용자에게 꼭 필요한 기능만 제공합니다.</p>
            </div>
            <div className="reveal" style={{ marginTop: 48 }}>
              <div className="features-tabs">
                {TAB_DATA.map((t) => (
                  <button
                    key={t.key}
                    className={`tab-btn${activeTab === t.key ? " active" : ""}`}
                    onClick={() => setActiveTab(t.key)}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>
            {TAB_DATA.map((t) =>
              activeTab === t.key ? (
                <div key={t.key} className="features-grid">
                  {t.items.map((item) => (
                    <div key={item.title} className="feature-item">
                      <div className="feature-dot">{item.emoji}</div>
                      <div>
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null
            )}
          </div>
        </section>

        {/* ════ 섹션 5: DASHBOARD PREVIEW ════ */}
        <section id="preview" className="sm-section preview-section">
          <div className="sm-inner" style={{ position: "relative", zIndex: 1 }}>
            <div className="reveal" style={{ textAlign: "center" }}>
              <div className="section-label">PREVIEW</div>
              <h2 className="sm-section-title">
                한눈에 보는
                <br />
                <span style={{ color: "var(--accent-mint)" }}>학사 대시보드</span>
              </h2>
              <p className="sm-section-desc">직관적인 인터페이스로 모든 학사 정보를 빠르게 파악하세요.</p>
            </div>
            <div className="preview-mockup-large reveal">
              <div className="preview-screen">
                <div className="preview-topbar">
                  <div className="preview-logo-sm">SchoolMate</div>
                  <div className="preview-nav-items">
                    <div className="preview-nav-item active" />
                    <div className="preview-nav-item" />
                    <div className="preview-nav-item" />
                    <div className="preview-nav-item" />
                  </div>
                </div>
                <div className="preview-body-mock">
                  <div className="preview-widget">
                    <div className="pw-title" />
                    <div className="pw-circle" />
                    <div className="pw-bar" style={{ width: "80%" }} />
                    <div className="pw-bar" style={{ width: "60%" }} />
                  </div>
                  <div className="preview-widget tall">
                    <div className="pw-title" />
                    <div className="pw-bar" />
                    <div className="pw-bar" style={{ width: "70%" }} />
                    <div className="pw-bar" style={{ width: "90%" }} />
                    <div className="pw-bar" style={{ width: "50%" }} />
                    <div className="pw-bar" style={{ width: "75%" }} />
                  </div>
                  <div className="preview-widget">
                    <div className="pw-title" />
                    <div className="pw-row"><div className="pw-cell h" /><div className="pw-cell h" /><div className="pw-cell h" /></div>
                    <div className="pw-row"><div className="pw-cell" /><div className="pw-cell" /><div className="pw-cell" /></div>
                    <div className="pw-row"><div className="pw-cell" /><div className="pw-cell" /><div className="pw-cell" /></div>
                  </div>
                  <div className="preview-widget">
                    <div className="pw-title" />
                    <div className="pw-bar" style={{ width: "90%" }} />
                    <div className="pw-bar" style={{ width: "70%" }} />
                    <div className="pw-bar" style={{ width: "80%" }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="preview-features-row reveal">
              {[
                { emoji: "⚡", title: "실시간 동기화", desc: "교사가 입력하면 학부모와 학생에게 즉시 반영됩니다." },
                { emoji: "📱", title: "모바일 최적화", desc: "어디서든 스마트폰으로 편하게 확인할 수 있습니다." },
                { emoji: "🔒", title: "안전한 데이터", desc: "개인정보 보호와 보안을 최우선으로 설계했습니다." },
              ].map((f) => (
                <div key={f.title} className="preview-feat">
                  <div className="preview-feat-icon">{f.emoji}</div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ 섹션 6: COMPARISON ════ */}
        <section className="sm-section" style={{ background: "var(--white)" }}>
          <div className="sm-inner">
            <div className="reveal" style={{ textAlign: "center" }}>
              <div className="section-label">COMPARISON</div>
              <h2 className="sm-section-title">기존 시스템 vs <span className="hl">School Mate</span></h2>
              <p className="sm-section-desc" style={{ margin: "0 auto" }}>무엇이 달라졌을까요?</p>
            </div>
            <div className="compare-container reveal">
              <div className="compare-col before">
                <h3>⚠️ 기존 시스템</h3>
                {["학교 중심 계정 구조", "자녀별 계정 분리 → 다자녀 관리 불편", "교사와 학생 중심 설계", "복잡한 메뉴 구조"].map((txt) => (
                  <div key={txt} className="compare-item"><div className="ci-icon">✕</div>{txt}</div>
                ))}
              </div>
              <div className="compare-arrow">
                <div className="arrow-circle">→</div>
              </div>
              <div className="compare-col after">
                <h3>💡 School Mate</h3>
                {["학부모 계정으로 자녀 선택", "다자녀 통합 대시보드", "역할 기반 맞춤 화면", "직관적인 UI"].map((txt) => (
                  <div key={txt} className="compare-item"><div className="ci-icon">✓</div>{txt}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════ 섹션 7: KEY FEATURES ════ */}
        <section className="sm-section" style={{ background: "var(--light-gray)" }}>
          <div className="sm-inner">
            <div className="reveal" style={{ textAlign: "center" }}>
              <div className="section-label">KEY FEATURES</div>
              <h2 className="sm-section-title"><span className="hl">주요 기능</span></h2>
              <p className="sm-section-desc" style={{ margin: "0 auto" }}>School Mate가 제공하는 핵심 기능을 소개합니다.</p>
            </div>
            <div className="roadmap-grid">
              {[
                { num: "01", emoji: "🤖", title: "AI 스마트 알림", desc: "중요한 공지사항을 반복 알림으로 놓치지 않도록", delay: "reveal-d1" },
                { num: "02", emoji: "🔗", title: "NEIS 공식 연동", desc: "나이스 시스템과의 공식 데이터 연동 지원", delay: "reveal-d2" },
                { num: "03", emoji: "🌐", title: "다국어 자동 번역", desc: "AI를 활용한 공지 다국어 자동 번역 기능", delay: "reveal-d3" },
                { num: "04", emoji: "📅", title: "상담 예약 시스템", desc: "학부모-교사 간 편리한 상담 예약 기능", delay: "reveal-d4" },
                { num: "05", emoji: "📉", title: "성적 변화 감지", desc: "학생 성적 변화를 자동으로 분석하고 알림", delay: "reveal-d5" },
              ].map((c) => (
                <div key={c.num} className={`roadmap-card reveal ${c.delay}`}>
                  <div className="roadmap-num outfit">{c.num}</div>
                  <div className="roadmap-icon">{c.emoji}</div>
                  <h4>{c.title}</h4>
                  <p>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ 섹션 8: 학교 찾기 ════ */}
        <section id="school" className="sm-section" style={{ background: "var(--white)" }}>
          <div className="sm-inner">
            <div className="text-center mb-5 reveal">
              <div className="section-label">학교 찾기</div>
              <h2 className="sm-section-title">우리 학교를 찾아보세요</h2>
              <p className="sm-section-desc" style={{ margin: "0 auto" }}>학교명 또는 종류로 검색하고 상세 정보를 확인하세요</p>
            </div>
            <div className="row g-4 justify-content-center">
              <div className="col-lg-5">
                <div className="school-search-box reveal">
                  <form onSubmit={schoolSearch.handleSearch}>
                    <input
                      type="text"
                      className="form-control mb-2"
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
                              <span style={{ lineHeight: "30px", fontSize: "0.82rem", color: "#6b7280", padding: "0 6px" }}>{schoolSearch.page + 1} / {schoolSearch.totalPages}</span>
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
                  <div className="school-info-card reveal">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className="ri-building-2-line" style={{ fontSize: 24 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, lineHeight: 1.2 }}>{selectedSchool.name}</div>
                        <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.72)", marginTop: 3 }}>{selectedSchool.schoolKind} · {selectedSchool.officeOfEducation}</div>
                      </div>
                    </div>
                    <div className="school-info-item"><div className="school-info-label">전화번호</div><div className="school-info-value">{selectedSchool.phoneNumber || "—"}</div></div>
                    <div className="school-info-item">
                      <div className="school-info-label">홈페이지</div>
                      <div className="school-info-value" style={{ wordBreak: "break-all" }}>
                        {selectedSchool.homepage ? (
                          <a href={selectedSchool.homepage} target="_blank" rel="noopener noreferrer" style={{ color: "#fff", textDecoration: "underline" }}>{selectedSchool.homepage}</a>
                        ) : "—"}
                      </div>
                    </div>
                    <div className="school-info-item"><div className="school-info-label">주소</div><div className="school-info-value" style={{ fontSize: "0.88rem" }}>{selectedSchool.address || "—"}</div></div>
                  </div>
                ) : (
                  <div style={{ minHeight: 240, border: "2px dashed rgba(26,158,160,0.25)", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af", gap: 10 }}>
                    <i className="ri-building-2-line" style={{ fontSize: 40, color: "var(--teal-light)" }} />
                    <div style={{ fontSize: "0.9rem", textAlign: "center" }}>
                      좌측에서 학교를 검색 후 클릭하면
                      <br />상세 정보가 표시됩니다.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ════ 섹션 9: 공지사항 ════ */}
        <section id="notice" className="sm-section" style={{ background: "var(--light-gray)" }}>
          <div className="sm-inner">
            <div className="text-center mb-4 reveal">
              <div className="section-label">공지사항</div>
              <h2 className="sm-section-title">SchoolMate 소식</h2>
              <p className="sm-section-desc" style={{ margin: "0 auto" }}>서비스 업데이트 및 중요 공지를 확인하세요</p>
            </div>
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="notice-wrap reveal">
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
          </div>
        </section>

        {/* ════ 섹션 10: CTA ════ */}
        <section className="cta-section" id="cta">
          <div className="sm-inner" style={{ position: "relative", zIndex: 1 }}>
            <div className="reveal">
              <p className="cta-eyebrow">교사, 학생, 학부모 모두를 위한</p>
              <h2 className="cta-title">
                School Mate와 함께
                <br />
                학사 관리의 변화를 경험하세요
              </h2>
              <p className="cta-desc">지금 바로 시작하고, 더 나은 교육 환경을 만들어 보세요.</p>
              <div className="cta-buttons">
                <a href="/register" className="btn-cta-primary">무료로 시작하기 →</a>
                <a href="#" className="btn-cta-secondary">도입 문의하기</a>
              </div>
            </div>
          </div>
        </section>

        {/* ════ FOOTER ════ */}
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
              <span>(주)스쿨메이트 &nbsp;|&nbsp; 대표: 진준철우</span>
              <br />
              <span>주소: 서울특별시 종로구 종로12길 15 코아빌딩 2층</span>
              <br />
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
                    <div className="modal-body" style={{ padding: "24px", whiteSpace: "pre-wrap", lineHeight: 1.9, color: "#374151", fontSize: "0.93rem" }}>
                      {selectedNotice.content}
                    </div>
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
