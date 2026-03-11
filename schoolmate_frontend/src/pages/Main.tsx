export default function Main() {
  return (
    <>
      <style>{`
        .main-hero {
          background-color: var(--primary-600, #25a194);
          min-height: calc(100vh - 70px);
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
          margin-top: 60px;
        }
        .main-nav {
          background: #fff;
          border-bottom: 1px solid #e0e0e0;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          padding: 12px 0;
        }
        .main-nav .nav-link {
          color: #000;
          font-weight: 500;
          padding: 0.5rem 1.2rem;
          transition: all 0.3s;
          border-radius: 8px;
          text-decoration: none;
        }
        .main-nav .nav-link:hover {
          color: var(--primary-600, #25a194);
          background: rgba(37, 161, 148, 0.1);
        }
        .main-nav .btn-login {
          color: #000;
          font-weight: 500;
          transition: all 0.3s;
          text-decoration: none;
        }
        .main-nav .btn-login:hover { color: var(--primary-600, #25a194); }
        .main-nav .btn-register {
          color: #fff;
          font-weight: 500;
          background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
          padding: 0.5rem 1.2rem;
          border-radius: 20px;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(37, 161, 148, 0.3);
          text-decoration: none;
        }
        .main-nav .btn-register:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 161, 148, 0.4);
        }
        .hero-subtitle {
          color: rgba(255,255,255,0.85);
          font-size: 1rem;
          letter-spacing: 0.5px;
        }
        .hero-title {
          color: #fff;
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 3rem;
        }
        .feature-label {
          display: inline-block;
          background-color: #fff;
          color: var(--primary-700, #1a7a6e);
          font-size: 1.5rem;
          font-weight: 700;
          padding: 0.3rem 0.6rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        .feature-desc {
          color: rgba(255,255,255,0.9);
          font-size: 1rem;
          margin-top: 1.5rem;
        }
        @media (max-width: 992px) {
          .hero-title { font-size: 2.5rem; }
        }
      `}</style>

      {/* 네비게이션 바 */}
      <nav className="main-nav">
        <div className="container-fluid px-16 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <a href="/main">
              <img src="/images/schoolmateLogo.png" alt="SchoolMate" width="173" height="40" />
            </a>
            <div className="d-none d-md-flex gap-2">
              <a href="#features" className="nav-link">서비스 소개</a>
              <a href="#about" className="nav-link">학교 찾기</a>
              <a href="#contact" className="nav-link">공지사항</a>
              <a href="#HR" className="nav-link">인재채용</a>
            </div>
          </div>
          <div className="d-flex gap-3 align-items-center">
            <a href="/login" className="btn-login">
              <i className="fa-solid fa-arrow-right-to-bracket"></i> 로그인
            </a>
            <a href="/register" className="btn-register">
              <i className="fa-solid fa-user-plus"></i> 회원가입
            </a>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="main-hero">
        <div className="container">
          <div className="row">
            <div className="col-lg-7">
              <p className="hero-subtitle mb-3">스마트한 학급 관리의 시작</p>
              <h1 className="hero-title">SchoolMate</h1>
              <div className="mb-4">
                <span className="feature-label">학생, 교사, 학부모를 위한</span><br />
                <span className="feature-label">통합 학급 관리 플랫폼</span>
              </div>
              <p className="feature-desc">
                출결 관리부터 성적 확인, 학급 소통까지<br />
                SchoolMate와 함께하세요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
