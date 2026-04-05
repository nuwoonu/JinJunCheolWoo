import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminTopBar from '@/shared/components/layout/admin/AdminTopBar'
import { ADMIN_ROUTES } from '@/shared/constants/routes'
import adminApi from '@/shared/api/adminApi'

export default function ServiceNoticeForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const [form, setForm] = useState({ title: '', content: '', isPinned: false })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    setFetchLoading(true)
    adminApi.get(`/service-notices/${id}`)
      .then(res => {
        const d = res.data
        setForm({ title: d.title, content: d.content, isPinned: d.isPinned })
      })
      .catch(() => setError('공지 정보를 불러오지 못했습니다.'))
      .finally(() => setFetchLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setError('제목과 내용을 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      if (isEdit) {
        await adminApi.put(`/service-notices/${id}`, form)
      } else {
        await adminApi.post('/service-notices', form)
      }
      navigate(ADMIN_ROUTES.SERVICE_NOTICES.LIST)
    } catch {
      setError(isEdit ? '수정에 실패했습니다.' : '등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--body-bg, #f8fafc)' }}>
      <AdminTopBar position="sticky" showBackButton={true} sectionBadge={isEdit ? '공지 수정' : '공지 작성'} />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>{isEdit ? '공지 수정' : '공지 작성'}</h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>서비스 공지사항을 {isEdit ? '수정' : '작성'}합니다.</p>
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#991b1b" }}>{error}</div>}

        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <div style={{ padding: 24 }}>
            {fetchLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>불러오는 중...</div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>제목 *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="공지 제목을 입력하세요"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>내용 *</label>
                  <textarea
                    className="form-control"
                    rows={14}
                    placeholder="공지 내용을 입력하세요"
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                  <input
                    type="checkbox"
                    id="pinnedCheck"
                    checked={form.isPinned}
                    onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <label htmlFor="pinnedCheck" style={{ fontSize: 14, color: "#374151", cursor: "pointer" }}>
                    상단 고정
                  </label>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: "9px 20px", background: "#25A194", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? '처리 중...' : (isEdit ? '수정 완료' : '등록')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(ADMIN_ROUTES.SERVICE_NOTICES.LIST)}
                    style={{ padding: "9px 20px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#374151", cursor: "pointer" }}
                  >
                    취소
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
