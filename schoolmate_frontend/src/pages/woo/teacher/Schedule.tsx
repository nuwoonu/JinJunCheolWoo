import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'

// [woo] /teacher/schedule - 수업 일정 페이지
// API: GET /api/teacher/schedule, POST /api/teacher/schedule, PUT /api/teacher/schedule/{id}, DELETE /api/teacher/schedule/{id}

const DAY_LABELS: Record<string, string> = {
  MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수', THURSDAY: '목', FRIDAY: '금',
  SATURDAY: '토', SUNDAY: '일',
}

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

// @ts-ignore [woo] 반복 유형 라벨 - 추후 사용 예정
const REPEAT_LABELS: Record<string, string> = {
  WEEKLY: '매주', ONCE: '1회', BIWEEKLY: '2주마다',
}

interface Schedule {
  id: number
  dayOfWeek: string
  dayOfWeekDescription: string
  period?: number
  startTime?: string
  endTime?: string
  subjectName?: string
  className?: string
  location?: string
  repeatType: string
  repeatTypeDescription: string
  specificDate?: string
  memo?: string
}

interface FormData {
  dayOfWeek: string
  period: string
  startTime: string
  endTime: string
  subjectName: string
  className: string
  location: string
  repeatType: string
  specificDate: string
  memo: string
}

const EMPTY_FORM: FormData = {
  dayOfWeek: 'MONDAY', period: '', startTime: '', endTime: '',
  subjectName: '', className: '', location: '',
  repeatType: 'WEEKLY', specificDate: '', memo: '',
}

