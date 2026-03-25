import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '@/api/auth'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'

// [woo] /board/parent-notice/:id - 가정통신문 상세 (개선된 UI)

interface Board {
  id: number
  title: string
  content: string
  writerName: string
  writerId: number
  viewCount: number
  pinned: boolean
  createDate: string
  targetClassroomName?: string
}

export default function ParentNoticeDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === 'ADMIN'
  const isTeacher = user?.role === 'TEACHER'
  // [woo] StrictMode 이중 실행 방지 - 조회수 POST를 최초 1회만 호출
  const viewedRef = useRef(false)

  // [woo 03/25] 학부모 역할 확인
  const isParent = user?.role === 'PARENT'

  useEffect(() => {
    if (!id) return
    api.get(`/board/${id}`)
      .then(res => {
        setBoard(res.data)
        setEditForm({ title: res.data.title, content: res.data.content })
        if (!viewedRef.current) {
          viewedRef.current = true
          api.post(`/board/${id}/view`).catch(() => {})
          // [woo 03/25] 학부모: 상세 진입 시 읽음 처리 (목록 외 직접 접근 대응)
          if (isParent) {
            api.post(`/board/${id}/read`).catch(() => {})
          }
        }
      })
      .catch(() => navigate('/board/parent-notice'))
      .finally(() => setLoading(false))
  }, [id])

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showEditModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showEditModal])

  const handleEdit = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      await api.put(`/board/${id}`, {
        boardType: 'PARENT_NOTICE',
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
      navigate('/board/parent-notice')
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  // [woo] 날짜 포맷
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
      </DashboardLayout>
    )
  }

  if (!board) return null

  return (
    <DashboardLayout>
      {/* [woo] 상단 브레드크럼 */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div className="d-flex align-items-center gap-8">
          <Link
            to="/board/parent-notice"
            className="w-36-px h-36-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center text-secondary-light"
          >
            <i className="ri-arrow-left-line text-lg" />
          </Link>
          <div>
            <h5 className="fw-bold mb-0">가정통신문</h5>
          </div>
        </div>
        {/* [woo] 수정/삭제 버튼 - 교사/관리자만 */}
        {(isAdmin || isTeacher) && (
          <div className="d-flex gap-8">
            <button
              type="button"
              className="btn btn-outline-primary-600 radius-8 d-flex align-items-center gap-4"
              onClick={() => setShowEditModal(true)}
            >
              <i className="ri-edit-line" />수정
            </button>
            <button
              type="button"
              className="btn btn-outline-danger radius-8 d-flex align-items-center gap-4"
              onClick={handleDelete}
            >
              <i className="ri-delete-bin-line" />삭제
            </button>
          </div>
        )}
      </div>

      {/* [woo] 메인 콘텐츠 카드 */}
      <div className="card border-0 radius-12 shadow-sm">
        {/* 헤더 */}
        <div className="card-header bg-white py-24 px-28 border-bottom border-neutral-100" style={{ borderRadius: '12px 12px 0 0' }}>
          <div className="d-flex align-items-start gap-12 mb-16">
            {board.pinned && (
              <span className="badge bg-danger-100 text-danger-600 text-xs px-10 py-6 rounded-pill flex-shrink-0">
                <i className="ri-pushpin-line me-4" />고정
              </span>
            )}
            {board.targetClassroomName && (
              <span className="badge bg-primary-100 text-primary-600 text-xs px-10 py-6 rounded-pill flex-shrink-0">
                {board.targetClassroomName}
              </span>
            )}
          </div>
          <h4 className="fw-bold mb-16" style={{ lineHeight: 1.5 }}>{board.title}</h4>
          <div className="d-flex flex-wrap align-items-center gap-16 text-secondary-light text-sm">
            <div className="d-flex align-items-center gap-8">
              <div className="w-32-px h-32-px rounded-circle bg-primary-100 d-flex align-items-center justify-content-center">
                <i className="ri-user-line text-primary-600 text-sm" />
              </div>
              <span className="fw-medium">{board.writerName}</span>
            </div>
            <span className="d-flex align-items-center gap-4">
              <i className="ri-calendar-line" />{formatDate(board.createDate)}
            </span>
            <span className="d-flex align-items-center gap-4">
              <i className="ri-eye-line" />조회 {board.viewCount}
            </span>
          </div>
        </div>

        {/* [woo] 본문 */}
        <div className="card-body px-28 py-32">
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 2, fontSize: '15px', color: '#333' }}>
            {board.content}
          </div>
        </div>

        {/* [woo] 하단 */}
        <div className="card-footer bg-white py-16 px-28 border-top border-neutral-100" style={{ borderRadius: '0 0 12px 12px' }}>
          <Link
            to="/board/parent-notice"
            className="btn btn-outline-neutral-300 radius-8 d-flex align-items-center gap-6"
            style={{ width: 'fit-content' }}
          >
            <i className="ri-list-unordered" />
            목록으로
          </Link>
        </div>
      </div>

      {/* [woo] 수정 모달 */}
      {showEditModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">
                  <i className="ri-edit-line me-8 text-primary-600" />
                  가정통신문 수정
                </h6>
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
