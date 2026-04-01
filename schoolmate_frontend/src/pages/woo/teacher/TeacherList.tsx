import { useEffect, useRef, useState } from 'react'
import api from '@/api/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'

// [woo] /teacher/list - 선생님 목록 페이지 (Thymeleaf teacher/teacher-list.html 마이그레이션)

interface Teacher {
  uid: number
  name: string
  email: string
  code?: string
  subject?: string
  department?: string
  position?: string
  statusDesc?: string
  statusName?: string
}

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  EMPLOYED: { bg: 'rgba(22,163,74,0.1)', color: '#16a34a' },
  LEAVE:    { bg: 'rgba(234,179,8,0.1)', color: '#ca8a04' },
  RESIGNED: { bg: '#f3f4f6',             color: '#6b7280' },
}

export default function TeacherList() {
  // [soojin] 플랜 패턴 적용: 화면 꽉 채우기 + 필터 카드 밖 + 페이지네이션 카드 밖
  const [page, setPage] = useState<any>(null)
  const [totalAll, setTotalAll] = useState<number | null>(null)
  const isInitialLoad = useRef(true)
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [keyword, setKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)

  const load = (p = 0, kw = keyword, st = status, tp = type) => {
    const params = new URLSearchParams({ page: String(p), size: '15' })
    if (kw) params.set('keyword', kw)
    if (st) params.set('status', st)
    if (tp) params.set('type', tp)

    api.get(`/teacher/list?${params}`)
      .then(res => {
        setPage(res.data)
        setCurrentPage(p)
        // [soojin] 최초 로드 시에만 전체 수 세팅 (필터 결과로 변경되지 않음)
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
    document.body.style.overflow = selectedTeacher ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedTeacher])

  const list: Teacher[] = page?.content ?? []

  return (
    <DashboardLayout>
      {/* [soojin] 화면 꽉 채우는 flex column 컨테이너 */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4.5rem - 48px)' }}>

        {/* [soojin] 제목 + 전체 인원 수 인라인 */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            선생님 목록
            <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>전체 {totalAll ?? 0}명</span>
          </h5>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>학교 교직원 목록을 조회합니다.</p>
        </div>

        {/* [soojin] 컨트롤 바: 검색/필터(좌) - 교사 뷰는 우측 버튼 없음 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
          <form
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
            onSubmit={e => { e.preventDefault(); load(0) }}
          >
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                style={{ padding: '5px 24px 5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="">모든 상태</option>
                <option value="EMPLOYED">재직</option>
                <option value="LEAVE">휴직</option>
                <option value="RESIGNED">퇴직</option>
              </select>
              <i className="ri-arrow-down-s-line" style={{ position: 'absolute', right: 4, pointerEvents: 'none', fontSize: 16, color: '#6b7280' }} />
            </div>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                style={{ padding: '5px 24px 5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
                value={type}
                onChange={e => setType(e.target.value)}
              >
                <option value="">전체</option>
                <option value="name">이름</option>
                <option value="email">이메일</option>
                <option value="dept">부서</option>
                <option value="position">직책</option>
                <option value="subject">담당 과목</option>
              </select>
              <i className="ri-arrow-down-s-line" style={{ position: 'absolute', right: 4, pointerEvents: 'none', fontSize: 16, color: '#6b7280' }} />
            </div>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 8, color: '#9ca3af', fontSize: 13, pointerEvents: 'none' }} />
              <input
                style={{ padding: '5px 8px 5px 28px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, minWidth: 160, background: '#fff' }}
                placeholder="이름 또는 이메일"
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
              onClick={() => { setStatus(''); setType(''); setKeyword(''); load(0, '', '', '') }}
            >초기화</button>
            {/* [soojin] 검색 중일 때만 필터 결과 건수 표시 */}
            {(status || type || keyword) && page && (
              <span style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600, color: '#111827' }}>{page.totalElements}명</span> / 전체 {totalAll ?? 0}명
              </span>
            )}
          </form>
        </div>

        {/* [soojin] 카드: flex:1 화면 꽉 채움 */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* [soojin] 스크롤 div: flex:1 overflowY:auto */}
          <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', minHeight: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 160 }} />
                <col style={{ width: 200 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 60 }} />
              </colgroup>
              <thead>
                <tr>
                  {['이름', '이메일', '사번', '담당 과목', '부서', '직책', '상태', '상세'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                      등록된 선생님이 없습니다.
                    </td>
                  </tr>
                ) : list.map(t => (
                  <tr key={t.uid}>
                    <td style={{ padding: '14px 16px', fontSize: 13, borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="w-36-px h-36-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                          <iconify-icon icon="mdi:account-tie" className="text-primary-600" />
                        </div>
                        <span style={{ fontWeight: 500, color: '#374151' }}>{t.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{t.code ?? '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{t.subject ?? '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{t.department ?? '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{t.position ?? '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
                      {(() => {
                        const s = STATUS_BADGE[t.statusName ?? ''] ?? { bg: '#f3f4f6', color: '#6b7280' }
                        return (
                          <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', background: s.bg, color: s.color }}>
                            {t.statusDesc ?? '-'}
                          </span>
                        )
                      })()}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', textAlign: 'center' }}>
                      <button
                        type="button"
                        style={{ padding: '4px 10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, color: '#374151', cursor: 'pointer' }}
                        onClick={() => setSelectedTeacher(t)}
                      >
                        <iconify-icon icon="mdi:eye-outline" />
                      </button>
                    </td>
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

      {/* [woo] 선생님 상세 모달 */}
      {selectedTeacher && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">선생님 정보</h6>
                <button type="button" className="btn-close" onClick={() => setSelectedTeacher(null)} />
              </div>
              <div className="modal-body p-24">
                <div className="text-center mb-24">
                  <div className="w-80-px h-80-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center mx-auto mb-16">
                    <iconify-icon icon="mdi:account-tie" className="text-primary-600 text-4xl" />
                  </div>
                  <h5 className="mb-4">{selectedTeacher.name}</h5>
                  {(() => {
                    const s = STATUS_BADGE[selectedTeacher.statusName ?? ''] ?? { bg: '#f3f4f6', color: '#6b7280' }
                    return (
                      <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
                        {selectedTeacher.statusDesc ?? '-'}
                      </span>
                    )
                  })()}
                </div>
                <div className="d-flex flex-column gap-12">
                  {[
                    { label: '이메일', value: selectedTeacher.email },
                    { label: '사번', value: selectedTeacher.code },
                    { label: '담당 과목', value: selectedTeacher.subject },
                    { label: '부서', value: selectedTeacher.department },
                    { label: '직책', value: selectedTeacher.position },
                  ].map(row => (
                    <div key={row.label} className="d-flex justify-content-between align-items-center py-10 border-bottom">
                      <span className="text-secondary-light text-sm">{row.label}</span>
                      <span className="fw-medium text-sm">{row.value ?? '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24">
                <button type="button" className="btn btn-outline-neutral-300 radius-8" onClick={() => setSelectedTeacher(null)}>
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
