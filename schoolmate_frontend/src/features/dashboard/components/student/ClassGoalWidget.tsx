// [soojin] 이달의 학급 목표 위젯 (학생용)
// GET /api/class/goal/{classroomId}?year=&month=
// 204 No Content → "목표 없음" 표시

import { useEffect, useState } from 'react'
import api from '@/shared/api/authApi'

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
    <div className="card shadow-sm h-100 dash-card">
      {/* 헤더 */}
      <div className="d-flex align-items-center justify-content-between dash-card-header">
        <div className="d-flex align-items-center gap-8">
          <i className="ri-focus-3-line text-primary-600" style={{ fontSize: 18 }} />
          <h6 className="fw-bold mb-0 text-sm">이달의 학급 목표</h6>
        </div>
        <span className="text-xs" style={{ color: '#9ca3af', lineHeight: 1 }}>
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
            {/* 1행: 해당 월 */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              padding: '10px 16px',
              marginBottom: 12,
              textAlign: 'center',
            }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#15803d' }}>
                {goal.month}월
              </span>
            </div>

            {/* 2행: 목표 */}
            <div style={{
              background: '#fefce8',
              border: '1px solid #fde68a',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 16,
            }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 4 }}>목표</p>
              <p className="text-sm mb-0" style={{ color: '#374151', lineHeight: 1.6 }}>{goal.goal}</p>
            </div>

            {/* 3행: 실천 사항 */}
            {goal.actionItems.length > 0 && (
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 10 }}>실천 사항</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {goal.actionItems.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 24, height: 24, minWidth: 24, borderRadius: '50%',
                        background: '#25A194', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {i + 1}
                      </span>
                      <span className="text-sm" style={{ color: '#374151', lineHeight: 1.5 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
