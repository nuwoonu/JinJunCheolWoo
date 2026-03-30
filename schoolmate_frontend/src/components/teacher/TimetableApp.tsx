import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Schedule, DayColumn } from '@/shared/types'
import api from '@/shared/api'

// [woo 03-27] /teacher/schedule — 주간 시간표

const DAYS: DayColumn[] = [
  { key: 'MONDAY',    label: '월요일', shortLabel: '월' },
  { key: 'TUESDAY',   label: '화요일', shortLabel: '화' },
  { key: 'WEDNESDAY', label: '수요일', shortLabel: '수' },
  { key: 'THURSDAY',  label: '목요일', shortLabel: '목' },
  { key: 'FRIDAY',    label: '금요일', shortLabel: '금' },
]

const MAX_PERIOD = 8

// [woo 03-27] 교시별 기본 시간 (50분 수업 + 10분 쉬는시간, 4교시 후 점심)
const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '09:00', end: '09:50' },
  2: { start: '10:00', end: '10:50' },
  3: { start: '11:00', end: '11:50' },
  4: { start: '12:00', end: '12:50' },
  5: { start: '13:50', end: '14:40' },
  6: { start: '14:50', end: '15:40' },
  7: { start: '15:50', end: '16:40' },
  8: { start: '16:50', end: '17:40' },
}

// [woo 03-27] 과목별 색상 — 같은 과목은 같은 색으로 표시
const SUBJECT_PALETTE = [
  { bg: '#eef2ff', border: '#6366f1', text: '#3730a3' },
  { bg: '#ecfdf5', border: '#10b981', text: '#064e3b' },
  { bg: '#fff7ed', border: '#f97316', text: '#7c2d12' },
  { bg: '#fdf2f8', border: '#ec4899', text: '#831843' },
  { bg: '#eff6ff', border: '#3b82f6', text: '#1e3a5f' },
  { bg: '#fefce8', border: '#ca8a04', text: '#713f12' },
  { bg: '#f0fdfa', border: '#14b8a6', text: '#134e4a' },
  { bg: '#faf5ff', border: '#a855f7', text: '#581c87' },
  { bg: '#fff1f2', border: '#f43f5e', text: '#881337' },
  { bg: '#f0f9ff', border: '#0ea5e9', text: '#0c4a6e' },
]

