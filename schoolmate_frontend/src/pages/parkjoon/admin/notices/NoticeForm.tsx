import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../../../components/layout/AdminLayout'
import admin from '../../../../api/adminApi'

const BASE = '/parkjoon/admin'

export default function NoticeForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ title: '', isImportant: false, content: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) {
      admin.get(`/notices/${id}`).then(r => {
        const d = r.data
        setForm({ title: d.title ?? '', isImportant: d.important ?? false, content: d.content ?? '' })
      })
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        await admin.put(`/notices/${id}`, form)
        navigate(`${BASE}/notices/${id}`)
      } else {
        const r = await admin.post('/notices', form)
        navigate(`${BASE}/notices/${r.data?.id ?? ''}`)
      }
    } finally { setSaving(false) }
  }

  return (
    <AdminLayout>
      <div className="d-flex align-items-center mb-4">
        <button className="btn btn-outline-secondary btn-sm me-3" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1" /> 목록으로 돌아가기
        </button>
        <h2 className="mb-0">{isEdit ? '공지사항 수정' : '공지사항 작성'}</h2>
      </div>
      <form onSubmit={handleSubmit} className="card shadow-sm">
        <div className="card-body p-4">
          <div className="mb-3">
            <label className="form-label fw-bold">제목</label>
            <input className="form-control form-control-lg" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="공지 제목을 입력하세요" />
          </div>
          <div className="mb-3">
            <div className="form-check">
              <input type="checkbox" className="form-check-input" id="isImportant" checked={form.isImportant} onChange={e => setForm(f => ({ ...f, isImportant: e.target.checked }))} />
              <label className="form-check-label fw-bold" htmlFor="isImportant">
                중요 공지로 설정 <span className="badge bg-danger ms-1">중요</span>
              </label>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">내용</label>
            <textarea className="form-control" rows={10} required value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="공지 내용을 입력하세요..." />
          </div>
        </div>
        <div className="card-footer bg-light p-4 text-end">
          <button type="button" className="btn btn-secondary px-4 me-2" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn btn-primary px-5" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2" />저장 중...</> : (isEdit ? '수정 완료' : '등록 완료')}
          </button>
        </div>
      </form>
    </AdminLayout>
  )
}
