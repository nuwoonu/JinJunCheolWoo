import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../../../components/layout/AdminLayout'
import admin from '../../../../api/adminApi'

const BASE = '/parkjoon/admin'

export default function ParentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [parent, setParent] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', statusName: '' })
  const [activeTab, setActiveTab] = useState('info')
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  const load = () =>
    admin.get(`/parents/${id}`).then(r => {
      setParent(r.data)
      const d = r.data
      setForm({ name: d.name ?? '', email: d.email ?? '', phone: d.phone ?? '', statusName: d.statusName ?? 'ACTIVE' })
    })

  useEffect(() => { load() }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await admin.put(`/parents/${id}`, form)
      alert('저장되었습니다.')
      load()
    } finally { setSaving(false) }
  }

  const removeChild = async (studentUid: string) => {
    if (!confirm('자녀 연결을 해제하시겠습니까?')) return
    await admin.delete(`/parents/${id}/children/${studentUid}`)
    load()
  }

  const searchStudents = async () => {
    if (!searchQuery.trim()) return
    const r = await admin.get('/students', { params: { keyword: searchQuery, size: 10 } })
    setSearchResults(r.data?.content ?? [])
  }

  const addChild = async (studentUid: string) => {
    await admin.post(`/parents/${id}/children`, { studentUid })
    setShowModal(false)
    setSearchQuery('')
    setSearchResults([])
    load()
  }

  if (!parent) return <AdminLayout><div className="text-center py-5"><div className="spinner-border" /></div></AdminLayout>

  const children: any[] = parent.children ?? []

  return (
    <AdminLayout>
      {showModal && (
        <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">학생 검색</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); setSearchResults([]) }} />
              </div>
              <div className="modal-body">
                <div className="input-group mb-3">
                  <input className="form-control" placeholder="학생 이름 또는 학번 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchStudents()} />
                  <button className="btn btn-primary" onClick={searchStudents}>검색</button>
                </div>
                {searchResults.length > 0 && (
                  <div className="list-group" style={{ maxHeight: 250, overflowY: 'auto' }}>
                    {searchResults.map((s: any) => (
                      <div key={s.uid} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                        <span><strong>{s.name}</strong> <small className="text-muted ms-2">{s.code}</small></span>
                        <button className="btn btn-sm btn-primary" onClick={() => addChild(s.uid)}>추가</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(`${BASE}/parents`)}>
          <i className="bi bi-arrow-left me-1" /> 목록으로 돌아가기
        </button>
      </div>

      <div className="row">
        {/* 좌측 프로필 카드 */}
        <div className="col-md-4">
          <div className="card mb-4 text-center py-4 shadow-sm border-0">
            <div className="card-body">
              <div
                className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: 100, height: 100 }}
              >
                <span className="text-success fw-bold" style={{ fontSize: 36 }}>
                  {parent.name?.[0] ?? '?'}
                </span>
              </div>
              <h5 className="mb-1 fw-bold">{parent.name}</h5>
              <p className="text-muted small mb-2">{parent.email}</p>
              <button type="button" className={`btn ${parent.statusName === 'ACTIVE' ? 'btn-success' : 'btn-secondary'} w-100 rounded-pill mb-3`} style={{ pointerEvents: 'none' }}>
                {parent.statusName === 'ACTIVE' ? '활성' : '비활성'}
              </button>
              <hr />
              <div className="text-start px-2">
                <div className="mb-2">
                  <small className="text-muted d-block">연락처</small>
                  <span className="fw-semibold">{parent.phone ?? '-'}</span>
                </div>
                <div>
                  <small className="text-muted d-block">자녀 수</small>
                  <span className="badge bg-light text-dark border">{children.length}명</span>
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
                  <button className={`nav-link${activeTab === 'children' ? ' active' : ''}`} onClick={() => setActiveTab('children')}>자녀 관리</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link${activeTab === 'noti' ? ' active' : ''}`} onClick={() => setActiveTab('noti')}>알림 이력</button>
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
                      <label className="form-label fw-bold">상태</label>
                      <select className="form-select" value={form.statusName} onChange={e => setForm(f => ({ ...f, statusName: e.target.value }))}>
                        <option value="ACTIVE">활성</option>
                        <option value="INACTIVE">비활성</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-white border-top p-4 text-end">
                  <button type="submit" className="btn btn-primary px-5" disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-2" />저장 중...</> : '정보 수정 저장'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'children' && (
              <>
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-top">
                  <h6 className="mb-0">자녀 목록 <span className="badge bg-light text-dark border ms-2">{children.length}명</span></h6>
                  <button className="btn btn-sm btn-primary" onClick={() => setShowModal(true)}>
                    <i className="bi bi-plus-lg" /> 자녀 추가
                  </button>
                </div>
                <div className="card-body p-0">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr><th className="ps-4">이름</th><th>학번</th><th>학년/반</th><th className="text-end pe-4">관리</th></tr>
                    </thead>
                    <tbody>
                      {children.map((c: any) => (
                        <tr key={c.uid}>
                          <td className="ps-4 fw-bold">{c.name}</td>
                          <td>{c.studentCode ?? c.code}</td>
                          <td>{c.grade ? `${c.grade}학년 ${c.classNum}반` : '-'}</td>
                          <td className="text-end pe-4">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeChild(c.uid)}>연결 해제</button>
                          </td>
                        </tr>
                      ))}
                      {children.length === 0 && <tr><td colSpan={4} className="text-center py-5 text-muted">연결된 자녀가 없습니다.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'noti' && (
              <div className="card-body text-center py-5 text-muted">
                <i className="bi bi-bell display-4 d-block mb-3" />
                <p>알림 이력 기능은 준비 중입니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
