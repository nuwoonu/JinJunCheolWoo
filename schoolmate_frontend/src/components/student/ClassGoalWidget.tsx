// [soojin] 이달의 학급 목표 위젯 (학생용)
// GET /api/class/goal/{classroomId}?year=&month=
// 204 No Content → "목표 없음" 표시

import { useEffect, useState } from 'react'
import api from '../../api/auth'

interface ClassGoal {
  id: number
  year: number
  month: number
  goal: string
  actionItems: string[]
}

interface Props {
  classroomId: number | null
}

export default function ClassGoalWidget({ classroomId }: Props) {
  const [goal, setGoal] = useState<ClassGoal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (classroomId == null) {
      setLoading(false)
      return
    }
    const now = new Date()
    api.get(`/class/goal/${classroomId}?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then(res => {
        if (res.status !== 204 && res.data?.goal) {
          setGoal(res.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [classroomId])

  const now = new Date()

  return (
    <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: '1px solid #e5e7eb' }}>
      {/* 헤더 */}
      <div
        className="d-flex align-items-center justify-content-between px-20 py-16"
        style={{ borderBottom: '1px solid #e5e7eb' }}
      >
        <div className="d-flex align-items-center gap-8">
          <i className="ri-focus-3-line text-primary-600" style={{ fontSize: 18 }} />
          <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>이달의 학급 목표</span>
        </div>
        <span className="text-xs" style={{ color: '#9ca3af' }}>
          {now.getFullYear()}년 {now.getMonth() + 1}월
        </span>
      </div>

      {/* 본문 */}
      <div className="p-20">
        {loading ? (
          <p className="text-secondary-light text-sm mb-0">불러오는 중...</p>

        ) : classroomId == null ? (
          <div className="text-center py-20">
            <i className="ri-error-warning-line text-secondary-light mb-8" style={{ fontSize: 32 }} />
            <p className="text-secondary-light text-sm mb-0">학급 정보가 없습니다.</p>
          </div>

        ) : goal ? (
          <div>
            {/* 목표 텍스트 박스 */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 16,
            }}>
              <p className="text-sm fw-semibold mb-0" style={{ color: '#15803d', lineHeight: 1.6 }}>
                {goal.goal}
              </p>
            </div>

            {/* 실천 사항 */}
            {goal.actionItems.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {goal.actionItems.map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{
                      width: 20, height: 20, minWidth: 20, borderRadius: '50%',
                      border: '2px solid #25A194', background: 'white',
                      marginTop: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#25A194', display: 'block' }} />
                    </span>
                    <span className="text-sm" style={{ color: '#374151', lineHeight: 1.5 }}>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

        ) : (
          <div className="text-center py-20">
            <i className="ri-focus-3-line text-secondary-light mb-8" style={{ fontSize: 32 }} />
            <p className="text-secondary-light text-sm mb-0">이번 달 학급 목표가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
