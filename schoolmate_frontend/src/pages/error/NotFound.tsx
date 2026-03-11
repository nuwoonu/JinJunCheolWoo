import { useNavigate } from 'react-router-dom'

// [woo] 404 - 페이지를 찾을 수 없음 (Spring Boot error/404.html 참조)

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="bg-base d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="text-center px-24">
        <div className="mb-32" style={{ fontSize: 96, fontWeight: 900, color: '#6c757d', lineHeight: 1 }}>
          404
        </div>
        <h2 className="fw-bold mb-12" style={{ fontSize: 28 }}>페이지를 찾을 수 없습니다</h2>
        <p className="text-secondary-light mb-40" style={{ maxWidth: 400, margin: '0 auto 40px' }}>
          요청하신 페이지가 삭제되었거나 주소가 변경되었습니다.<br />
          입력하신 주소가 정확한지 다시 한번 확인해 주세요.
        </p>
        <div className="d-flex justify-content-center gap-12">
          <button
            type="button"
            className="btn btn-primary-600 radius-8 px-24 py-12"
            onClick={() => navigate('/main')}
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
