import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_ROUTES } from '@/constants/routes'
import AdminTopBar from '@/components/layout/admin/AdminTopBar'

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
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--body-bg, #f8fafc)' }}>
      <AdminTopBar position="sticky" showBackButton={false} />

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
              color: 'var(--heading-color)',
              marginBottom: 8,
            }}
          >
            관리자 메뉴
          </h2>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: 14, margin: 0 }}>
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
              border: `2px solid ${hovered === item.to ? '#25A194' : 'var(--neutral-200)'}`,
              borderRadius: 16,
              padding: 24,
              marginBottom: 16,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: hovered === item.to
                ? 'linear-gradient(135deg, rgba(37,161,148,0.07), rgba(37,161,148,0.13))'
                : 'var(--white)',
              boxShadow: hovered === item.to
                ? '0 4px 12px rgba(37,161,148,0.18)'
                : '0 1px 4px rgba(0,0,0,0.07)',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12, color: '#25A194' }}>
              <i className={item.icon} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--heading-color)' }}>
              {item.label}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary-light)' }}>{item.desc}</div>
          </div>
        ))}
      </main>
    </div>
  )
}
