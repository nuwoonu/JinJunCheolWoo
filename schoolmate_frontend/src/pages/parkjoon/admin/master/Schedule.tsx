import { useEffect, useRef, useState } from 'react'
import AdminLayout from '../../../../components/layout/AdminLayout'
import admin from '../../../../api/adminApi'

const EVENT_TYPES = ['ACADEMIC', 'HOLIDAY', 'EXAM', 'EVENT', 'VACATION']
const TYPE_LABELS: Record<string, string> = { ACADEMIC: '학사', HOLIDAY: '공휴일', EXAM: '시험', EVENT: '행사', VACATION: '방학' }
const TYPE_COLORS: Record<string, string> = {
  ACADEMIC: 'bg-primary-subtle text-primary border border-primary-subtle',
  HOLIDAY: 'bg-danger-subtle text-danger border border-danger-subtle',
  EXAM: 'bg-warning-subtle text-warning border border-warning-subtle',
  EVENT: 'bg-success-subtle text-success border border-success-subtle',
  VACATION: 'bg-info-subtle text-info border border-info-subtle',
}
const TYPE_BG: Record<string, string> = {
  ACADEMIC: '#cfe2ff', HOLIDAY: '#f8d7da', EXAM: '#fff3cd', EVENT: '#d1e7dd', VACATION: '#cff4fc',
}
const TYPE_TEXT: Record<string, string> = {
  ACADEMIC: '#084298', HOLIDAY: '#842029', EXAM: '#664d03', EVENT: '#0a3622', VACATION: '#055160',
}
const EMPTY_FORM = { title: '', eventType: 'ACADEMIC', start: '', end: '', targetGrade: '', description: '' }

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildCalendar(year: number, month: number): (Date | null)[] {
  const firstDow = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month - 1, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function eventOnDate(ev: any, date: Date) {
  const s = ev.start ? new Date(ev.start).setHours(0, 0, 0, 0) : null
  const e = ev.end ? new Date(ev.end).setHours(23, 59, 59, 999) : null
  if (!s || !e) return false
  return date.getTime() >= s && date.getTime() <= e
}

export default function Schedule() {
  const now = new Date()
  const todayStr = toDateStr(now)

  const [events, setEvents] = useState<any[]>([])
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [view, setView] = useState<'month' | 'list'>('month')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>({ ...EMPTY_FORM })
  const [editId, setEditId] = useState<number | null>(null)
  const [importing, setImporting] = useState(false)
  const csvRef = useRef<HTMLInputElement>(null)

  const load = (y = year, m = month) => {
    const start = new Date(y, m - 1, 1).toISOString()
    const end = new Date(y, m, 0, 23, 59, 59).toISOString()
    admin.get('/schedule', { params: { start, end } }).then(r => setEvents(r.data ?? []))
  }

  useEffect(() => { load() }, [])

  const goMonth = (delta: number) => {
    let nm = month + delta, ny = year
    if (nm < 1) { nm = 12; ny-- }
    if (nm > 12) { nm = 1; ny++ }
    setMonth(nm); setYear(ny); load(ny, nm)
  }

  const goToday = () => {
    const ny = now.getFullYear(), nm = now.getMonth() + 1
    setYear(ny); setMonth(nm); load(ny, nm)
  }

  const openCreate = (dateStr = '') => {
    setForm({ ...EMPTY_FORM, start: dateStr, end: dateStr })
    setEditId(null); setShowModal(true)
  }

  const openEdit = (ev: any) => {
    setForm({
      title: ev.title, eventType: ev.eventType,
      start: ev.start?.split('T')[0] ?? '',
      end: ev.end?.split('T')[0] ?? '',
      targetGrade: ev.targetGrade ?? '',
      description: ev.description ?? '',
    })
    setEditId(ev.id); setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, targetGrade: form.targetGrade || null }
    if (editId !== null) await admin.put(`/schedule/${editId}`, payload)
    else await admin.post('/schedule', payload)
    setShowModal(false); load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return
    await admin.delete(`/schedule/${id}`); load()
  }

  const exportCsv = () => {
    const rows = events.map((e: any) =>
      `${e.title},${e.eventType},${e.start?.split('T')[0]},${e.end?.split('T')[0]},${e.targetGrade ?? '전체'}`
    ).join('\n')
    const blob = new Blob([`일정명,유형,시작일,종료일,대상학년\n${rows}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `학사일정_${year}년${month}월.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const importCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      await admin.post('/schedule/import-csv', fd)
      alert('일정이 일괄 등록되었습니다.')
      load()
    } catch (err: any) {
      alert(`등록 실패: ${err.response?.data ?? err.message}`)
    } finally { setImporting(false) }
    e.target.value = ''
  }

  const cells = buildCalendar(year, month)

  return (
    <AdminLayout>
      {/* 등록/수정 모달 */}
      {showModal && (
        <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editId !== null ? '일정 수정' : '일정 등록'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-bold">제목</label>
                      <input className="form-control" required value={form.title}
                        onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">유형</label>
                      <select className="form-select" value={form.eventType}
                        onChange={e => setForm((f: any) => ({ ...f, eventType: e.target.value }))}>
                        {EVENT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">대상 학년</label>
                      <select className="form-select" value={form.targetGrade}
                        onChange={e => setForm((f: any) => ({ ...f, targetGrade: e.target.value }))}>
                        <option value="">전체</option>
                        <option value="1">1학년</option>
                        <option value="2">2학년</option>
                        <option value="3">3학년</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">시작일</label>
                      <input type="date" className="form-control" required value={form.start}
                        onChange={e => setForm((f: any) => ({ ...f, start: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">종료일</label>
                      <input type="date" className="form-control" required value={form.end}
                        onChange={e => setForm((f: any) => ({ ...f, end: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">설명</label>
                      <textarea className="form-control" rows={2} value={form.description}
                        onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  {editId !== null && (
                    <button type="button" className="btn btn-outline-danger me-auto"
                      onClick={() => { handleDelete(editId!); setShowModal(false) }}>
                      삭제
                    </button>
                  )}
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                  <button type="submit" className="btn btn-primary">{editId !== null ? '수정' : '등록'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {importing && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="text-center">
            <div className="spinner-border text-light" style={{ width: '3rem', height: '3rem' }} />
            <h5 className="text-white mt-3">일정 데이터를 등록 중입니다...</h5>
          </div>
        </div>
      )}
      <input type="file" ref={csvRef} accept=".csv" style={{ display: 'none' }} onChange={importCsv} />

      {/* 헤더 */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">🗓️ 학사 일정 관리</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={exportCsv}>
            <i className="bi bi-file-earmark-arrow-down" /> CSV 내보내기
          </button>
          <button className="btn btn-outline-success" onClick={() => csvRef.current?.click()}>
            <i className="bi bi-file-earmark-spreadsheet" /> CSV 일괄 등록
          </button>
          <button className="btn btn-primary" onClick={() => openCreate()}>
            <i className="bi bi-plus-lg" /> 일정 등록
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        {/* 네비게이션 */}
        <div className="card-header bg-white py-3">
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary btn-sm me-1" onClick={() => goMonth(-1)}>
              <i className="bi bi-chevron-left" />
            </button>
            <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => goMonth(1)}>
              <i className="bi bi-chevron-right" />
            </button>
            <button className="btn btn-outline-secondary btn-sm me-4" onClick={goToday}>today</button>
            <h5 className="mb-0 fw-bold flex-grow-1 text-center">{year}년 {month}월</h5>
            <div className="btn-group btn-group-sm">
              <button
                className={`btn btn-outline-secondary${view === 'month' ? ' active' : ''}`}
                onClick={() => setView('month')}
              >month</button>
              <button
                className={`btn btn-outline-secondary${view === 'list' ? ' active' : ''}`}
                onClick={() => setView('list')}
              >list</button>
            </div>
          </div>
        </div>

        {/* 캘린더 뷰 */}
        {view === 'month' ? (
          <div>
            {/* 요일 헤더 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #dee2e6' }}>
              {DAYS.map((d, i) => (
                <div
                  key={d}
                  className="text-center py-2 small fw-semibold"
                  style={{ color: i === 0 ? '#dc3545' : i === 6 ? '#0d6efd' : '#6c757d' }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {cells.map((date, idx) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      style={{ minHeight: 110, borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', background: '#f8f9fa' }}
                    />
                  )
                }
                const ds = toDateStr(date)
                const isToday = ds === todayStr
                const dow = date.getDay()
                const dayEvents = events.filter(ev => eventOnDate(ev, date))

                return (
                  <div
                    key={ds}
                    style={{
                      minHeight: 110,
                      borderRight: '1px solid #f0f0f0',
                      borderBottom: '1px solid #f0f0f0',
                      background: isToday ? '#fffde7' : '#fff',
                      cursor: 'pointer',
                    }}
                    onClick={() => openCreate(ds)}
                  >
                    {/* 날짜 숫자 */}
                    <div className="px-2 pt-1">
                      <a
                        href="#"
                        className="text-decoration-underline small fw-bold"
                        style={{ color: isToday ? '#212529' : dow === 0 ? '#dc3545' : dow === 6 ? '#0d6efd' : '#212529' }}
                        onClick={e => { e.preventDefault(); e.stopPropagation(); openCreate(ds) }}
                      >
                        {date.getDate()}일
                      </a>
                    </div>

                    {/* 이벤트 뱃지 */}
                    <div className="px-1 mt-1">
                      {dayEvents.slice(0, 3).map(ev => (
                        <div
                          key={ev.id}
                          className="text-truncate px-1 mb-1 rounded"
                          style={{
                            fontSize: '0.7rem',
                            background: TYPE_BG[ev.eventType] ?? '#e9ecef',
                            color: TYPE_TEXT[ev.eventType] ?? '#212529',
                            cursor: 'pointer',
                            lineHeight: '1.6',
                          }}
                          onClick={e => { e.stopPropagation(); openEdit(ev) }}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-muted px-1" style={{ fontSize: '0.7rem' }}>
                          +{dayEvents.length - 3}개 더
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* 리스트 뷰 */
          <div className="card-body p-0">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">제목</th>
                  <th>유형</th>
                  <th>시작일</th>
                  <th>종료일</th>
                  <th>대상 학년</th>
                  <th>설명</th>
                  <th className="text-end pe-4">관리</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev: any) => (
                  <tr key={ev.id}>
                    <td className="ps-4 fw-bold">{ev.title}</td>
                    <td>
                      <span className={`badge ${TYPE_COLORS[ev.eventType] ?? 'bg-secondary'}`}>
                        {TYPE_LABELS[ev.eventType] ?? ev.eventType}
                      </span>
                    </td>
                    <td>{ev.start?.split('T')[0]}</td>
                    <td>{ev.end?.split('T')[0]}</td>
                    <td>{ev.targetGrade ? `${ev.targetGrade}학년` : '전체'}</td>
                    <td className="text-muted small">{ev.description}</td>
                    <td className="text-end pe-4">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(ev)}>수정</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(ev.id)}>삭제</button>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">이 달의 일정이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
