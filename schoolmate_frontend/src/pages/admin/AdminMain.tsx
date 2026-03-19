import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_ROUTES } from '@/constants/routes'
import { ADMIN_GRANTS, GRANTED_ROLE } from '@/constants/adminPermissions'
import { useAuth } from '@/contexts/AuthContext'
import { useSchool } from '@/context/SchoolContext'
import type { GrantInfo } from '@/api/auth'
import AdminTopBar from '@/components/layout/admin/AdminTopBar'

/** AdminSidebar와 동일한 grant 체크 헬퍼 */
function hasGrant(grants: GrantInfo[], ...roles: string[]) {
  return grants.some(g => roles.includes(g.grantedRole))
}

const ALL_MENU_ITEMS = [
  {
    to: ADMIN_ROUTES.SCHOOL_SELECT,
    icon: 'ri-building-2-line',
    label: '학교 정보 관리',
    desc: '학교를 선택하여 학생, 교사, 교직원, 학급, 공지사항 등을 관리합니다.',
    /** 표시 조건: SCHOOL_ADMIN 이상이거나 학교 내 기능 grant 중 하나라도 보유 */
    requiredGrants: ADMIN_GRANTS.DASHBOARD.filter(g => g !== GRANTED_ROLE.PARENT_MANAGER),
  },
  {
    to: ADMIN_ROUTES.PARENTS.LIST,
    icon: 'ri-user-heart-line',
    label: '학부모 관리',
    desc: '학부모 계정을 등록하고 자녀 연결 및 상태를 관리합니다.',
    requiredGrants: ADMIN_GRANTS.PARENTS,
  },
]

export default function AdminMain() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const { user } = useAuth()
  const { selectedSchool, setSelectedSchool } = useSchool()

  const grants: GrantInfo[] = user?.grants ?? []
  const isSuperAdmin = user?.roles?.includes('ADMIN') || user?.role === 'ADMIN'

  // 비 SUPER_ADMIN 그랜트 보유자: 학교 자동 선택 후 바로 대시보드로 이동
  // AdminMain은 SUPER_ADMIN 전용 학교 선택 허브이므로 그랜트 보유자는 직접 대시보드 진입
  useEffect(() => {
    if (isSuperAdmin || !user) return
    const firstGrant = grants.find(g => g.schoolId)
    if (!firstGrant) return
    if (!selectedSchool) {
      setSelectedSchool({
        id: firstGrant.schoolId!,
        name: firstGrant.schoolName!,
        schoolCode: firstGrant.schoolCode ?? '',
        schoolKind: firstGrant.schoolKind ?? '',
        officeOfEducation: firstGrant.officeOfEducation ?? '',
      })
    }
    navigate(ADMIN_ROUTES.DASHBOARD, { replace: true })
  }, [isSuperAdmin, user])

  // ADMIN role은 모든 메뉴 표시, GrantedRole 보유자는 requiredGrants 기준 필터링
  const menuItems = useMemo(() => {
    if (isSuperAdmin) return ALL_MENU_ITEMS
    return ALL_MENU_ITEMS.filter(item =>
      hasGrant(grants, ...item.requiredGrants)
    )
  }, [grants, isSuperAdmin])

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

        {menuItems.map((item) => (
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
