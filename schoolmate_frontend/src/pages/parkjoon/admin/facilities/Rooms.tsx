import { useEffect, useState } from 'react'
import AdminLayout from '../../../../components/layout/AdminLayout'
import admin from '../../../../api/adminApi'

const EMPTY = { name: '', type: '', capacity: 0, location: '', status: 'AVAILABLE' }

export default function Rooms() {
  const [rooms, setRooms] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>({ ...EMPTY })
  const [editId, setEditId] = useState<number | null>(null)

  const load = () => admin.get('/facilities').then(r => setRooms(r.data ?? []))
  useEffect(() => { load() }, [])

  const openCreate = () => { setForm({ ...EMPTY }); setEditId(null); setShowModal(true) }
  const openEdit = (r: any) => { setForm({ name: r.name, type: r.type, capacity: r.capacity, location: r.location, status: r.status }); setEditId(r.id); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editId !== null) {
      await admin.put(`/facilities/${editId}`, form)
    } else {
      await admin.post('/facilities', form)
    }
    setShowModal(false)
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 시설을 삭제하시겠습니까?')) return
    await admin.delete(`/facilities/${id}`)
    load()
  }

  return (
    <AdminLayout>
      {showModal && (
        <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editId !== null ? '시설 수정' : '시설 등록'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">시설명</label>
                      <input className="form-control" required value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">유형</label>
                      <input className="form-control" value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))} placeholder="예: 강당, 교실, 회의실" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">수용 인원</label>
                      <input type="number" className="form-control" min={0} value={form.capacity} onChange={e => setForm((f: any) => ({ ...f, capacity: Number(e.target.value) }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">위치</label>
                      <input className="form-control" value={form.location} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} placeholder="예: 본관 3층" />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-bold">상태</label>
                      <select className="form-select" value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}>
                        <option value="AVAILABLE">사용 가능</option>
                        <option value="UNAVAILABLE">사용 불가</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                  <button type="submit" className="btn btn-primary">{editId !== null ? '수정' : '등록'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">시설 관리</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg" /> 시설 등록
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">시설명</th>
                <th>유형</th>
                <th>수용 인원</th>
                <th>위치</th>
                <th>상태</th>
                <th className="text-end pe-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r: any) => (
                <tr key={r.id}>
                  <td className="ps-4 fw-bold">{r.name}</td>
                  <td>{r.type}</td>
                  <td>{r.capacity}명</td>
                  <td>{r.location}</td>
                  <td>
                    <span className={`badge ${r.status === 'AVAILABLE' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}`}>
                      {r.status === 'AVAILABLE' ? '사용 가능' : '사용 불가'}
                    </span>
                  </td>
                  <td className="text-end pe-4">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(r)}>수정</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}>삭제</button>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && <tr><td colSpan={6} className="text-center py-5 text-muted">등록된 시설이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
