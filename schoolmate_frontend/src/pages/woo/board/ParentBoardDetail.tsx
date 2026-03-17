import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '@/api/auth'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'

// [woo] /board/parent/:id - 학부모 자유게시판 상세

interface Board {
  id: number
  title: string
  content: string
  writerName: string
  writerEmail: string
  viewCount: number
  createDate: string
}

export default function ParentBoardDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)
  // [woo] StrictMode 이중 실행 방지 - 조회수 POST를 최초 1회만 호출
  const viewedRef = useRef(false)

  // [woo] 작성자 본인(email 비교) 또는 ADMIN만 수정/삭제 가능
  const isAdmin = user?.role === 'ADMIN'
  const canEdit = isAdmin || (board?.writerEmail != null && board.writerEmail === user?.email)

  useEffect(() => {
    if (!id) return
    api.get(`/board/${id}`)
      .then(res => {
        setBoard(res.data)
        setEditForm({ title: res.data.title, content: res.data.content })
        // [woo] viewedRef로 StrictMode 이중 실행 방지 - 최초 1회만 조회수 증가
        if (!viewedRef.current) {
          viewedRef.current = true
          api.post(`/board/${id}/view`).catch(() => {})
        }
      })
      .catch(() => navigate('/board/parent'))
      .finally(() => setLoading(false))
  }, [id])

  const handleEdit = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      await api.put(`/board/${id}`, {
        boardType: 'PARENT_BOARD',
        title: editForm.title,
        content: editForm.content,
      })
      setShowEditModal(false)
      const res = await api.get(`/board/${id}`)
      setBoard(res.data)
    } catch {
      alert('수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await api.delete(`/board/${id}`)
      navigate('/board/parent')
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return <DashboardLayout><div className="text-center py-48 text-secondary-light">불러오는 중...</div></DashboardLayout>
  }

  if (!board) return null

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">게시판</h6>
          <p className="text-neutral-600 mt-4 mb-0">학부모 게시판</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">게시판</li>
          <li>-</li>
          <li className="fw-medium"><Link to="/board/parent" className="hover-text-primary">학부모 게시판</Link></li>
          <li>-</li>
          <li className="fw-medium">상세보기</li>
        </ul>
      </div>

      <div className="card radius-12">
        <div className="card-header py-16 px-24 border-bottom">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h5 className="mb-8">{board.title}</h5>
              <div className="d-flex gap-16 text-secondary-light text-sm">
                <span><iconify-icon icon="mdi:account" className="me-4" />{board.writerName}</span>
                <span><iconify-icon icon="mdi:calendar" className="me-4" />{board.createDate?.slice(0, 16).replace('T', ' ')}</span>
                <span><iconify-icon icon="mdi:eye" className="me-4" />{board.viewCount}</span>
              </div>
            </div>
            {canEdit && (
              <div className="d-flex gap-8">
                <button type="button" className="btn btn-outline-primary-600 radius-8" onClick={() => setShowEditModal(true)}>
                  <iconify-icon icon="mdi:pencil" className="me-4" />수정
                </button>
                <button type="button" className="btn btn-outline-danger radius-8" onClick={handleDelete}>
                  <iconify-icon icon="mdi:delete" className="me-4" />삭제
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="card-body p-24">
          <div style={{ minHeight: 300, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{board.content}</div>
        </div>
        <div className="card-footer py-16 px-24 border-top">
          <Link to="/board/parent" className="btn btn-secondary-600 radius-8">
            <iconify-icon icon="mdi:arrow-left" className="me-4" />목록으로
          </Link>
        </div>
      </div>

      {/* [woo] 수정 모달 */}
      {showEditModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">게시물 수정</h6>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
              </div>
              <div className="modal-body p-24">
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">제목</label>
                  <input type="text" className="form-control" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label fw-semibold text-sm">내용</label>
                  <textarea className="form-control" rows={12} value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24 gap-8">
                <button type="button" className="btn btn-outline-neutral-300 radius-8" onClick={() => setShowEditModal(false)}>취소</button>
                <button type="button" className="btn btn-primary-600 radius-8" onClick={handleEdit} disabled={saving}>
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
