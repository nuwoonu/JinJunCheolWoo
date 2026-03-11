import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/auth'
import DashboardLayout from '../../../components/layout/DashboardLayout'

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

const STATUS_BADGE: Record<string, string> = {
  EMPLOYED: 'bg-success-100 text-success-600',
  LEAVE: 'bg-warning-100 text-warning-600',
  RESIGNED: 'bg-neutral-100 text-secondary-light',
}

export default function TeacherList() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)

  const fetchTeachers = (p = 0, kw = search, st = statusFilter) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), size: '15' })
    if (kw) params.set('keyword', kw)
    if (st) params.set('status', st)

    api.get(`/teacher/list?${params}`)
      .then(res => {
        setTeachers(res.data.content)
        setTotalPages(res.data.totalPages)
        setPage(res.data.currentPage)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTeachers() }, [])

  const handleSearch = () => fetchTeachers(0)

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">선생님</h6>
          <p className="text-neutral-600 mt-4 mb-0">선생님 목록</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">선생님 목록</li>
        </ul>
      </div>

      <div className="card radius-12">
        {/* 검색 영역 */}
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
            <select
              className="form-select"
              style={{ maxWidth: 140 }}
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); fetchTeachers(0, search, e.target.value) }}
            >
              <option value="">전체 상태</option>
              <option value="EMPLOYED">재직</option>
              <option value="LEAVE">휴직</option>
              <option value="RESIGNED">퇴직</option>
            </select>
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
                  <th scope="col">사번</th>
                  <th scope="col">담당 과목</th>
                  <th scope="col">부서</th>
                  <th scope="col">직책</th>
                  <th scope="col" className="text-center">상태</th>
                  <th scope="col" className="text-center">상세</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-24 text-secondary-light">불러오는 중...</td></tr>
                ) : teachers.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-24 text-secondary-light">등록된 선생님이 없습니다.</td></tr>
                ) : (
                  teachers.map(t => (
                    <tr key={t.uid}>
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <div className="w-36-px h-36-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                            <iconify-icon icon="mdi:account-tie" className="text-primary-600" />
                          </div>
                          <span className="fw-medium">{t.name}</span>
                        </div>
                      </td>
                      <td className="text-secondary-light">{t.email}</td>
                      <td>{t.code ?? '-'}</td>
                      <td>{t.subject ?? '-'}</td>
                      <td>{t.department ?? '-'}</td>
                      <td>{t.position ?? '-'}</td>
                      <td className="text-center">
                        <span className={`badge px-10 py-4 radius-4 text-xs fw-medium ${STATUS_BADGE[t.statusName ?? ''] ?? 'bg-neutral-100 text-secondary-light'}`}>
                          {t.statusDesc ?? '-'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary-600 radius-4"
                          onClick={() => setSelectedTeacher(t)}
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
            <button type="button" className="btn btn-sm btn-outline-neutral-300 radius-8" disabled={page === 0} onClick={() => fetchTeachers(page - 1)}>
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`btn btn-sm radius-8 ${i === page ? 'btn-primary-600' : 'btn-outline-neutral-300'}`}
                onClick={() => fetchTeachers(i)}
              >
                {i + 1}
              </button>
            ))}
            <button type="button" className="btn btn-sm btn-outline-neutral-300 radius-8" disabled={page >= totalPages - 1} onClick={() => fetchTeachers(page + 1)}>
              다음
            </button>
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
                  <span className={`badge px-10 py-4 radius-4 text-xs fw-medium ${STATUS_BADGE[selectedTeacher.statusName ?? ''] ?? 'bg-neutral-100 text-secondary-light'}`}>
                    {selectedTeacher.statusDesc ?? '-'}
                  </span>
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
