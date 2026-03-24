/**
 * 급식 정보 클라이언트 메모리 캐시
 *
 * - 브라우저 탭이 열려 있는 동안 유지 (탭 닫으면 자동 소멸)
 * - 날짜별로 캐싱 → 날짜가 바뀌면 자동으로 새로 요청
 * - 서버 DB 저장 없음, 브라우저 localStorage 사용 없음
 */

export interface MealInfo {
  menu: string      // 메뉴 (줄바꿈 구분)
  calories: string  // 칼로리 (예: "645")
  mealType: string  // 급식 구분 (예: "중식")
}

// 캐시 저장소: { "2025-03-23": MealInfo | null }
// null = 해당 날짜에 급식 정보 없음 (재요청 방지)
const cache: Record<string, MealInfo | null> = {}

function todayKey(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/**
 * 당일 급식 정보를 반환합니다.
 * 캐시가 있으면 API 호출 없이 즉시 반환하고,
 * 없으면 /api/neis/meal/today 를 호출한 뒤 캐싱합니다.
 *
 * @param schoolId 학교 ID — 다중 학교 지원을 위해 캐시 키에 포함
 */
export async function getTodayMeal(schoolId?: number | null): Promise<MealInfo | null> {
  const key = schoolId != null ? `${schoolId}-${todayKey()}` : todayKey()

  // 캐시 HIT (null 포함 — 급식 없는 날도 재요청 방지)
  if (Object.prototype.hasOwnProperty.call(cache, key)) {
    return cache[key]
  }

  try {
    const res = await fetch('/api/neis/meal/today')
    // 200 OK일 때만 JSON 파싱 (204 No Content는 body가 없으므로 json() 호출 불가)
    cache[key] = res.status === 200 ? await res.json() : null
  } catch {
    // 네트워크 오류 시 캐시에 저장하지 않음 → 다음 요청 시 재시도
  }

  return cache[key]
}
