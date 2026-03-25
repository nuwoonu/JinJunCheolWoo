import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '@/api/auth'
import { auth } from '@/shared/auth'
import { useSchoolSearch, type SchoolSummary } from '@/hooks/useSchoolSearch'

// 이메일 가입: 학교 선택 후 /register로 이동 (state에 role+schoolId 전달)
// SNS/Hub 가입: 학교 선택 후 POST /auth/select-role → /hub로 이동

const SCHOOL_KINDS = ['', '초등학교', '중학교', '고등학교', '특수학교', '각종학교']

const roleLabels: Record<string, string> = {
  TEACHER: '교사',
  STUDENT: '학생',
}

export default function RegisterSchoolSelect() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { role, source } = (state ?? {}) as { role?: string; source?: string }

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    name, setName,
    schoolKind, setSchoolKind,
    schools,
    totalPages,
    totalElements,
    page,
    loading,
    searched,
    fetchSchools,
    handleSearch,
  } = useSchoolSearch((params) => api.get('/schools', { params }))

  // state 없이 직접 접근 시 select-info로 보냄
  if (!role || !source) {
    window.location.replace('/select-info?source=email')
    return null
  }

  const handleSelect = async (school: SchoolSummary) => {
    setSubmitting(true)
    setError('')
    try {
      if (source === 'sns' || source === 'hub') {
        const res = await api.post<{ accessToken: string; refreshToken: string; role: string }>(
          '/auth/select-role',
          { role, schoolId: String(school.id) }
        )
        auth.setTokens(res.data.accessToken, res.data.refreshToken)
        navigate('/hub')
      } else {
        // 이메일 가입: 폼 단계로 이동
        navigate('/register', { state: { role, schoolId: school.id, schoolName: school.name } })
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message ?? '처리 중 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="register-container">
      {/* 왼쪽 상단 로고 */}
      <a href="/main" className="register-logo">
        <img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" />
      </a>

      {/* 폼 중앙 배치 */}
      <div className="register-body">
        <div className="register-form" style={{ maxWidth: 600 }}>
          <div className="mobile-logo">
            <a href="/main"><img src="/images/schoolmateLogo.png" alt="Schoolmate Logo" /></a>
          </div>

          <div className="text-center mb-4">
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#333', marginBottom: 8 }}>
              {source === 'email' ? '학교 선택' : '소속 학교를 선택해 주세요'}
            </h1>
            <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
              {roleLabels[role]} 역할로 소속될 학교를 검색하여 선택해 주세요.
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {/* 검색 폼 */}
          <form onSubmit={handleSearch} className="mb-3">
            <div className="row g-2 align-items-end">
              <div className="col-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="학교명 검색 (예: 서울중학교)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="col-3">
                <select
                  className="form-select"
                  value={schoolKind}
                  onChange={(e) => setSchoolKind(e.target.value)}
                >
                  {SCHOOL_KINDS.map((k) => (
                    <option key={k} value={k}>{k || '전체'}</option>
                  ))}
                </select>
              </div>
              <div className="col-3">
                <button
                  type="submit"
                  className="btn w-100"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #25A194, #1a7a6e)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                  }}
                >
                  {loading
                    ? <span className="spinner-border spinner-border-sm" />
                    : <><i className="bi bi-search me-1"></i>검색</>}
                </button>
              </div>
            </div>
          </form>

          {/* 검색 결과 */}
          {searched && (
            <>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                총 {totalElements.toLocaleString()}개 결과
              </div>
              {schools.length === 0 ? (
                <div className="text-center text-muted py-4">검색 결과가 없습니다.</div>
              ) : (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  {schools.map((school, idx) => (
                    <div
                      key={school.id}
                      style={{
                        padding: '14px 16px',
                        borderBottom: idx < schools.length - 1 ? '1px solid #f3f4f6' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#fff',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>
                          {school.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                          {school.schoolKind} · {school.officeOfEducation}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelect(school)}
                        disabled={submitting}
                        style={{
                          background: 'linear-gradient(135deg, #25A194, #1a7a6e)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 16px',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: submitting ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                          marginLeft: 12,
                          opacity: submitting ? 0.6 : 1,
                        }}
                      >
                        선택
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item${page === 0 ? ' disabled' : ''}`}>
                        <button className="page-link" onClick={() => fetchSchools(page - 1)}>
                          &laquo;
                        </button>
                      </li>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const start = Math.max(0, Math.min(page - 2, totalPages - 5))
                        const p = start + i
                        return (
                          <li key={p} className={`page-item${p === page ? ' active' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => fetchSchools(p)}
                              style={p === page ? { background: '#25A194', borderColor: '#25A194' } : {}}
                            >
                              {p + 1}
                            </button>
                          </li>
                        )
                      })}
                      <li className={`page-item${page >= totalPages - 1 ? ' disabled' : ''}`}>
                        <button className="page-link" onClick={() => fetchSchools(page + 1)}>
                          &raquo;
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}

          {!searched && (
            <div className="text-center text-muted py-4" style={{ fontSize: 14 }}>
              <i className="bi bi-search" style={{ fontSize: 32, display: 'block', marginBottom: 8, opacity: 0.3 }}></i>
              학교명을 입력하고 검색하세요.
            </div>
          )}

          <button
            type="button"
            className="btn btn-link w-100 mt-3"
            onClick={() => navigate(-1)}
          >
            ← 이전 단계로
          </button>
        </div>
      </div>
    </div>
  )
}
