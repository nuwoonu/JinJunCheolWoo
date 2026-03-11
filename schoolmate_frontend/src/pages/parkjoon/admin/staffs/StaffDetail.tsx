import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../../../components/layout/AdminLayout'
import admin from '../../../../api/adminApi'

const BASE = '/parkjoon/admin'
const DEPARTMENTS = ['행정실', '시설관리실', '급식실', '전산실', '당직실', '기타']
const EMPLOYMENT_TYPES = [
  { value: 'PERMANENT', label: '정규직' },
  { value: 'INDEFINITE_CONTRACT', label: '무기계약직' },
  { value: 'FIXED_TERM', label: '기간제/계약직' },
  { value: 'PART_TIME', label: '시간제/단기' },
]
const SYSTEM_ROLES = [
  { value: 'STAFF', label: '교직원' },
  { value: 'ADMIN', label: '관리자' },
  { value: 'FACILITY_MANAGER', label: '시설 관리자' },
  { value: 'ASSET_MANAGER', label: '기자재 관리자' },
  { value: 'LIBRARIAN', label: '사서' },
  { value: 'NURSE', label: '보건 교사' },
  { value: 'NUTRITIONIST', label: '영양사' },
]
const ROLE_LABEL: Record<string, string> = {
  TEACHER: '교사', STAFF: '교직원', ADMIN: '관리자', STUDENT: '학생', PARENT: '학부모',
  FACILITY_MANAGER: '시설 관리자', ASSET_MANAGER: '기자재 관리자',
  LIBRARIAN: '사서', NURSE: '보건 교사', NUTRITIONIST: '영양사',
}

