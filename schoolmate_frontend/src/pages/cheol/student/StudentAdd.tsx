import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../../api/auth'
import DashboardLayout from '../../../components/layout/DashboardLayout'

// [woo] /student/add - 학생 추가 (ADMIN 전용)

interface StudentAddForm {
  userName: string
  email: string
  password: string
  phone: string
  gender: string
  year: string
  classNum: string
}

const EMPTY_FORM: StudentAddForm = {
  userName: '', email: '', password: '', phone: '',
  gender: 'MALE', year: '', classNum: '',
}

export default function StudentAdd() {
  const navigate = useNavigate()
  const [form, setForm] = useState<StudentAddForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof StudentAddForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.userName.trim() || !form.email.trim() || !form.password.trim()) {
      setError('이름, 이메일, 비밀번호는 필수입니다.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.post('/admin/student', {
        userName: form.userName,
        email: form.email,
        password: form.password,
        phone: form.phone || null,
        gender: form.gender,
        year: form.year ? Number(form.year) : null,
        classNum: form.classNum ? Number(form.classNum) : null,
      })
      navigate('/student/list')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? '학생 추가에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학생 추가</h6>
          <p className="text-neutral-600 mt-4 mb-0">새 학생 계정을 생성합니다</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium"><Link to="/student/list">학생</Link></li>
          <li>-</li>
          <li className="fw-medium">학생 추가</li>
        </ul>
      </div>

      <div className="card radius-12" style={{ maxWidth: 640 }}>
        <div className="card-header py-16 px-24 border-bottom">
          <h6 className="mb-0">학생 정보 입력</h6>
        </div>
        <div className="card-body p-24">
          {error && (
            <div className="alert alert-danger radius-8 mb-16">{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="row gy-16">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-sm">이름 *</label>
                <input type="text" className="form-control" placeholder="홍길동" value={form.userName} onChange={set('userName')} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-sm">이메일 *</label>
                <input type="email" className="form-control" placeholder="student@school.kr" value={form.email} onChange={set('email')} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-sm">비밀번호 *</label>
                <input type="password" className="form-control" placeholder="초기 비밀번호" value={form.password} onChange={set('password')} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-sm">연락처</label>
                <input type="tel" className="form-control" placeholder="010-0000-0000" value={form.phone} onChange={set('phone')} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold text-sm">성별</label>
                <select className="form-select" value={form.gender} onChange={set('gender')}>
                  <option value="MALE">남</option>
                  <option value="FEMALE">여</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold text-sm">학년</label>
                <input type="number" className="form-control" min={1} max={6} placeholder="예: 3" value={form.year} onChange={set('year')} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold text-sm">반</label>
                <input type="number" className="form-control" min={1} max={20} placeholder="예: 2" value={form.classNum} onChange={set('classNum')} />
              </div>
            </div>

            <div className="d-flex gap-8 mt-24">
              <button type="button" className="btn btn-outline-neutral-300 radius-8" onClick={() => navigate(-1)}>
                취소
              </button>
              <button type="submit" className="btn btn-primary-600 radius-8" disabled={saving}>
                {saving ? '추가 중...' : '학생 추가'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
