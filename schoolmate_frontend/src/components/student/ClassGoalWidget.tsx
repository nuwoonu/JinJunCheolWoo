// [soojin] 이달의 학급 목표 위젯
// GET /api/class/goal/{classroomId}?year=&month=
// 백엔드 API 미완성 (ClassGoal 엔티티 신규 기능) → "준비 중" 표시

import { useEffect, useState } from 'react'
import api from '../../api/auth'

interface ClassGoal {
  id: number
  content: string
  achievementRate: number  // 달성률 0~100
  year: number
  month: number
}

interface Props {
  classroomId: number | null
}

export default function ClassGoalWidget({ classroomId }: Props) {
  const [goal, setGoal] = useState<ClassGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [notReady, setNotReady] = useState(false)

  useEffect(() => {
    if (classroomId == null) {
      setLoading(false)
      return
    }
    const now = new Date()
    api.get(`/class/goal/${classroomId}?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then(res => { setGoal(res.data) })
      .catch(() => {
        // API 미완성 → 준비 중 상태
        setNotReady(true)
      })
      .finally(() => setLoading(false))
  }, [classroomId])

  return (
    <div className="card shadow-sm p-20 h-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <h6 className="fw-bold mb-16 text-sm">
        <i className="ri-focus-3-line text-primary-600 me-2" />
        이달의 학급 목표
      </h6>

      {loading ? (
        <p className="text-secondary-light text-sm mb-0">불러오는 중...</p>
      ) : notReady || classroomId == null ? (
        <div className="text-center py-20">
          <i className="ri-tools-line text-secondary-light mb-8" style={{ fontSize: 32 }} />
          <p className="text-secondary-light text-sm mb-0">준비 중입니다.</p>
        </div>
      ) : goal ? (
        <>
          <p className="text-sm text-dark mb-16" style={{ lineHeight: 1.6 }}>
            {goal.content}
          </p>
          {/* 달성률 Progress Bar */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-6">
              <span className="text-xs text-secondary-light">달성률</span>
              <span className="text-xs fw-bold text-primary-600">{goal.achievementRate}%</span>
            </div>
            <div className="progress" style={{ height: 8, borderRadius: 4 }}>
              <div
                className="progress-bar bg-primary-600"
                style={{ width: `${goal.achievementRate}%`, borderRadius: 4 }}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-secondary-light text-sm py-20">
          이번 달 학급 목표가 없습니다.
        </div>
      )}
    </div>
  )
}