export default function StaffDetail() {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()
  const [staff, setStaff] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', code: '', department: '', jobTitle: '',
    extensionNumber: '', statusName: '', employmentType: '', contractEndDate: ''
  })
  const [activeTab, setActiveTab] = useState('info')
  const [saving, setSaving] = useState(false)
  const [newRole, setNewRole] = useState('')

  const load = () =>
    admin.get(`/staffs/${uid}`).then(r => {
      setStaff(r.data)
      const d = r.data
      setForm({
        name: d.name ?? '', email: d.email ?? '', phone: d.phone ?? '',
        code: d.code ?? '', department: d.department ?? '', jobTitle: d.jobTitle ?? '',
        extensionNumber: d.extensionNumber ?? '', statusName: d.statusName ?? '', employmentType: d.employmentType ?? 'PERMANENT',
        contractEndDate: d.contractEndDate ?? ''
      })
    })

  useEffect(() => { load() }, [uid])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: any = { ...form }
      if (form.employmentType !== 'FIXED_TERM') delete payload.contractEndDate
      await admin.put(`/staffs/${uid}`, payload)
      alert('저장되었습니다.')
      load()
    } finally { setSaving(false) }
  }

  const addRole = async () => {
    if (!newRole.trim()) return
    await admin.post(`/staffs/${uid}/role`, null, { params: { role: newRole } })
    setNewRole('')
    load()
  }

  const removeRole = async (role: string) => {
    if (!confirm(`"${ROLE_LABEL[role] ?? role}" 권한을 제거하시겠습니까?`)) return
    await admin.delete(`/staffs/${uid}/role`, { params: { role } })
    load()
  }

  if (!staff) return <AdminLayout><div className="text-center py-5"><div className="spinner-border" /></div></AdminLayout>

  const roles: string[] = staff.roles ?? []

  const statusBtnClass = (s: string) =>
    s === 'EMPLOYED' ? 'btn-success' : s === 'LEAVE' ? 'btn-warning' : 'btn-secondary'
  const statusLabel = (s: string) =>
    s === 'EMPLOYED' ? '재직' : s === 'LEAVE' ? '휴직' : '퇴직'

  return (
    <AdminLayout>
      <div className="mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(`${BASE}/staffs`)}>
          <i className="bi bi-arrow-left me-1" /> 목록으로 돌아가기
        </button>
      </div>

      <div className="row">
        {/* 좌측 프로필 카드 */}
        <div className="col-md-4">
          <div className="card mb-4 text-center py-4 shadow-sm border-0">
            <div className="card-body">
              <div
                className="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: 100, height: 100 }}
              >
                <span className="text-secondary fw-bold" style={{ fontSize: 36 }}>
                  {staff.name?.[0] ?? '?'}
                </span>
              </div>
              <h5 className="mb-1 fw-bold">{staff.name}</h5>
              <p className="text-muted small mb-2">{staff.email}</p>
              <button type="button" className={`btn ${statusBtnClass(staff.statusName)} w-100 rounded-pill mb-3`} style={{ pointerEvents: 'none' }}>
                {statusLabel(staff.statusName)}
              </button>
              <hr />
              <div className="text-start px-2">
                <div className="mb-2">
                  <small className="text-muted d-block">사번</small>
                  <span className="fw-semibold">{staff.code ?? '-'}</span>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">부서 / 직책</small>
                  <span className="fw-semibold">{staff.department ?? '-'} / {staff.jobTitle ?? '-'}</span>
                </div>
                <div>
                  <small className="text-muted d-block">고용형태</small>
                  <span className={`badge ${staff.employmentType === 'PERMANENT' ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-info-subtle text-info border border-info-subtle'}`}>
                    {EMPLOYMENT_TYPES.find(t => t.value === staff.employmentType)?.label ?? staff.employmentType ?? '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 우측 탭 카드 */}
        <div className="col-md-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white p-0">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button className={`nav-link${activeTab === 'info' ? ' active' : ''}`} onClick={() => setActiveTab('info')}>기본 정보</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link${activeTab === 'noti' ? ' active' : ''}`} onClick={() => setActiveTab('noti')}>알림 이력</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link${activeTab === 'role' ? ' active' : ''}`} onClick={() => setActiveTab('role')}>권한 관리</button>
                </li>
              </ul>
            </div>

            {activeTab === 'info' && (
              <form onSubmit={handleSave}>
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">이름</label>
                      <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">연락처</label>
                      <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">이메일</label>
                      <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">사번</label>
                      <input className="form-control" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">상태</label>
                      <select className="form-select" value={form.statusName} onChange={e => setForm(f => ({ ...f, statusName: e.target.value }))}>
                        <option value="EMPLOYED">재직</option>
                        <option value="LEAVE">휴직</option>
                        <option value="RETIRED">퇴직</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">부서</label>
                      <select className="form-select" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                        <option value="">선택</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">직책</label>
                      <input className="form-control" value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">내선번호</label>
                      <input className="form-control" value={form.extensionNumber} onChange={e => setForm(f => ({ ...f, extensionNumber: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">고용형태</label>
                      <select className="form-select" value={form.employmentType} onChange={e => setForm(f => ({ ...f, employmentType: e.target.value }))}>
                        {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    {form.employmentType === 'FIXED_TERM' && (
                      <div className="col-md-6">
                        <label className="form-label fw-bold">계약 종료일</label>
                        <input type="date" className="form-control" value={form.contractEndDate} onChange={e => setForm(f => ({ ...f, contractEndDate: e.target.value }))} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-footer bg-white border-top p-4 text-end">
                  <button type="submit" className="btn btn-primary px-5" disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-2" />저장 중...</> : '정보 수정 저장'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'noti' && (
              <div className="card-body text-center py-5 text-muted">
                <i className="bi bi-bell display-4 d-block mb-3" />
                <p>알림 이력 기능은 준비 중입니다.</p>
              </div>
            )}

            {activeTab === 'role' && (
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3">부여된 시스템 권한</h6>
                {roles.length === 0 && <p className="text-muted">부여된 권한이 없습니다.</p>}
                <div className="d-flex flex-wrap gap-2 mb-4">
                  {roles.map(r => (
                    <span key={r} className="badge bg-primary fs-6 d-flex align-items-center gap-2 px-3 py-2">
                      {ROLE_LABEL[r] ?? r}
                      <button type="button" className="btn-close btn-close-white" style={{ fontSize: '0.6rem' }} onClick={() => removeRole(r)} />
                    </span>
                  ))}
                </div>
                <h6 className="fw-bold mb-2">권한 추가</h6>
                <div className="input-group" style={{ maxWidth: 400 }}>
                  <select className="form-select" value={newRole} onChange={e => setNewRole(e.target.value)}>
                    <option value="">권한 선택</option>
                    {SYSTEM_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <button className="btn btn-primary" type="button" onClick={addRole}>추가</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
