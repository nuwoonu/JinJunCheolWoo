import { useAuth } from '@/contexts/AuthContext'
import { Link } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'

// [woo] /user/profile - 내 프로필 (전체 역할 공용)

const ROLE_LABEL: Record<string, string> = {
  STUDENT: '학생',
  TEACHER: '교사',
  ADMIN: '관리자',
  PARENT: '학부모',
  GUEST: '게스트',
}

export default function UserProfile() {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">프로필</h6>
          <p className="text-neutral-600 mt-4 mb-0">나의 프로필 정보</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">프로필</li>
        </ul>
      </div>

      <div className="row gy-4">
        <div className="col-lg-4">
          <div className="card radius-12 text-center p-24">
            <div className="w-100-px h-100-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center mx-auto mb-16">
              <iconify-icon icon="mdi:account" className="text-primary-600" style={{ fontSize: 56 }} />
            </div>
            <h5 className="mb-4">{user?.name ?? user?.email ?? '-'}</h5>
            <span className="badge bg-primary-100 text-primary-600 px-16 py-8 radius-8 text-sm fw-medium">
              {ROLE_LABEL[user?.role ?? ''] ?? user?.role ?? '-'}
            </span>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card radius-12">
            <div className="card-header py-16 px-24 border-bottom">
              <h6 className="mb-0">기본 정보</h6>
            </div>
            <div className="card-body p-24">
              <div className="d-flex flex-column gap-16">
                {[
                  { label: '이름', value: user?.name, icon: 'mdi:account-outline' },
                  { label: '이메일', value: user?.email, icon: 'mdi:email-outline' },
                  { label: '역할', value: ROLE_LABEL[user?.role ?? ''] ?? user?.role, icon: 'mdi:shield-account-outline' },
                  { label: '사용자 ID', value: user?.uid != null ? String(user.uid) : '-', icon: 'mdi:identifier' },
                ].map(row => (
                  <div key={row.label} className="d-flex align-items-center justify-content-between py-12 border-bottom">
                    <div className="d-flex align-items-center gap-12">
                      <div className="w-40-px h-40-px bg-neutral-100 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                        <iconify-icon icon={row.icon} className="text-neutral-600 text-lg" />
                      </div>
                      <span className="text-secondary-light text-sm">{row.label}</span>
                    </div>
                    <span className="fw-medium text-sm">{row.value ?? '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
