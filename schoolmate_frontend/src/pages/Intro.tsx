import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import PageLoader from '@/components/PageLoader'

export default function Intro() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  if (loading) return <PageLoader />
  if (user?.authenticated) return <Navigate to="/hub" replace />

  // 왼쪽 그룹: 기우는 방향(왼쪽) 하단 고정
  const fallLeft = (deg: number, zIdx?: number): React.CSSProperties => ({
    transformOrigin: 'bottom left',
    transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    transform: hovered ? `rotate(${deg}deg)` : 'rotate(0deg)',
    position: 'relative',
    zIndex: zIdx,
  })

  // 오른쪽 그룹: 기우는 방향(오른쪽) 하단 고정
  const fallRight = (deg: number, zIdx?: number): React.CSSProperties => ({
    transformOrigin: 'bottom right',
    transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    transform: hovered ? `rotate(${deg}deg)` : 'rotate(0deg)',
    position: 'relative',
    zIndex: zIdx,
  })

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; }

        .intro-root {
          min-height: 100vh;
          background: #25A194;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
          overflow: hidden;
          user-select: none;
        }

        .bookshelf-scene {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .books-row {
          display: flex;
          align-items: flex-end;
          gap: 6px;
        }

        .left-group,
        .right-group {
          display: flex;
          align-items: flex-end;
          gap: 5px;
        }

        /* ── 2D 플랫 책 공통 ── */
        .book {
          position: relative;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 3px;
        }

        .book-title {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          position: relative;
          z-index: 1;
          user-select: none;
        }

        /* ── 야구공 ── */
        .baseball {
          flex-shrink: 0;
          align-self: flex-end;
          margin-bottom: 10px;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 58px;
        }

        /* ── 중앙 고정 구역 ── */
        .center-section {
          position: relative;
          width: 340px;
          height: 420px;
          flex-shrink: 0;
          display: flex;
          align-items: flex-end;
        }

        .center-frame {
          position: absolute;
          left: 3px;
          bottom: 0;
          width: 38px;
          height: 255px;
          background: #ece8dc;
          border-radius: 3px;
          z-index: 2;
        }

        .flat-stack {
          position: absolute;
          left: 55px;
          right: 0;
          bottom: 0;
          z-index: 1;
        }
        .flat-layer { width: 100%; }
        .flat-pages {
          width: 100%;
          background: #e8e3d5;
        }

        /* ── TOUCH 버튼 ── */
        .touch-btn {
          position: absolute;
          top: 40%;
          left: 18%;
          transform: translate(-50%, -50%);
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: #1a7a6e;
          color: #fff;
          border: 4px solid rgba(255,255,255,0.5);
          cursor: pointer;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.5;
          text-align: center;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: background 0.3s, font-size 0.2s;
          font-family: inherit;
        }
        .touch-btn.is-hover {
          background: #ef4444;
          font-size: 46px;
          font-weight: 400;
          letter-spacing: 0;
          border-color: rgba(255,255,255,0.6);
        }

        /* ── 선반 ── */
        .shelf {
          width: 1100px;
          height: 18px;
          background: #8b6914;
          border-radius: 2px;
        }

        /* ── 하단 문구 ── */
        .intro-caption {
          color: rgba(255,255,255,0.65);
          font-size: 13px;
          letter-spacing: 0.8px;
          margin-top: 24px;
          text-align: center;
        }
        .intro-brand {
          color: rgba(255,255,255,0.95);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 3px;
          text-align: center;
          margin-top: 7px;
        }
      `}</style>

      <div className="intro-root">
        <div className="bookshelf-scene">
          <div className="books-row">

            {/* ════════ 왼쪽 그룹 — 안→바깥 순서로 쓰러짐 ════════ */}
            <div className="left-group">

              {/* THE SHARED — 빨강+크림 스플릿, 고정 */}
              <div className="book" style={{
                width: 90, height: 260,
                background: 'linear-gradient(to right, #e63946 38%, #f5f0e0 38%)',
              }}>
                <span className="book-title" style={{
                  fontSize: 18, fontWeight: 900, color: '#1a1a1a', letterSpacing: 3,
                }}>
                  THE SHARED
                </span>
              </div>

              {/* READING — 크림색 */}
              <div className="book" style={{
                ...fallLeft(-10, 2),
                width: 80, height: 415, backgroundColor: '#f5f0e0',
              }}>
                <span className="book-title" style={{
                  fontSize: 30, fontWeight: 900, color: '#1a1a1a', letterSpacing: 4,
                }}>
                  READING
                </span>
              </div>

              {/* A/N/D — 마젠타, 가장 안쪽 (딜레이 0) */}
              <div className="book" style={{
                ...fallLeft(-12, 1),
                width: 78, height: 325, backgroundColor: '#d500f9',
              }}>
                <span className="book-title" style={{
                  fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: 4,
                }}>
                  A/N/D
                </span>
              </div>

              {/* 야구공 */}
              <div className="baseball">⚾</div>
            </div>

            {/* ════════ 중앙 (고정) ════════ */}
            <div className="center-section">
              <div className="center-frame" />

              <div className="flat-stack">
                <div className="flat-layer" style={{ height: 30, backgroundColor: '#1a7a6e' }} />
                <div className="flat-pages" style={{ height: 13 }} />
                <div className="flat-layer" style={{ height: 22, backgroundColor: '#f5f0e0' }} />
                <div className="flat-pages" style={{ height: 12 }} />
                <div className="flat-layer" style={{ height: 37, backgroundColor: '#e63946' }} />
                <div className="flat-pages" style={{ height: 12 }} />
                <div className="flat-layer" style={{ height: 12, backgroundColor: '#c8c0a8' }} />
              </div>

              <button
                className={`touch-btn${hovered ? ' is-hover' : ''}`}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={() => navigate('/main')}
              >
                {hovered
                  ? '→'
                  : <span>TOUCH<br />THE<br />BOOK!</span>
                }
              </button>
            </div>

            {/* ════════ 오른쪽 그룹 — 안→바깥 순서로 쓰러짐 ════════ */}
            <div className="right-group">

              {/* DISCUSSION — 마젠타, 가장 안쪽 (딜레이 0) */}
              <div className="book" style={{
                ...fallRight(12, 1),
                width: 88, height: 365, backgroundColor: '#d500f9',
              }}>
                <span className="book-title" style={{
                  fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: 4,
                }}>
                  DISCUSSION
                </span>
              </div>

              {/* ACTIVITY — 라임 그린 */}
              <div className="book" style={{
                ...fallRight(10, 2),
                width: 85, height: 340, backgroundColor: '#76ff03',
              }}>
                <span className="book-title" style={{
                  fontSize: 28, fontWeight: 900, color: '#1a2e10', letterSpacing: 4,
                }}>
                  ACTIVITY
                </span>
              </div>

              {/* SchoolMate — 연두 이탤릭, 고정 */}
              <div className="book" style={{
                width: 115, height: 420, backgroundColor: '#d4ed9a',
              }}>
                <span className="book-title" style={{
                  fontSize: 24, fontWeight: 600, fontStyle: 'italic',
                  color: '#1a3020', fontFamily: "Georgia, 'Times New Roman', serif",
                  letterSpacing: 3,
                }}>
                  SchoolMate
                </span>
              </div>
            </div>

          </div>

          <div className="shelf" />
        </div>

        <p className="intro-caption">
          교사, 학생, 학부모를 하나의 플랫폼으로 연결하는 통합 학사 관리 시스템
        </p>
        <p className="intro-brand">SchoolMate</p>
      </div>
    </>
  )
}
