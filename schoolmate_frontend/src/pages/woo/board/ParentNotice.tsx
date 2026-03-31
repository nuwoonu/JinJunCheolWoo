import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReactQuill, QUILL_MODULES_TEXT, QUILL_FORMATS_TEXT, isQuillEmpty } from '@/shared/quillConfig'
import 'react-quill-new/dist/quill.snow.css'
import api from '@/api/auth'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'

// [woo] /board/parent-notice - 가정통신문 목록
// 학부모: 타임라인형 (월별 그룹 + 읽음 표시) / 교사·관리자: 기존 리스트형

interface Board {
  id: number
  title: string
  content?: string
  writerName: string
  viewCount: number
  pinned: boolean
  createDate: string
  targetClassroomName?: string
  readCount?: number
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
  const [writeFile, setWriteFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  // [woo] 교사일 때 담임 학급 정보 조회
  const [myClass, setMyClass] = useState<MyClassInfo | null>(null)

  // [woo] 교사용 읽음 현황 모달
  const [readStatusModal, setReadStatusModal] = useState<{
    boardTitle: string
    list: { uid: number; name: string; studentName: string; read: boolean }[]
  } | null>(null)
  const [readStatusLoading, setReadStatusLoading] = useState(false)

  const openReadStatus = (e: React.MouseEvent, board: Board) => {
    e.preventDefault()
    setReadStatusLoading(true)
    setReadStatusModal({ boardTitle: board.title, list: [] })
    api.get(`/board/${board.id}/read-status`)
      .then(res => setReadStatusModal({ boardTitle: board.title, list: res.data }))
      .catch(() => setReadStatusModal(null))
      .finally(() => setReadStatusLoading(false))
  }

  const isAdmin = user?.role === 'ADMIN'
  const isTeacher = user?.role === 'TEACHER'
  const isParent = user?.role === 'PARENT'

  // [woo] 읽음 상태 — 백엔드 API로 관리 (웹/앱 동기화)
  const [readIds, setReadIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!isParent) return
    api.get('/board/read-ids?type=PARENT_NOTICE')
      .then(res => setReadIds(new Set(res.data)))
      .catch(() => {})
  }, [isParent])

  const markRead = (id: number) => {
    if (readIds.has(id)) return
    api.post(`/board/${id}/read`).catch(() => {})
    setReadIds(prev => new Set([...prev, id]))
  }

  // [woo] 월별 그룹핑 (학부모 타임라인용)
  const groupedByMonth = boards.reduce<Record<string, Board[]>>((acc, board) => {
    if (!board.createDate) return acc
    const d = new Date(board.createDate)
    const key = `${d.getFullYear()}년 ${d.getMonth() + 1}월`
    if (!acc[key]) acc[key] = []
    acc[key].push(board)
    return acc
  }, {})

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = (showWriteModal || !!readStatusModal) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showWriteModal, readStatusModal])

  // [woo] 다자녀 학부모: sessionStorage에서 선택된 자녀 ID 읽기 (기존 패턴 동일)
  const selectedChildId = isParent ? sessionStorage.getItem('selectedChildId') : null

  const fetchBoards = (p = 0) => {
    setLoading(true)
    const childParam = selectedChildId ? `&studentUserUid=${selectedChildId}` : ''
    api.get(`/board/parent-notice?page=${p}&size=10${childParam}`)
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
    if (!writeForm.title.trim() || isQuillEmpty(writeForm.content)) {
      alert('제목과 내용을 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      let attachmentUrl = ''
      // [woo] 파일 첨부 시 먼저 업로드
      if (writeFile) {
        const fd = new FormData()
        fd.append('file', writeFile)
        const uploadRes = await api.post('/board/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        attachmentUrl = uploadRes.data.url
      }
      await api.post('/board', {
        boardType: 'PARENT_NOTICE',
        title: writeForm.title,
        content: writeForm.content,
        isPinned: writeForm.isPinned,
        attachmentUrl,
      })
      setShowWriteModal(false)
      setWriteForm({ title: '', content: '', isPinned: false })
      setWriteFile(null)
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

      {/* [woo] 학부모 타임라인 뷰 */}
      {isParent && (
        <div>
          {loading ? (
            <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
          ) : boards.length === 0 ? (
            <div className="text-center py-48">
              <i className="ri-mail-line text-4xl text-neutral-300 d-block mb-12" />
              <p className="text-secondary-light mb-0">등록된 가정통신문이 없습니다.</p>
            </div>
          ) : (
            Object.entries(groupedByMonth).map(([month, items]) => (
              <div key={month} className="mb-32">
                {/* 월 헤더 */}
                <div className="d-flex align-items-center gap-12 mb-16">
                  <span style={{ color: '#1a2e2c', minWidth: 90, fontSize: 17, fontWeight: 800 }}>{month}</span>
                  <div style={{ flex: 1, height: 1, background: '#e9ecef' }} />
                  <span className="text-xs text-secondary-light">{items.length}건</span>
                </div>

                {/* 카드 목록 */}
                <div className="d-flex flex-column gap-10">
                  {items.map(board => {
                    const isRead = readIds.has(board.id)
                    const isNew = !isRead && (() => {
                      const diff = Date.now() - new Date(board.createDate).getTime()
                      return diff < 7 * 24 * 60 * 60 * 1000
                    })()
                    const date = formatDateFull(board.createDate)
                    return (
                      <Link
                        key={board.id}
                        to={`/board/parent-notice/${board.id}`}
                        onClick={() => markRead(board.id)}
                        className="text-decoration-none"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 20,
                          background: isRead ? '#fff' : '#f0faf8',
                          border: `1px solid ${isRead ? '#f0f0f0' : '#c8ede8'}`,
                          borderRadius: 16,
                          padding: '20px 24px',
                          transition: 'box-shadow 0.2s, transform 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,161,148,0.13)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.transform = ''
                        }}
                      >
                        {/* 날짜 */}
                        <div className="text-center flex-shrink-0" style={{
                          width: 56, padding: '10px 0',
                          background: board.pinned ? '#fff3e0' : '#f0faf8',
                          borderRadius: 12,
                          border: `1px solid ${board.pinned ? '#ffd9b3' : '#d8f0ec'}`,
                        }}>
                          <div style={{ fontSize: 11, color: board.pinned ? '#e65100' : '#25a194', fontWeight: 700, letterSpacing: 0.3 }}>
                            {date.month}
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, color: board.pinned ? '#e65100' : '#1a2e2c' }}>
                            {date.day}
                          </div>
                        </div>

                        {/* 제목 + 뱃지 */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="d-flex align-items-center gap-6 mb-6">
                            {isNew && (
                              <span style={{
                                background: '#25a194', color: '#fff',
                                fontSize: 11, fontWeight: 700,
                                padding: '3px 9px', borderRadius: 10,
                              }}>NEW</span>
                            )}
                            {board.pinned && (
                              <span style={{
                                background: '#fff3e0', color: '#e65100',
                                fontSize: 11, fontWeight: 700,
                                padding: '3px 9px', borderRadius: 10,
                              }}>고정</span>
                            )}
                          </div>
                          <div style={{
                            fontSize: 17, fontWeight: isRead ? 500 : 700,
                            color: isRead ? '#6c757d' : '#1a2e2c',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            marginBottom: 4,
                          }}>
                            {board.title}
                          </div>
                          <div style={{ fontSize: 13, color: '#adb5bd' }}>
                            {board.writerName} · 조회 {board.viewCount}
                          </div>
                        </div>

                        {/* 읽음 표시 */}
                        <div className="flex-shrink-0">
                          {isRead
                            ? <i className="ri-check-double-line" style={{ fontSize: 22, color: '#25a194' }} />
                            : <i className="ri-arrow-right-s-line" style={{ fontSize: 22, color: '#c8ede8' }} />
                          }
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center py-16">
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
      )}

      {/* [woo] 교사/관리자 기존 리스트 뷰 */}
      {!isParent && <div className="card border-0 radius-12 shadow-sm">
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

                    {/* [woo] 오른쪽: 작성자 + 조회수 + 읽음 현황 버튼 */}
                    <div className="flex-shrink-0 text-end" style={{ minWidth: 90 }}>
                      <div className="text-xs text-secondary-light mb-4">{board.writerName}</div>
                      <div className="text-xs text-neutral-400 mb-6">
                        <i className="ri-eye-line me-2" />{board.viewCount}
                      </div>
                      {(isTeacher || isAdmin) && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ fontSize: 11, padding: '3px 8px', background: '#f0faf8', color: '#25a194', border: '1px solid #c8ede8', borderRadius: 6 }}
                          onClick={e => openReadStatus(e, board)}
                        >
                          <i className="ri-check-double-line me-1" />읽음 확인
                        </button>
                      )}
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
      </div>}

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
                  <div style={{ minHeight: 320 }}>
                    <ReactQuill
                      theme="snow"
                      value={writeForm.content}
                      onChange={(val: string) => setWriteForm(f => ({ ...f, content: val }))}
                      modules={QUILL_MODULES_TEXT}
                      formats={QUILL_FORMATS_TEXT}
                      placeholder="학부모에게 전달할 내용을 입력하세요"
                      style={{ height: 280 }}
                    />
                  </div>
                </div>
                {/* [woo] 첨부파일 */}
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">첨부파일 (PDF, DOCX)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.docx,.doc,.hwp"
                    onChange={e => setWriteFile(e.target.files?.[0] ?? null)}
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

      {/* [woo] 교사용 읽음 현황 모달 */}
      {readStatusModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 }}
          onClick={e => { if (e.target === e.currentTarget) setReadStatusModal(null) }}>
          <div className="modal-dialog modal-dialog-centered modal-md modal-dialog-scrollable">
            <div className="modal-content radius-12">
              <div className="modal-header py-16 px-24 border-bottom">
                <div>
                  <h6 className="modal-title mb-2">읽음 현황</h6>
                  <p className="text-xs text-secondary-light mb-0" style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {readStatusModal.boardTitle}
                  </p>
                </div>
                <button type="button" className="btn-close" onClick={() => setReadStatusModal(null)} />
              </div>
              <div className="modal-body p-0">
                {readStatusLoading ? (
                  <div className="text-center py-32 text-secondary-light">불러오는 중...</div>
                ) : readStatusModal.list.length === 0 ? (
                  <div className="text-center py-32 text-secondary-light">대상 학부모 정보가 없습니다.</div>
                ) : (
                  <div>
                    {/* 요약 */}
                    <div className="d-flex gap-16 px-20 py-12 border-bottom" style={{ background: '#f8f9fa' }}>
                      <span className="text-sm">
                        <i className="ri-check-double-line me-4" style={{ color: '#25a194' }} />
                        읽음 <strong style={{ color: '#25a194' }}>{readStatusModal.list.filter(r => r.read).length}명</strong>
                      </span>
                      <span className="text-sm">
                        <i className="ri-time-line me-4" style={{ color: '#adb5bd' }} />
                        미확인 <strong style={{ color: '#adb5bd' }}>{readStatusModal.list.filter(r => !r.read).length}명</strong>
                        <span style={{ color: '#ced4da', margin: '0 4px' }}>/</span>
                        총 <strong style={{ color: '#495057' }}>{readStatusModal.list.length}명</strong>
                      </span>
                    </div>
                    {/* 목록 */}
                    {readStatusModal.list.map(r => (
                      <div key={r.uid} className="d-flex align-items-center px-20 py-12 border-bottom"
                        style={{ gap: 12, borderColor: '#f1f3f5' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: r.read ? '#e8f8f5' : '#f8f9fa',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <i className={r.read ? 'ri-check-double-line' : 'ri-time-line'}
                            style={{ color: r.read ? '#25a194' : '#adb5bd', fontSize: 16 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="fw-semibold text-sm" style={{ color: '#1a2e2c' }}>{r.name}</div>
                          <div className="text-xs text-secondary-light">{r.studentName} 학부모</div>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
                          background: r.read ? '#e8f8f5' : '#f8f9fa',
                          color: r.read ? '#25a194' : '#adb5bd',
                        }}>
                          {r.read ? '읽음' : '미확인'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer py-12 px-20 border-top">
                <button className="btn btn-sm btn-outline-neutral-300 radius-8" onClick={() => setReadStatusModal(null)}>닫기</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
