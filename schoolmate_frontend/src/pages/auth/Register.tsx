import { useState } from 'react'
import api from '../../api/auth'
import '../../styles/register.css'

export default function Register() {
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePhoneInput = (value: string) => {
    // [woo] 전화번호 자동 하이픈 입력
    const digits = value.replace(/[^0-9]/g, '')
    let formatted = digits
    if (digits.length > 3 && digits.length <= 7) {
      formatted = digits.slice(0, 3) + '-' + digits.slice(3)
    } else if (digits.length > 7) {
      formatted = digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7, 11)
    }
    setForm(prev => ({ ...prev, phoneNumber: formatted }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // [woo] POST /api/auth/register → 가입 즉시 JWT 발급, 역할별 대시보드로 이동
      const res = await api.post<{ accessToken: string; refreshToken: string; role: string }>(
        '/auth/register',
        form
      )
      const { accessToken, refreshToken, role } = res.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      document.cookie = `accessToken=${accessToken}; path=/; SameSite=Strict`

      setSuccess('회원가입이 완료되었습니다. 잠시만 기다려 주세요, 페이지를 이동하겠습니다.')

      const roleRedirects: Record<string, string> = {
        TEACHER: '/teacher/dashboard',
        STUDENT: '/student/dashboard',
        PARENT: '/parent/dashboard',
        ADMIN: '/admin/dashboard',
      }
      setTimeout(() => { window.location.href = roleRedirects[role] ?? '/login' }, 1000)

    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      if ((err as { response?: { status?: number } })?.response?.status === 409) {
        setError(msg ?? '이미 사용 중인 이메일입니다.')
      } else {
        setError(msg ?? '회원가입에 실패했습니다. 다시 시도해 주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex">
      {/* 왼쪽 - 로고 */}
      <div className="register-left d-none d-lg-flex">
        <img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" />
      </div>

      {/* 오른쪽 - 폼 */}
      <div className="register-right">
        <div className="register-form">
          {/* 모바일 로고 */}
          <div className="d-lg-none text-center mb-4">
            <img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" style={{ maxWidth: 200 }} />
          </div>

          <h2 className="register-title">계정을 만들어 시작하기</h2>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {!showEmailForm ? (
            <div id="socialButtons">
              {/* 이메일 가입 버튼 */}
              <button type="button" className="btn-social" onClick={() => setShowEmailForm(true)}>
                <i className="fa-regular fa-envelope" style={{ fontSize: 20 }}></i>
                이메일 주소로 계속하기
              </button>

              <div className="divider"><span>다른 방법으로 가입하기</span></div>

              <div className="social-buttons">
                <a href="/oauth2/authorization/google" className="btn-social">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google로 계속하기
                </a>
                <a href="/oauth2/authorization/kakao" className="btn-kakao">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.718 1.805 5.104 4.516 6.441-.199.748-.72 2.712-.825 3.131-.129.516.189.508.398.37.164-.109 2.612-1.773 3.674-2.492.717.099 1.455.151 2.237.151 5.523 0 10-3.463 10-7.691S17.523 3 12 3z" />
                  </svg>
                  카카오톡으로 계속하기
                </a>
              </div>
            </div>
          ) : (
            <div>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">이름 *</label>
                  <input
                    type="text" className="form-control" required
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">이메일 *</label>
                  <input
                    type="email" className="form-control" required
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">비밀번호 *</label>
                  <input
                    type="password" className="form-control" required
                    value={form.password}
                    onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">전화번호</label>
                  <input
                    type="tel" className="form-control" placeholder="010-0000-0000"
                    value={form.phoneNumber}
                    onChange={e => handlePhoneInput(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">사용자 유형 *</label>
                  <select
                    className="form-select" required
                    value={form.role}
                    onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="">선택하세요</option>
                    <option value="STUDENT">학생</option>
                    <option value="TEACHER">교사</option>
                    <option value="PARENT">학부모</option>
                  </select>
                </div>
                <button
                  type="submit" className="btn w-100" disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-500, #25a194), var(--primary-700, #1a7a6e))',
                    color: '#fff',
                    borderRadius: 20,
                    boxShadow: '0 4px 15px rgba(37, 161, 148, 0.3)',
                  }}
                >
                  {loading ? '가입 중...' : '가입하기'}
                </button>
              </form>
              <button
                type="button" className="btn btn-link w-100 mt-2"
                onClick={() => setShowEmailForm(false)}
              >
                다른 방법으로 가입하기
              </button>
            </div>
          )}

          <div className="login-link">
            이미 계정이 있으신가요? <a href="/login">로그인하기</a>
          </div>
        </div>
      </div>
    </div>
  )
}
