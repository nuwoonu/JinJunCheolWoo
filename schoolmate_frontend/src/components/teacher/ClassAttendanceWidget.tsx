// [jin] 학급 학생 출결 상태 위젯 (교사용)
// GET /api/attendance/student?date={오늘} → JWT 기반 담임반 자동 조회 (grade/classNum 파라미터 불필요)

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/auth'

interface AttendanceRecord {
  id: number
  studentInfoId: number
  studentName: string
  studentNumber: number
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EARLY_LEAVE' | 'SICK' | 'NONE'
  statusDesc?: string
}

interface Props {
  grade: number
  classNum: number
}

const STATUS_CONFIG = {
  PRESENT:     { label: '출석', color: '#22c55e' },
  LATE:        { label: '지각', color: '#f97316' },
  ABSENT:      { label: '결석', color: '#ef4444' },
  EARLY_LEAVE: { label: '조퇴', color: '#3b82f6' },
  SICK:        { label: '병결', color: '#a855f7' },
  NONE:        { label: '미처리', color: '#9ca3af' },
} as const

export default function ClassAttendanceWidget({ grade, classNum }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    api.get(`/attendance/student?date=${today}`)
      .then(res => {
        const data = res.data
        setRecords(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const total = records.length
  const counts = {
    PRESENT:     records.filter(r => r.status === 'PRESENT').length,
    LATE:        records.filter(r => r.status === 'LATE').length,
    ABSENT:      records.filter(r => r.status === 'ABSENT').length,
    EARLY_LEAVE: records.filter(r => r.status === 'EARLY_LEAVE').length,
  }

  return (
    <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: '1px solid #e5e7eb' }}>
      {/* 헤더 */}
      <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
        <div className="d-flex align-items-center gap-8">
          <iconify-icon icon="mdi:account-check-outline" className="text-primary-600 text-xl" />
          <div>
            <h6 className="fw-bold mb-0 text-sm">학급 학생 출결 상태</h6>
            <p className="text-secondary-light text-xs mb-0 mt-2">
              {grade}학년 {classNum}반 ({total}명)
            </p>
          </div>
        </div>
        <Link
          to="/attendance/student"
          style={{ background: '#25A194', color: 'white', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
        >
          출결 관리
        </Link>
      </div>

      <div className="p-16 d-flex flex-column gap-16">
        {loading ? (
          <p className="text-secondary-light text-sm text-center py-16 mb-0">불러오는 중...</p>
        ) : (
          <>
            {/* 요약 뱃지 행 */}
            <div className="d-flex flex-wrap gap-8">
              {(['PRESENT', 'LATE', 'ABSENT', 'EARLY_LEAVE'] as const).map(key => (
                <span
                  key={key}
                  className="fw-semibold px-12 py-4 rounded-pill text-white text-xs"
                  style={{ background: STATUS_CONFIG[key].color }}
                >
                  {STATUS_CONFIG[key].label}: {counts[key]}
                </span>
              ))}
            </div>

            {/* 학생 목록 */}
            <div style={{ overflowY: 'auto', maxHeight: 320 }}>
              {records.length === 0 ? (
                <p className="text-secondary-light text-sm text-center py-16 mb-0">
                  출결 데이터가 없습니다.
                </p>
              ) : (
                records.map((r, i) => {
                  const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.NONE
                  return (
                    <div
                      key={r.id}
                      className="d-flex align-items-center py-10 px-4"
                      style={{ borderBottom: i < records.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                    >
                      <span className="text-secondary-light text-xs me-12" style={{ minWidth: 20, textAlign: 'right' }}>
                        {r.studentNumber}
                      </span>
                      <span className="text-sm fw-medium text-dark flex-grow-1">{r.studentName}</span>
                      <span
                        className="text-xs fw-semibold px-8 py-3 rounded text-white"
                        style={{ background: cfg.color, minWidth: 36, textAlign: 'center' }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
