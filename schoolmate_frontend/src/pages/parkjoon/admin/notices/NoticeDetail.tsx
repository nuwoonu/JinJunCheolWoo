import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../../../components/layout/AdminLayout'
import admin from '../../../../api/adminApi'
import { ADMIN_ROUTES } from '../../../../constants/routes'

export default function NoticeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [notice, setNotice] = useState<any>(null)

  useEffect(() => {
    admin.get(`/notices/${id}`).then(r => setNotice(r.data))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) return
    await admin.delete(`/notices/${id}`)
    navigate(ADMIN_ROUTES.NOTICES.LIST)
  }

  if (!notice) return <AdminLayout><div className="text-center py-5"><div className="spinner-border" /></div></AdminLayout>

  return (
    <AdminLayout>
      <div className="mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(ADMIN_ROUTES.NOTICES.LIST)}>
          <i className="bi bi-arrow-left me-1" /> 목록으로 돌아가기
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white p-4">
          <div className="d-flex align-items-start justify-content-between">
            <div>
              <h4 className="mb-2 fw-bold">
                {notice.important && <span className="badge bg-danger me-2">중요</span>}
                {notice.title}
              </h4>
              <p className="mb-0 text-muted small">
                작성자: <strong>{notice.writerName}</strong> ·
                작성일: {notice.createdDate?.split('T')[0]} ·
                조회수: {notice.viewCount}
              </p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(ADMIN_ROUTES.NOTICES.EDIT(id!))}>
                <i className="bi bi-pencil" /> 수정
              </button>
              <button className="btn btn-outline-danger btn-sm" onClick={handleDelete}>
                <i className="bi bi-trash" /> 삭제
              </button>
            </div>
          </div>
        </div>
        <div className="card-body p-4">
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '1rem' }}>{notice.content}</pre>
        </div>
        <div className="card-footer bg-light p-3 text-start">
          <button className="btn btn-outline-secondary" onClick={() => navigate(ADMIN_ROUTES.NOTICES.LIST)}>
            <i className="bi bi-list" /> 목록으로
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
