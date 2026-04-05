import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminTopBar from '@/shared/components/layout/admin/AdminTopBar'
import { ADMIN_ROUTES } from '@/shared/constants/routes'
import adminApi from '@/shared/api/adminApi'

interface NoticeDetail {
  id: number
  title: string
  content: string
  writerName: string
  viewCount: number
  isPinned: boolean
  createDate: string
  updateDate: string
}

export default function ServiceNoticeDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [notice, setNotice] = useState<NoticeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.get(`/service-notices/${id}`)
      .then(res => setNotice(res.data))
      .catch(() => setError('공지 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!notice) return
    if (!confirm(`"${notice.title}" 공지를 삭제하시겠습니까?`)) return
    try {
      await adminApi.delete(`/service-notices/${id}`)
      navigate(ADMIN_ROUTES.SERVICE_NOTICES.LIST)
    } catch {
      setError('삭제에 실패했습니다.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--body-bg, #f8fafc)' }}>
      <AdminTopBar position="sticky" showBackButton={true} sectionBadge="공지 상세" />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
          <div>
            <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>공지 상세</h5>
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>서비스 공지사항 내용을 확인합니다.</p>
          </div>
          <button
            onClick={() => navigate(ADMIN_ROUTES.SERVICE_NOTICES.LIST)}
            style={{ padding: "8px 16px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#374151", cursor: "pointer" }}
          >
            ← 목록
          </button>
        </div>

        {error && <div className="alert alert-danger mb-16">{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>불러오는 중...</div>
        ) : notice && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {notice.isPinned && (
                  <span style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>상단 고정</span>
                )}
                <h5 style={{ margin: 0, fontWeight: 700, color: "#111827" }}>{notice.title}</h5>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#6b7280" }}>
                <span>작성자: {notice.writerName}</span>
                <span>작성일: {notice.createDate?.slice(0, 10)}</span>
                <span>조회수: {notice.viewCount}</span>
              </div>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.9, color: "#374151", fontSize: "0.95rem" }}>
                {notice.content}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, padding: "16px 24px", borderTop: "1px solid #e5e7eb" }}>
              <button
                onClick={() => navigate(ADMIN_ROUTES.SERVICE_NOTICES.EDIT(notice.id))}
                style={{ padding: "8px 20px", background: "#25A194", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                style={{ padding: "8px 20px", background: "#fff", border: "1px solid #ef4444", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#ef4444", cursor: "pointer" }}
              >
                삭제
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
