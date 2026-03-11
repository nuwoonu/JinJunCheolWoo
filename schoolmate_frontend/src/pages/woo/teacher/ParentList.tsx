import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/auth'
import DashboardLayout from '../../../components/layout/DashboardLayout'

// [woo] /teacher/parent/list - 학부모 목록 페이지 (Thymeleaf teacher/parent-list.html 마이그레이션)

interface Parent {
  id: number
  name: string
  code?: string
  phone?: string
  email?: string
  status?: string
  statusName?: string
  linked: boolean
  childrenStrings?: string[]
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-success-100 text-success-600',
  INACTIVE: 'bg-neutral-100 text-secondary-light',
}

export default function ParentList() {
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null)

  const fetchParents = (p = 0, kw = search) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), size: '15' })
    if (kw) params.set('keyword', kw)

    api.get(`/teacher/parents?${params}`)
      .then(res => {
        setParents(res.data.content)
        setTotalPages(res.data.totalPages)
        setPage(res.data.currentPage)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchParents() }, [])

  const handleSearch = () => fetchParents(0)

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학부모</h6>
          <p className="text-neutral-600 mt-4 mb-0">학부모 목록</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">학부모</li>
          <li>-</li>
          <li className="fw-medium">학부모 목록</li>
        </ul>
      </div>

      <div className="card radius-12">
        {/* 검색 */}
        <div className="card-header py-16 px-24 border-bottom">
          <div className="d-flex flex-wrap align-items-center gap-12">
            <input
              type="text"
              className="form-control"
              placeholder="이름 또는 이메일 검색"
              value={search}
              style={{ maxWidth: 220 }}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button type="button" className="btn btn-primary-600 radius-8" onClick={handleSearch}>
              <iconify-icon icon="ion:search-outline" className="me-4" />
              검색
            </button>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col">이름</th>
                  <th scope="col">이메일</th>
                  <th scope="col">연락처</th>
                  <th scope="col">자녀</th>
                  <th scope="col" className="text-center">연동</th>
                  <th scope="col" className="text-center">상태</th>
                  <th scope="col" className="text-center">상세</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-24 text-secondary-light">불러오는 중...</td></tr>
                ) : parents.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-24 text-secondary-light">등록된 학부모가 없습니다.</td></tr>
                ) : (
                  parents.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <div className="w-36-px h-36-px bg-success-100 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                            <iconify-icon icon="mdi:account-heart" className="text-success-600" />
                          </div>
                          <span className="fw-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="text-secondary-light">{p.email ?? '-'}</td>
                      <td className="text-secondary-light">{p.phone ?? '-'}</td>
                      <td>
                        {p.childrenStrings && p.childrenStrings.length > 0
                          ? <span className="text-sm">{p.childrenStrings.join(', ')}</span>
                          : <span className="text-secondary-light">-</span>
                        }
                      </td>
                      <td className="text-center">
                        {p.linked
                          ? <span className="badge bg-success-100 text-success-600 px-8 py-4 radius-4 text-xs">연동됨</span>
                          : <span className="badge bg-neutral-100 text-secondary-light px-8 py-4 radius-4 text-xs">미연동</span>
                        }
                      </td>
                      <td className="text-center">
                        <span className={`badge px-10 py-4 radius-4 text-xs fw-medium ${STATUS_BADGE[p.statusName ?? ''] ?? 'bg-neutral-100 text-secondary-light'}`}>
                          {p.status ?? '-'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary-600 radius-4"
                          onClick={() => setSelectedParent(p)}
                        >
                          <iconify-icon icon="mdi:eye-outline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="card-footer py-16 px-24 d-flex justify-content-center gap-4">
            <button type="button" className="btn btn-sm btn-outline-neutral-300 radius-8" disabled={page === 0} onClick={() => fetchParents(page - 1)}>
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`btn btn-sm radius-8 ${i === page ? 'btn-primary-600' : 'btn-outline-neutral-300'}`}
                onClick={() => fetchParents(i)}
              >
                {i + 1}
              </button>
            ))}
            <button type="button" className="btn btn-sm btn-outline-neutral-300 radius-8" disabled={page >= totalPages - 1} onClick={() => fetchParents(page + 1)}>
              다음
            </button>
          </div>
        )}
      </div>

      {/* [woo] 학부모 상세 모달 */}
      {selectedParent && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">학부모 정보</h6>
                <button type="button" className="btn-close" onClick={() => setSelectedParent(null)} />
              </div>
              <div className="modal-body p-24">
                <div className="text-center mb-24">
                  <div className="w-80-px h-80-px bg-success-100 rounded-circle d-flex justify-content-center align-items-center mx-auto mb-16">
                    <iconify-icon icon="mdi:account-heart" className="text-success-600 text-4xl" />
                  </div>
                  <h5 className="mb-4">{selectedParent.name}</h5>
                  <span className={`badge px-10 py-4 radius-4 text-xs fw-medium ${selectedParent.linked ? 'bg-success-100 text-success-600' : 'bg-neutral-100 text-secondary-light'}`}>
                    {selectedParent.linked ? '연동됨' : '미연동'}
                  </span>
                </div>
                <div className="d-flex flex-column gap-12">
                  {[
                    { label: '이메일', value: selectedParent.email },
                    { label: '연락처', value: selectedParent.phone },
                    { label: '학부모코드', value: selectedParent.code },
                    { label: '상태', value: selectedParent.status },
                  ].map(row => (
                    <div key={row.label} className="d-flex justify-content-between align-items-center py-10 border-bottom">
                      <span className="text-secondary-light text-sm">{row.label}</span>
                      <span className="fw-medium text-sm">{row.value ?? '-'}</span>
                    </div>
                  ))}
                  {selectedParent.childrenStrings && selectedParent.childrenStrings.length > 0 && (
                    <div className="py-10">
                      <p className="text-secondary-light text-sm mb-8">자녀 목록</p>
                      {selectedParent.childrenStrings.map((c, i) => (
                        <span key={i} className="badge bg-primary-100 text-primary-600 me-6 mb-4 px-10 py-4 radius-4">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24">
                <button type="button" className="btn btn-outline-neutral-300 radius-8" onClick={() => setSelectedParent(null)}>
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
