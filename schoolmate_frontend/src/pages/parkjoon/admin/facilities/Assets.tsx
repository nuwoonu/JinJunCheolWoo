import { useEffect, useState } from 'react'
import AdminLayout from '../../../../components/layout/AdminLayout'
import admin from '../../../../api/adminApi'

const EMPTY = { name: '', category: '', serialNumber: '', quantity: 1, status: 'NORMAL', location: '' }

export default function Assets() {
  const [page, setPage] = useState<any>(null)
  const [keyword, setKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>({ ...EMPTY })
  const [editId, setEditId] = useState<number | null>(null)

  const load = (p = 0, kw = keyword) =>
    admin.get('/assets', { params: { keyword: kw || undefined, page: p, size: 15 } })
      .then(r => { setPage(r.data); setCurrentPage(p) })

  useEffect(() => { load() }, [])

  const search = (e: React.FormEvent) => { e.preventDefault(); load(0) }

  const openCreate = () => { setForm({ ...EMPTY }); setEditId(null); setShowModal(true) }
  const openEdit = (a: any) => {
    setForm({ name: a.name, category: a.category, serialNumber: a.serialNumber, quantity: a.quantity, status: a.status, location: a.location })
    setEditId(a.id)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editId !== null) {
      await admin.put(`/assets/${editId}`, form)
    } else {
      await admin.post('/assets', form)
    }
    setShowModal(false)
    load(currentPage)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 자산을 삭제하시겠습니까?')) return
    await admin.delete(`/assets/${id}`)
    load(currentPage)
  }

  const statusBadge = (s: string) =>
    s === 'NORMAL' ? 'bg-success-subtle text-success border border-success-subtle' :
    s === 'REPAIR' ? 'bg-warning-subtle text-warning border border-warning-subtle' :
    'bg-secondary-subtle text-secondary border border-secondary-subtle'

  const statusLabel = (s: string) =>
    s === 'NORMAL' ? '정상' : s === 'REPAIR' ? '수리중' : '폐기'

  const list = page?.content ?? []

  return (
    <AdminLayout>
      {showModal && (
        <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editId !== null ? '자산 수정' : '자산 등록'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">자산명</label>
                      <input className="form-control" required value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">분류</label>
                      <input className="form-control" value={form.category} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))} placeholder="예: 전자기기, 가구" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">시리얼 번호</label>
                      <input className="form-control" value={form.serialNumber} onChange={e => setForm((f: any) => ({ ...f, serialNumber: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">수량</label>
                      <input type="number" className="form-control" min={1} value={form.quantity} onChange={e => setForm((f: any) => ({ ...f, quantity: Number(e.target.value) }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">상태</label>
                      <select className="form-select" value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}>
                        <option value="NORMAL">정상</option>
                        <option value="REPAIR">수리중</option>
                        <option value="DISPOSED">폐기</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">보관 위치</label>
                      <input className="form-control" value={form.location} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} placeholder="예: 창고 A" />
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
        <h2 className="mb-0">자산 관리</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg" /> 자산 등록
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <div className="row align-items-center">
            <div className="col"><h5 className="mb-0 text-dark">자산 목록</h5></div>
            <div className="col-auto">
              <form className="input-group input-group-sm" onSubmit={search}>
                <input className="form-control" style={{ width: 250 }} placeholder="자산명 검색..." value={keyword} onChange={e => setKeyword(e.target.value)} />
                <button className="btn btn-primary" type="submit"><i className="bi bi-search" /></button>
                <button className="btn btn-outline-secondary" type="button" onClick={() => { setKeyword(''); load(0, '') }}>초기화</button>
              </form>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">자산명</th>
                <th>분류</th>
                <th>시리얼 번호</th>
                <th>수량</th>
                <th>상태</th>
                <th>위치</th>
                <th className="text-end pe-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a: any) => (
                <tr key={a.id}>
                  <td className="ps-4 fw-bold">{a.name}</td>
                  <td>{a.category}</td>
                  <td className="text-muted small">{a.serialNumber}</td>
                  <td>{a.quantity}</td>
                  <td><span className={`badge ${statusBadge(a.status)}`}>{statusLabel(a.status)}</span></td>
                  <td>{a.location}</td>
                  <td className="text-end pe-4">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(a)}>수정</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(a.id)}>삭제</button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={7} className="text-center py-5 text-muted">등록된 자산이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
        {page && page.totalPages >= 1 && (
          <div className="card-footer bg-white py-3">
            <nav><ul className="pagination pagination-sm justify-content-center mb-0">
              <li className={`page-item${!page.hasPrevious ? ' disabled' : ''}`}>
                <a className="page-link" href="#" onClick={e => { e.preventDefault(); load(currentPage - 1) }}>&laquo;</a>
              </li>
              {Array.from({ length: page.totalPages }, (_, i) => (
                <li key={i} className={`page-item${i === currentPage ? ' active' : ''}`}>
                  <a className="page-link" href="#" onClick={e => { e.preventDefault(); load(i) }}>{i + 1}</a>
                </li>
              ))}
              <li className={`page-item${!page.hasNext ? ' disabled' : ''}`}>
                <a className="page-link" href="#" onClick={e => { e.preventDefault(); load(currentPage + 1) }}>&raquo;</a>
              </li>
            </ul></nav>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
