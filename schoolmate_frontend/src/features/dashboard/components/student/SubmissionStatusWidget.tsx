// [soojin] 과제/퀴즈 제출 현황 위젯
// GET /api/homework/student?page=0&size=10 → { content: [{ id, title, classroomName, teacherName, status, dueDate, submitted }] }
// GET /api/quiz/student?page=0&size=10    → { content: [{ id, title, classroomName, teacherName, status, dueDate, myAttemptCount }] }

import { useEffect, useState } from 'react'
import api from '@/shared/api/authApi'

const C = {
  hw:           '#25A194',
  hwLight:      '#e6f7f6',
  qz:           '#5B8DEF',
  qzLight:      '#eaf0fe',
  done:         '#25A194',
  doneLight:    '#e6f7f6',
  pending:      '#f97316',
  pendingLight: '#fff3e0',
  miss:         '#e55353',
  missLight:    '#fdecea',
  closed:       '#9ca3af',
  closedLight:  '#f3f4f6',
  divider:      '#f3f4f6',
  rowText:      '#374151',
  subText:      '#9ca3af',
}

interface HomeworkItem {
  id: number
  title: string
  subjectName: string
  teacherName: string
  createDate: string | null
  dueDate: string | null
  submitted: boolean
  status: 'OPEN' | 'CLOSED'
}

interface QuizItem {
  id: number
  title: string
  subjectName: string
  teacherName: string
  createDate: string | null
  dueDate: string | null
  myAttemptCount: number | null
  status: 'OPEN' | 'CLOSED'
}

