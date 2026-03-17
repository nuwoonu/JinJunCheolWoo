import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'

// [woo] /teacher/myclass/students - 학생 관리 페이지 (Thymeleaf teacher/myclass/students.html 마이그레이션)

interface Student {
  studentId: number
  name: string
  studentNumber: number
  phone?: string
  email?: string
}

interface ClassInfo {
  year: number
  grade: number
  classNum: number
  homeroomTeacherName?: string
  totalStudents: number
  students: Student[]
}

const EMPTY_ADD_FORM = {
  name: '', email: '', password: '', phone: '',
  gender: 'MALE', studentNumber: '', birthDate: '',
}

export default function TeacherMyClassStudents() {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSaving, setAddSaving] = useState(false)

  useEffect(() => {
    api.get('/teacher/myclass')
      .then(res => {
        const data = res.data
        if (data.hasClassroom === false) {
          setErrorMessage(data.message ?? '담당 학급이 없습니다.')
        } else {
          setClassInfo(data)
        }
      })
      .catch(() => setErrorMessage('학급 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = classInfo?.students.filter(s =>
    s.name.includes(search) || String(s.studentNumber).includes(search)
  ) ?? []

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddForm(f => ({ ...f, [field]: e.target.value }))

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 3 && digits.length <= 7) formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`
    else if (digits.length > 7) formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    setAddForm(f => ({ ...f, phone: formatted }))
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classInfo) return
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim() || !addForm.studentNumber) {
      setAddError('이름, 이메일, 비밀번호, 출석번호는 필수입니다.')
      return
    }
    setAddSaving(true)
    setAddError(null)
    try {
      await api.post('/students', {
        name: addForm.name,
        email: addForm.email,
        password: addForm.password,
        phone: addForm.phone || null,
        gender: addForm.gender,
        studentNumber: Number(addForm.studentNumber),
        birthDate: addForm.birthDate || null,
        // [woo] 본인 학급만 - grade/classNum 고정
        grade: classInfo.grade,
        classNum: classInfo.classNum,
      })
      // 목록 갱신
      const res = await api.get('/teacher/myclass')
      setClassInfo(res.data)
      setShowAddModal(false)
      setAddForm(EMPTY_ADD_FORM)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setAddError(msg ?? '학생 추가에 실패했습니다.')
    } finally {
      setAddSaving(false)
    }
  }

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">나의 학급</h6>
          <p className="text-neutral-600 mt-4 mb-0">학생 관리</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium"><Link to="/teacher/myclass" className="hover-text-primary">나의 학급</Link></li>
          <li>-</li>
          <li className="fw-medium">학생 관리</li>
        </ul>
      </div>

      {loading && <div className="text-center py-48 text-secondary-light">불러오는 중...</div>}

      {/* 학급 없음 */}
      {!loading && errorMessage && (
        <div className="card">
          <div className="card-body text-center py-48">
            <iconify-icon icon="mdi:account-group-outline" className="text-neutral-400 mb-16" style={{ fontSize: 64 }} />
            <h5 className="text-neutral-600 mb-8">담당 학급이 없습니다</h5>
            <p className="text-neutral-500 mb-0">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 학급 헤더 */}
      {!loading && classInfo && (
        <>
          <div className="card radius-12 mb-24">
            <div className="card-body p-20">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-16">
                <div className="d-flex align-items-center gap-16">
                  <div className="w-48-px h-48-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center">
                    <iconify-icon icon="mdi:google-classroom" className="text-primary-600 text-2xl" />
                  </div>
                  <div>
                    <h6 className="mb-0">
                      {classInfo.year}학년도 {classInfo.grade}학년 {classInfo.classNum}반
                    </h6>
                    <span className="text-secondary-light text-sm">
                      담임: {classInfo.homeroomTeacherName ?? '-'} | 총 {classInfo.totalStudents}명
                    </span>
                  </div>
                </div>
                <Link to="/teacher/myclass" className="btn btn-outline-neutral-300 radius-8">
                  <iconify-icon icon="mdi:arrow-left" className="me-4" />
                  학급 현황
                </Link>
              </div>
            </div>
          </div>

          {/* 학생 목록 */}
          <div className="card radius-12">
            <div className="card-header d-flex justify-content-between align-items-center py-16 px-24 border-bottom">
              <h6 className="mb-0">학생 목록</h6>
              <div className="d-flex gap-8 align-items-center">
                <input
                  type="text"
                  className="form-control w-auto"
                  placeholder="이름 또는 번호 검색"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ maxWidth: 200 }}
                />
                <button
                  type="button"
                  className="btn btn-primary-600 radius-8 d-flex align-items-center gap-6"
                  onClick={() => { setShowAddModal(true); setAddError(null); setAddForm(EMPTY_ADD_FORM) }}
                >
                  <i className="ri-user-add-line" /> 학생 추가
                </button>
              </div>
            </div>
            <div className="card-body p-24">
              <div className="table-responsive">
                <table className="table bordered-table mb-0">
                  <thead>
                    <tr>
                      <th scope="col" className="text-center" style={{ width: 80 }}>번호</th>
                      <th scope="col">이름</th>
                      <th scope="col">연락처</th>
                      <th scope="col">이메일</th>
                      <th scope="col" className="text-center" style={{ width: 120 }}>상세</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-24 text-secondary-light">등록된 학생이 없습니다.</td></tr>
                    ) : (
                      filtered.map(s => (
                        <tr key={s.studentId}>
                          <td className="text-center">{s.studentNumber}</td>
                          <td>
                            <div className="d-flex align-items-center gap-12">
                              <div className="w-40-px h-40-px bg-neutral-100 rounded-circle d-flex justify-content-center align-items-center">
                                <iconify-icon icon="mdi:account" className="text-neutral-500 text-xl" />
                              </div>
                              <span className="fw-medium">{s.name}</span>
                            </div>
                          </td>
                          <td>{s.phone ?? '-'}</td>
                          <td>{s.email ?? '-'}</td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary-600 radius-4"
                              onClick={() => setSelectedStudent(s)}
                            >
                              <iconify-icon icon="mdi:eye-outline" />
                              보기
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* [woo] 학생 추가 모달 - 본인 학급 고정 */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">
                  학생 추가 — {classInfo?.grade}학년 {classInfo?.classNum}반
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
              </div>
              <form onSubmit={handleAddStudent}>
                <div className="modal-body p-24">
                  {addError && <div className="alert alert-danger radius-8 mb-16 text-sm">{addError}</div>}
                  <div className="row gy-16">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-sm">이름 *</label>
                      <input type="text" className="form-control" placeholder="홍길동" value={addForm.name} onChange={setField('name')} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-sm">반번호 *</label>
                      <input type="number" className="form-control" min={1} placeholder="예: 5" value={addForm.studentNumber} onChange={setField('studentNumber')} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold text-sm">이메일 *</label>
                      <input type="email" className="form-control" placeholder="student@gmail.com" value={addForm.email} onChange={setField('email')} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold text-sm">초기 비밀번호 *</label>
                      <input type="password" className="form-control" placeholder="초기 비밀번호" value={addForm.password} onChange={setField('password')} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-sm">연락처</label>
                      <input type="tel" className="form-control" placeholder="010-0000-0000" value={addForm.phone} onChange={handlePhoneInput} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-sm">성별</label>
                      <select className="form-select" value={addForm.gender} onChange={setField('gender')}>
                        <option value="MALE">남</option>
                        <option value="FEMALE">여</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold text-sm">생년월일</label>
                      <input type="date" className="form-control" value={addForm.birthDate} onChange={setField('birthDate')} />
                    </div>
                    <div className="col-12">
                      <div className="p-12 bg-neutral-50 radius-8 text-xs text-secondary-light">
                        <i className="ri-information-line me-4" />
                        학급: {classInfo?.grade}학년 {classInfo?.classNum}반 (자동 배정)
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top py-16 px-24 gap-8">
                  <button type="button" className="btn btn-outline-neutral-300 radius-8" onClick={() => setShowAddModal(false)}>취소</button>
                  <button type="submit" className="btn btn-primary-600 radius-8" disabled={addSaving}>
                    {addSaving ? '추가 중...' : '학생 추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* [woo] 학생 상세 모달 - React state로 제어 (Bootstrap JS 불필요) */}
      {selectedStudent && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">학생 정보</h6>
                <button type="button" className="btn-close" onClick={() => setSelectedStudent(null)} />
              </div>
              <div className="modal-body p-24">
                <div className="text-center mb-24">
                  <div className="w-80-px h-80-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center mx-auto mb-16">
                    <iconify-icon icon="mdi:account" className="text-primary-600 text-4xl" />
                  </div>
                  <h5 className="mb-4">{selectedStudent.name}</h5>
                  <span className="text-secondary-light">{selectedStudent.studentNumber}번</span>
                </div>
                <div className="d-flex flex-column gap-16">
                  <div className="d-flex justify-content-between align-items-center py-12 border-bottom">
                    <span className="text-secondary-light">
                      <iconify-icon icon="mdi:phone" className="me-8" />
                      연락처
                    </span>
                    <span className="fw-medium">{selectedStudent.phone ?? '-'}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-12 border-bottom">
                    <span className="text-secondary-light">
                      <iconify-icon icon="mdi:email" className="me-8" />
                      이메일
                    </span>
                    <span className="fw-medium">{selectedStudent.email ?? '-'}</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24">
                <button type="button" className="btn btn-outline-neutral-300 radius-8" onClick={() => setSelectedStudent(null)}>
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
