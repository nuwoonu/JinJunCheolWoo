import { useEffect, useState } from 'react'
import AdminLayout from '../../../../components/layout/AdminLayout'
import admin from '../../../../api/adminApi'

// AssetStatus 실제 enum 값: AVAILABLE, IN_USE, BROKEN, LOST
const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: '사용 가능' },
  { value: 'IN_USE',    label: '대여중' },
  { value: 'BROKEN',    label: '수리중/파손' },
  { value: 'LOST',      label: '분실/폐기' },
]

const EMPTY_FORM = {
  id: null as number | null,
  modelId: '' as string | number,
  name: '',
  category: '',
  manufacturer: '',
  description: '',
  assetCode: '',
  serialNumber: '',
  location: '',
  status: 'AVAILABLE',
  purchaseDate: '',
}

export default function Assets() {
  const [page, setPage]           = useState<any>(null)
  const [models, setModels]       = useState<any[]>([])
  const [summaries, setSummaries] = useState<any[]>([])
  const [keyword, setKeyword]     = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState<any>({ ...EMPTY_FORM })

  const load = (p = 0, kw = keyword) =>
    admin.get('/resources/assets', { params: { keyword: kw || undefined, page: p, size: 15 } })
      .then(r => {
        setPage(r.data.assets)
        setSummaries(r.data.summaries ?? [])
        setModels(r.data.models ?? [])
        setCurrentPage(p)
      })

  useEffect(() => { load() }, [])

  const search = (e: React.FormEvent) => { e.preventDefault(); load(0) }

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setShowModal(true) }
  const openEdit = (a: any) => {
    setForm({
      id: a.id,
      modelId: a.modelId ?? '',
      name: a.name ?? '',
      category: a.category ?? '',
      manufacturer: a.manufacturer ?? '',
      description: '',
      assetCode: a.assetCode ?? '',
      serialNumber: a.serialNumber ?? '',
      location: a.location ?? '',
      status: a.status ?? 'AVAILABLE',
      purchaseDate: a.purchaseDate ?? '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      ...form,
      modelId: form.modelId !== '' ? Number(form.modelId) : undefined,
    }
    if (form.id !== null) {
      await admin.put('/resources/assets', payload)
    } else {
      await admin.post('/resources/assets', payload)
    }
    setShowModal(false)
    load(currentPage)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 자산을 삭제하시겠습니까?')) return
    await admin.delete(`/resources/assets/${id}`)
    load(currentPage)
  }

  const statusInfo = (s: string) =>
    STATUS_OPTIONS.find(o => o.value === s) ?? { label: s, value: s }

  const statusBadge = (s: string) => {
    if (s === 'AVAILABLE') return 'bg-success-subtle text-success border border-success-subtle'
    if (s === 'IN_USE')    return 'bg-primary-subtle text-primary border border-primary-subtle'
    if (s === 'BROKEN')    return 'bg-warning-subtle text-warning border border-warning-subtle'
    return 'bg-secondary-subtle text-secondary border border-secondary-subtle'
  }

  const list = page?.content ?? []

  return (
    <AdminLayout>
      {showModal && (
        <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{form.id !== null ? '기자재 수정' : '기자재 등록'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <h6 className="fw-bold text-primary mb-3">모델 정보</h6>
                  <div className="row g-3 mb-3">
                    <div className="col-md-12">
                      <label className="form-label fw-bold">기존 모델 선택 <span className="text-muted fw-normal">(선택 시 아래 정보 자동 적용)</span></label>
                      <select className="form-select" value={form.modelId}
                        onChange={e => {
                          const mid = e.target.value
                          const m = models.find((m: any) => String(m.id) === mid)
                          setForm((f: any) => ({
                            ...f,
                            modelId: mid,
                            name: m?.name ?? f.name,
                            category: m?.category ?? f.category,
                            manufacturer: m?.manufacturer ?? f.manufacturer,
                            description: m?.description ?? f.description,
                          }))
                        }}>
                        <option value="">신규 모델 입력</option>
                        {models.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.category})</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">모델명</label>
                      <input className="form-control" required value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">분류</label>
                      <input className="form-control" value={form.category} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))} placeholder="예: 전자기기, 가구" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">제조사</label>
                      <input className="form-control" value={form.manufacturer} onChange={e => setForm((f: any) => ({ ...f, manufacturer: e.target.value }))} />
                    </div>
                  </div>
                  <hr />
                  <h6 className="fw-bold text-primary mb-3">자산 정보</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">관리 번호</label>
                      <input className="form-control" value={form.assetCode} onChange={e => setForm((f: any) => ({ ...f, assetCode: e.target.value }))} placeholder="예: AST-2024-001" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">시리얼 번호</label>
                      <input className="form-control" value={form.serialNumber} onChange={e => setForm((f: any) => ({ ...f, serialNumber: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">상태</label>
                      <select className="form-select" value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}>
                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">보관 위치</label>
                      <input className="form-control" value={form.location} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} placeholder="예: 창고 A" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">구매일</label>
                      <input type="date" className="form-control" value={form.purchaseDate} onChange={e => setForm((f: any) => ({ ...f, purchaseDate: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                  <button type="submit" className="btn btn-primary">{form.id !== null ? '수정' : '등록'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">기자재 관리</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg" /> 기자재 등록
        </button>
      </div>

      {summaries.length > 0 && (
        <div className="row g-3 mb-4">
          {summaries.map((s: any) => (
            <div key={s.category} className="col-md-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="text-muted small">{s.category || '미분류'}</div>
                  <div className="fw-bold fs-5">{s.totalCount}개</div>
                  <div className="text-muted small">사용가능 {s.availableCount} / 대여중 {s.inUseCount} / 파손 {s.brokenCount}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                <th className="ps-4">관리 번호</th>
                <th>자산명</th>
                <th>분류</th>
                <th>시리얼 번호</th>
                <th>상태</th>
                <th>위치</th>
                <th>구매일</th>
                <th className="text-end pe-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a: any) => (
                <tr key={a.id}>
                  <td className="ps-4 text-muted small">{a.assetCode}</td>
                  <td className="fw-bold">{a.name}</td>
                  <td>{a.category}</td>
                  <td className="text-muted small">{a.serialNumber}</td>
                  <td><span className={`badge ${statusBadge(a.status)}`}>{statusInfo(a.status).label}</span></td>
                  <td>{a.location}</td>
                  <td className="text-muted small">{a.purchaseDate}</td>
                  <td className="text-end pe-4">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(a)}>수정</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(a.id)}>삭제</button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={8} className="text-center py-5 text-muted">등록된 기자재가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
        {page && page.totalPages > 1 && (
          <div className="card-footer bg-white py-3">
            <nav><ul className="pagination pagination-sm justify-content-center mb-0">
              <li className={`page-item${currentPage === 0 ? ' disabled' : ''}`}>
                <a className="page-link" href="#" onClick={e => { e.preventDefault(); load(currentPage - 1) }}>&laquo;</a>
              </li>
              {Array.from({ length: page.totalPages }, (_, i) => (
                <li key={i} className={`page-item${i === currentPage ? ' active' : ''}`}>
                  <a className="page-link" href="#" onClick={e => { e.preventDefault(); load(i) }}>{i + 1}</a>
                </li>
              ))}
              <li className={`page-item${currentPage >= page.totalPages - 1 ? ' disabled' : ''}`}>
                <a className="page-link" href="#" onClick={e => { e.preventDefault(); load(currentPage + 1) }}>&raquo;</a>
              </li>
            </ul></nav>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