function formatDate(dueDate: string | null) {
  if (!dueDate) return '-'
  const d = new Date(dueDate)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getDDay(dueDate: string | null) {
  if (!dueDate) return null
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
  if (diff < 0)   return { label: '종료',     color: C.closed }
  if (diff === 0) return { label: 'D-Day',    color: C.miss }
  if (diff <= 3)  return { label: `D-${diff}`, color: C.pending }
  return           { label: `D-${diff}`,      color: C.subText }
}

function HwRow({ item, last }: { item: HomeworkItem; last: boolean }) {
  const isClosed  = item.status === 'CLOSED'
  const dday      = isClosed ? null : getDDay(item.dueDate)
  const canSubmit = !item.submitted && !isClosed

  // 미제출(OPEN): 우측 상단 과제 칩과 동일한 색 (C.hwLight / C.hw)
  let statusBg = C.hwLight, statusColor = C.hw, statusLabel = '미제출'
  if (item.submitted)  { statusBg = C.doneLight;  statusColor = C.done;  statusLabel = '제출완료' }
  else if (isClosed)   { statusBg = C.missLight;   statusColor = C.miss;  statusLabel = '미제출' }

  return (
    <div style={{ borderBottom: last ? 'none' : `1px solid ${C.divider}`, padding: '10px 0' }}>
      {/* 제목 행: 제목 | D-day | 상태 | 버튼 */}
      <div className="d-flex align-items-center gap-8 mb-4">
        <span
          className="fw-medium flex-grow-1"
          style={{ fontSize: 13, color: C.rowText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {item.title}
        </span>
        {/* D-day: 과제 섹션 타이틀 색(C.hw), 상태 앞 */}
        {dday && (
          <span className="fw-semibold flex-shrink-0" style={{ fontSize: 10, color: C.hw }}>{dday.label}</span>
        )}
        <span
          className="fw-semibold flex-shrink-0"
          style={{ background: statusBg, color: statusColor, borderRadius: 4, padding: '2px 7px', fontSize: 10, minWidth: 44, textAlign: 'center' }}
        >
          {statusLabel}
        </span>
        {canSubmit && (
          <a
            href={`/homework/${item.id}`}
            className="flex-shrink-0"
            style={{ background: C.hw, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'none' }}
          >
            제출하기
          </a>
        )}
      </div>
      {/* 메타 정보 */}
      <div className="d-flex align-items-center gap-8">
        <span style={{ fontSize: 11, color: C.subText }}>{item.subjectName}</span>
        <span style={{ fontSize: 11, color: C.divider }}>|</span>
        <span style={{ fontSize: 11, color: C.subText }}>{item.teacherName} 선생님</span>
        <span style={{ fontSize: 11, color: C.divider }}>|</span>
        <span style={{ fontSize: 11, color: C.subText }}>{formatDate(item.createDate)}-{formatDate(item.dueDate)}</span>
      </div>
    </div>
  )
}

function QzRow({ item, last }: { item: QuizItem; last: boolean }) {
  const isClosed    = item.status === 'CLOSED'
  const attempted   = (item.myAttemptCount ?? 0) > 0
  const dday        = isClosed ? null : getDDay(item.dueDate)
  const canAttempt  = !attempted && !isClosed

  const statusBg    = attempted ? C.doneLight  : isClosed ? C.closedLight  : C.qzLight
  const statusColor = attempted ? C.done        : isClosed ? C.closed        : C.qz
  const statusLabel = attempted ? '응시완료'     : isClosed ? '마감'          : '미응시'

  return (
    <div style={{ borderBottom: last ? 'none' : `1px solid ${C.divider}`, padding: '10px 0' }}>
      {/* 제목 행: 제목 | D-day | 상태 | 버튼 */}
      <div className="d-flex align-items-center gap-8 mb-4">
        <span
          className="fw-medium flex-grow-1"
          style={{ fontSize: 13, color: C.rowText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {item.title}
        </span>
        {/* D-day: 퀴즈 섹션 타이틀 색(C.qz), 상태 앞 */}
        {dday && (
          <span className="fw-semibold flex-shrink-0" style={{ fontSize: 10, color: C.qz }}>{dday.label}</span>
        )}
        <span
          className="fw-semibold flex-shrink-0"
          style={{ background: statusBg, color: statusColor, borderRadius: 4, padding: '2px 7px', fontSize: 10, minWidth: 44, textAlign: 'center' }}
        >
          {statusLabel}
        </span>
        {canAttempt && (
          <a
            href={`/quiz/${item.id}`}
            className="flex-shrink-0"
            style={{ background: C.qz, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'none' }}
          >
            응시하기
          </a>
        )}
      </div>
      {/* 메타 정보 */}
      <div className="d-flex align-items-center gap-8">
        <span style={{ fontSize: 11, color: C.subText }}>{item.subjectName}</span>
        <span style={{ fontSize: 11, color: C.divider }}>|</span>
        <span style={{ fontSize: 11, color: C.subText }}>{item.teacherName} 선생님</span>
        <span style={{ fontSize: 11, color: C.divider }}>|</span>
        <span style={{ fontSize: 11, color: C.subText }}>{formatDate(item.createDate)}-{formatDate(item.dueDate)}</span>
      </div>
    </div>
  )
}

export default function SubmissionStatusWidget() {
  const [hwItems, setHwItems] = useState<HomeworkItem[]>([])
  const [qzItems, setQzItems] = useState<QuizItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/homework/student?page=0&size=10').catch(() => ({ data: { content: [] } })),
      api.get('/quiz/student?page=0&size=10').catch(() => ({ data: { content: [] } })),
    ])
      .then(([hwRes, qzRes]) => {
        setHwItems(
          (hwRes.data?.content ?? []).map((h: any) => ({
            id:            h.id,
            title:         h.title,
            subjectName: h.subjectName ?? '',
            teacherName:   h.teacherName ?? '',
            createDate:    h.createDate ?? null,
            dueDate:       h.dueDate ?? null,
            submitted:     h.submitted ?? false,
            status:        h.status,
          }))
        )
        setQzItems(
          (qzRes.data?.content ?? []).map((q: any) => ({
            id:             q.id,
            title:          q.title,
            subjectName:  q.subjectName ?? '',
            teacherName:    q.teacherName ?? '',
            createDate:     q.createDate ?? null,
            dueDate:        q.dueDate ?? null,
            myAttemptCount: q.myAttemptCount ?? 0,
            status:         q.status,
          }))
        )
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: '1px solid #e5e7eb' }}>

      {/* 헤더 */}
      <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-file-list-3-line text-primary-600 me-2" />
          과제/퀴즈 현황
        </h6>
        {!loading && (
          <div className="d-flex gap-8">
            <span className="fw-semibold" style={{ background: C.hwLight, color: C.hw, borderRadius: 20, padding: '1px 10px', fontSize: 11 }}>
              과제 {hwItems.length}
            </span>
            <span className="fw-semibold" style={{ background: C.qzLight, color: C.qz, borderRadius: 20, padding: '1px 10px', fontSize: 11 }}>
              퀴즈 {qzItems.length}
            </span>
          </div>
        )}
      </div>

      {/* 본문 — 2열 */}
      {loading ? (
        <p className="text-secondary-light text-sm text-center py-20 mb-0">불러오는 중...</p>
      ) : (
        <div className="d-flex" style={{ height: 'calc(100% - 53px)' }}>

          {/* 과제 열 */}
          <div className="p-16 flex-grow-1" style={{ width: '50%', borderRight: `1px solid ${C.divider}`, overflowY: 'auto' }}>
            {/* 섹션 제목 — 리스트보다 큰 사이즈, 아이콘 없음 */}
            <p className="fw-bold mb-12" style={{ fontSize: 15, color: C.hw }}>과제</p>
            {hwItems.length > 0
              ? hwItems.map((item, i) => <HwRow key={item.id} item={item} last={i === hwItems.length - 1} />)
              : <p className="text-secondary-light text-sm text-center py-20 mb-0">등록된 과제가 없습니다.</p>
            }
          </div>

          {/* 퀴즈 열 */}
          <div className="p-16 flex-grow-1" style={{ width: '50%', overflowY: 'auto' }}>
            {/* 섹션 제목 — 리스트보다 큰 사이즈, 아이콘 없음 */}
            <p className="fw-bold mb-12" style={{ fontSize: 15, color: C.qz }}>퀴즈</p>
            {qzItems.length > 0
              ? qzItems.map((item, i) => <QzRow key={item.id} item={item} last={i === qzItems.length - 1} />)
              : <p className="text-secondary-light text-sm text-center py-20 mb-0">등록된 퀴즈가 없습니다.</p>
            }
          </div>

        </div>
      )}
    </div>
  )
}
