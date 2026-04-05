// [soojin] 오늘의 급식 위젯
// NEIS API → 백엔드 프록시(/api/neis/meal/today) → 클라이언트 메모리 캐시
// 브라우저 탭이 열려 있는 동안 캐시 유지, 탭 닫으면 자동 소멸

import { useEffect, useState } from 'react'
import { getTodayMeal, type MealInfo } from '@/api/mealCache'

// [soojin] NEIS 표준 알레르기 코드표 (1~18번)
const ALLERGY_NAMES: Record<number, string> = {
  1: '난류', 2: '우유', 3: '메밀', 4: '땅콩', 5: '대두',
  6: '밀', 7: '고등어', 8: '게', 9: '새우', 10: '돼지고기',
  11: '복숭아', 12: '토마토', 13: '아황산류', 14: '호두',
  15: '닭고기', 16: '쇠고기', 17: '오징어', 18: '조개류', 19: '잣',
}

interface Props {
  schoolId?: number | null
}

export default function TodayMealWidget({ schoolId }: Props) {
  const [meal, setMeal] = useState<MealInfo | null>(null)
  const [loading, setLoading] = useState(true)
  // [soojin] 알레르기 정보 모달 표시 여부
  const [showAllergy, setShowAllergy] = useState(false)

  useEffect(() => {
    setLoading(true)
    getTodayMeal(schoolId)
      .then(data => { setMeal(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [schoolId])

  // [soojin] menuItems가 있으면 알레르기 포함 목록 사용, 없으면 기존 menu 문자열 폴백
  const menuItems = meal?.menuItems ?? meal?.menu?.split('\n').map(name => ({ name, allergies: [] })) ?? []

  // [soojin] 이 급식에 포함된 알레르기 코드를 요리명과 함께 정리 (코드 오름차순)
  const allergyMap = new Map<number, string[]>()
  for (const item of menuItems) {
    for (const code of item.allergies) {
      if (!allergyMap.has(code)) allergyMap.set(code, [])
      allergyMap.get(code)!.push(item.name)
    }
  }
  const allergyEntries = [...allergyMap.entries()].sort((a, b) => a[0] - b[0])

  return (
    <div className="card shadow-sm h-100 d-flex flex-column dash-card">
      {/* 헤더 */}
      <div className="d-flex align-items-center justify-content-between dash-card-header">
        <div className="d-flex align-items-center gap-8">
          <i className="ri-restaurant-line text-primary-600" style={{ fontSize: 18 }} />
          <h6 className="fw-bold mb-0 text-sm">오늘의 급식</h6>
        </div>
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
      <div className="d-flex flex-column align-items-center justify-content-center p-20" style={{ flex: 1 }}>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center h-100">
            <p className="text-secondary-light text-sm mb-0">급식 정보를 불러오는 중...</p>
          </div>
        ) : meal ? (
          <>
            {/* [soojin] 메뉴를 쉼표 구분 한 단락으로 표시 (학부모 대시보드 형태) */}
            <p className="text-sm mb-12 text-center" style={{ color: '#374151', lineHeight: 1.7 }}>
              {menuItems.map(item => item.name).join(', ')}
            </p>

            {/* [soojin] 칼로리(좌) + 알레르기 버튼(우) — 메뉴명과 사진 사이 */}
            <div style={{ display: 'flex', gap: 8, width: '100%', marginBottom: 16 }}>
              {meal.calories && (
                <span style={{
                  flex: 1, textAlign: 'center',
                  background: '#25A194', color: 'white',
                  borderRadius: 20, padding: '5px 0',
                  fontSize: 12, fontWeight: 500,
                }}>
                  칼로리: {meal.calories} kcal
                </span>
              )}
              <button
                onClick={() => setShowAllergy(true)}
                style={{
                  flex: 1, textAlign: 'center',
                  background: '#fef3c7', color: '#b45309',
                  border: 'none', borderRadius: 20, padding: '5px 0',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                알레르기 정보
              </button>
            </div>

            {/* [soojin] 알레르기 정보 모달 오버레이 */}
            {showAllergy && (
              <div
                onClick={() => setShowAllergy(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 1050,
                  background: 'rgba(0,0,0,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    background: 'white', borderRadius: 16,
                    padding: '24px', width: 320, maxWidth: '90vw',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>알레르기 정보</span>
                    <button
                      onClick={() => setShowAllergy(false)}
                      style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' }}
                    >
                      ×
                    </button>
                  </div>
                  {allergyEntries.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', margin: 0 }}>
                      알레르기 유발 식품 정보가 없습니다.
                    </p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontWeight: 600, width: 110 }}>알레르기</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>포함 요리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allergyEntries.map(([code, dishes]) => (
                          <tr key={code} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                              <span style={{
                                display: 'inline-block', marginRight: 6,
                                fontSize: 10, fontWeight: 700, color: '#b45309',
                                background: '#fef3c7', borderRadius: 4, padding: '1px 5px',
                              }}>
                                {code}
                              </span>
                              {ALLERGY_NAMES[code] ?? `알레르기 ${code}`}
                            </td>
                            <td style={{ padding: '6px 8px', color: '#374151' }}>
                              {dishes.join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* [soojin] 이미지 플레이스홀더 */}
            <div style={{
              width: '100%', height: 110, borderRadius: 10,
              background: '#f3f4f6', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ri-image-line" style={{ fontSize: 32, color: '#9ca3af' }} />
            </div>
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
