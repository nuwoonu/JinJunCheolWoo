import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../../../components/layout/AdminLayout'
import admin from '../../../../api/adminApi'
import { ADMIN_ROUTES } from '../../../../constants/routes'

// [joon] 학생 상세

export default function StudentDetail() {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()
  const [student, setStudent] = useState<any>(null)
  const [tab, setTab] = useState('basic')
  const [form, setForm] = useState<any>({})
  const [parentSearch, setParentSearch] = useState('')
  const [parentResults, setParentResults] = useState<any[]>([])
  const [showParentModal, setShowParentModal] = useState(false)
  const [relationship, setRelationship] = useState('OTHER')
  const [msg, setMsg] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = () => {
    setLoadError(null)
    admin.get(`/students/${uid}`)
      .then(r => { setStudent(r.data); setForm(r.data) })
      .catch(e => setLoadError(`[${e.response?.status ?? 'ERR'}] ${e.response?.data?.message ?? e.message}`))
  }

  useEffect(() => { load() }, [uid])

  const saveBasic = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await admin.put(`/students/${uid}/basic`, form)
      setMsg('저장되었습니다.')
      load()
    } catch (err: any) {
      setMsg(`저장 실패: ${err.response?.data ?? err.message}`)
    }
  }

  const deleteAssignment = async (schoolYear: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    await admin.delete(`/students/${uid}/assignment/${schoolYear}`)
    load()
  }

  const searchParents = async () => {
    const r = await admin.get('/students/search-parent', { params: { keyword: parentSearch } })
    setParentResults(Array.isArray(r.data) ? r.data : (r.data?.content ?? []))
  }

  const addGuardian = async (parentId: string) => {
    await admin.post(`/students/${uid}/guardian`, null, { params: { parentId, relationship } })
    setShowParentModal(false)
    setRelationship('OTHER')
    load()
  }

  const removeGuardian = async (parentId: string) => {
    if (!confirm('보호자 연동을 해제하시겠습니까?')) return
    await admin.delete(`/students/${uid}/guardian/${parentId}`)
    load()
  }

  if (!student) return (
    <AdminLayout>
      <div className="text-center py-5">
        {loadError
          ? <div className="alert alert-danger d-inline-block">{loadError}</div>
          : <div className="spinner-border" />
        }
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout msg={msg}>
      <div className="breadcrumb d-flex align-items-center gap-3 mb-24">
        <button type="button" onClick={() => navigate(ADMIN_ROUTES.STUDENTS.LIST)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#6b7280" }}>
          <i className="bi bi-arrow-left" />
        </button>
        <h6 className="fw-semibold mb-0">학생 상세 정보</h6>
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card mb-4 text-center py-4">
            <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: 100, height: 100, background: '#e0f2f1' }}>
              <span className="fs-1 text-primary fw-bold">{student.name?.[0]}</span>
            </div>
            <h4 className="fw-bold mb-1">{student.name}</h4>
            <p className="text-muted small mb-3">{student.code}</p>
            <div className="px-4">
              <span className={`badge w-100 py-2 fs-6 ${
                student.statusName === 'ENROLLED' ? 'bg-success' :
                student.statusName === 'LEAVE_OF_ABSENCE' ? 'bg-warning text-dark' :
                'bg-secondary'
              }`}>{student.statusDescription || student.statusName || '미설정'}</span>
            </div>
            <hr className="mx-4 my-4" />
            <div className="text-start px-4">
              <p className="mb-1 small text-muted">계정 이메일</p>
              <p className="fw-medium">{student.email}</p>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card">
            <div className="d-flex border-bottom border-neutral-200">
              {[['basic', '기본 정보'], ['history', '학적 이력'], ['parent', '보호자 관리']].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)}
                  style={{
                    padding: '12px 20px', border: 'none', background: 'none',
                    borderBottom: `2px solid ${tab === key ? '#25A194' : 'transparent'}`,
                    color: tab === key ? '#25A194' : '#6b7280',
                    fontWeight: tab === key ? 600 : 400, fontSize: 14, cursor: 'pointer',
                  }}>
                  {label}
                </button>
              ))}
            </div>
            <div className="card-body p-4">
              {tab === 'basic' && (
                <form onSubmit={saveBasic}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">이름</label>
                      <input className="form-control" required value={form.name ?? ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">학번</label>
                      <input className="form-control" required value={form.code ?? ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value }))} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">학적 상태</label>
                      <select className="form-select" value={form.statusName ?? ''} onChange={e => setForm((f: any) => ({ ...f, statusName: e.target.value }))}>
                        <option value="PENDING">승인대기</option>
                        <option value="ENROLLED">재학</option>
                        <option value="LEAVE_OF_ABSENCE">휴학</option>
                        <option value="GRADUATED">졸업</option>
                        <option value="DROPOUT">자퇴</option>
                        <option value="EXPELLED">제적</option>
                        <option value="TRANSFERRED">전학</option>
                      </select>
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">기초 생활 기록</label>
                      <textarea className="form-control" rows={3} value={form.basicHabits ?? ''} onChange={e => setForm((f: any) => ({ ...f, basicHabits: e.target.value }))} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">특이사항</label>
                      <textarea className="form-control" rows={3} value={form.specialNotes ?? ''} onChange={e => setForm((f: any) => ({ ...f, specialNotes: e.target.value }))} />
                    </div>
                    <div className="col-12 text-end mt-4">
                      <button type="submit" className="btn btn-primary-600 radius-8 px-4 fw-bold">정보 수정 저장</button>
                    </div>
                  </div>
                </form>
              )}

              {tab === 'history' && (
                <>
                  <h6 className="fw-bold mb-3">학년도별 학급 배정 이력</h6>
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr><th>학년도</th><th>소속 (학년-반-번호)</th><th className="text-end">관리</th></tr>
                    </thead>
                    <tbody>
                      {(student.assignments ?? []).map((a: any) => (
                        <tr key={a.schoolYear}>
                          <td className="fw-bold">{a.schoolYear}학년도</td>
                          <td>{a.grade}학년 {a.classNum}반 {a.attendanceNum}번</td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteAssignment(a.schoolYear)}>삭제</button>
                          </td>
                        </tr>
                      ))}
                      {!(student.assignments?.length) && <tr><td colSpan={3} className="text-center py-4 text-muted">등록된 이력이 없습니다.</td></tr>}
                    </tbody>
                  </table>
                </>
              )}

              {tab === 'parent' && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">연동된 보호자 목록</h6>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowParentModal(true)}>
                      <i className="bi bi-plus-lg" /> 보호자 추가
                    </button>
                  </div>
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr><th>보호자명</th><th>연락처</th><th>관계</th><th className="text-end">관리</th></tr>
                    </thead>
                    <tbody>
                      {(student.guardians ?? []).map((g: any) => (
                        <tr key={g.parentId}>
                          <td className="fw-bold">{g.name}</td>
                          <td>{g.phone}</td>
                          <td><span className="badge bg-light text-dark border">{g.relationship}</span></td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeGuardian(g.parentId)}>해제</button>
                          </td>
                        </tr>
                      ))}
                      {!(student.guardians?.length) && <tr><td colSpan={4} className="text-center py-4 text-muted">연동된 보호자가 없습니다.</td></tr>}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showParentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 480, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>보호자 검색</h6>
              <button onClick={() => setShowParentModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div className="input-group mb-3">
                <input className="form-control" placeholder="보호자 이름 입력" value={parentSearch} onChange={e => setParentSearch(e.target.value)} onKeyUp={e => e.key === 'Enter' && searchParents()} />
                <button className="btn btn-primary-600 radius-8" onClick={searchParents}>검색</button>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">관계</label>
                <select className="form-select" value={relationship} onChange={e => setRelationship(e.target.value)}>
                  <option value="FATHER">부</option>
                  <option value="MOTHER">모</option>
                  <option value="GRANDFATHER">조부</option>
                  <option value="GRANDMOTHER">조모</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>
              <div className="list-group" style={{ maxHeight: 260, overflowY: 'auto' }}>
                {parentResults.map((p: any) => (
                  <button key={p.id ?? p.uid} type="button" className="list-group-item list-group-item-action" onClick={() => addGuardian(p.id ?? p.uid)}>
                    {p.name} ({p.email})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
