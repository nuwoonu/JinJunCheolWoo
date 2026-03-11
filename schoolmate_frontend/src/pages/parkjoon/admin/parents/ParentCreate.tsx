import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../../../components/layout/AdminLayout'
import admin from '../../../../api/adminApi'

const BASE = '/parkjoon/admin'

export default function ParentCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await admin.post('/parents', form)
    navigate(`${BASE}/parents`)
  }

  return (
    <AdminLayout>
      <h2 className="mb-4">
        <span className="me-2" style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
        ✨ 신규 학부모 등록
      </h2>
      <form onSubmit={handleSubmit} className="card shadow-sm">
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">이름</label>
              <input className="form-control" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="성함 입력" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">연락처</label>
              <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="010-0000-0000" />
            </div>
            <div className="col-md-12">
              <label className="form-label fw-bold">이메일 (ID)</label>
              <input type="email" className="form-control" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="example@school.com" />
            </div>
            <div className="col-md-12">
              <label className="form-label fw-bold">초기 비밀번호</label>
              <input type="password" className="form-control" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="card-footer bg-light p-4 text-end">
          <button type="button" className="btn btn-secondary px-4 me-2" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn btn-primary px-5">등록 완료</button>
        </div>
      </form>
    </AdminLayout>
  )
}
