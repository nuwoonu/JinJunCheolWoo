import { useEffect, useState, useMemo } from 'react'
import api from '../../../api/auth'
import { useAuth } from '../../../contexts/AuthContext'
import DashboardLayout from '../../../components/layout/DashboardLayout'

// [soojin] 상담 예약 캘린더
// PARENT: 예약 신청 (캘린더 + 폼)
// TEACHER: 확정 예약 캘린더 + 클릭 시 일정 조정 모달

interface Reservation {
  id?: number
  date: string
  startTime: string
  endTime: string
  writerName: string
  content?: string
  status?: string
  studentName?: string
  studentNumber?: string
  local?: boolean
}

interface ChildInfo {
  id: number
  name: string
  grade: number | null
  classNum: number | null
  number: number | null
}

const TIME_SLOTS = [
  '오전 10시', '오전 11시', '오후 12시',
  '오후 1시', '오후 2시', '오후 3시', '오후 4시', '오후 5시',
]
const TIME_MAP: Record<string, string> = {
  '오전 10시': '10:00', '오전 11시': '11:00', '오후 12시': '12:00',
  '오후 1시': '13:00', '오후 2시': '14:00', '오후 3시': '15:00',
  '오후 4시': '16:00', '오후 5시': '17:00',
}
const TIME_LABEL: Record<string, string> = {
  '10:00': '오전 10시', '11:00': '오전 11시', '12:00': '오후 12시',
  '13:00': '오후 1시', '14:00': '오후 2시', '15:00': '오후 3시',
  '16:00': '오후 4시', '17:00': '오후 5시',
}
const DAY_LABELS = ['월', '화', '수', '목', '금']

