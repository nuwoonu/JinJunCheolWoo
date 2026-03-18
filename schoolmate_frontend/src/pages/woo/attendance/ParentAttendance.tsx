import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/auth'
import DashboardLayout from '../../../components/layout/DashboardLayout'

// [woo] /attendance/parent - 학부모 자녀 출결 현황 조회

interface ChildSummary {
  childName: string
  studentInfoId: number
  studentNumber: string
  grade: number
  classNum: number
  statusCounts: Record<string, number>
  totalDays: number
}

interface ChildRecord {
  id: number
  attendanceDate: string
  status: string
  statusDesc: string
  checkInTime?: string
  reason?: string
}

const STATUS_LABELS: Record<string, string> = {
  PRESENT: '출석',
  ABSENT: '결석',
  LATE: '지각',
  EARLY_LEAVE: '조퇴',
  SICK: '병결',
}

const STATUS_BADGE: Record<string, string> = {
  PRESENT: 'bg-success-100 text-success-600',
  ABSENT: 'bg-danger-100 text-danger-600',
  LATE: 'bg-warning-100 text-warning-600',
  EARLY_LEAVE: 'bg-info-100 text-info-600',
  SICK: 'bg-neutral-200 text-neutral-600',
}

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

export default function ParentAttendance() {
  const [summaries, setSummaries] = useState<ChildSummary[]>([])
  const [records, setRecords] = useState<ChildRecord[]>([])
  const [selectedChild, setSelectedChild] = useState<ChildSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const { startDate, endDate } = getMonthRange()

  useEffect(() => {
    api
      .get(`/attendance/parent/summary?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => setSummaries(res.data))
      .catch(() => setSummaries([]))
      .finally(() => setLoading(false))
  }, [])

  const handleChildClick = (child: ChildSummary) => {
    setSelectedChild(child)
    setRecordsLoading(true)
    api
      .get(
        `/attendance/parent/children/${child.studentInfoId}?startDate=${startDate}&endDate=${endDate}`
      )
      .then((res) => setRecords(res.data))
      .catch(() => setRecords([]))
      .finally(() => setRecordsLoading(false))
  }

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">자녀 출결 현황</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            이번 달 자녀 출결 요약 및 상세 기록
          </p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link
              to="/main"
              className="d-flex align-items-center gap-1 hover-text-primary"
            >
              <iconify-icon
                icon="solar:home-smile-angle-outline"
                className="icon text-lg"
              />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">출결 현황</li>
        </ul>
      </div>

      {/* 자녀 출결 요약 카드 */}
      {loading ? (
        <div className="text-center py-24 text-secondary-light">
          불러오는 중...
        </div>
      ) : summaries.length === 0 ? (
        <div className="card radius-12">
          <div className="card-body text-center py-24 text-secondary-light">
            연결된 자녀가 없거나 출결 기록이 없습니다.
          </div>
        </div>
      ) : (
        <div className="row g-16 mb-24">
          {summaries.map((child) => (
            <div key={child.studentInfoId} className="col-md-6 col-lg-4">
              <div
                className={`card radius-12 cursor-pointer border ${
                  selectedChild?.studentInfoId === child.studentInfoId
                    ? 'border-primary-600'
                    : ''
                }`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleChildClick(child)}
              >
                <div className="card-body">
                  <div className="d-flex align-items-center gap-12 mb-16">
                    <div className="w-40-px h-40-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                      <iconify-icon
                        icon="mdi:account-school"
                        className="text-primary-600 text-xl"
                      />
                    </div>
                    <div>
                      <h6 className="fw-semibold mb-0">{child.childName}</h6>
                      <span className="text-secondary-light text-sm">
                        {child.grade}학년 {child.classNum}반 ({child.studentNumber})
                      </span>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-8">
                    {Object.entries(child.statusCounts).map(([status, count]) => (
                      <div key={status} className="text-center">
                        <span
                          className={`badge px-10 py-4 radius-4 text-xs fw-medium ${
                            STATUS_BADGE[status] ?? 'bg-neutral-100 text-secondary-light'
                          }`}
                        >
                          {STATUS_LABELS[status] ?? status}
                        </span>
                        <div className="fw-semibold mt-4">{count}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 text-sm text-secondary-light">
                    총 {child.totalDays}일 기록
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 선택된 자녀의 출결 상세 기록 */}
      {selectedChild && (
        <div className="card radius-12">
          <div className="card-header py-16 px-24 border-bottom">
            <h6 className="fw-semibold mb-0">
              {selectedChild.childName} 출결 상세 기록
            </h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table bordered-table mb-0">
                <thead>
                  <tr>
                    <th scope="col">날짜</th>
                    <th scope="col" className="text-center">
                      상태
                    </th>
                    <th scope="col">출석 시간</th>
                    <th scope="col">사유</th>
                  </tr>
                </thead>
                <tbody>
                  {recordsLoading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-24 text-secondary-light"
                      >
                        불러오는 중...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-24 text-secondary-light"
                      >
                        출결 기록이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.id}>
                        <td>{r.attendanceDate}</td>
                        <td className="text-center">
                          <span
                            className={`badge px-10 py-4 radius-4 text-xs fw-medium ${
                              STATUS_BADGE[r.status] ??
                              'bg-neutral-100 text-secondary-light'
                            }`}
                          >
                            {r.statusDesc ?? r.status}
                          </span>
                        </td>
                        <td className="text-secondary-light">
                          {r.checkInTime ?? '-'}
                        </td>
                        <td className="text-secondary-light">
                          {r.reason ?? '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
