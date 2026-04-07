import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/contexts/AuthContext";
import PageLoader from "@/shared/components/PageLoader";

type TabKey = "admin" | "teacher" | "parent" | "student";

const TAB_DATA: {
  key: TabKey;
  label: string;
  items: { title: string; desc: string; icon: string }[];
}[] = [
  {
    key: "admin",
    label: "관리자",
    items: [
      {
        icon: "ri-shield-keyhole-line",
        title: "권한 관리",
        desc: "사용자별 접근 권한을 세밀하게 설정하고 관리합니다.",
      },
      {
        icon: "ri-database-2-line",
        title: "학사 데이터 관리",
        desc: "학교 전체 학사 데이터를 한 곳에서 체계적으로 관리합니다.",
      },
      { icon: "ri-megaphone-line", title: "공지 관리", desc: "학교 공지사항을 작성하고 대상별로 발송합니다." },
      { icon: "ri-team-line", title: "교직원 정보 관리", desc: "교직원 정보를 등록·수정하고 담당 업무를 배정합니다." },
    ],
  },
  {
    key: "teacher",
    label: "교사",
    items: [
      {
        icon: "ri-dashboard-3-line",
        title: "교사 전용 대시보드",
        desc: "담당 학급 현황을 한눈에 파악하는 맞춤 대시보드를 제공합니다.",
      },
      {
        icon: "ri-clipboard-line",
        title: "출결 / 성적 / 과제 관리",
        desc: "출석 체크, 성적 입력, 과제 배포와 제출 확인을 한 곳에서 처리합니다.",
      },
      { icon: "ri-group-line", title: "학급 관리", desc: "학급 구성원을 관리하고 학급별 활동을 기록합니다." },
      {
        icon: "ri-chat-3-line",
        title: "학부모 상담 관리",
        desc: "상담 일정을 관리하고 상담 기록을 체계적으로 보관합니다.",
      },
    ],
  },
  {
    key: "parent",
    label: "학부모",
    items: [
      { icon: "ri-parent-line", title: "자녀 선택", desc: "하나의 계정으로 여러 자녀를 전환하며 관리할 수 있습니다." },
      {
        icon: "ri-line-chart-line",
        title: "자녀 학습 / 생활 현황",
        desc: "자녀의 출석, 성적, 과제 현황을 실시간으로 확인합니다.",
      },
      {
        icon: "ri-calendar-schedule-line",
        title: "상담 신청",
        desc: "담임 교사에게 간편하게 상담을 신청하고 일정을 조율합니다.",
      },
      { icon: "ri-article-line", title: "학부모 게시판", desc: "같은 학교 학부모들과 정보를 나누는 소통 공간입니다." },
    ],
  },
  {
    key: "student",
    label: "학생",
    items: [
      {
        icon: "ri-bar-chart-box-line",
        title: "개인 학습 대시보드",
        desc: "나의 학습 진행 상황과 성적 변화를 시각적으로 확인합니다.",
      },
      {
        icon: "ri-todo-line",
        title: "과제 / 일정 확인",
        desc: "제출해야 할 과제와 다가오는 일정을 한눈에 확인합니다.",
      },
      {
        icon: "ri-layout-grid-line",
        title: "학급 보드",
        desc: "우리 반 공지사항과 활동을 한 곳에서 확인하는 공간입니다.",
      },
      {
        icon: "ri-discuss-line",
        title: "학생 게시판",
        desc: "학교 생활에 대해 자유롭게 소통하는 학생 전용 게시판입니다.",
      },
    ],
  },
]; // [soojin] 역할별 카드 ri 아이콘으로 교체

