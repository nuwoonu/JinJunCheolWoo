import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReactQuill, QUILL_MODULES_TEXT, QUILL_FORMATS_TEXT, isQuillEmpty } from '@/shared/types/quillConfig'
import 'react-quill-new/dist/quill.snow.css'
import api from '@/shared/api/authApi'
import { useAuth } from '@/shared/contexts/AuthContext'
import DashboardLayout from '@/shared/components/layout/DashboardLayout'

// [woo] /board/school-notice - 학교 공지 목록 (Thymeleaf woo/teacher/board/school-notice/list.html 마이그레이션)

interface Board {
  id: number
  title: string
  writerName: string
  viewCount: number
  pinned: boolean
  createDate: string
}

export default function SchoolNotice() {
  const { user } = useAuth()
  // [soojin] 플랜 패턴 적용: 화면 꽉 채우기 + 필터 카드 밖 + 페이지네이션 카드 밖
  const [page, setPage] = useState<any>(null)
  const [totalAll, setTotalAll] = useState<number | null>(null)
  const isInitialLoad = useRef(true)
  const [searchType, setSearchType] = useState('')
  const [keyword, setKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(0)

  // [woo] 글쓰기 모달 상태
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [writeForm, setWriteForm] = useState({ title: '', content: '', isPinned: false })
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === 'ADMIN'

  const load = (p = 0, kw = keyword, st = searchType) => {
    const params = new URLSearchParams({ page: String(p), size: '10' })
    if (kw) params.set('keyword', kw)
    if (st) params.set('searchType', st)

    api.get(`/board/school-notice?${params}`)
      .then(res => {
        setPage(res.data)
        setCurrentPage(p)
        // [soojin] 최초 로드 시에만 전체 건수 세팅
        if (isInitialLoad.current) {
          setTotalAll(res.data.totalElements)
          isInitialLoad.current = false
        }
      })
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showWriteModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showWriteModal])

  const handleWrite = async () => {
    if (!writeForm.title.trim() || isQuillEmpty(writeForm.content)) {
      alert('제목과 내용을 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      await api.post('/board', {
        boardType: 'SCHOOL_NOTICE',
        title: writeForm.title,
        content: writeForm.content,
        pinned: writeForm.isPinned,
      })
      setShowWriteModal(false)
      setWriteForm({ title: '', content: '', isPinned: false })
      load(0)
    } catch {
      alert('게시물 작성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const list: Board[] = page?.content ?? []

  const getRowNumber = (index: number, board: Board) => {
    if (board.pinned) return null
    return (page?.totalElements ?? 0) - currentPage * 10 - index
  }

  return (
    <DashboardLayout>
      {/* [soojin] 화면 꽉 채우는 flex column 컨테이너 */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4.5rem - 48px)' }}>

        {/* [soojin] 제목 + 전체 건수 인라인 */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            학교 공지
            <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>전체 {totalAll ?? 0}건</span>
          </h5>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>학교 전체 공지사항을 확인합니다.</p>
        </div>

        {/* [soojin] 컨트롤 바: 검색(좌) + 글쓰기(우, admin only) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
          <form
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
            onSubmit={e => { e.preventDefault(); load(0) }}
          >
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                style={{ padding: '5px 24px 5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
                value={searchType}
                onChange={e => setSearchType(e.target.value)}
              >
                <option value="">전체</option>
                <option value="writer">작성자</option>
                <option value="title">제목</option>
                <option value="content">내용</option>
                <option value="title_content">제목 + 내용</option>
              </select>
              <i className="ri-arrow-down-s-line" style={{ position: 'absolute', right: 4, pointerEvents: 'none', fontSize: 16, color: '#6b7280' }} />
            </div>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 8, color: '#9ca3af', fontSize: 13, pointerEvents: 'none' }} />
              <input
                style={{ padding: '5px 8px 5px 28px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, minWidth: 180, background: '#fff' }}
                placeholder="검색어 입력"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            <button
              style={{ padding: '5px 12px', background: '#25A194', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
              type="submit"
            >검색</button>
            <button
              style={{ padding: '5px 10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}
              type="button"
              onClick={() => { setSearchType(''); setKeyword(''); load(0, '', '') }}
            >초기화</button>
            {/* [soojin] 검색 중일 때만 필터 결과 건수 표시 */}
            {(keyword || searchType) && page && (
              <span style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600, color: '#111827' }}>{page.totalElements}건</span> / 전체 {totalAll ?? 0}건
              </span>
            )}
          </form>
          {isAdmin && (
            <button
              type="button"
              style={{ padding: '5px 12px', background: '#25A194', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setShowWriteModal(true)}
            >
              <i className="ri-edit-line" />
              글쓰기
            </button>
          )}
        </div>

        {/* [soojin] 카드: flex:1 화면 꽉 채움 */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* [soojin] 스크롤 div: flex:1 overflowY:auto */}
          <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', minHeight: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                {/* [soojin] 제목 열 auto로 인해 2·3열 간격 과다 → 퍼센트 비율로 전환해 균형 조정 */}
                <col style={{ width: '6%' }} />
                <col style={{ width: '50%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead>
                <tr>
                  {['번호', '제목', '작성자', '작성일', '조회'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                      등록된 게시물이 없습니다.
                    </td>
                  </tr>
                ) : list.map((board, i) => (
                  <tr key={board.id} style={{ background: board.pinned ? '#f0fdf4' : undefined }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
                      {board.pinned
                        ? <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>공지</span>
                        : getRowNumber(i, board)
                      }
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Link
                        to={`/board/school-notice/${board.id}`}
                        style={{ color: '#1d4ed8', fontWeight: 500, textDecoration: 'none' }}
                      >
                        {board.title}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{board.writerName}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{board.createDate?.slice(0, 10)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{board.viewCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* [soojin] 페이지네이션: 카드 밖, 우측 정렬, 28×28 정사각형 버튼 */}
        {page && page.totalPages >= 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 0', gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => load(currentPage - 1)}
              disabled={currentPage === 0}
              style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', color: currentPage === 0 ? '#d1d5db' : '#374151', fontSize: 12 }}
            >‹</button>
            {Array.from({ length: page.totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => load(i)}
                style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${i === currentPage ? '#25A194' : '#e5e7eb'}`, borderRadius: 6, background: i === currentPage ? '#25A194' : '#fff', color: i === currentPage ? '#fff' : '#374151', cursor: 'pointer', fontSize: 12, fontWeight: i === currentPage ? 600 : 400 }}
              >{i + 1}</button>
            ))}
            <button
              onClick={() => load(currentPage + 1)}
              disabled={currentPage >= page.totalPages - 1}
              style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: currentPage >= page.totalPages - 1 ? 'not-allowed' : 'pointer', color: currentPage >= page.totalPages - 1 ? '#d1d5db' : '#374151', fontSize: 12 }}
            >›</button>
          </div>
        )}
      </div>

      {/* [woo] 글쓰기 모달 (ADMIN 전용) */}
      {showWriteModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">학교 공지 작성</h6>
                <button type="button" className="btn-close" onClick={() => setShowWriteModal(false)} />
              </div>
              <div className="modal-body p-24">
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">제목 *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="제목을 입력하세요"
                    value={writeForm.title}
                    onChange={e => setWriteForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                {/* [woo] WYSIWYG 에디터 적용 */}
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">내용 *</label>
                  <div style={{ minHeight: 280 }}>
                    <ReactQuill
                      theme="snow"
                      value={writeForm.content}
                      onChange={(val: string) => setWriteForm(f => ({ ...f, content: val }))}
                      modules={QUILL_MODULES_TEXT}
                      formats={QUILL_FORMATS_TEXT}
                      placeholder="내용을 입력하세요"
                      style={{ height: 250 }}
                    />
                  </div>
                </div>
                <div className="form-check" style={{ marginTop: 30 }}>
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
                <button type="button" className="btn btn-outline-neutral-300 radius-8" onClick={() => setShowWriteModal(false)}>취소</button>
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
