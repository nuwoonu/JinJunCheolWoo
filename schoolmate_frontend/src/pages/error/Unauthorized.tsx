import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// [woo] 403 - 접근 권한 없음 (Spring Boot error/403.html 참조)

export default function Unauthorized() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // [woo] role별 대시보드 경로
  const dashboardPath =
    user?.role === 'STUDENT' ? '/student/dashboard' :
    user?.role === 'TEACHER' ? '/teacher/dashboard' :
    user?.role === 'PARENT'  ? '/parent/dashboard'  : '/main'

  return (
    <div className="bg-base d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="text-center px-24">
        <div className="mb-32" style={{ fontSize: 96, fontWeight: 900, color: '#fd7e14', lineHeight: 1 }}>
          403
        </div>
        <h2 className="fw-bold mb-12" style={{ fontSize: 28 }}>접근 권한이 없습니다</h2>
        <p className="text-secondary-light mb-40" style={{ maxWidth: 400, margin: '0 auto 40px' }}>
          해당 페이지에 접근할 수 있는 권한이 부족합니다.<br />
          관리자에게 문의하거나 다시 로그인해 주세요.
        </p>
        <div className="d-flex justify-content-center gap-12">
          <button
            type="button"
            className="btn btn-primary-600 radius-8 px-24 py-12"
            onClick={() => navigate(dashboardPath)}
          >
            <i className="ri-home-4-line me-8" />메인으로 돌아가기
          </button>
          <button
            type="button"
            className="btn btn-outline-neutral-300 radius-8 px-24 py-12"
            onClick={() => navigate(-1)}
          >
            이전 페이지
          </button>
        </div>
      </div>
    </div>
  )
}
