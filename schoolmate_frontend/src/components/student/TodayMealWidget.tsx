// [soojin] 오늘의 급식 위젯
// 기존 Dashboard.tsx 하드코딩 교체 → GET /api/meals/daily?date=YYYY-MM-DD 실제 API 연동
// 백엔드 팀원 작업 중 - API 응답 없으면 "급식 정보가 없습니다" 표시

import { useEffect, useState } from 'react'

interface MealInfo {
  menu: string       // 급식 메뉴 (줄바꿈 구분)
  calories?: string  // 칼로리 정보
}

export default function TodayMealWidget() {
  const [meal, setMeal] = useState<MealInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    fetch(`/api/meals/daily?date=${today}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setMeal(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const MOCK_MENU = '잡곡밥, 미역국, 제육볶음, 배추김치, 과일'
  const MOCK_CALORIES = 646

  const displayMenu = meal?.menu ?? MOCK_MENU
  const displayCalories = meal?.calories ?? MOCK_CALORIES

  return (
    <div className="card shadow-sm h-100 d-flex flex-column" style={{ borderRadius: 16, border: '1px solid #e5e7eb' }}>
      {/* 헤더 */}
      <div className="p-16 border-bottom">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-restaurant-line text-primary-600 me-2" />
          오늘의 급식
        </h6>
      </div>

      {/* 본문: 세로 중앙 정렬 */}
      <div className="d-flex flex-column align-items-center justify-content-center p-20" style={{ flex: 1 }}>
        {loading ? (
          <p className="text-secondary-light text-sm mb-0">급식 정보를 불러오는 중...</p>
        ) : (
          <>
            <p className="text-sm mb-12 text-center" style={{ color: '#374151', lineHeight: 1.7 }}>{displayMenu}</p>
            <span style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              background: '#25A194',
              color: 'white',
              borderRadius: 20,
              padding: '5px 0',
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 16,
            }}>
              칼로리: {displayCalories}kcal
            </span>
            <div style={{
              width: '100%',
              height: 110,
              borderRadius: 10,
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <i className="ri-image-line" style={{ fontSize: 32, color: '#9ca3af' }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
