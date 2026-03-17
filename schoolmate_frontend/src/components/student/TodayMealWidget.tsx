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
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/meals/daily?date=${today}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setMeal(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // 메뉴 문자열을 줄 단위로 분리 (개행 또는 쉼표 구분 허용)
  const menuLines = meal?.menu
    ? meal.menu.split(/[\n,]/).map(s => s.trim()).filter(Boolean)
    : []

  return (
    <div className="card shadow-sm p-20 h-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <h6 className="fw-bold mb-16 text-sm">
        <i className="ri-restaurant-2-line text-primary-600 me-2" />
        오늘의 급식
      </h6>

      {loading ? (
        <p className="text-secondary-light text-sm mb-0">급식 정보를 불러오는 중...</p>
      ) : meal && menuLines.length > 0 ? (
        <>
          <div className="d-flex flex-column gap-6 mb-12">
            {menuLines.map((item, i) => (
              <div key={i} className="d-flex align-items-center gap-8">
                <i className="ri-checkbox-blank-circle-fill text-primary-200" style={{ fontSize: 6 }} />
                <span className="text-sm text-dark">{item}</span>
              </div>
            ))}
          </div>
          {meal.calories && (
            <span className="badge bg-primary-100 text-primary-600 px-8 py-4 rounded-pill text-xs">
              칼로리: {meal.calories}
            </span>
          )}
        </>
      ) : (
        <p className="text-secondary-light text-sm mb-0">
          오늘 급식 정보가 없습니다.
        </p>
      )}
    </div>
  )
}