const isTodayDay = (dayKey: string): boolean => {
  const map: Record<number, string> = { 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY' }
  return map[new Date().getDay()] === dayKey
}

export default function TimetableApp() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [hovered, setHovered]     = useState<number | null>(null)

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get<Schedule[]>('/api/teacher/schedule')
      setSchedules(res.data)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '일정을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/api/teacher/schedule/${id}`)
      setSchedules(prev => prev.filter(s => s.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '삭제 중 오류가 발생했습니다.')
    }
  }, [])

  // [woo 03-27] 과목명 → 색상 매핑 (같은 과목은 같은 색)
  const subjectColorMap = useCallback(() => {
    const map = new Map<string, typeof SUBJECT_PALETTE[0]>()
    const subjects = [...new Set(schedules.map(s => s.subjectName))]
    subjects.forEach((name, i) => {
      map.set(name, SUBJECT_PALETTE[i % SUBJECT_PALETTE.length])
    })
    return map
  }, [schedules])

  const colorMap = subjectColorMap()

  /* ── 로딩 ── */
  if (loading) {
    return (
      <div className="card radius-12">
        <div className="card-body d-flex flex-column align-items-center justify-content-center" style={{ padding: '100px 20px' }}>
          <div className="spinner-border text-primary-600" style={{ width: 44, height: 44 }} />
          <p className="text-secondary-light mt-20 mb-0 text-sm">시간표를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  /* ── 에러 ── */
  if (error) {
    return (
      <div className="card radius-12" style={{ borderLeft: '4px solid #ef4444' }}>
        <div className="card-body d-flex align-items-center justify-content-between py-20 px-24">
          <div className="d-flex align-items-center gap-12">
            <i className="ri-error-warning-line text-danger-600" style={{ fontSize: 22 }} />
            <span className="text-sm">{error}</span>
          </div>
          <button onClick={fetchSchedules} className="btn btn-sm btn-outline-danger radius-6">다시 시도</button>
        </div>
      </div>
    )
  }

  /* ── 빈 상태 ── */
  if (schedules.length === 0) {
    return (
      <div className="card radius-12">
        <div className="card-body text-center" style={{ padding: '100px 20px' }}>
          <i className="ri-calendar-schedule-line d-block mb-16" style={{ fontSize: 56, color: '#d1d5db' }} />
          <h5 className="fw-bold mb-8">아직 등록된 수업이 없어요</h5>
          <p className="text-secondary-light mb-24 text-sm" style={{ maxWidth: 300, margin: '0 auto 24px' }}>
            시간표를 등록하면 대시보드에서 오늘의 수업을 한눈에 확인할 수 있어요
          </p>
          <button
            onClick={() => navigate('/teacher/schedule/add')}
            className="btn btn-primary-600 radius-8 d-inline-flex align-items-center gap-6"
          >
            <i className="ri-add-line" />
            첫 수업 등록하기
          </button>
        </div>
      </div>
    )
  }

  /* ── 시간표 ── */
  return (
    <div className="card radius-12">
      {/* 헤더 */}
      <div className="card-header d-flex align-items-center justify-content-between py-16 px-20 border-bottom">
        <h6 className="fw-bold mb-0">
          <i className="ri-calendar-2-line me-8 text-primary-600" />
          주간 시간표
          <span className="text-secondary-light fw-normal text-xs ms-8">총 {schedules.length}개 수업</span>
        </h6>
        <button
          onClick={() => navigate('/teacher/schedule/add')}
          className="btn btn-primary-600 radius-8 btn-sm d-flex align-items-center gap-6"
        >
          <i className="ri-add-line" />
          일정 등록
        </button>
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>
              {/* 시간 헤더 */}
              <th style={{
                width: 100, padding: '16px 12px', textAlign: 'center',
                fontSize: 12, fontWeight: 600,
                borderRight: '1px solid var(--border-color, #e5e7eb)',
                borderBottom: '2px solid var(--border-color, #e5e7eb)',
                color: 'var(--text-secondary-light, #9ca3af)',
              }}>
                시간
              </th>
              {DAYS.map(day => {
                const isToday = isTodayDay(day.key)
                return (
                  <th key={day.key} style={{
                    padding: '16px 8px', textAlign: 'center', minWidth: 130,
                    borderBottom: '2px solid var(--border-color, #e5e7eb)',
                    borderRight: '1px solid var(--border-color, #f3f4f6)',
                    fontWeight: 700, fontSize: 14,
                    color: isToday ? '#0284c7' : undefined,
                  }}>
                    <span>{day.shortLabel}</span>
                    {isToday && (
                      <span
                        style={{
                          display: 'inline-block',
                          background: '#dbeafe',
                          color: '#0284c7',
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          marginLeft: 6,
                          verticalAlign: 'middle',
                        }}
                      >
                        오늘
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: MAX_PERIOD }, (_, i) => i + 1).map(period => {
              const pt = PERIOD_TIMES[period]
              return (
                <>{/* [woo 03-27] 점심시간 구분 */}
                {period === 5 && (
                  <tr key="lunch">
                    <td
                      colSpan={DAYS.length + 1}
                      style={{
                        textAlign: 'center', padding: '12px 0',
                        borderBottom: '1px solid var(--border-color, #e5e7eb)',
                        fontSize: 13, fontWeight: 500,
                        color: 'var(--text-secondary-light, #9ca3af)',
                      }}
                    >
                      점심시간 · 12:50 ~ 13:50
                    </td>
                  </tr>
                )}
                <tr key={period}>
                  {/* 교시 + 시간 */}
                  <td style={{
                    padding: '12px 10px', textAlign: 'center', verticalAlign: 'middle',
                    borderRight: '1px solid var(--border-color, #e5e7eb)',
                    borderBottom: '1px solid var(--border-color, #f3f4f6)',
                    whiteSpace: 'nowrap',
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#25A194', lineHeight: 1 }}>
                      {period}교시
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary-light, #9ca3af)', marginTop: 4 }}>
                      {pt.start} ~ {pt.end}
                    </div>
                  </td>

                  {/* 요일별 수업 */}
                  {DAYS.map(day => {
                    const s = schedules.find(sc => sc.dayOfWeek === day.key && sc.period === period)
                    const isToday = isTodayDay(day.key)
                    const isHover = s ? hovered === s.id : false
                    const c = s ? (colorMap.get(s.subjectName) ?? SUBJECT_PALETTE[0]) : null
                    return (
                      <td key={day.key} style={{
                        padding: '6px', verticalAlign: 'middle', textAlign: 'center',
                        minWidth: 130, height: 80,
                        background: isToday ? 'rgba(2,132,199,0.03)' : undefined,
                        borderRight: '1px solid var(--border-color, #f3f4f6)',
                        borderBottom: '1px solid var(--border-color, #f3f4f6)',
                      }}>
                        {s && c ? (
                          <div
                            onMouseEnter={() => setHovered(s.id)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                              background: c.bg, borderRadius: 8, padding: '8px 10px',
                              borderLeft: `3px solid ${c.border}`, textAlign: 'left',
                              position: 'relative', cursor: 'default',
                              boxShadow: isHover ? `0 4px 12px ${c.border}20` : 'none',
                              transform: isHover ? 'translateY(-1px)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ color: c.text, fontWeight: 700, fontSize: 13, marginBottom: 2, paddingRight: isHover ? 50 : 0 }}>
                              {s.subjectName}
                            </div>
                            {s.className && (
                              <div style={{ color: c.text, opacity: 0.6, fontSize: 11 }}>
                                {s.className}
                              </div>
                            )}
                            {s.location && (
                              <div style={{ color: c.text, opacity: 0.5, fontSize: 10.5, marginTop: 1 }}>
                                {s.location}
                              </div>
                            )}

                            {/* 수정/삭제 — hover 시 */}
                            <div style={{
                              position: 'absolute', top: 6, right: 6,
                              display: 'flex', gap: 3,
                              opacity: isHover ? 1 : 0,
                              transition: 'opacity 0.15s',
                            }}>
                              <button
                                onClick={() => navigate(`/teacher/schedule/edit/${s.id}`)}
                                title="수정"
                                style={{
                                  width: 22, height: 22, borderRadius: 5,
                                  background: 'rgba(255,255,255,0.85)', border: `1px solid ${c.border}25`,
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: c.text, fontSize: 11,
                                }}
                              >
                                <i className="ri-pencil-line" />
                              </button>
                              <button
                                onClick={() => handleDelete(s.id)}
                                title="삭제"
                                style={{
                                  width: 22, height: 22, borderRadius: 5,
                                  background: 'rgba(255,255,255,0.85)', border: '1px solid #fca5a525',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#dc2626', fontSize: 11,
                                }}
                              >
                                <i className="ri-delete-bin-line" />
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
