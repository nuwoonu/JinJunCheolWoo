import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'

// [woo] /teacher/parent/list - 학부모 목록 페이지

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

// [woo] 담임 반 학생 정보 (간편등록 모달용)
interface ClassStudent {
  studentId: number
  name: string
  studentNumber?: number
}

// [woo] 관계 옵션
const RELATIONSHIP_OPTIONS = [
  { value: 'FATHER', label: '부' },
  { value: 'MOTHER', label: '모' },
  { value: 'GRANDFATHER', label: '조부' },
  { value: 'GRANDMOTHER', label: '조모' },
  { value: 'OTHER', label: '기타' },
]

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

  // [woo] 간편등록 모달 상태
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [registerForm, setRegisterForm] = useState({
    studentInfoId: 0,
    parentName: '',
    phoneNumber: '',
    relationship: 'MOTHER',
  })
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerResult, setRegisterResult] = useState<{
    parentName: string
    loginEmail: string
    childName: string
    relationship: string
  } | null>(null)

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

  // [woo] 담임 반 학생 목록 조회
  const fetchMyClassStudents = () => {
    api.get('/teacher/myclass')
      .then(res => {
        if (res.data.students) {
          setStudents(res.data.students)
        }
      })
      .catch(() => {})
  }

  useEffect(() => { fetchParents() }, [])

  const handleSearch = () => fetchParents(0)

  // [woo] 간편등록 모달 열기
  const openRegisterModal = () => {
    fetchMyClassStudents()
    setRegisterForm({ studentInfoId: 0, parentName: '', phoneNumber: '', relationship: 'MOTHER' })
    setRegisterResult(null)
    setShowRegisterModal(true)
  }

  // [woo] 간편등록 제출
  const handleRegister = () => {
    if (!registerForm.studentInfoId) {
      alert('학생을 선택해주세요.')
      return
    }
    if (!registerForm.parentName.trim()) {
      alert('학부모 이름을 입력해주세요.')
      return
    }
    if (!registerForm.phoneNumber.trim() || registerForm.phoneNumber.replace(/[^0-9]/g, '').length < 10) {
      alert('올바른 전화번호를 입력해주세요.')
      return
    }

    setRegisterLoading(true)
    api.post('/teacher/parents/quick-register', registerForm)
      .then(res => {
        setRegisterResult(res.data)
        fetchParents() // [woo] 목록 갱신
      })
      .catch(err => {
        const msg = err.response?.data?.error || '등록에 실패했습니다.'
        alert(msg)
      })
      .finally(() => setRegisterLoading(false))
  }

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
        {/* [woo] 검색 + 간편등록 버튼 */}
        <div className="card-header py-16 px-24 border-bottom">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-12">
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
            {/* [woo] 간편등록 버튼 */}
            <button
              type="button"
              className="btn btn-success-600 radius-8 d-flex align-items-center gap-6"
              onClick={openRegisterModal}
            >
              <iconify-icon icon="mdi:account-plus" className="text-lg" />
              학부모 간편등록
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
                          {p.statusName ?? '-'}
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
                    { label: '상태', value: selectedParent.statusName },
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

      {/* [woo] 학부모 간편등록 모달 */}
      {showRegisterModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title d-flex align-items-center gap-8">
                  <iconify-icon icon="mdi:account-plus" className="text-success-600" />
                  학부모 간편등록
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowRegisterModal(false)} />
              </div>
              <div className="modal-body p-24">
                {registerResult ? (
                  /* [woo] 등록 완료 결과 표시 */
                  <div className="text-center">
                    <div className="w-80-px h-80-px bg-success-100 rounded-circle d-flex justify-content-center align-items-center mx-auto mb-16">
                      <iconify-icon icon="mdi:check-circle" className="text-success-600 text-4xl" />
                    </div>
                    <h6 className="mb-16">등록 완료!</h6>
                    <div className="bg-neutral-50 radius-8 p-16 text-start">
                      <div className="d-flex justify-content-between py-8 border-bottom">
                        <span className="text-secondary-light text-sm">학부모</span>
                        <span className="fw-medium text-sm">{registerResult.parentName}</span>
                      </div>
                      <div className="d-flex justify-content-between py-8 border-bottom">
                        <span className="text-secondary-light text-sm">자녀</span>
                        <span className="fw-medium text-sm">{registerResult.childName}</span>
                      </div>
                      <div className="d-flex justify-content-between py-8 border-bottom">
                        <span className="text-secondary-light text-sm">관계</span>
                        <span className="fw-medium text-sm">{registerResult.relationship}</span>
                      </div>
                      <div className="d-flex justify-content-between py-8 border-bottom">
                        <span className="text-secondary-light text-sm">로그인 ID</span>
                        <span className="fw-semibold text-sm text-primary-600">{registerResult.loginEmail}</span>
                      </div>
                      <div className="d-flex justify-content-between py-8">
                        <span className="text-secondary-light text-sm">초기 비밀번호</span>
                        <span className="fw-semibold text-sm text-warning-600">전화번호 뒷 4자리</span>
                      </div>
                    </div>
                    <p className="text-secondary-light text-xs mt-12">
                      학부모에게 로그인 ID와 초기 비밀번호를 안내해주세요.
                    </p>
                  </div>
                ) : (
                  /* [woo] 등록 폼 */
                  <div className="d-flex flex-column gap-16">
                    <p className="text-secondary-light text-sm mb-0">
                      학생의 학부모를 간편하게 등록합니다.<br />
                      전화번호가 로그인 ID, 뒷 4자리가 초기 비밀번호가 됩니다.
                    </p>

                    {/* [woo] 학생 선택 */}
                    <div>
                      <label className="form-label fw-medium text-sm mb-6">학생 선택 <span className="text-danger-600">*</span></label>
                      <select
                        className="form-select radius-8"
                        value={registerForm.studentInfoId}
                        onChange={e => setRegisterForm(f => ({ ...f, studentInfoId: Number(e.target.value) }))}
                      >
                        <option value={0}>-- 학생을 선택하세요 --</option>
                        {students.map(s => (
                          <option key={s.studentId} value={s.studentId}>
                            {s.studentNumber ? `${s.studentNumber}번 ` : ''}{s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* [woo] 학부모 이름 */}
                    <div>
                      <label className="form-label fw-medium text-sm mb-6">학부모 이름 <span className="text-danger-600">*</span></label>
                      <input
                        type="text"
                        className="form-control radius-8"
                        placeholder="학부모 이름 입력"
                        value={registerForm.parentName}
                        onChange={e => setRegisterForm(f => ({ ...f, parentName: e.target.value }))}
                      />
                    </div>

                    {/* [woo] 전화번호 */}
                    <div>
                      <label className="form-label fw-medium text-sm mb-6">전화번호 <span className="text-danger-600">*</span></label>
                      <input
                        type="tel"
                        className="form-control radius-8"
                        placeholder="01012345678"
                        value={registerForm.phoneNumber}
                        onChange={e => setRegisterForm(f => ({ ...f, phoneNumber: e.target.value }))}
                      />
                    </div>

                    {/* [woo] 관계 */}
                    <div>
                      <label className="form-label fw-medium text-sm mb-6">관계</label>
                      <select
                        className="form-select radius-8"
                        value={registerForm.relationship}
                        onChange={e => setRegisterForm(f => ({ ...f, relationship: e.target.value }))}
                      >
                        {RELATIONSHIP_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top py-16 px-24">
                {registerResult ? (
                  <button
                    type="button"
                    className="btn btn-primary-600 radius-8"
                    onClick={() => {
                      setRegisterResult(null)
                      setRegisterForm({ studentInfoId: 0, parentName: '', phoneNumber: '', relationship: 'MOTHER' })
                    }}
                  >
                    추가 등록
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-success-600 radius-8 d-flex align-items-center gap-6"
                    onClick={handleRegister}
                    disabled={registerLoading}
                  >
                    {registerLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" />
                        등록 중...
                      </>
                    ) : (
                      <>
                        <iconify-icon icon="mdi:check" />
                        등록하기
                      </>
                    )}
                  </button>
                )}
                <button type="button" className="btn btn-outline-neutral-300 radius-8" onClick={() => setShowRegisterModal(false)}>
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