export default function TeacherSchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Schedule | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchSchedules = () => {
    api.get('/teacher/schedule')
      .then(res => setSchedules(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSchedules() }, [])

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showModal])

  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (s: Schedule) => {
    setEditTarget(s)
    setForm({
      dayOfWeek: s.dayOfWeek,
      period: s.period != null ? String(s.period) : '',
      startTime: s.startTime ?? '',
      endTime: s.endTime ?? '',
      subjectName: s.subjectName ?? '',
      className: s.className ?? '',
      location: s.location ?? '',
      repeatType: s.repeatType,
      specificDate: s.specificDate ?? '',
      memo: s.memo ?? '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      dayOfWeek: form.dayOfWeek,
      period: form.period ? Number(form.period) : null,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      subjectName: form.subjectName || null,
      className: form.className || null,
      location: form.location || null,
      repeatType: form.repeatType,
      specificDate: form.specificDate || null,
      memo: form.memo || null,
    }
    try {
      if (editTarget) {
        await api.put(`/teacher/schedule/${editTarget.id}`, payload)
      } else {
        await api.post('/teacher/schedule', payload)
      }
      setShowModal(false)
      fetchSchedules()
    } catch {
      // [woo] 에러 발생 시 모달 유지
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('일정을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/teacher/schedule/${id}`)
      fetchSchedules()
    } catch {}
  }

  // [woo] 요일별로 그룹핑 후 교시 순 정렬
  const byDay = DAY_ORDER.reduce<Record<string, Schedule[]>>((acc, day) => {
    acc[day] = schedules
      .filter(s => s.dayOfWeek === day)
      .sort((a, b) => (a.period ?? 99) - (b.period ?? 99))
    return acc
  }, {})

  const activeDays = DAY_ORDER.filter(d => byDay[d].length > 0)

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">수업 일정</h6>
          <p className="text-neutral-600 mt-4 mb-0">나의 수업 시간표</p>
        </div>
        <div className="d-flex align-items-center gap-8">
          <ul className="d-flex align-items-center gap-2 me-12">
            <li className="fw-medium">
              <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
                <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
                홈
              </Link>
            </li>
            <li>-</li>
            <li className="fw-medium">수업 일정</li>
          </ul>
          <button type="button" className="btn btn-primary-600 radius-8" onClick={openAdd}>
            <iconify-icon icon="mdi:plus" className="me-4" />
            일정 추가
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-48 text-secondary-light">불러오는 중...</div>}

      {!loading && schedules.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-48">
            <iconify-icon icon="mdi:calendar-blank-outline" className="text-neutral-400 mb-16" style={{ fontSize: 64 }} />
            <h5 className="text-neutral-600 mb-8">등록된 수업 일정이 없습니다</h5>
            <button type="button" className="btn btn-primary-600 radius-8 mt-8" onClick={openAdd}>
              첫 일정 추가하기
            </button>
          </div>
        </div>
      )}

      {/* [woo] 요일별 카드 그리드 */}
      {!loading && activeDays.length > 0 && (
        <div className="row gy-4">
          {activeDays.map(day => (
            <div key={day} className="col-xl-4 col-lg-6">
              <div className="card radius-12 h-100">
                <div className="card-header py-12 px-20 border-bottom d-flex align-items-center gap-8">
                  <span className="w-32-px h-32-px bg-primary-600 text-white rounded-circle d-flex justify-content-center align-items-center fw-bold text-sm">
                    {DAY_LABELS[day]}
                  </span>
                  <span className="fw-semibold">{DAY_LABELS[day]}요일</span>
                  <span className="badge bg-neutral-100 text-secondary-light ms-auto">{byDay[day].length}교시</span>
                </div>
                <div className="card-body p-0">
                  {byDay[day].map((s, i) => (
                    <div key={s.id} className={`px-20 py-14${i < byDay[day].length - 1 ? ' border-bottom' : ''}`}>
                      <div className="d-flex align-items-start justify-content-between">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-8 mb-4">
                            {s.period != null && (
                              <span className="badge bg-primary-100 text-primary-600 px-8 py-4 radius-4 text-xs fw-semibold">
                                {s.period}교시
                              </span>
                            )}
                            <span className="fw-semibold text-sm">{s.subjectName ?? '수업'}</span>
                          </div>
                          {s.className && (
                            <p className="text-xs text-secondary-light mb-2">
                              <iconify-icon icon="mdi:google-classroom" className="me-4" />
                              {s.className}
                            </p>
                          )}
                          {(s.startTime || s.endTime) && (
                            <p className="text-xs text-secondary-light mb-2">
                              <iconify-icon icon="mdi:clock-outline" className="me-4" />
                              {s.startTime ?? '?'} ~ {s.endTime ?? '?'}
                            </p>
                          )}
                          {s.location && (
                            <p className="text-xs text-secondary-light mb-0">
                              <iconify-icon icon="mdi:map-marker-outline" className="me-4" />
                              {s.location}
                            </p>
                          )}
                        </div>
                        <div className="d-flex gap-4 ms-8">
                          <button type="button" className="btn btn-xs btn-outline-primary-600 radius-4 px-6 py-4" onClick={() => openEdit(s)}>
                            <iconify-icon icon="mdi:pencil-outline" />
                          </button>
                          <button type="button" className="btn btn-xs btn-outline-danger radius-4 px-6 py-4" onClick={() => handleDelete(s.id)}>
                            <iconify-icon icon="mdi:trash-can-outline" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* [woo] 일정 추가/수정 모달 - React state 제어 */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content radius-12">
              <div className="modal-header border-bottom py-16 px-24">
                <h6 className="modal-title">{editTarget ? '일정 수정' : '일정 추가'}</h6>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body p-24">
                <div className="row gy-16">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-sm">요일 *</label>
                    <select className="form-select" value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))}>
                      {DAY_ORDER.map(d => <option key={d} value={d}>{DAY_LABELS[d]}요일</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-sm">교시</label>
                    <input type="number" className="form-control" min={1} max={10} placeholder="예: 1"
                      value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-sm">시작 시간</label>
                    <input type="time" className="form-control" value={form.startTime}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-sm">종료 시간</label>
                    <input type="time" className="form-control" value={form.endTime}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-sm">과목명 *</label>
                    <input type="text" className="form-control" placeholder="예: 수학"
                      value={form.subjectName} onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-sm">담당 반</label>
                    <input type="text" className="form-control" placeholder="예: 3학년 2반"
                      value={form.className} onChange={e => setForm(f => ({ ...f, className: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-sm">장소</label>
                    <input type="text" className="form-control" placeholder="예: 3-2 교실"
                      value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-sm">반복</label>
                    <select className="form-select" value={form.repeatType} onChange={e => setForm(f => ({ ...f, repeatType: e.target.value }))}>
                      <option value="WEEKLY">매주</option>
                      <option value="ONCE">1회</option>
                      <option value="BIWEEKLY">2주마다</option>
                    </select>
                  </div>
                  {form.repeatType === 'ONCE' && (
                    <div className="col-12">
                      <label className="form-label fw-semibold text-sm">날짜 (1회성)</label>
                      <input type="date" className="form-control"
                        value={form.specificDate} onChange={e => setForm(f => ({ ...f, specificDate: e.target.value }))} />
                    </div>
                  )}
                  <div className="col-12">
                    <label className="form-label fw-semibold text-sm">메모</label>
                    <textarea className="form-control" rows={2} placeholder="메모 (선택)"
                      value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top py-16 px-24 gap-8">
                <button type="button" className="btn btn-outline-neutral-300 radius-8" onClick={() => setShowModal(false)}>
                  취소
                </button>
                <button type="button" className="btn btn-primary-600 radius-8" onClick={handleSave} disabled={saving}>
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
