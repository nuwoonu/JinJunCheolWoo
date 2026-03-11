import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/auth'
import DashboardLayout from '../../../components/layout/DashboardLayout'

// [woo] /attendance/student - 학생 출결 관리 (TEACHER, ADMIN)

interface AttendanceRecord {
  id: number
  studentName: string
  studentNumber: string
  year: number
  classNum: number
  date: string
  status: string
  statusDesc?: string
  reason?: string
}

const ATTENDANCE_BADGE: Record<string, string> = {
  PRESENT: 'bg-success-100 text-success-600',
  ABSENT: 'bg-danger-100 text-danger-600',
  LATE: 'bg-warning-100 text-warning-600',
  EARLY_LEAVE: 'bg-info-100 text-info-600',
}

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: '출석' },
  { value: 'ABSENT', label: '결석' },
  { value: 'LATE', label: '지각' },
  { value: 'EARLY_LEAVE', label: '조퇴' },
]

const today = new Date().toISOString().slice(0, 10)

export default function StudentAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(today)
  const [yearFilter, setYearFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const fetchRecords = (d = date, y = yearFilter, c = classFilter) => {
    setLoading(true)
    const params = new URLSearchParams({ date: d })
    if (y) params.set('year', y)
    if (c) params.set('classNum', c)
    api.get(`/attendance/student?${params}`)
      .then(res => setRecords(res.data))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRecords() }, [])

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.put(`/attendance/student/${id}`, { status })
      fetchRecords()
    } catch {
      alert('출결 변경에 실패했습니다.')
    }
  }

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">출결 관리</h6>
          <p className="text-neutral-600 mt-4 mb-0">학생 출결 현황</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">출결 관리</li>
          <li>-</li>
          <li className="fw-medium">학생 출결</li>
        </ul>
      </div>

      <div className="card radius-12">
        <div className="card-header py-16 px-24 border-bottom">
          <div className="d-flex flex-wrap align-items-center gap-12">
            <div>
              <label className="form-label fw-semibold text-sm mb-4">날짜</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ maxWidth: 160 }}
              />
            </div>
            <div>
              <label className="form-label fw-semibold text-sm mb-4">학년</label>
              <select className="form-select" style={{ maxWidth: 100 }} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                <option value="">전체</option>
                {[1,2,3].map(y => <option key={y} value={y}>{y}학년</option>)}
              </select>
            </div>
            <div>
              <label className="form-label fw-semibold text-sm mb-4">반</label>
              <select className="form-select" style={{ maxWidth: 100 }} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                <option value="">전체</option>
                {[1,2,3,4,5].map(c => <option key={c} value={c}>{c}반</option>)}
              </select>
            </div>
            <div className="mt-auto">
              <button type="button" className="btn btn-primary-600 radius-8" onClick={() => fetchRecords()}>
                <iconify-icon icon="ion:search-outline" className="me-4" />
                조회
              </button>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col">학번</th>
                  <th scope="col">이름</th>
                  <th scope="col">학년/반</th>
                  <th scope="col">날짜</th>
                  <th scope="col" className="text-center">현재 상태</th>
                  <th scope="col" className="text-center">변경</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-24 text-secondary-light">불러오는 중...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-24 text-secondary-light">출결 기록이 없습니다.</td></tr>
                ) : (
                  records.map(r => (
                    <tr key={r.id}>
                      <td className="fw-medium">{r.studentNumber}</td>
                      <td>{r.studentName}</td>
                      <td className="text-secondary-light">{r.year}학년 {r.classNum}반</td>
                      <td className="text-secondary-light">{r.date}</td>
                      <td className="text-center">
                        <span className={`badge px-10 py-4 radius-4 text-xs fw-medium ${ATTENDANCE_BADGE[r.status] ?? 'bg-neutral-100 text-secondary-light'}`}>
                          {r.statusDesc ?? r.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <select
                          className="form-select form-select-sm"
                          style={{ maxWidth: 100 }}
                          value={r.status}
                          onChange={e => handleStatusChange(r.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
