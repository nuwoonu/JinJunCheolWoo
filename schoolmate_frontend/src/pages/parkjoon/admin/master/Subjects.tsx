import { useEffect, useState } from 'react'
import AdminLayout from '../../../../components/layout/AdminLayout'
import admin from '../../../../api/adminApi'

const EMPTY = { originCode: '', code: '', name: '' }

export default function Subjects() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [isEdit, setIsEdit] = useState(false)

  const load = () => admin.get('/subjects').then(r => setSubjects(r.data ?? []))
  useEffect(() => { load() }, [])

  const openCreateModal = () => {
    setForm({ ...EMPTY })
    setIsEdit(false)
    setShowModal(true)
  }

  const openUpdateModal = (s: any) => {
    setForm({ originCode: s.code, code: s.code, name: s.name })
    setIsEdit(true)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      await admin.put(`/subjects`, { originCode: form.originCode, code: form.code, name: form.name })
    } else {
      await admin.post('/subjects', { code: form.code, name: form.name })
    }
    setShowModal(false)
    load()
  }

  const handleDelete = async (code: string) => {
    if (!confirm(`"${code}" 과목을 삭제하시겠습니까?`)) return
    await admin.delete(`/subjects/${code}`)
    load()
  }

  return (
    <AdminLayout>
      {showModal && (
        <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{isEdit ? '과목 수정' : '과목 등록'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {isEdit && (
                    <input type="hidden" value={form.originCode} />
                  )}
                  <div className="mb-3">
                    <label className="form-label fw-bold">과목 코드</label>
                    <input className="form-control" required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="예: MATH01" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">과목명</label>
                    <input className="form-control" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 수학" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                  <button type="submit" className="btn btn-primary">{isEdit ? '수정' : '등록'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">과목 관리</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <i className="bi bi-plus-lg" /> 과목 등록
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">과목 코드</th>
                <th>과목명</th>
                <th className="text-end pe-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s: any) => (
                <tr key={s.code}>
                  <td className="ps-4 fw-bold text-primary">{s.code}</td>
                  <td>{s.name}</td>
                  <td className="text-end pe-4">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openUpdateModal(s)}>수정</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.code)}>삭제</button>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && <tr><td colSpan={3} className="text-center py-5 text-muted">등록된 과목이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
