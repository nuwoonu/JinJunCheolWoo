// [soojin] 우리 반 친구들 위젯
// GET /api/students/search?grade=&classNum= 로 같은 반 학생 목록 조회
// GET /api/attendance/student?date={today} 로 오늘 출석 상태 조회 (병렬 fetch 후 studentNumber로 merge)
// 프로필 이미지 없으면 기본 아이콘 표시

import { useEffect, useState } from 'react'
import api from '@/shared/api/authApi'

interface Student {
  id?: number          // StudentInfo.id (studentInfoId와 동일)
  uid?: number
  studentId?: number
  userName: string
  studentNumber?: number
  profileImageUrl?: string
  role?: 'CLASS_PRESIDENT' | 'VICE_PRESIDENT' | null
  attendanceStatus?: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'SICK' | 'NONE' | null
}

interface AttendanceRecord {
  studentInfoId: number
  studentNumber: number | string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'SICK' | 'NONE'
}

const STATUS_CONFIG = {
  PRESENT:     { label: '출석', color: '#22c55e' },
  LATE:        { label: '지각', color: '#f97316' },
  ABSENT:      { label: '결석', color: '#ef4444' },
  EARLY_LEAVE: { label: '조퇴', color: '#3b82f6' },
  SICK:        { label: '병결', color: '#a855f7' },
  NONE:        { label: '미처리', color: '#9ca3af' },
} as const

interface Props {
  grade: number
  classNum: number
}

export default function ClassFriendsWidget({ grade, classNum }: Props) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      api.get(`/students/search?grade=${grade}&classNum=${classNum}`),
      api.get(`/attendance/student?date=${today}`).catch(() => ({ data: [] })),
    ])
      .then(([studentsRes, attendanceRes]) => {
        const studentData: Student[] = Array.isArray(studentsRes.data)
          ? studentsRes.data
          : (studentsRes.data.content ?? [])
        const attendanceData: AttendanceRecord[] = Array.isArray(attendanceRes.data)
          ? attendanceRes.data
          : []

        // studentInfoId(출석 API) = id(학생 검색 API) 로 merge
        const attendanceMap = new Map(
          attendanceData.map(a => [a.studentInfoId, a.status])
        )

        setStudents(
          studentData.map(s => ({
            ...s,
            attendanceStatus: s.id != null ? (attendanceMap.get(s.id) ?? 'NONE') : 'NONE',
          }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [grade, classNum])

  return (
    <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
      {/* 헤더 */}
      <div className="d-flex align-items-center p-16 border-bottom">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-group-line text-primary-600 me-2" />
          우리 반 친구들
          <span className="text-secondary-light fw-normal ms-4">({students.length}명)</span>
        </h6>
      </div>

      <div className="p-16">
      {loading ? (
        <p className="text-secondary-light text-sm text-center py-20 mb-0">불러오는 중...</p>
      ) : students.length > 0 ? (
        <div className="d-flex flex-column gap-0" style={{ overflowY: 'auto', maxHeight: 240 }}>
          {students.map((s, i) => (
            <div
              key={s.id ?? s.uid ?? s.studentId ?? i}
              className="d-flex align-items-center py-10 px-4"
              style={{ borderBottom: '1px solid #f3f4f6' }}
            >
              {/* 번호 */}
              <span className="text-secondary-light text-xs me-12" style={{ minWidth: 16, textAlign: 'right' }}>
                {s.studentNumber ?? i + 1}
              </span>

              {/* 아바타 */}
              <div
                className="rounded-circle overflow-hidden me-10 flex-shrink-0"
                style={{ width: 34, height: 34 }}
              >
                {s.profileImageUrl ? (
                  <img
                    src={s.profileImageUrl}
                    alt={s.userName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center w-100 h-100"
                    style={{ background: '#d1fae5' }}
                  >
                    <i className="ri-user-3-line" style={{ fontSize: 16, color: '#059669' }} />
                  </div>
                )}
              </div>

              {/* 이름 + 역할 배지 */}
              <div className="d-flex align-items-center gap-6 flex-grow-1">
                <span className="text-sm fw-medium text-dark">{s.userName}</span>
                {s.role === 'CLASS_PRESIDENT' && (
                  <span
                    className="text-xs fw-semibold px-6 py-2 rounded"
                    style={{ background: '#ff6b35', color: '#fff', fontSize: 11 }}
                  >
                    반장
                  </span>
                )}
                {s.role === 'VICE_PRESIDENT' && (
                  <span
                    className="text-xs fw-semibold px-6 py-2 rounded"
                    style={{ background: '#f59e0b', color: '#fff', fontSize: 11 }}
                  >
                    부반장
                  </span>
                )}
              </div>

              {/* 말풍선 아이콘 */}
              <button
                className="btn p-0 me-10 text-secondary-light"
                style={{ lineHeight: 1, background: 'none', border: 'none' }}
                title="메시지"
              >
                <i className="ri-chat-1-line" style={{ fontSize: 16 }} />
              </button>

              {/* 출석 상태 배지 */}
              {(() => {
                const key = (s.attendanceStatus ?? 'NONE') as keyof typeof STATUS_CONFIG
                const cfg = STATUS_CONFIG[key] ?? STATUS_CONFIG.NONE
                return (
                  <span
                    className="text-xs fw-semibold px-8 py-3 rounded"
                    style={{ background: cfg.color, color: '#fff', fontSize: 11, minWidth: 36, textAlign: 'center' }}
                  >
                    {cfg.label}
                  </span>
                )
              })()}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-secondary-light text-sm py-20">
          같은 반 학생 정보가 없습니다.
        </div>
      )}
      </div>
    </div>
  )
}
