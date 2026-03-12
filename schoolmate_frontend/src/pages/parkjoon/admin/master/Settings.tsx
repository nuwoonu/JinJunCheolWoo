import { useEffect, useState } from 'react'
import AdminLayout from '../../../../components/layout/AdminLayout'
import admin from '../../../../api/adminApi'

export default function Settings() {
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [semester, setSemester] = useState<string>('1')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    admin.get('/settings').then(r => {
      setYear(r.data?.currentSchoolYear ?? new Date().getFullYear())
      setSemester(String(r.data?.currentSemester ?? 1))
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await admin.post('/settings', null, { params: { year, semester } })
      alert('학사 기준 정보가 저장되었습니다.')
    } finally { setSaving(false) }
  }

  if (!loaded) return <AdminLayout><div className="text-center py-5"><div className="spinner-border" /></div></AdminLayout>

  return (
    <AdminLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">시스템 설정</h6>
          <p className="text-neutral-600 mt-4 mb-0">학사 기준 연도 및 학기를 설정합니다.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card mb-24">
        <div className="d-flex align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
          <h6 className="fw-semibold mb-0">학사 기준 정보</h6>
        </div>
        <div className="card-body p-24">
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold">현재 학년도</label>
              <input type="number" className="form-control form-control-lg" value={year} onChange={e => setYear(Number(e.target.value))} min={2000} max={2100} />
              <div className="form-text">학생 성적, 학급 등 전반적인 기준 연도로 사용됩니다.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">현재 학기</label>
              <select className="form-select form-select-lg" value={semester} onChange={e => setSemester(e.target.value)}>
                <option value="1">1학기</option>
                <option value="2">2학기</option>
              </select>
              <div className="form-text">현재 진행 중인 학기를 선택하세요.</div>
            </div>
          </div>
        </div>
        <div className="px-24 py-16 border-top border-neutral-200 text-end">
          <button type="submit" className="btn btn-primary-600 radius-8 px-5" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2" />저장 중...</> : '설정 저장'}
          </button>
        </div>
      </form>

      <div className="card" style={{ border: '1px solid #fde68a' }}>
        <div className="d-flex align-items-center px-20 py-16 border-bottom" style={{ borderColor: '#fde68a', background: '#fffbeb' }}>
          <h6 className="fw-semibold mb-0" style={{ color: '#d97706' }}>
            <i className="bi bi-exclamation-triangle-fill me-2" />
            학생 진급 처리
          </h6>
        </div>
        <div className="card-body p-24">
          <p className="text-muted mb-4">
            현재 학년도 종료 시 전체 학생의 학년을 일괄 진급 처리합니다.
            이 작업은 되돌릴 수 없으니 신중하게 실행하세요.
          </p>
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-warning radius-8"
              onClick={() => alert('현재 준비 중인 기능입니다.\n(학생 Info 엔티티 연동 필요)')}
            >
              <i className="bi bi-arrow-up-circle-fill me-2" />
              전체 학생 진급 처리
            </button>
            <span className="text-muted small">* 실행 전 반드시 데이터를 백업하세요.</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