export default function Main() {
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("admin");
  const [isScrolled, setIsScrolled] = useState(false);
  const [heroPassed, setHeroPassed] = useState(false); // [soojin] 히어로 섹션 지났는지 여부

  // [soojin] PWA 앱 설치 관련 state - Main.tsx에서 이식
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 20);
      setHeroPassed(y > 64); // [soojin] 스페이서(64px) 넘으면 히어로 상단이 뷰포트 벗어남
    };
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

  // [soojin] PWA 앱 설치 권유 로직 - Main.tsx에서 이식
  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 1 * 24 * 60 * 60 * 1000) return; // [soojin] 30일 → 1일로 변경

    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (iosDevice) {
      const isStandalone = (window.navigator as any).standalone === true;
      if (!isStandalone) {
        setIsIOS(true);
        setShowInstallPrompt(true);
      }
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // [soojin] PWA 설치 핸들러 - Main.tsx에서 이식
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleInstallDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
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
          font-family: var(--app-font-sans);
          color: var(--navy);
          background: var(--white);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }
        .outfit { font-family: var(--app-font-sans); }

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
          font-size: 2rem;
          font-weight: 700;
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
          position: fixed; /* [soojin] sticky → fixed (overflow-x:hidden 때문에 sticky 깨짐) */
          top: 0;
          left: 0;
          right: 0;
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
          font-family: var(--app-font-sans);
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
        /* [soojin] hero 배경 동그라미 도형 제거 */
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
          font-family: var(--app-font-sans);
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
          font-size: 1.2rem;
          font-weight: 500; /* [soojin] 글자 굵기 400 → 500으로 한 단계 상향 */
          line-height: 1.8;
          color: rgba(255,255,255,0.8);
          margin-bottom: 40px;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 10px;
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
          border-radius: 16px;
          padding: 16px 20px;
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--navy);
          z-index: 2;
        }
        .hero-float.float-1 { top: 12%; right: -50px; animation: floatUp 3s ease-in-out 0s infinite; }
        .hero-float.float-2 { bottom: 45px; left: -30px; animation: floatUp 3s ease-in-out 1.5s infinite; }
        .hero-float.float-3 { bottom: 30%; right: -90px; animation: floatUp 3s ease-in-out 1.0s infinite; }
        .hero-float.float-4 { bottom: -30px; right: -60px; animation: floatUp 3s ease-in-out 2.0s infinite; }
        .hero-float.float-5 { bottom: 50%; left: -70px; animation: floatUp 3s ease-in-out 0.5s infinite; }
        .hero-float.float-6 { top: -30px; left: -20px; animation: floatUp 3s ease-in-out 2.5s infinite; }
        .float-icon {
          width: 38px; height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }
        .float-icon.teal { background: var(--teal-light); }
        .float-icon.coral { background: #FFF0EE; }
        .float-icon.mint { background: #EAFAF8; }
        .float-icon.amber { background: #FFF8EC; }
        .float-icon.purple { background: #F0EEFF; }

        /* ── PAIN POINTS (색상 override: #25a194) ── */
        .pain-section .section-label { background: #E0F5F5; color: #25a194; }
        .pain-section .section-label::before { background: #25a194; }
        .pain-section .hl { color: #157A7C; }

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
          min-height: 240px;
        }
        .pain-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: rgba(26,158,160,0.15); }
        .pain-tag {
          display: inline-block;
          background: #FFF0EE;
          color: var(--accent-coral);
          font-size: 0.82rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 50px;
          margin-bottom: 12px;
          margin-top: 12px;
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
        .overview-card h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 6px; color: var(--navy); text-align: center; }
        .overview-card-sub { font-size: 0.82rem; color: var(--teal); font-weight: 600; margin-bottom: 16px; text-align: center; }
        .overview-card p { font-size: 0.92rem; color: var(--warm-gray); line-height: 1.7; text-align: center; margin: 0; }

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
          font-family: var(--app-font-sans);
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
          color: var(--teal-dark); /* [soojin] 아이콘 색상 회원가입 버튼(teal-dark)으로 변경 */
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
        .preview-logo-sm { font-family: var(--app-font-sans); font-weight: 800; font-size: 0.9rem; color: var(--teal-dark); }
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
        .preview-feat p { font-size: 1rem; color: rgba(255,255,255,0.5); line-height: 1.5; margin: 0; }

        /* ── COMPARISON ── */
        .compare-container {
          display: grid;
          grid-template-columns: 400px 180px 400px;
          align-items: center;
          margin-top: 56px;
          width: 980px; /* [soojin] 카드 폭 고정으로 좌우 대칭 보장 */
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
        .roadmap-num { font-family: var(--app-font-sans); font-size: 2rem; font-weight: 700; color: var(--teal-dark); margin-bottom: 12px; } /* [soojin] 카드 숫자 색상을 주요 기능(teal-dark)으로 변경 */
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

        /* ── CTA ── */
        .cta-section {
          background: #25a194; /* [soojin] 히어로 배경색(#25a194)과 동일하게 변경 */
          text-align: center;
          padding: 100px 48px;
          position: relative;
          overflow: hidden;
        }
        .cta-section::before { content: none; } /* [soojin] 동그라미 장식 제거 */
        .cta-eyebrow { font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-bottom: 16px; font-weight: 500; }
        .cta-title {
          font-size: 3rem; font-weight: 700;
          color: var(--white); line-height: 1.3;
          letter-spacing: -1px; margin-bottom: 20px;
        }
        .cta-desc { font-size: 1.4rem; font-weight: 500; color: rgba(255,255,255,0.7); margin-bottom: 40px; line-height: 1.7; } /* [soojin] font-size 1.1→1.4rem(+2단계), font-weight 400→500(+1단계) */
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
          .hero-float.float-1 { top: 12%; right: -5px; }
          .hero-float.float-2 { bottom: -12px; left: -5px; }
          .hero-float.float-3 { bottom: 5%; right: -5px; }
          .hero-float.float-4 { bottom: -12px; right: -5px; }
          .hero-float.float-5 { bottom: 20%; left: -5px; }
          .hero-float.float-6 { top: -36px; left: -5px; }
        }

        /* [soojin] PWA 설치 팝업 배너 - Main.tsx에서 이식 */
        .install-prompt-banner {
          position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
          background: rgba(255,255,255,0.85); backdrop-filter: blur(16px); /* [soojin] 반투명 배경 */
          padding: 18px 24px; border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15); z-index: 9999;
          width: 90%; max-width: 480px; border: 1px solid rgba(232,236,236,0.6);
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          animation: slideUpPrompt 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUpPrompt { from { opacity: 0; transform: translate(-50%, 40px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      <div className="sm-root">
        {/* ════ NAV ════ */}
        <nav className={`sm-nav${isScrolled ? " scrolled" : ""}`}>
          <div
            style={{
              width: "100%",
              padding: "0 24px",
              boxSizing: "border-box",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <a href="#hero" onClick={scrollTo("hero")} style={{ lineHeight: 0 }}>
                <img src="/images/schoolmateLogo.png" alt="SchoolMate" width="160" height="37" />
              </a>
              <div className="d-none d-md-flex gap-1 ms-2">
                <button className="nav-link-tab" onClick={scrollTo("features")}>
                  서비스 소개
                </button>
                <a href="/school-search" className="nav-link-tab">
                  {" "}
                  {/* [soojin] 스크롤 → 페이지 이동 */}
                  학교 찾기
                </a>
                <a href="/service-notice" className="nav-link-tab">
                  {" "}
                  {/* [soojin] 스크롤 → 페이지 이동 */}
                  공지사항
                </a>
              </div>
            </div>
            <div className="d-flex gap-3 align-items-center">
              <a href="/login" className="btn-login-nav">
                <i className="ri-login-box-line me-1" />
                로그인
              </a>
              <a href="/register" className="btn-register-nav">
                <i className="ri-user-add-line me-1" />
                회원가입
              </a>
            </div>
          </div>
        </nav>
        <div style={{ height: 64 }} /> {/* [soojin] fixed nav 높이만큼 스페이서 */}
        {/* ════ 섹션 1: HERO ════ */}
        <section id="hero" className="hero-wrap" style={{ background: "#25a194" }}>
          {" "}
          {/* [soojin] Main.tsx 히어로 바탕색(#25a194)으로 변경 */}
          <div className="hero-inner">
            <div className="hero-text" style={{ color: "#ffffff" }}>
              {/* <h1 className="hero-title outfit" style={{ color: "#ffffff" }}>
                School Mate
              </h1> */}
              <p className="hero-desc" style={{ color: "ffffff" }}>
                학교에 관한 모든 정보를 한 곳에서 관리해주는{" "}
                <img
                  src="/images/schoolmateLogo.png"
                  alt="SchoolMate"
                  style={{
                    height: "1.6em",
                    verticalAlign: "middle",
                    display: "inline",
                    filter: "brightness(0) invert(1)",
                  }}
                />
              </p>
              <h2 className="hero-subtitle" style={{ color: "#ffffff" }}>
                학사 통합 관리 플랫폼
              </h2>
              <div className="hero-buttons">
                <a href="/register" className="btn-hero-primary">
                  지금 바로 시작하기
                </a>
                <button className="btn-hero-secondary" onClick={handleInstallClick}>
                  APP 다운로드
                </button>{" "}
                {/* [soojin] 미리보기 → APP 다운로드 */}
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
              {/* [soojin] 상담 신청 / 성적 조회 / 과제·퀴즈 / 학교 일정 플로팅 카드 추가 */}
              <div className="hero-float float-3">
                <div className="float-icon amber">📝</div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--warm-gray)" }}>과제/퀴즈</div>
                  <div style={{ color: "var(--accent-amber)", fontWeight: 800 }}>확인하기</div>
                </div>
              </div>
              <div className="hero-float float-4">
                <div className="float-icon mint">📈</div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--warm-gray)" }}>성적 조회</div>
                  <div style={{ color: "var(--accent-mint)", fontWeight: 800 }}>바로가기</div>
                </div>
              </div>
              <div className="hero-float float-5">
                <div className="float-icon purple">💬</div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--warm-gray)" }}>상담 신청</div>
                  <div style={{ color: "#7C6DFF", fontWeight: 800 }}>신청하기</div>
                </div>
              </div>
              <div className="hero-float float-6">
                <div className="float-icon coral">📅</div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--warm-gray)" }}>학교 일정</div>
                  <div style={{ color: "var(--accent-coral)", fontWeight: 800 }}>일정 보기</div>
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
                            <div
                              className="mock-card-line"
                              style={{ background: "var(--accent-mint)", opacity: 0.3 }}
                            />
                            <div className="mock-card-line" />
                            <div className="mock-card-line" />
                          </div>
                          <div className="mock-card">
                            <div className="mock-card-line" />
                            <div
                              className="mock-card-line"
                              style={{ background: "var(--accent-amber)", opacity: 0.3 }}
                            />
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
        <section className="sm-section pain-section" style={{ background: "var(--light-gray)" }}>
          <div className="sm-inner">
            <div className="reveal">
              <div className="section-label">PROBLEM</div>
              <h3 className="sm-section-title" style={{ fontSize: "2rem", fontWeight: 700 }}>
                기존 학사 시스템,
                <br />
                <span className="hl">이런 불편함</span> 느끼셨나요?
              </h3>
            </div>
            <div className="pain-grid">
              {[
                {
                  tag: "불편",
                  title: "학교마다 다른 앱",
                  desc: "자녀가 다른 학교에 다니면 앱도 따로, 회원가입도 따로\n매번 두 개의 앱을 번갈아 확인하는 불편함",
                  delay: "reveal-d1",
                },
                {
                  tag: "복잡",
                  title: "직관적이지 않은 메뉴",
                  desc: "성적은 어디서 보는지, 출결은 어떻게 확인하는지\n원하는 정보를 찾기 어려운 복잡한 메뉴 구조",
                  delay: "reveal-d2",
                },
                {
                  tag: "비효율",
                  title: "흩어진 학사 정보",
                  desc: "출결은 이 앱, 성적은 저 앱, 공지는 또 다른 앱\n중요한 정보를 한 곳에서 보지 못하고 시간만 보내는\n비효율 형태",
                  delay: "reveal-d3",
                },
              ].map((c) => (
                <div key={c.title} className={`pain-card reveal ${c.delay}`}>
                  <div className="pain-tag">{c.tag}</div>
                  <h4
                    style={{
                      marginTop: 4,
                      marginBottom: 12,
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      color: "var(--navy)",
                    }}
                  >
                    {c.title}
                  </h4>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "var(--warm-gray)",
                      lineHeight: 1.6,
                      margin: 0,
                      paddingBottom: 30,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {c.desc}
                  </p>
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
              <h2 className="sm-section-title" style={{ fontSize: "2rem", fontWeight: 700 }}>
                School Mate가
                <br />
                <span className="hl" style={{ color: "var(--teal-dark)" }}>
                  해결합니다
                </span>
              </h2>
              <p className="sm-section-desc" style={{ margin: "0 auto", fontSize: "1.2rem", fontWeight: "500" }}>
                교사, 학생, 학부모를 하나의 플랫폼으로 연결하는 교육 관리 시스템
              </p>
            </div>
            <div className="overview-grid">
              {[
                {
                  title: "통합 관리",
                  sub: "All-in-One Management",
                  desc: "출결, 성적, 과제, 상담, 일정 학교에 대한 모든 정보를\n하나의 시스템에서 통합 관리합니다.",
                  delay: "reveal-d1",
                },
                {
                  title: "역할 기반 시스템",
                  sub: "Role-Based Access",
                  desc: "사용자 역할에 따라 맞춤형 화면을 제공합니다.\n교사, 학생, 학부모 전용 대시보드로 각자 필요한 정보만 빠르게 전달합니다.",
                  delay: "reveal-d2",
                },
                {
                  title: "쉬운 UI",
                  sub: "Intuitive Interface",
                  desc: "누구나 쉽게 사용할 수 있는 직관적인 화면으로 구성,\n불필요하고 복잡한 메뉴를 최소화했습니다.",
                  delay: "reveal-d3",
                },
              ].map((c) => (
                <div key={c.title} className={`overview-card reveal ${c.delay}`}>
                  <div className="overview-card-sub" style={{ marginBottom: 6 }}>
                    {c.sub}
                  </div>
                  <h4 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 6px 0", lineHeight: 1.3 }}>
                    {c.title}
                  </h4>
                  <p style={{ whiteSpace: "pre-line" }}>{c.desc}</p>
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
              <h2 className="sm-section-title" style={{ fontSize: "2rem", fontWeight: 700 }}>
                역할별{" "}
                <span className="hl" style={{ color: "var(--teal-dark)" }}>
                  맞춤 기능
                </span>
              </h2>
              <p
                className="sm-section-desc"
                style={{ margin: "0", fontSize: "1.2rem", fontWeight: "500", textAlign: "left" }}
              >
                각 사용자에게 꼭 필요한 기능만 제공합니다.
              </p>
            </div>
            <div className="reveal" style={{ marginTop: 10 }}>
              <div className="features-tabs">
                {TAB_DATA.map((t) => (
                  <button
                    key={t.key}
                    className={`tab-btn${activeTab === t.key ? " active" : ""}`}
                    onClick={() => setActiveTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {TAB_DATA.map((t) =>
              activeTab === t.key ? (
                <div key={t.key} className="features-grid">
                  {t.items.map((item) => (
                    <div key={item.title} className="feature-item">
                      <div className="feature-dot">
                        <i className={item.icon} />
                      </div>
                      <div>
                        <h6 style={{ fontWeight: 700 }}>{item.title}</h6>
                        <p>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null,
            )}
          </div>
        </section>
        {/* ════ 섹션 5: DASHBOARD PREVIEW ════ */}
        <section id="preview" className="sm-section preview-section">
          <div className="sm-inner" style={{ position: "relative", zIndex: 1 }}>
            <div className="reveal" style={{ textAlign: "center" }}>
              <div className="section-label">PREVIEW</div>
              <h2 className="sm-section-title" style={{ fontSize: "2rem", fontWeight: 700 }}>
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
                    <div className="pw-row">
                      <div className="pw-cell h" />
                      <div className="pw-cell h" />
                      <div className="pw-cell h" />
                    </div>
                    <div className="pw-row">
                      <div className="pw-cell" />
                      <div className="pw-cell" />
                      <div className="pw-cell" />
                    </div>
                    <div className="pw-row">
                      <div className="pw-cell" />
                      <div className="pw-cell" />
                      <div className="pw-cell" />
                    </div>
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
                { title: "실시간 동기화", desc: "교사가 입력하면 학부모와 학생에게 즉시 반영됩니다." },
                { title: "모바일 최적화", desc: "어디서든 스마트폰으로 편하게 확인할 수 있습니다." },
                { title: "안전한 데이터", desc: "개인정보 보호와 보안을 최우선으로 설계했습니다." },
              ].map((f) => (
                <div key={f.title} className="preview-feat">
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* ════ 섹션 6: COMPARISON ════ */}
        <section className="sm-section" style={{ background: "var(--white)" }}>
          <div className="sm-inner" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="reveal" style={{ textAlign: "center" }}>
              <div className="section-label">COMPARISON</div>
              <h2 className="sm-section-title" style={{ fontSize: "2rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", flexWrap: "nowrap" }}>
                <span style={{ color: "#000" }}>기존 시스템</span>
                <span>vs</span>
                <img
                  src="/images/schoolmate_logo.png"
                  alt="School Mate"
                  style={{ height: "5.5rem" }}
                />
              </h2>
              <p
                className="sm-section-desc"
                style={{ fontSize: "2rem", fontWeight: "500", margin: "0 auto", color: "#333" }}
              >
                무엇이 달라졌을까요?
              </p>
            </div>
            <div className="compare-container reveal">
              <div className="compare-col before">
                <h3>기존 시스템</h3>
                {[
                  "학교 중심 계정 구조",
                  "자녀별 계정 분리 → 다자녀 관리 불편",
                  "교사와 학생 중심 설계",
                  "복잡한 메뉴 구조",
                ].map((txt) => (
                  <div key={txt} className="compare-item">
                    <div className="ci-icon">✕</div>
                    {txt}
                  </div>
                ))}
              </div>
              <div className="compare-arrow">
                <div className="arrow-circle">→</div>
              </div>
              <div className="compare-col after">
                <h3>School Mate</h3>
                {["학부모 계정으로 자녀 선택", "다자녀 통합 대시보드", "역할 기반 맞춤 화면", "직관적인 UI"].map(
                  (txt) => (
                    <div key={txt} className="compare-item">
                      <div className="ci-icon">✓</div>
                      {txt}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>
        {/* ════ 섹션 7: KEY FEATURES ════ */}
        <section className="sm-section" style={{ background: "var(--light-gray)" }}>
          <div className="sm-inner">
            <div className="reveal" style={{ textAlign: "center" }}>
              <div className="section-label">KEY FEATURES</div>
              <h2 className="sm-section-title" style={{ fontSize: "2rem", fontWeight: 700 }}>
                <span className="hl" style={{ color: "var(--teal-dark)" }}>
                  주요 기능
                </span>{" "}
                {/* [soojin] 색상을 회원가입 버튼(teal-dark)으로 변경 */}
              </h2>
              <p className="sm-section-desc" style={{ margin: "0 auto" }}>
                School Mate가 제공하는 핵심 기능을 소개합니다.
              </p>
            </div>
            <div className="roadmap-grid">
              {[
                {
                  num: "01",
                  title: "스마트 알림",
                  desc: "중요한 공지사항을 반복 알림으로 놓치지 않도록",
                  delay: "reveal-d1",
                },
                {
                  num: "02",
                  title: "NEIS 공식 연동",
                  desc: "나이스 시스템과의 공식 데이터\n연동 지원",
                  delay: "reveal-d2",
                },
                {
                  num: "03",
                  title: "다국어 자동 번역",
                  desc: "AI를 활용한 공지\n다국어 자동 번역 기능",
                  delay: "reveal-d3",
                },
                {
                  num: "04",
                  title: "상담 예약 시스템",
                  desc: "학부모-교사 간 편리한\n상담 예약 기능",
                  delay: "reveal-d4",
                },
                {
                  num: "05",
                  title: "성적 변화 감지",
                  desc: "학생 성적 변화를\n자동으로 분석하고 알림",
                  delay: "reveal-d5",
                },
              ].map((c) => (
                <div key={c.num} className={`roadmap-card reveal ${c.delay}`}>
                  <div className="roadmap-num outfit">{c.num}</div>
                  <h6>{c.title}</h6>
                  <p style={{ whiteSpace: "pre-line" }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* ════ 섹션 10: CTA ════ */}
        <section className="cta-section" id="cta">
          <div className="sm-inner" style={{ position: "relative", zIndex: 1 }}>
            <div className="reveal">
              <h2 className="cta-title">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25em" }}>
                  <img
                    src="/images/schoolmateLogo.png"
                    alt="SchoolMate"
                    style={{
                      height: "1.5em",
                      filter: "brightness(0) invert(1)",
                    }}
                  />
                  <span>와 함께</span>
                </span>
                <br />
                학사 관리의 변화를 경험하세요
              </h2>
              <p className="cta-desc">지금 바로 시작하고, 더 나은 교육 환경을 만들어 보세요.</p>
              <div className="cta-buttons">
                <a href="/register" className="btn-cta-primary">
                  무료로 시작하기
                </a>
                <a href="#" className="btn-cta-secondary">
                  도입 문의하기
                </a>
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

      {/* [soojin] PWA 설치 권유 팝업 - 히어로 섹션 지난 후에만 표시 */}
      {showInstallPrompt && heroPassed && (
        <div className="install-prompt-banner">
          <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "var(--teal-pale)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i className="ri-download-cloud-2-line" style={{ fontSize: 24, color: "var(--teal)" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: "0.95rem" }}>SchoolMate 앱 설치하기</div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--warm-gray)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: isIOS ? "normal" : "nowrap",
                }}
              >
                {isIOS
                  ? "Safari 하단 공유 버튼 → '홈 화면에 추가'를 눌러 설치하세요."
                  : "바탕화면에서 더 빠르고 편리하게 접속하세요!"}
              </div>
            </div>
          </div>
          <div className="d-flex gap-2 flex-shrink-0">
            <button
              className="btn btn-sm btn-light"
              onClick={handleInstallDismiss}
              style={{ borderRadius: 8, fontSize: "0.85rem", fontWeight: 600 }}
            >
              나중에
            </button>
            {!isIOS && (
              <button
                className="btn btn-sm"
                onClick={handleInstallClick}
                style={{
                  background: "var(--teal-dark)",
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                설치
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
