import { useState } from 'react'
import api from '../../api/auth'
import { auth } from '../../shared/auth'

// [woo] OAuth2 소셜 로그인 후 역할 선택 페이지 (GUEST 유저 전용)
export default function SelectRole() {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const roles = [
    {
      value: 'STUDENT',
      label: '학생',
      icon: 'fa-solid fa-graduation-cap',
      desc: '수업 시간표, 성적, 출결 현황을 확인할 수 있습니다.',
    },
    {
      value: 'TEACHER',
      label: '교사',
      icon: 'fa-solid fa-chalkboard-user',
      desc: '학급 관리, 성적 입력 및 수정, 출결 및 게시판 관리를 할 수 있습니다.',
    },
    {
      value: 'PARENT',
      label: '학부모',
      icon: 'fa-solid fa-people-roof',
      desc: '자녀의 학교 생활, 성적, 알림을 확인할 수 있습니다.',
    },
  ]

  const roleRedirects: Record<string, string> = {
    STUDENT: '/student/dashboard',
    TEACHER: '/teacher/dashboard',
    PARENT: '/parent/dashboard',
    ADMIN: '/parkjoon/admin/dashboard',
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string; role: string }>(
        '/auth/select-role',
        { role: selected }
      )
      const { accessToken, refreshToken, role } = res.data
      auth.setTokens(accessToken, refreshToken)
      window.location.href = roleRedirects[role] ?? '/login'
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? '역할 설정에 실패했습니다. 다시 시도해 주세요.')
      setLoading(false)
    }
  }

  return (
    <div className="d-flex">
      {/* 왼쪽 - 로고 */}
      <div className="register-left d-none d-lg-flex">
        <img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" />
      </div>

      {/* 오른쪽 - 역할 선택 폼 */}
      <div className="register-right">
        <div className="register-form">
          {/* 모바일 로고 */}
          <div className="d-lg-none text-center mb-4">
            <img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" style={{ maxWidth: 200 }} />
          </div>

          <div className="text-center mb-4">
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#333', marginBottom: 8 }}>
              환영합니다! 👋
            </h1>
            <p style={{ color: '#666', fontSize: 14, margin: 0 }}>사용자 유형을 선택해주세요.</p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            {roles.map((role) => (
              <div
                key={role.value}
                onClick={() => setSelected(role.value)}
                style={{
                  border: `2px solid ${selected === role.value ? 'var(--primary-500, #25A194)' : '#e0e0e0'}`,
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 16,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: selected === role.value
                    ? 'linear-gradient(135deg, rgba(37,161,148,0.05), rgba(37,161,148,0.1))'
                    : '#fff',
                  boxShadow: selected === role.value ? '0 4px 12px rgba(37,161,148,0.15)' : 'none',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12, color: 'var(--primary-500, #25A194)' }}>
                  <i className={role.icon}></i>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#333' }}>
                  {role.label}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>{role.desc}</div>
              </div>
            ))}

            <button
              type="submit"
              disabled={!selected || loading}
              style={{
                width: '100%',
                padding: 14,
                border: 'none',
                borderRadius: 20,
                background: (!selected || loading)
                  ? '#ccc'
                  : 'linear-gradient(135deg, var(--primary-500, #25A194), var(--primary-700, #1a7a6e))',
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                cursor: (!selected || loading) ? 'not-allowed' : 'pointer',
                marginTop: 24,
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? '처리 중...' : '선택 완료'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
