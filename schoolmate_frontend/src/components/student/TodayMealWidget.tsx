// [soojin] 오늘의 급식 위젯
// NEIS API → 백엔드 프록시(/api/neis/meal/today) → 클라이언트 메모리 캐시
// 브라우저 탭이 열려 있는 동안 캐시 유지, 탭 닫으면 자동 소멸

import { useEffect, useState } from 'react'
import { getTodayMeal, type MealInfo } from '@/api/mealCache'

interface Props {
  schoolId?: number | null
}

export default function TodayMealWidget({ schoolId }: Props) {
  const [meal, setMeal] = useState<MealInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getTodayMeal(schoolId)
      .then(data => { setMeal(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [schoolId])

  const menuLines = meal?.menu?.split('\n') ?? []

  return (
    <div className="card shadow-sm h-100 d-flex flex-column" style={{ borderRadius: 16, border: '1px solid #e5e7eb' }}>
      {/* 헤더 */}
      <div className="p-16 border-bottom d-flex align-items-center justify-content-between">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-restaurant-line text-primary-600 me-2" />
          오늘의 급식
        </h6>
        {meal?.mealType && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#25A194',
            background: '#e6f7f6', borderRadius: 20, padding: '2px 10px',
          }}>
            {meal.mealType}
          </span>
        )}
      </div>

      {/* 본문 */}
      <div className="d-flex flex-column p-20" style={{ flex: 1 }}>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center h-100">
            <p className="text-secondary-light text-sm mb-0">급식 정보를 불러오는 중...</p>
          </div>
        ) : meal ? (
          <>
            {/* 메뉴 목록 */}
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0', flex: 1 }}>
              {menuLines.map((line, i) => (
                <li key={i} style={{
                  fontSize: 13, color: '#374151', lineHeight: 1.8,
                  borderBottom: i < menuLines.length - 1 ? '1px solid #f3f4f6' : 'none',
                  padding: '3px 0',
                }}>
                  {line}
                </li>
              ))}
            </ul>

            {/* 칼로리 */}
            {meal.calories && (
              <span style={{
                display: 'block', textAlign: 'center',
                background: '#25A194', color: 'white',
                borderRadius: 20, padding: '5px 0',
                fontSize: 12, fontWeight: 500,
              }}>
                칼로리: {meal.calories} kcal
              </span>
            )}
          </>
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100">
            <p className="text-secondary-light text-sm mb-0 text-center">오늘의 급식 정보가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
