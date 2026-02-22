import { useEffect, useState, useCallback } from 'react'
import type { Schedule, DayKey } from '../shared/types'

// ── 타입 ─────────────────────────────────────────────────────────────────────

interface TodayResponse {
  label: string
  schedules: Schedule[]
}

interface FormData {
  dayOfWeek: DayKey
  period: number
  startTime: string
  endTime: string
  subjectName: string
  className: string
  location: string
  repeatType: 'WEEKLY' | 'BIWEEKLY' | 'ONCE'
  specificDate: string
  memo: string
}

// ── 상수 ─────────────────────────────────────────────────────────────────────

const DAY_OPTIONS: { value: DayKey; label: string }[] = [
  { value: 'MONDAY',    label: '월요일' },
  { value: 'TUESDAY',   label: '화요일' },
  { value: 'WEDNESDAY', label: '수요일' },
  { value: 'THURSDAY',  label: '목요일' },
  { value: 'FRIDAY',    label: '금요일' },
]

// Schoolmate 브랜드 팔레트 (primary, info, warning, success, lilac)
const BORDER_COLORS = ['#25A194', '#04B4FF', '#FF7A2C', '#45B369', '#8252E9']

// ── 유틸 ─────────────────────────────────────────────────────────────────────

/** "09:00:00" → "09:00" */
const fmtTime = (t: string) => t.substring(0, 5)

/** 오늘 요일 키 (주말이면 MONDAY 반환) */
function todayDayKey(): DayKey {
  const map: Record<number, DayKey> = {
    1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY',
  }
  return map[new Date().getDay()] ?? 'MONDAY'
}

