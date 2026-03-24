import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '@/api/auth'
import { auth } from '@/shared/auth'

// 이메일 가입: /select-info?source=email → 역할 선택 → 학교 선택 or 폼 입력
// SNS 가입:   /select-info?source=sns  → 역할 선택 → 학교 선택 or 가입 완료
// Hub 역할 추가: /select-info?source=hub → 중복 체크 후 동일 플로우 진행
export default function SelectInfo() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const source = searchParams.get('source') ?? 'sns'

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError('')

    try {
      if (source === 'email') {
        // 이메일 가입: API 호출 없이 다음 단계로 이동
        if (selected === 'PARENT') {
          navigate('/register', { state: { role: 'PARENT' } })
        } else {
          navigate('/register/school-select', { state: { role: selected, source: 'email' } })
        }
        setLoading(false)
        return
      }

      // SNS 가입 / Hub 역할 추가
      if (selected === 'PARENT') {
        // 학부모: 학교 선택 없이 바로 역할 확정
        const res = await api.post<{ accessToken: string; refreshToken: string; role: string }>(
          '/auth/select-role',
          { role: selected }
        )
        auth.setTokens(res.data.accessToken, res.data.refreshToken)
        navigate('/hub')
      } else {
        // 교사/학생: 학교 선택 단계로 이동
        navigate('/register/school-select', { state: { role: selected, source: source === 'hub' ? 'hub' : 'sns' } })
        setLoading(false)
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? '처리 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="d-flex">
      {/* 왼쪽 - 로고 */}
      <div className="register-left d-none d-lg-flex">
        <a href="/main"><img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" /></a>
      </div>

      {/* 오른쪽 - 역할 선택 폼 */}
      <div className="register-right">
        <div className="register-form">
          <div className="d-lg-none text-center mb-4">
            <a href="/main"><img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" style={{ maxWidth: 200 }} /></a>
          </div>

          <div className="text-center mb-4">
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#333', marginBottom: 8 }}>
              {source === 'email' ? '회원가입' : '환영합니다! 👋'}
            </h1>
            <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
              {source === 'email'
                ? '사용자 유형을 선택해 주세요.'
                : '사용자 유형을 선택해 주세요.'}
            </p>
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
              {loading ? '처리 중...' : selected === 'PARENT' && source === 'sns' ? '선택 완료' : '다음'}
            </button>
          </form>

          {source === 'email' && (
            <div className="login-link" style={{ marginTop: 16 }}>
              이미 계정이 있으신가요? <a href="/login">로그인하기</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
