import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/auth'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'

// [woo] /board/parent-notice - 가정통신문 목록 (뉴스피드형 UI)

interface Board {
  id: number
  title: string
  content?: string
  writerName: string
  viewCount: number
  pinned: boolean
  createDate: string
  targetClassroomName?: string
}

// [woo] 교사 담임 학급 정보
interface MyClassInfo {
  classroomId: number
  className: string
  grade: number
  classNum: number
}

export default function ParentNotice() {
  const { user } = useAuth()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [showWriteModal, setShowWriteModal] = useState(false)
  const [writeForm, setWriteForm] = useState({ title: '', content: '', isPinned: false })
  const [saving, setSaving] = useState(false)

  // [woo] 교사일 때 담임 학급 정보 조회
  const [myClass, setMyClass] = useState<MyClassInfo | null>(null)

  const isAdmin = user?.role === 'ADMIN'
  const isTeacher = user?.role === 'TEACHER'

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showWriteModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showWriteModal])

  const fetchBoards = (p = 0) => {
    setLoading(true)
    api.get(`/board/parent-notice?page=${p}&size=10`)
      .then(res => {
        setBoards(res.data.content)
        setTotalPages(res.data.totalPages)
        setPage(res.data.currentPage)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchBoards()
    // [woo] 교사인 경우 담임 학급 정보 가져오기
    if (isTeacher) {
      api.get('/teacher/myclass')
        .then(res => {
          const d = res.data
          if (d?.classroomId) {
            setMyClass({
              classroomId: d.classroomId,
              className: d.className ?? `${d.grade}학년 ${d.classNum}반`,
              grade: d.grade,
              classNum: d.classNum,
            })
          }
        })
        .catch(() => {})
    }
  }, [])

  const handleWrite = async () => {
    if (!writeForm.title.trim() || !writeForm.content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      await api.post('/board', {
        boardType: 'PARENT_NOTICE',
        title: writeForm.title,
        content: writeForm.content,
        isPinned: writeForm.isPinned,
      })
      setShowWriteModal(false)
      setWriteForm({ title: '', content: '', isPinned: false })
      fetchBoards(0)
    } catch {
      alert('게시물 작성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // [woo] 날짜 포맷
  const formatDateFull = (dateStr: string) => {
    if (!dateStr) return { month: '', day: '', full: '' }
    const d = new Date(dateStr)
    return {
      month: `${d.getMonth() + 1}월`,
      day: `${d.getDate()}`,
      full: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
    }
  }

  return (
    <DashboardLayout>
      {/* [woo] 상단 헤더 */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h5 className="fw-bold mb-4">가정통신문</h5>
          <p className="text-secondary-light text-sm mb-0">
            {isTeacher && myClass
              ? `${myClass.className} 담임 학부모에게 전달되는 가정통신문입니다.`
              : '학교와 가정을 연결하는 소식을 전합니다.'}
          </p>
        </div>
        {(isAdmin || isTeacher) && (
          <button
            type="button"
            className="btn btn-primary-600 radius-8 d-flex align-items-center gap-6"
            onClick={() => setShowWriteModal(true)}
          >
            <i className="ri-edit-line" />
            작성
          </button>
        )}
      </div>

      {/* [woo] 교사 담임 학급 안내 배너 */}
      {isTeacher && myClass && (
        <div className="card border-0 radius-8 mb-20" style={{ background: '#f0faf8' }}>
          <div className="card-body py-12 px-20 d-flex align-items-center gap-10">
            <i className="ri-information-line text-success-600" />
            <span className="text-sm text-dark">
              <strong>{myClass.className}</strong> 학부모에게 자동 전달됩니다.
            </span>
          </div>
        </div>
      )}

      {/* [woo] 메인 콘텐츠 */}
      <div className="card border-0 radius-12 shadow-sm">
        {/* 카드 헤더 - 총 건수 */}
        <div className="card-header bg-white py-16 px-24 border-bottom d-flex align-items-center justify-content-between" style={{ borderRadius: '12px 12px 0 0' }}>
          <div className="d-flex align-items-center gap-8">
            <i className="ri-mail-send-line text-primary-600 text-lg" />
            <span className="fw-semibold text-dark">전체 통신문</span>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
          ) : boards.length === 0 ? (
            <div className="text-center py-48">
              <i className="ri-mail-line text-4xl text-neutral-300 d-block mb-12" />
              <p className="text-secondary-light mb-0">등록된 가정통신문이 없습니다.</p>
            </div>
          ) : (
            <div>
              {boards.map((board, idx) => {
                const date = formatDateFull(board.createDate)
                return (
                  <Link
                    key={board.id}
                    to={`/board/parent-notice/${board.id}`}
                    className="d-flex align-items-start gap-20 px-24 py-20 text-decoration-none"
                    style={{
                      borderBottom: idx < boards.length - 1 ? '1px solid #f1f3f5' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fa' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '' }}
                  >
                    {/* [woo] 왼쪽: 날짜 블록 */}
                    <div
                      className="text-center flex-shrink-0"
                      style={{
                        width: 52,
                        padding: '8px 0',
                        background: board.pinned ? '#fff3e0' : '#f5f7fa',
                        borderRadius: 8,
                      }}
                    >
                      <div className="text-xs fw-medium" style={{ color: board.pinned ? '#e65100' : '#868e96' }}>
                        {date.month}
                      </div>
                      <div className="fw-bold" style={{ fontSize: 20, lineHeight: 1.2, color: board.pinned ? '#e65100' : '#495057' }}>
                        {date.day}
                      </div>
                    </div>

                    {/* [woo] 가운데: 제목 + 미리보기 + 메타 */}
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-8 mb-4">
                        {board.pinned && (
                          <span className="badge text-xs px-6 py-2 rounded-pill" style={{ background: '#fff3e0', color: '#e65100' }}>
                            <i className="ri-pushpin-fill me-2" style={{ fontSize: 10 }} />고정
                          </span>
                        )}
                        {board.targetClassroomName && (
                          <span className="badge bg-primary-100 text-primary-600 text-xs px-6 py-2 rounded-pill">
                            {board.targetClassroomName}
                          </span>
                        )}
                      </div>
                      <h6
                        className="fw-semibold mb-4"
                        style={{
                          color: '#212529',
                          fontSize: 15,
                          lineHeight: 1.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {board.title}
                      </h6>
                      {board.content && (
                        <p
                          className="mb-0 text-secondary-light"
                          style={{
                            fontSize: 13,
                            lineHeight: 1.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {board.content}
                        </p>
                      )}
                    </div>

                    {/* [woo] 오른쪽: 작성자 + 조회수 */}
                    <div className="flex-shrink-0 text-end" style={{ minWidth: 80 }}>
                      <div className="text-xs text-secondary-light mb-2">{board.writerName}</div>
                      <div className="text-xs text-neutral-400">
                        <i className="ri-eye-line me-2" />{board.viewCount}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* [woo] 페이지네이션 */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center py-16 border-top">
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item${page === 0 ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => fetchBoards(page - 1)}>
                      <i className="ri-arrow-left-s-line" />
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li key={i} className={`page-item${i === page ? ' active' : ''}`}>
                      <button className="page-link" onClick={() => fetchBoards(i)}>{i + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item${page >= totalPages - 1 ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => fetchBoards(page + 1)}>
                      <i className="ri-arrow-right-s-line" />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* [woo] 작성 모달 */}
      {showWriteModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">가정통신문 작성</h6>
                <button type="button" className="btn-close" onClick={() => setShowWriteModal(false)} />
              </div>
              <div className="modal-body p-24">
                {/* [woo] 교사 담임 학급 자동 연결 안내 */}
                {isTeacher && myClass && (
                  <div className="radius-8 mb-16 py-10 px-16 d-flex align-items-center gap-8" style={{ background: '#f0faf8' }}>
                    <i className="ri-information-line text-success-600" />
                    <span className="text-sm text-dark">
                      <strong>{myClass.className}</strong> 학부모에게 자동 전달됩니다.
                    </span>
                  </div>
                )}
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">제목 *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="가정통신문 제목을 입력하세요"
                    value={writeForm.title}
                    onChange={e => setWriteForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">내용 *</label>
                  <textarea
                    className="form-control"
                    rows={12}
                    placeholder="학부모에게 전달할 내용을 입력하세요"
                    value={writeForm.content}
                    onChange={e => setWriteForm(f => ({ ...f, content: e.target.value }))}
                  />
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="pinCheck"
                    checked={writeForm.isPinned}
                    onChange={e => setWriteForm(f => ({ ...f, isPinned: e.target.checked }))}
                  />
                  <label className="form-check-label text-sm" htmlFor="pinCheck">상단 고정</label>
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24 gap-8">
                <button type="button" className="btn btn-outline-neutral-300 radius-8" onClick={() => setShowWriteModal(false)}>
                  취소
                </button>
                <button type="button" className="btn btn-primary-600 radius-8" onClick={handleWrite} disabled={saving}>
                  {saving ? '저장 중...' : '등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
