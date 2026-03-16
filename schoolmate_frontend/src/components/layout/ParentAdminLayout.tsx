import { useEffect, useState, type ReactNode } from 'react'
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

interface ParentAdminLayoutProps {
  children: ReactNode
  msg?: string
  error?: string
}

export default function ParentAdminLayout({ children, msg, error }: ParentAdminLayoutProps) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const theme = useTheme()

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            onClick={() => navigate(ADMIN_ROUTES.MAIN)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.isDark ? '#9ca3af' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              padding: '4px 8px',
              borderRadius: 8,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = theme.isDark ? '#2d2d2d' : '#f3f4f6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <i className="ri-arrow-left-line" style={{ fontSize: 16 }} />
            <span>관리자 메뉴</span>
          </button>
          <div style={{ width: 1, height: 20, background: theme.isDark ? '#444' : '#e5e7eb' }} />
          <img src="/images/schoolmateLogo.png" alt="SchoolMate" style={{ height: 28, width: 'auto' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#25A194',
              padding: '4px 12px',
              background: 'rgba(37,161,148,0.1)',
              borderRadius: 20,
            }}
          >
            학부모 관리
          </span>
          <button
            type="button"
            onClick={theme.toggle}
            className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center border-0"
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
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {msg && (
          <div
            className="alert alert-dismissible mb-24 px-20 py-12 radius-8"
            role="alert"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--text-primary-light)' }}
          >
            {msg}
            <button type="button" className="btn-close" onClick={(e) => (e.currentTarget.closest('.alert') as HTMLElement)?.remove()} />
          </div>
        )}
        {error && (
          <div
            className="alert alert-dismissible mb-24 px-20 py-12 radius-8"
            role="alert"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626' }}
          >
            {error}
            <button type="button" className="btn-close" onClick={(e) => (e.currentTarget.closest('.alert') as HTMLElement)?.remove()} />
          </div>
        )}
        {children}
      </main>

      <footer style={{ textAlign: 'center', padding: '24px', color: theme.isDark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>
        Copyright 2026 SchoolMate. All Rights Reserved.
      </footer>
    </div>
  )
}
