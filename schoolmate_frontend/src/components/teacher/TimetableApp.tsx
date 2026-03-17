import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Schedule, DayColumn } from '@/shared/types'
import api from '@/shared/api'

// ── 상수 ──────────────────────────────────────────────────────────────────────

const DAYS: DayColumn[] = [
  { key: 'MONDAY',    label: '월요일', shortLabel: '월' },
  { key: 'TUESDAY',   label: '화요일', shortLabel: '화' },
  { key: 'WEDNESDAY', label: '수요일', shortLabel: '수' },
  { key: 'THURSDAY',  label: '목요일', shortLabel: '목' },
  { key: 'FRIDAY',    label: '금요일', shortLabel: '금' },
]

const MAX_PERIOD = 8

// 교시별 색상 (1~8교시 순환)
const PERIOD_COLORS = [
  { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }, // 1 - 파랑
  { bg: '#dcfce7', border: '#22c55e', text: '#166534' }, // 2 - 초록
  { bg: '#fef9c3', border: '#eab308', text: '#713f12' }, // 3 - 노랑
  { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' }, // 4 - 분홍
  { bg: '#ede9fe', border: '#8b5cf6', text: '#4c1d95' }, // 5 - 보라
  { bg: '#ffedd5', border: '#f97316', text: '#7c2d12' }, // 6 - 주황
  { bg: '#e0f2fe', border: '#0ea5e9', text: '#0c4a6e' }, // 7 - 하늘
  { bg: '#f0fdf4', border: '#10b981', text: '#064e3b' }, // 8 - 에메랄드
]

// ── 유틸 ──────────────────────────────────────────────────────────────────────

/** "09:00:00" → "09:00", null/undefined → "?" */
const fmt = (t: string | null | undefined): string => t ? t.substring(0, 5) : '?'

/** 오늘이 해당 요일인지 */
const isTodayDay = (dayKey: string): boolean => {
  const map: Record<number, string> = {
    1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY',
  }
  return map[new Date().getDay()] === dayKey
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function TimetableApp() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get<Schedule[]>('/api/teacher/schedule')
      setSchedules(res.data)
      setError(null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '일정을 불러오지 못했습니다.'
      setError(msg)
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

  // ── 렌더 ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#6b7280', marginTop: 12 }}>일정을 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...styles.alert, background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c' }}>
        ⚠ {error}
        <button onClick={fetchSchedules} style={styles.retryBtn}>다시 시도</button>
      </div>
    )
  }

  if (schedules.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
        <h6 style={{ color: '#374151', marginBottom: 8 }}>등록된 수업 일정이 없습니다</h6>
        <p style={{ color: '#9ca3af', marginBottom: 16, fontSize: 14 }}>
          수업 일정을 등록하면 대시보드에서 오늘의 시간표를 확인할 수 있습니다
        </p>
        <button onClick={() => navigate('/teacher/schedule/add')} style={styles.addBtn}>+ 첫 일정 등록하기</button>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {/* 상단 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => navigate('/teacher/schedule/add')} style={styles.addBtn}>+ 일정 등록</button>
      </div>

      {/* 시간표 테이블 */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              {/* 교시 헤더 */}
              <th style={{ ...styles.th, ...styles.periodHeader, width: 90 }}>교시</th>
              {/* 요일 헤더 */}
              {DAYS.map(day => (
                <th
                  key={day.key}
                  style={{
                    ...styles.th,
                    ...styles.dayHeader,
                    background: isTodayDay(day.key) ? '#04B4FF' : '#25A194',
                    borderBottom: isTodayDay(day.key) ? '3px solid #BAE6FD' : '3px solid transparent',
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{day.shortLabel}</span>
                  {isTodayDay(day.key) && (
                    <span style={styles.todayBadge}>오늘</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: MAX_PERIOD }, (_, i) => i + 1).map(period => {
              const color = PERIOD_COLORS[(period - 1) % PERIOD_COLORS.length]
              return (
                <tr key={period} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  {/* 교시 셀 */}
                  <td style={styles.periodCell}>
                    <span style={{ color: '#25A194', fontWeight: 700, fontSize: 13 }}>
                      {period}교시
                    </span>
                  </td>

                  {/* 요일별 셀 */}
                  {DAYS.map(day => {
                    const s = schedules.find(
                      sc => sc.dayOfWeek === day.key && sc.period === period
                    )
                    return (
                      <td
                        key={day.key}
                        style={{
                          ...styles.cell,
                          background: isTodayDay(day.key) ? '#F0F9FF' : 'white',
                          borderRight: '1px solid #e5e7eb',
                        }}
                      >
                        {s && (
                          <div
                            style={{
                              ...styles.scheduleBlock,
                              background: color.bg,
                              borderLeft: `3px solid ${color.border}`,
                            }}
                          >
                            <div style={{ color: color.text, fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
                              {s.subjectName}
                            </div>
                            {s.className && (
                              <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 2 }}>
                                {s.className}
                              </div>
                            )}
                            <div style={{ color: '#9ca3af', fontSize: 11, marginBottom: 6 }}>
                              {fmt(s.startTime)}~{fmt(s.endTime)}
                            </div>
                            {/* 수정/삭제 버튼 */}
                            <div style={styles.actionRow}>
                              <button
                                onClick={() => navigate(`/teacher/schedule/edit/${s.id}`)}
                                style={styles.editBtn}
                                title="수정"
                              >
                                ✏
                              </button>
                              <button
                                onClick={() => handleDelete(s.id)}
                                style={styles.deleteBtn}
                                title="삭제"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 범례 */}
      <div style={styles.legend}>
        <span style={{ color: '#9ca3af', fontSize: 12 }}>
          ✏ 수정 &nbsp;|&nbsp; 🗑 삭제 &nbsp;|&nbsp;
          <span style={{ background: '#F0F9FF', color: '#04B4FF', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
            오늘 열 강조 표시
          </span>
        </span>
      </div>
    </div>
  )
}

// ── 스타일 ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 0',
  },
  spinner: {
    width: 36, height: 36, border: '3px solid #e5e7eb',
    borderTop: '3px solid #25A194', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  alert: {
    padding: '16px 20px', borderRadius: 8, display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  retryBtn: {
    background: '#ef4444', color: 'white', border: 'none',
    borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13,
  },
  empty: {
    textAlign: 'center', padding: '60px 20px',
    background: 'white', borderRadius: 12, border: '1px solid #e5e7eb',
  },
  addBtn: {
    display: 'inline-block', background: '#25A194', color: 'white',
    padding: '8px 20px', borderRadius: 8, textDecoration: 'none',
    fontSize: 14, fontWeight: 600,
  },
  tableWrapper: {
    background: 'white', borderRadius: 12,
    border: '1px solid #e5e7eb', overflow: 'hidden',
    overflowX: 'auto',
  },
  table: {
    width: '100%', borderCollapse: 'collapse', minWidth: 600,
  },
  th: {
    padding: '14px 10px', textAlign: 'center',
    fontSize: 14, fontWeight: 700,
  },
  periodHeader: {
    background: '#f3f4f6', color: '#374151',
    borderRight: '2px solid #e5e7eb',
  },
  dayHeader: {
    color: 'white', position: 'relative',
  },
  todayBadge: {
    display: 'block', fontSize: 10, fontWeight: 400,
    background: 'rgba(255,255,255,0.25)', borderRadius: 4,
    padding: '1px 6px', marginTop: 3,
  },
  periodCell: {
    padding: '8px', textAlign: 'center',
    background: '#f9fafb', borderRight: '2px solid #e5e7eb',
    minWidth: 70,
  },
  cell: {
    padding: '6px', verticalAlign: 'middle',
    textAlign: 'center', minWidth: 120, height: 100,
  },
  scheduleBlock: {
    borderRadius: 6, padding: '8px 10px',
    display: 'inline-block', width: '90%', textAlign: 'left',
    boxSizing: 'border-box',
  },
  actionRow: {
    display: 'flex', gap: 4, justifyContent: 'flex-end',
  },
  editBtn: {
    width: 24, height: 24, borderRadius: 4,
    background: '#E6F7F5', border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, textDecoration: 'none',
  },
  deleteBtn: {
    width: 24, height: 24, borderRadius: 4,
    background: '#fee2e2', border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12,
  },
  legend: {
    marginTop: 12, textAlign: 'right', padding: '0 4px',
  },
}
