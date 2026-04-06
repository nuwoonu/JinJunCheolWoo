import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReactQuill, QUILL_MODULES, QUILL_FORMATS, isQuillEmpty } from '@/shared/types/quillConfig'
import 'react-quill-new/dist/quill.snow.css'
import api from '@/shared/api/authApi'
import { useAuth } from '@/shared/contexts/AuthContext'
import DashboardLayout from '@/shared/components/layout/DashboardLayout'

// [woo] /teacher/myclass/notice - 우리반 알림장 (교사 전용, TeacherList 패턴)

interface Board {
  id: number
  title: string
  writerName: string
  viewCount: number
  createDate: string
}

interface MyClassInfo {
  classroomId: number
  className: string
}

export default function TeacherClassNotice() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState<any>(null)
  const [totalAll, setTotalAll] = useState<number | null>(null)
  const isInitialLoad = useRef(true)
  const [searchType, setSearchType] = useState('')
  const [keyword, setKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [myClass, setMyClass] = useState<MyClassInfo | null>(null)

  // [woo] 작성 모달
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [writeTitle, setWriteTitle] = useState('')
  const [writeContent, setWriteContent] = useState('')
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === 'ADMIN'
  const isTeacher = user?.role === 'TEACHER'

  const load = (p = 0, kw = keyword, st = searchType) => {
    const params = new URLSearchParams({ page: String(p), size: '10' })
    if (kw) params.set('keyword', kw)
    if (st) params.set('searchType', st)

    api.get(`/board/class-diary?${params}`)
      .then(res => {
        setPage(res.data)
        setCurrentPage(res.data.currentPage ?? p)
        if (isInitialLoad.current) {
          setTotalAll(res.data.totalElements)
          isInitialLoad.current = false
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    load()
    if (isTeacher || isAdmin) {
      api.get('/teacher/myclass')
        .then(res => {
          const d = res.data
          if (d?.classroomId) {
            setMyClass({
              classroomId: d.classroomId,
              className: d.className ?? `${d.grade}학년 ${d.classNum}반`,
            })
          }
        })
        .catch(() => {})
    }
  }, [])

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showWriteModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showWriteModal])

  const handleWrite = async () => {
    if (!writeTitle.trim()) {
      alert('제목을 입력해주세요.')
      return
    }
    if (isQuillEmpty(writeContent)) {
      alert('내용을 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      await api.post('/board', {
        boardType: 'CLASS_DIARY',
        title: writeTitle,
        content: writeContent,
      })
      setShowWriteModal(false)
      setWriteTitle('')
      setWriteContent('')
      load(0)
    } catch {
      alert('알림장 작성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const list: Board[] = page?.content ?? []

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try { return dateStr.slice(0, 10).replace(/-/g, '.') } catch { return dateStr }
  }

  const getRowNumber = (index: number) =>
    (page?.totalElements ?? 0) - currentPage * 10 - index

  return (
    <DashboardLayout>
      {/* [woo] 화면 꽉 채우는 flex column 컨테이너 */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4.5rem - 48px)' }}>

        {/* [woo] 제목 + 전체 건수 인라인 */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            우리반 알림장
            <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>전체 {totalAll ?? 0}건</span>
          </h5>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            {myClass
              ? `${myClass.className} 학생 및 학부모에게 전달되는 알림장입니다.`
              : '학생 및 학부모에게 전달되는 알림장입니다.'}
          </p>
        </div>

        {/* [woo] 컨트롤 바: 검색(좌) + 작성 버튼(우) */}
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
                <option value="title">제목</option>
                <option value="content">내용</option>
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
            {/* [woo] 검색 중일 때만 필터 결과 건수 표시 */}
            {(keyword || searchType) && page && (
              <span style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600, color: '#111827' }}>{page.totalElements}건</span> / 전체 {totalAll ?? 0}건
              </span>
            )}
          </form>
          {(isAdmin || isTeacher) && (
            <button
              type="button"
              style={{ padding: '5px 12px', background: '#25A194', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setShowWriteModal(true)}
            >
              <i className="ri-edit-line" />
              작성
            </button>
          )}
        </div>

        {/* [woo] 카드: flex:1 화면 꽉 채움 */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', minHeight: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '6%' }} />
                <col style={{ width: '54%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '14%' }} />
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
                      등록된 알림장이 없습니다.
                    </td>
                  </tr>
                ) : list.map((board, i) => {
                  const isNew = Date.now() - new Date(board.createDate).getTime() < 24 * 60 * 60 * 1000
                  return (
                    <tr
                      key={board.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/teacher/myclass/notice/${board.id}`)}
                    >
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
                        {getRowNumber(i)}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#1d4ed8', fontWeight: 500 }}>{board.title}</span>
                        {/* [soojin] 새글 표시 - 가정통신문 위젯과 동일한 스타일로 통일 */}
                        {isNew && (
                          <span style={{ color: '#25A194', fontSize: 11, fontWeight: 700, marginLeft: 6 }}>새글</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{board.writerName}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formatDate(board.createDate)}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{board.viewCount}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* [woo] 페이지네이션: 카드 밖, 우측 정렬 */}
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

      {/* [woo] 작성 모달 — ReactQuill 에디터 */}
      {showWriteModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">
                  <i className="ri-edit-line me-8 text-primary-600" />
                  알림장 작성
                  {myClass && (
                    <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>— {myClass.className}</span>
                  )}
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowWriteModal(false)} />
              </div>
              <div className="modal-body p-24">
                <div className="mb-16">
                  <label className="form-label fw-semibold text-sm">제목 *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="알림장 제목을 입력하세요"
                    value={writeTitle}
                    onChange={e => setWriteTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label fw-semibold text-sm">내용 *</label>
                  <div style={{ minHeight: 280 }}>
                    <ReactQuill
                      theme="snow"
                      value={writeContent}
                      onChange={setWriteContent}
                      modules={QUILL_MODULES}
                      formats={QUILL_FORMATS}
                      placeholder="준비물, 전달사항, 숙제 등을 입력하세요"
                      style={{ height: 250 }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24 gap-8">
                <button
                  type="button"
                  className="btn btn-outline-neutral-300 radius-8"
                  onClick={() => setShowWriteModal(false)}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="btn btn-primary-600 radius-8 d-flex align-items-center gap-6"
                  onClick={handleWrite}
                  disabled={saving}
                >
                  {saving ? '저장 중...' : (
                    <>
                      <i className="ri-check-line" />
                      등록
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