function normalizeTime(t: string): string {
  return t ? t.substring(0, 5) : t
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function fmtDisplay(d: Date): string {
  return `${d.getMonth() + 1}. ${d.getDate()}. (${DAY_LABELS[d.getDay() - 1] ?? ''})`
}

function endTimeOf(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number)
  return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function ConsultationReservation() {
  const { user } = useAuth()
  const isTeacher = user?.role === 'TEACHER'
  const isParent = user?.role === 'PARENT'

  const [monday, setMonday] = useState(() => getMonday(new Date()))
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selected, setSelected] = useState<{ date: string; time: string } | null>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // PARENT: 자녀 목록
  const [children, setChildren] = useState<ChildInfo[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)

  // TEACHER: 일정 조정 모달
  const [adjusting, setAdjusting] = useState<Reservation | null>(null)
  const [adjDate, setAdjDate] = useState('')
  const [adjStart, setAdjStart] = useState('')
  const [adjEnd, setAdjEnd] = useState('')
  const [adjSaving, setAdjSaving] = useState(false)

  const weekDates = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => addDays(monday, i)), [monday])

  const startStr = fmt(monday)
  const endStr = fmt(addDays(monday, 4))

  const fetchReservations = () => {
    api.get(`/consultation/reservations?startDate=${startStr}&endDate=${endStr}`)
      .then(res => {
        const list: Reservation[] = Array.isArray(res.data) ? res.data : []
        setReservations(list.map(r => ({
          ...r,
          startTime: normalizeTime(r.startTime),
          endTime: normalizeTime(r.endTime),
        })))
      })
      .catch(() => {})
  }

  useEffect(() => { fetchReservations() }, [startStr, endStr])

  useEffect(() => {
    if (!isParent) return
    api.get('/consultation/reservations/children')
      .then(res => {
        const list: ChildInfo[] = Array.isArray(res.data) ? res.data : []
        setChildren(list)
        if (list.length > 0 && selectedChildId === null) {
          setSelectedChildId(list[0].id)
        }
      })
      .catch(() => {})
  }, [])

  const prevWeek = () => { setMonday(prev => addDays(prev, -7)); setSelected(null) }
  const nextWeek = () => { setMonday(prev => addDays(prev, 7)); setSelected(null) }
  const goToday = () => { setMonday(getMonday(new Date())); setSelected(null) }

  const reservationMap = useMemo(() => {
    const map: Record<string, Reservation> = {}
    for (const r of reservations) {
      if (isTeacher && r.status !== 'CONFIRMED') continue
      map[`${r.date}_${r.startTime}`] = r
    }
    return map
  }, [reservations, isTeacher])

  // PARENT: 셀 클릭 → 시간 선택
  const handleCellClick = (date: string, timeLabel: string) => {
    if (isTeacher) return
    const timeStr = TIME_MAP[timeLabel]
    const key = `${date}_${timeStr}`
    if (reservationMap[key]) return
    if (selected?.date === date && selected?.time === timeStr) {
      setSelected(null)
    } else {
      setSelected({ date, time: timeStr })
    }
  }

  // TEACHER: 확정 예약 클릭 → 조정 모달
  const handleReservationClick = (reservation: Reservation) => {
    if (!isTeacher || !reservation.id) return
    setAdjusting(reservation)
    setAdjDate(reservation.date)
    setAdjStart(reservation.startTime)
    setAdjEnd(reservation.endTime)
  }

  // TEACHER: 일정 조정 저장
  const handleAdjustSave = async () => {
    if (!adjusting?.id) return
    setAdjSaving(true)
    try {
      await api.patch(`/consultation/reservations/${adjusting.id}/confirm`, {
        date: adjDate,
        startTime: adjStart,
        endTime: adjEnd,
      })
      setAdjusting(null)
      fetchReservations()
    } catch {
      alert('일정 변경에 실패했습니다.')
    } finally {
      setAdjSaving(false)
    }
  }

  const handleReserve = async () => {
    if (!selected) { alert('날짜와 시간을 선택해주세요.'); return }
    if (!content.trim()) { alert('상담 내용을 입력해주세요.'); return }
    if (children.length > 0 && !selectedChildId) { alert('자녀를 선택해주세요.'); return }
    setSaving(true)

    const newReservation: Reservation = {
      date: selected.date,
      startTime: selected.time,
      endTime: endTimeOf(selected.time),
      writerName: user?.name ?? '나',
      content,
      status: 'PENDING',
      local: true,
    }

    setReservations(prev => [...prev, newReservation])
    setSelected(null)
    setContent('')
    setSuccessMsg('예약이 완료되었습니다!')
    setTimeout(() => setSuccessMsg(''), 3000)

    try {
      await api.post('/consultation/reservations', {
        date: newReservation.date,
        startTime: newReservation.startTime,
        endTime: newReservation.endTime,
        content: newReservation.content,
        studentInfoId: selectedChildId,
      })
      fetchReservations()
    } catch {
      setReservations(prev => prev.filter(r => r !== newReservation))
    } finally {
      setSaving(false)
    }
  }

  const rangeLabel = `${monday.getFullYear()}년 ${monday.getMonth() + 1}월 ${monday.getDate()}일 - ${addDays(monday, 4).getDate()}일`
  const confirmedCount = reservations.filter(r => r.status === 'CONFIRMED').length
  const pendingCount = reservations.filter(r => r.status === 'PENDING').length

  return (
    <DashboardLayout>
      {/* 헤더 */}
      <div className="d-flex align-items-center gap-12 mb-24 p-20 rounded-16"
        style={{ background: isTeacher
          ? 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)'
          : 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)' }}>
        <i className={isTeacher ? 'ri-calendar-schedule-line text-primary' : 'ri-calendar-check-line text-success-600'}
          style={{ fontSize: 32 }} />
        <div>
          <h5 className="fw-bold mb-4">{isTeacher ? '예약 캘린더' : '상담 신청 예약'}</h5>
          <p className="text-secondary-light text-sm mb-0">
            {isTeacher ? '확정된 상담 예약이 캘린더에 표시됩니다. 클릭하면 일정을 조정할 수 있습니다.' : '원하시는 날짜와 시간을 선택해주세요'}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="alert d-flex align-items-center gap-8 mb-16 py-12 px-16"
          style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 12, color: '#155724' }}>
          <i className="ri-checkbox-circle-line" style={{ fontSize: 20 }} />
          <span className="fw-medium">{successMsg}</span>
        </div>
      )}

      {/* 교사: 통계 카드 */}
      {isTeacher && (
        <div className="row g-16 mb-20">
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-16 d-flex align-items-center gap-12">
                <div className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 40, height: 40, background: '#2ecc7118' }}>
                  <i className="ri-checkbox-circle-line" style={{ fontSize: 18, color: '#2ecc71' }} />
                </div>
                <div>
                  <div className="text-xs text-secondary-light">이번 주 확정</div>
                  <div className="fw-bold text-lg">{confirmedCount}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-16 d-flex align-items-center gap-12">
                <div className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 40, height: 40, background: '#f0ad4e18' }}>
                  <i className="ri-time-line" style={{ fontSize: 18, color: '#f0ad4e' }} />
                </div>
                <div>
                  <div className="text-xs text-secondary-light">대기중</div>
                  <div className="fw-bold text-lg">{pendingCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-20">
        <div className={isTeacher ? 'col-12' : 'col-lg-8'}>
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body p-24">
              <h6 className="fw-semibold mb-16">
                <i className="ri-calendar-line text-success-600 me-8" />예약 캘린더
              </h6>

              <div className="d-flex align-items-center justify-content-between mb-16">
                <div className="d-flex align-items-center gap-8">
                  <button className="btn btn-sm btn-outline-secondary px-10 py-4" onClick={prevWeek}>‹</button>
                  <button className="btn btn-sm btn-outline-secondary px-10 py-4" onClick={nextWeek}>›</button>
                  <button className="btn btn-sm btn-outline-secondary px-12 py-4" onClick={goToday}>오늘</button>
                </div>
                <span className="fw-semibold text-lg">{rangeLabel}</span>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-success px-12 py-4">주</button>
                  <button className="btn btn-sm btn-outline-secondary px-12 py-4">일</button>
                </div>
              </div>

              {/* 주간 그리드 */}
              <div className="table-responsive">
                <table className="table table-bordered mb-0 text-center" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ width: 90 }} className="py-12 text-sm fw-semibold">시간</th>
                      {weekDates.map((d, i) => (
                        <th key={i} className="py-12 text-sm fw-semibold">{fmtDisplay(d)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map(timeLabel => {
                      const timeStr = TIME_MAP[timeLabel]
                      return (
                        <tr key={timeLabel}>
                          <td className="py-12 text-sm fw-medium" style={{ background: '#fafafa' }}>{timeLabel}</td>
                          {weekDates.map((d, i) => {
                            const dateStr = fmt(d)
                            const key = `${dateStr}_${timeStr}`
                            const reservation = reservationMap[key]
                            const isSelected = selected?.date === dateStr && selected?.time === timeStr

                            // [soojin] 3.png 참조: 예약 있으면 셀 전체를 초록색으로 채움
                            if (reservation) {
                              const label = isTeacher
                                ? `${reservation.studentName ?? reservation.writerName} 학부모`
                                : reservation.writerName
                              return (
                                <td key={i}
                                  style={{
                                    background: '#2ecc71',
                                    height: 48,
                                    verticalAlign: 'middle',
                                    cursor: isTeacher ? 'pointer' : 'default',
                                    padding: 0,
                                  }}
                                  onClick={() => isTeacher && handleReservationClick(reservation)}>
                                  <span className="text-white fw-semibold" style={{ fontSize: 12 }}>
                                    {label}
                                  </span>
                                </td>
                              )
                            }

                            return (
                              <td key={i}
                                style={{
                                  height: 48,
                                  verticalAlign: 'middle',
                                  background: isSelected ? '#fff9c4' : '',
                                  cursor: isTeacher ? 'default' : 'pointer',
                                  transition: 'background 0.15s',
                                }}
                                onClick={() => handleCellClick(dateStr, timeLabel)}>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* 범례 */}
              <div className="d-flex align-items-center gap-20 mt-16 text-sm">
                <span className="d-flex align-items-center gap-6">
                  <span style={{ width: 16, height: 16, border: '1px solid #dee2e6', borderRadius: 4, display: 'inline-block' }} />
                  예약 가능
                </span>
                <span className="d-flex align-items-center gap-6">
                  <span style={{ width: 16, height: 16, background: '#2ecc71', borderRadius: 4, display: 'inline-block' }} />
                  {isTeacher ? '확정됨' : '예약됨'}
                </span>
                {isParent && (
                  <span className="d-flex align-items-center gap-6">
                    <span style={{ width: 16, height: 16, background: '#fff9c4', border: '1px solid #f0e68c', borderRadius: 4, display: 'inline-block' }} />
                    선택됨
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PARENT: 오른쪽 예약 폼 */}
        {isParent && (
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body p-24">
                <h6 className="fw-semibold mb-20">
                  <i className="ri-calendar-check-line text-success-600 me-8" />예약 정보
                </h6>

                {children.length > 0 && (
                  <div className="mb-16">
                    <label className="form-label text-sm fw-medium">자녀 선택</label>
                    <select className="form-select"
                      value={selectedChildId ?? ''}
                      onChange={e => setSelectedChildId(Number(e.target.value))}>
                      {children.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.grade != null ? ` (${c.grade}학년 ${c.classNum}반 ${c.number}번)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-16">
                  <label className="form-label text-sm fw-medium">날짜</label>
                  <input type="text" className="form-control" readOnly placeholder="yyyy/mm/dd"
                    value={selected?.date?.replace(/-/g, '/') ?? ''} />
                </div>

                <div className="row g-12 mb-16">
                  <div className="col-6">
                    <label className="form-label text-sm fw-medium">시작 시간</label>
                    <input type="text" className="form-control" readOnly placeholder="--:--"
                      value={selected?.time ?? ''} />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-sm fw-medium">종료 시간</label>
                    <input type="text" className="form-control" readOnly placeholder="--:--"
                      value={selected ? endTimeOf(selected.time) : ''} />
                  </div>
                </div>

                <div className="mb-20">
                  <label className="form-label text-sm fw-semibold">상담 내용</label>
                  <textarea className="form-control" rows={5}
                    placeholder="상담하고 싶은 내용을 입력해주세요"
                    value={content} onChange={e => setContent(e.target.value)} />
                </div>

                <button className="btn w-100 text-white py-12 fw-semibold"
                  style={{ background: selected ? '#2ecc71' : '#a0a0a0', borderRadius: 10 }}
                  onClick={handleReserve} disabled={saving || !selected}>
                  {saving ? '예약 중...' : '예약하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TEACHER: 일정 조정 모달 */}
      {adjusting && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setAdjusting(null)}>
          <div className="card border-0 shadow-lg" style={{ borderRadius: 16, width: 440, maxWidth: '90vw' }}
            onClick={e => e.stopPropagation()}>
            <div className="card-body p-24">
              <div className="d-flex align-items-center justify-content-between mb-20">
                <h6 className="fw-bold mb-0">
                  <i className="ri-calendar-event-line text-primary me-8" />일정 조정
                </h6>
                <button className="btn btn-sm p-0 border-0 bg-transparent"
                  onClick={() => setAdjusting(null)} style={{ fontSize: 20 }}>
                  <i className="ri-close-line" />
                </button>
              </div>

              {/* 예약 정보 */}
              <div className="p-12 mb-16 rounded-12" style={{ background: '#f8f9fa' }}>
                <div className="text-sm">
                  <span className="fw-semibold">{adjusting.writerName}</span> (학부모)
                  {adjusting.studentName && <span className="text-secondary-light"> · {adjusting.studentName}</span>}
                </div>
                {adjusting.content && (
                  <div className="text-sm text-secondary-light mt-4">
                    {adjusting.content.length > 100 ? adjusting.content.slice(0, 100) + '...' : adjusting.content}
                  </div>
                )}
              </div>

              {/* 현재 일정 */}
              <div className="mb-12">
                <label className="form-label text-xs text-secondary-light fw-medium mb-4">현재 확정 일정</label>
                <div className="text-sm fw-medium">
                  {adjusting.date} · {TIME_LABEL[adjusting.startTime] ?? adjusting.startTime} ~ {TIME_LABEL[adjusting.endTime] ?? adjusting.endTime}
                </div>
              </div>

              <hr className="my-16" />

              {/* 변경 폼 */}
              <div className="mb-12">
                <label className="form-label text-sm fw-medium">날짜</label>
                <input type="date" className="form-control"
                  value={adjDate} onChange={e => setAdjDate(e.target.value)} />
              </div>
              <div className="row g-12 mb-20">
                <div className="col-6">
                  <label className="form-label text-sm fw-medium">시작 시간</label>
                  <select className="form-select" value={adjStart}
                    onChange={e => {
                      setAdjStart(e.target.value)
                      const [h, m] = e.target.value.split(':').map(Number)
                      setAdjEnd(`${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
                    }}>
                    <option value="10:00">오전 10시</option>
                    <option value="11:00">오전 11시</option>
                    <option value="12:00">오후 12시</option>
                    <option value="13:00">오후 1시</option>
                    <option value="14:00">오후 2시</option>
                    <option value="15:00">오후 3시</option>
                    <option value="16:00">오후 4시</option>
                    <option value="17:00">오후 5시</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label text-sm fw-medium">종료 시간</label>
                  <input type="text" className="form-control" readOnly value={adjEnd} />
                </div>
              </div>

              <div className="d-flex gap-8">
                <button className="btn btn-outline-secondary flex-fill py-10"
                  onClick={() => setAdjusting(null)}>
                  취소
                </button>
                <button className="btn text-white flex-fill py-10 fw-semibold"
                  style={{ background: '#2ecc71' }}
                  disabled={adjSaving}
                  onClick={handleAdjustSave}>
                  {adjSaving ? '처리 중...' : '일정 변경'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
