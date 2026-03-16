import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ADMIN_ROUTES } from '../../constants/routes'

function useTheme() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])
  useEffect(() => {
    const saved = localStorage.getItem('theme') ?? 'light'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])
  return { isDark, toggle: () => setIsDark((p) => !p) }
}

const MENU_ITEMS = [
  {
    to: ADMIN_ROUTES.SCHOOL_SELECT,
    icon: 'ri-building-2-line',
    label: '학교 정보 관리',
    desc: '학교를 선택하여 학생, 교사, 교직원, 학급, 공지사항 등을 관리합니다.',
  },
  {
    to: ADMIN_ROUTES.PARENTS.LIST,
    icon: 'ri-user-heart-line',
    label: '학부모 관리',
    desc: '학부모 계정을 등록하고 자녀 연결 및 상태를 관리합니다.',
  },
]

export default function AdminMain() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const theme = useTheme()
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: theme.isDark ? '#121212' : '#f8fafc', transition: 'background 0.3s' }}>
      {/* 헤더 */}
      <header
        style={{
          background: theme.isDark ? '#1e1e1e' : '#fff',
          borderBottom: `1px solid ${theme.isDark ? '#333' : '#e5e7eb'}`,
          padding: '0 32px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          transition: 'background 0.3s, border-color 0.3s',
        }}
      >
        <img
          src="/images/schoolmateLogo.png"
          alt="SchoolMate"
          style={{ height: 32, width: 'auto' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={theme.toggle}
            className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center me-2 border-0"
            aria-label="Dark & Light Mode Button"
          >
            <iconify-icon
              icon={theme.isDark ? 'ri:sun-line' : 'ri:moon-line'}
              className="text-primary-light text-xl"
            />
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={signOut}
            style={{ fontSize: 13 }}
          >
            <i className="bi bi-box-arrow-right me-1" />
            로그아웃
          </button>
        </div>
      </header>

      {/* 본문 */}
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '64px 24px' }}>
        <div className="text-center mb-40">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #25A194, #1a7a6e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <i className="ri-shield-user-line" style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: theme.isDark ? '#f3f4f6' : '#1a1a1a',
              marginBottom: 8,
            }}
          >
            관리자 메뉴
          </h2>
          <p style={{ color: theme.isDark ? '#9ca3af' : '#6b7280', fontSize: 14, margin: 0 }}>
            관리할 항목을 선택해 주세요.
          </p>
        </div>

        {MENU_ITEMS.map((item) => (
          <div
            key={item.to}
            onClick={() => navigate(item.to)}
            onMouseEnter={() => setHovered(item.to)}
            onMouseLeave={() => setHovered(null)}
            style={{
              border: `2px solid ${hovered === item.to ? '#25A194' : theme.isDark ? '#333' : '#e0e0e0'}`,
              borderRadius: 16,
              padding: 24,
              marginBottom: 16,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background:
                hovered === item.to
                  ? 'linear-gradient(135deg, rgba(37,161,148,0.07), rgba(37,161,148,0.13))'
                  : theme.isDark
                    ? '#1e1e1e'
                    : '#fff',
              boxShadow:
                hovered === item.to
                  ? '0 4px 12px rgba(37,161,148,0.18)'
                  : theme.isDark
                    ? '0 1px 4px rgba(0,0,0,0.3)'
                    : '0 1px 4px rgba(0,0,0,0.07)',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12, color: '#25A194' }}>
              <i className={item.icon} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: theme.isDark ? '#f3f4f6' : '#1a1a1a' }}>
              {item.label}
            </div>
            <div style={{ fontSize: 14, color: theme.isDark ? '#9ca3af' : '#6b7280' }}>{item.desc}</div>
          </div>
        ))}
      </main>
    </div>
  )
}
