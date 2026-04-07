// [woo] 우리 반 알림장 위젯 — 교사/학생/학부모 대시보드 공통
// 백엔드 GET /api/board/class-diary/{classroomId} 연동

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReactQuill, QUILL_MODULES, QUILL_FORMATS, isQuillEmpty } from '@/shared/types/quillConfig'
import 'react-quill-new/dist/quill.snow.css'
import api from '@/shared/api/authApi'

interface NotebookEntry {
  id: number
  date: string
  content: string
  createDate: string
}

interface Props {
  classroomId: number | null
  studentUserUid?: number | null // [woo] 학부모용: 자녀 uid로 조회
  moreHref?: string
  canWrite?: boolean // [woo 03-27] 작성 버튼 표시 여부
}

function isNew(dateStr: string) {
  if (!dateStr) return false
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000
}

export default function ClassNotebookWidget({ classroomId, studentUserUid, moreHref, canWrite = false }: Props) {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<NotebookEntry[]>([])
  const [loading, setLoading] = useState(false)

  // [woo 03-27] 작성 모달 상태
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [writeTitle, setWriteTitle] = useState('')
  const [writeContent, setWriteContent] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchEntries = () => {
    let url: string | null = null
    if (classroomId) {
      url = `/board/class-diary/${classroomId}?page=0&size=4`
    } else if (studentUserUid) {
      url = `/board/class-diary?page=0&size=4&studentUserUid=${studentUserUid}`
    }
    if (!url) return

    setLoading(true)
    api
      .get(url)
      .then((res) => {
        const items = (res.data.content || []).map((b: any) => ({
          id: b.id,
          date: b.createDate ? b.createDate.slice(0, 10) : '',
          content: b.title,
          createDate: b.createDate ?? '',
        }))
        setEntries(items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchEntries()
  }, [classroomId, studentUserUid])

  // [woo 03-27] 모달 스크롤 제어
  useEffect(() => {
    document.body.style.overflow = showWriteModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showWriteModal])

  // [woo 03-27] 작성 모달 — 등록 처리
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
      fetchEntries()
    } catch {
      alert('알림장 작성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="card shadow-sm h-100 dash-card">
        {/* [woo] 헤더 */}
        <div className="d-flex justify-content-between align-items-center dash-card-header">
          <div className="d-flex align-items-center gap-8">
            <i className="ri-book-open-line text-primary-600" style={{ fontSize: 18 }} />
            <h6 className="fw-bold mb-0 text-sm">우리 반 알림장</h6>
          </div>
          <div className="d-flex align-items-center gap-8">
            {moreHref && (
              <a
                href={moreHref}
                className="text-primary-600 text-sm"
                style={{ lineHeight: 1 }}
                onClick={(e) => { e.preventDefault(); navigate(moreHref) }}
              >
                더보기
              </a>
            )}
            {/* [woo 03-27] 작성 버튼 — 클릭 시 모달 */}
            {canWrite && (
              <button
                type="button"
                className="text-primary-600 text-sm"
                style={{ lineHeight: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                onClick={() => setShowWriteModal(true)}
              >
                작성
              </button>
            )}
          </div>
        </div>

        {/* [woo] 목록 */}
        <div className="p-16">
          {loading ? (
            <div className="text-center text-secondary-light text-sm py-24">
              불러오는 중...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center text-secondary-light text-sm py-24">
              등록된 알림장이 없습니다.
            </div>
          ) : (
            <div className="d-flex flex-column gap-0">
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  className="d-flex align-items-center justify-content-between py-12"
                  style={{ borderBottom: i < entries.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer' }}
                  onClick={() => navigate(`/board/class-diary/${entry.id}`)}
                >
                  <div className="d-flex align-items-center gap-12">
                    <i className="ri-notification-3-line text-secondary-light" />
                    <span className="text-sm" style={{ color: '#374151' }}>{entry.content}</span>
                    {isNew(entry.createDate) && (
                      <span style={{ color: '#25A194', fontSize: 11, fontWeight: 700 }}>새글</span>
                    )}
                  </div>
                  <span className="text-xs text-secondary-light flex-shrink-0 ms-8">{entry.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* [woo 03-27] 작성 모달 — ReactQuill 에디터 */}
      {showWriteModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">
                  <i className="ri-edit-line me-8 text-primary-600" />
                  알림장 작성
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
                    onChange={(e) => setWriteTitle(e.target.value)}
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
                      placeholder="준비물, 전달사항 등을 입력하세요"
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
    </>
  )
}
