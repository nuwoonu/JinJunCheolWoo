import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/contexts/AuthContext'
import { useProfileModal } from '@/shared/contexts/ProfileModalContext'
import { getRoleContexts } from '@/shared/api/authApi'
import type { RoleContext } from '@/shared/api/authApi'
import { ADMIN_ROUTES } from '@/shared/constants/routes'

const menuItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  width: '100%', background: 'none', border: 'none',
  padding: '10px 14px', fontSize: 13, fontWeight: 500,
  color: 'var(--text-primary-light, #111827)', cursor: 'pointer',
  textAlign: 'left',
}

export default function ProfileDropdown() {
  const { user, signOut } = useAuth()
  const { openProfileModal } = useProfileModal()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  const isHub = pathname === '/hub'
  const isAdminPage = pathname.startsWith('/admin')
  const ref = useRef<HTMLDivElement>(null)
  const [allContexts, setAllContexts] = useState<RoleContext[]>([])

  const roleRequests = user?.roleRequests ?? []
  const isSuperAdmin = user?.grants?.some(g => g.grantedRole === 'SUPER_ADMIN') ?? false
  const hasAdminAccess = (user?.grants?.length ?? 0) > 0 && !isSuperAdmin
  // 역할이 2개 이상이거나 비활성(승인 대기·거부·차단) 역할이 존재하면 허브 진입 버튼 노출
  const showHubButton =
    roleRequests.length + (isSuperAdmin ? 1 : 0) >= 2 ||
    roleRequests.some(r => r.status !== 'ACTIVE')

  // 역할 추가 가능 여부 판단
  useEffect(() => {
    getRoleContexts().then(setAllContexts).catch(() => setAllContexts([]))
  }, [])

  const canAddRole = (['STUDENT', 'TEACHER', 'PARENT'] as const).some((role) => {
    const hasPending = roleRequests.some(rr => rr.role === role && rr.status === 'PENDING')
    if (hasPending) return false
    if (role === 'PARENT') {
      return !roleRequests.some(rr => rr.role === 'PARENT' && rr.status === 'ACTIVE')
    }
    const roleCtxs = allContexts.filter(c => c.roleType === role)
    if (roleCtxs.length === 0) return true
    return roleCtxs.every(c => c.status === 'TRANSFERRED')
  })

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const imgSrc = user?.profileImageUrl ?? null
  const initial = (user?.name ?? user?.email ?? '?')[0].toUpperCase()

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px 6px', borderRadius: 8,
        }}
        aria-label="프로필 메뉴"
      >
        {/* 아바타 */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#25A194', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {imgSrc ? (
            <img src={imgSrc} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{initial}</span>
          )}
        </div>
        {/* 이름 */}
        <span style={{
          fontSize: 13, fontWeight: 600,
          color: 'var(--text-primary-light, #111827)',
          maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {user?.name ?? user?.email ?? '-'}
        </span>
        <i
          className={open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
          style={{ fontSize: 14, color: 'var(--neutral-400, #9ca3af)' }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'var(--body-bg, #fff)', border: '1px solid var(--neutral-200, #e5e7eb)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: 160, zIndex: 9999, overflow: 'hidden',
        }}>
          <button
            onClick={() => { setOpen(false); openProfileModal() }}
            style={menuItemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--neutral-100, #f3f4f6)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <i className="ri-user-settings-line" style={{ fontSize: 15 }} />
            프로필 보기
          </button>
          {!isHub && canAddRole && (
            <button
              onClick={() => { setOpen(false); navigate('/select-info?source=profile') }}
              style={menuItemStyle}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--neutral-100, #f3f4f6)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <i className="ri-add-circle-line" style={{ fontSize: 15 }} />
              역할 추가
            </button>
          )}
          {!isHub && showHubButton && (
            <button
              onClick={() => { setOpen(false); navigate('/hub') }}
              style={menuItemStyle}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--neutral-100, #f3f4f6)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <i className="ri-swap-box-line" style={{ fontSize: 15 }} />
              역할 전환
            </button>
          )}
          {hasAdminAccess && (
            isAdminPage ? (
              <button
                onClick={() => { setOpen(false); navigate('/teacher/dashboard') }}
                style={menuItemStyle}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--neutral-100, #f3f4f6)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <i className="ri-home-smile-line" style={{ fontSize: 15 }} />
                교사 대시보드
              </button>
            ) : (
              <button
                onClick={() => { setOpen(false); navigate(ADMIN_ROUTES.MAIN) }}
                style={menuItemStyle}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--neutral-100, #f3f4f6)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <i className="ri-shield-keyhole-line" style={{ fontSize: 15 }} />
                관리 페이지
              </button>
            )
          )}
          <div style={{ height: 1, background: 'var(--neutral-100, #f3f4f6)' }} />
          <button
            onClick={() => { setOpen(false); signOut() }}
            style={{ ...menuItemStyle, color: '#ef4444' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--neutral-100, #f3f4f6)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <i className="ri-logout-box-line" style={{ fontSize: 15 }} />
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}