function emptyForm(): FormData {
  return {
    dayOfWeek: todayDayKey(),
    period: 1,
    startTime: '09:00',
    endTime: '09:45',
    subjectName: '',
    className: '',
    location: '',
    repeatType: 'WEEKLY',
    specificDate: '',
    memo: '',
  }
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function DashboardScheduleWidget() {
  const [label, setLabel]         = useState('오늘의 수업 일정')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const [showModal, setShowModal]     = useState(false)
  const [editTarget, setEditTarget]   = useState<Schedule | null>(null)
  const [form, setForm]               = useState<FormData>(emptyForm())
  const [submitting, setSubmitting]   = useState(false)

  // ── 데이터 로딩 ────────────────────────────────────────────────────────────

  const fetchToday = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/teacher/schedule/today', { credentials: 'include' })
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`)
      const data: TodayResponse = await res.json()
      setLabel(data.label)
      setSchedules(data.schedules)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '일정을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchToday() }, [fetchToday])

  // ── 모달 제어 ──────────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm(emptyForm())
    setEditTarget(null)
    setShowModal(true)
  }

  const openEdit = (s: Schedule) => {
    setForm({
      dayOfWeek:    s.dayOfWeek,
      period:       s.period,
      startTime:    fmtTime(s.startTime),
      endTime:      fmtTime(s.endTime),
      subjectName:  s.subjectName,
      className:    s.className ?? '',
      location:     s.location ?? '',
      repeatType:   s.repeatType as 'WEEKLY' | 'BIWEEKLY' | 'ONCE',
      specificDate: s.specificDate ?? '',
      memo:         s.memo ?? '',
    })
    setEditTarget(s)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditTarget(null)
  }

  const setField = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.subjectName.trim()) { alert('과목명을 입력해주세요.'); return }
    if (!form.startTime)          { alert('시작 시간을 입력해주세요.'); return }
    if (!form.endTime)            { alert('종료 시간을 입력해주세요.'); return }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        // 빈 문자열 → null 로 변환
        className:    form.className    || null,
        location:     form.location     || null,
        specificDate: form.specificDate || null,
        memo:         form.memo         || null,
      }
      const url    = editTarget ? `/api/teacher/schedule/${editTarget.id}` : '/api/teacher/schedule'
      const method = editTarget ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || '저장에 실패했습니다.')
      }
      closeModal()
      await fetchToday()
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/teacher/schedule/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('삭제 실패')
      setSchedules(prev => prev.filter(s => s.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 중 오류가 발생했습니다.')
    }
  }

  // ── 렌더 ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* 카드 */}
      <div style={css.card}>

        {/* 헤더 */}
        <div style={css.cardHeader}>
          <h6 style={css.cardTitle}>
            <span style={{ marginRight: 6 }}>📅</span>
            {label}
          </h6>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={openAdd} style={css.addBtn}>+ 일정 추가</button>
            <a href="/teacher/schedule" style={css.manageLink}>일정 관리 →</a>
          </div>
        </div>

        {/* 본문 */}
        <div style={css.cardBody}>
          {loading ? (
            <div style={css.center}>
              <div style={css.spinner} />
              <p style={{ color: '#9ca3af', marginTop: 10, fontSize: 13 }}>불러오는 중...</p>
            </div>
          ) : error ? (
            <div style={css.errorBox}>
              ⚠ {error}
              <button onClick={fetchToday} style={css.retryBtn}>다시 시도</button>
            </div>
          ) : schedules.length === 0 ? (
            <div style={css.empty}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 12 }}>
                {label}이 없습니다
              </p>
              <button onClick={openAdd} style={css.addBtn}>+ 일정 등록하기</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {schedules.map((s, idx) => (
                <ScheduleCard
                  key={s.id}
                  schedule={s}
                  color={BORDER_COLORS[idx % BORDER_COLORS.length]}
                  onEdit={() => openEdit(s)}
                  onDelete={() => handleDelete(s.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 모달 오버레이 */}
      {showModal && (
        <ScheduleModal
          form={form}
          isEdit={!!editTarget}
          submitting={submitting}
          onChangeField={setField}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </>
  )
}

// ── 일정 카드 ─────────────────────────────────────────────────────────────────

function ScheduleCard({
  schedule: s,
  color,
  onEdit,
  onDelete,
}: {
  schedule: Schedule
  color: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ ...css.scheduleBar, borderLeftColor: color }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ ...css.periodBadge, background: color + '22', color }}>
            {s.period}교시
          </span>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{s.subjectName}</span>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          {fmtTime(s.startTime)} - {fmtTime(s.endTime)}
          {s.className && <span style={{ marginLeft: 8 }}>| {s.className}</span>}
          {s.location  && <span style={{ marginLeft: 6 }}>| {s.location}</span>}
        </div>
        {s.memo && (
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>📝 {s.memo}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button onClick={onEdit}   style={css.editIconBtn}   title="수정">✏</button>
        <button onClick={onDelete} style={css.deleteIconBtn} title="삭제">🗑</button>
      </div>
    </div>
  )
}

// ── 모달 ──────────────────────────────────────────────────────────────────────

function ScheduleModal({
  form,
  isEdit,
  submitting,
  onChangeField,
  onSubmit,
  onClose,
}: {
  form: FormData
  isEdit: boolean
  submitting: boolean
  onChangeField: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  onSubmit: () => void
  onClose: () => void
}) {
  return (
    <div style={css.overlay} onClick={onClose}>
      <div style={css.modal} onClick={e => e.stopPropagation()}>

        {/* 모달 헤더 */}
        <div style={css.modalHeader}>
          <h6 style={{ margin: 0, fontWeight: 600 }}>
            {isEdit ? '일정 수정' : '일정 추가'}
          </h6>
          <button onClick={onClose} style={css.closeBtn}>✕</button>
        </div>

        {/* 모달 바디 */}
        <div style={css.modalBody}>

          {/* 요일 + 교시 */}
          <div style={css.row2}>
            <div style={css.formGroup}>
              <label style={css.label}>요일</label>
              <select
                style={css.select}
                value={form.dayOfWeek}
                onChange={e => onChangeField('dayOfWeek', e.target.value as DayKey)}
              >
                {DAY_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div style={css.formGroup}>
              <label style={css.label}>교시</label>
              <input
                type="number" min={1} max={8}
                style={css.input}
                value={form.period}
                onChange={e => onChangeField('period', Number(e.target.value))}
              />
            </div>
          </div>

          {/* 시작/종료 시간 */}
          <div style={css.row2}>
            <div style={css.formGroup}>
              <label style={css.label}>시작 시간</label>
              <input
                type="time" style={css.input}
                value={form.startTime}
                onChange={e => onChangeField('startTime', e.target.value)}
              />
            </div>
            <div style={css.formGroup}>
              <label style={css.label}>종료 시간</label>
              <input
                type="time" style={css.input}
                value={form.endTime}
                onChange={e => onChangeField('endTime', e.target.value)}
              />
            </div>
          </div>

          {/* 과목명 */}
          <div style={css.formGroup}>
            <label style={css.label}>과목명 <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text" placeholder="예: 수학"
              style={css.input}
              value={form.subjectName}
              onChange={e => onChangeField('subjectName', e.target.value)}
            />
          </div>

          {/* 학급 + 장소 */}
          <div style={css.row2}>
            <div style={css.formGroup}>
              <label style={css.label}>학급</label>
              <input
                type="text" placeholder="예: 1학년 2반"
                style={css.input}
                value={form.className}
                onChange={e => onChangeField('className', e.target.value)}
              />
            </div>
            <div style={css.formGroup}>
              <label style={css.label}>장소</label>
              <input
                type="text" placeholder="예: 3-2 교실"
                style={css.input}
                value={form.location}
                onChange={e => onChangeField('location', e.target.value)}
              />
            </div>
          </div>

          {/* 반복 유형 */}
          <div style={css.formGroup}>
            <label style={css.label}>반복</label>
            <select
              style={css.select}
              value={form.repeatType}
              onChange={e => onChangeField('repeatType', e.target.value as FormData['repeatType'])}
            >
              <option value="WEEKLY">매주</option>
              <option value="BIWEEKLY">2주마다</option>
              <option value="ONCE">특정 날짜만</option>
            </select>
          </div>

          {/* 특정 날짜 (ONCE 선택 시만 표시) */}
          {form.repeatType === 'ONCE' && (
            <div style={css.formGroup}>
              <label style={css.label}>날짜</label>
              <input
                type="date" style={css.input}
                value={form.specificDate}
                onChange={e => onChangeField('specificDate', e.target.value)}
              />
            </div>
          )}

          {/* 메모 */}
          <div style={css.formGroup}>
            <label style={css.label}>메모</label>
            <textarea
              rows={2} placeholder="간단한 메모 (선택)"
              style={{ ...css.input, resize: 'vertical' }}
              value={form.memo}
              onChange={e => onChangeField('memo', e.target.value)}
            />
          </div>
        </div>

        {/* 모달 푸터 */}
        <div style={css.modalFooter}>
          <button onClick={onClose} style={css.cancelBtn} disabled={submitting}>취소</button>
          <button onClick={onSubmit} style={css.saveBtn} disabled={submitting}>
            {submitting ? '저장 중...' : (isEdit ? '수정 완료' : '등록')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 스타일 ────────────────────────────────────────────────────────────────────

const css: Record<string, React.CSSProperties> = {
  card: {
    background: 'white',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
  },
  cardBody: {
    padding: '20px',
    overflowY: 'auto',
    maxHeight: 460,
  },
  addBtn: {
    background: '#25A194',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  manageLink: {
    color: '#6b7280',
    fontSize: 13,
    textDecoration: 'none',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #25A194',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    padding: '14px 16px',
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#b91c1c',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 14,
  },
  retryBtn: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    padding: '4px 12px',
    cursor: 'pointer',
    fontSize: 13,
  },
  empty: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  scheduleBar: {
    flex: 1,
    paddingLeft: 12,
    borderLeft: '3px solid #e5e7eb',
  },
  periodBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 4,
  },
  editIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: '#E6F7F5',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: '#fee2e2',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 모달
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    background: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    margin: '0 16px',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '14px 20px',
    borderTop: '1px solid #e5e7eb',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 16,
    cursor: 'pointer',
    color: '#6b7280',
    padding: 4,
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
  },
  input: {
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  select: {
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    background: 'white',
  } as React.CSSProperties,
  cancelBtn: {
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: 6,
    padding: '8px 20px',
    cursor: 'pointer',
    fontSize: 14,
  },
  saveBtn: {
    background: '#25A194',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    padding: '8px 20px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
  },
}
