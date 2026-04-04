import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '@/shared/api/authApi'
import { useAuth } from '@/shared/contexts/AuthContext'
import DashboardLayout from '@/shared/components/layout/DashboardLayout'

// [woo] 과제/퀴즈 통합 목록 페이지
// - /homework → 과제 목록, /quiz → 퀴즈 목록
// - 교사: 내가 출제한 목록 / 학생: 내 학급 목록

// ========== 타입 ==========
interface Homework {
  id: number
  title: string
  teacherName: string
  classroomName: string
  classroomId: number
  status: 'OPEN' | 'CLOSED' | 'GRADED'
  dueDate: string
  hasAttachment: boolean
  maxScore: number
  submissionCount: number
  totalStudentCount: number
  createDate: string
  submitted?: boolean
  score?: number | null
  feedback?: string | null
  submissionStatus?: 'SUBMITTED' | 'LATE' | 'GRADED' | null
}

interface Quiz {
  id: number
  title: string
  description: string | null
  week: number | null
  teacherName: string
  classroomName: string
  classroomId: number
  status: 'OPEN' | 'CLOSED'
  dueDate: string
  questionCount: number
  totalPoints: number
  maxAttempts: number | null
  showAnswer: boolean
  createDate: string
  myAttemptCount?: number | null
  myBestScore?: number | null
}

// [soojin] 뱃지 인라인 스타일 - TeacherList 동일 패턴
const badgeBase: React.CSSProperties = { padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }
const HW_BADGE: Record<string, React.CSSProperties> = {
  OPEN:   { background: 'rgba(22,163,74,0.1)',  color: '#16a34a' },
  CLOSED: { background: 'rgba(239,68,68,0.1)',  color: '#dc2626' },
  GRADED: { background: 'rgba(14,165,233,0.1)', color: '#0284c7' },
}
const HW_LABEL: Record<string, string> = { OPEN: '진행중', CLOSED: '마감', GRADED: '채점완료' }
const QZ_BADGE: Record<string, React.CSSProperties> = {
  OPEN:   { background: 'rgba(22,163,74,0.1)', color: '#16a34a' },
  CLOSED: { background: 'rgba(239,68,68,0.1)', color: '#dc2626' },
}
const QZ_LABEL: Record<string, string> = { OPEN: '진행중', CLOSED: '마감' }

// [soojin] th/td 공통 스타일 - TeacherList 동일 패턴
const thSt: React.CSSProperties = {
  padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#6b7280',
  background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left',
}
const tdSt: React.CSSProperties = {
  padding: '12px 16px', fontSize: 13, color: '#374151',
  borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', whiteSpace: 'nowrap',
}

export default function HomeworkList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const role = user?.role ?? ''
  const isTeacher = role === 'TEACHER'
  const isStudent = role === 'STUDENT'

  // [soojin] URL 경로로 탭 결정: /quiz → 퀴즈 전용, /homework → 과제 전용
  const activeTab = pathname === '/quiz' ? 'quiz' : 'homework'

  const [totalAll, setTotalAll] = useState<number | null>(null)
  const isInitialLoad = useRef(true)
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [revealedStudentScores, setRevealedStudentScores] = useState<Set<number>>(new Set())

  const toggleStudentScore = (hwId: number) => {
    setRevealedStudentScores(prev => {
      const next = new Set(prev)
      if (next.has(hwId)) next.delete(hwId)
      else next.add(hwId)
      return next
    })
  }

  // [soojin] ovStatus/ovKeyword: reset 시 state 업데이트 전 API 호출 대응
  const load = (p = 0, ovStatus?: string, ovKeyword?: string) => {
    const s = ovStatus !== undefined ? ovStatus : status
    const k = ovKeyword !== undefined ? ovKeyword : keyword
    setLoading(true)
    const endpoint = activeTab === 'homework'
      ? (isTeacher ? '/homework/teacher' : '/homework/student')
      : (isTeacher ? '/quiz/teacher' : '/quiz/student')
    api.get(endpoint, { params: { page: p, size: 10, status: s || undefined, keyword: k || undefined } })
      .then(res => {
        if (activeTab === 'homework') setHomeworks(res.data.content)
        else setQuizzes(res.data.content)
        setTotalPages(res.data.totalPages ?? 1)
        setTotalElements(res.data.totalElements ?? 0)
        setCurrentPage(res.data.currentPage ?? p)
        if (isInitialLoad.current) { setTotalAll(res.data.totalElements); isInitialLoad.current = false }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const search = (e: React.FormEvent) => { e.preventDefault(); load(0) }
  const reset = () => { setStatus(''); setKeyword(''); load(0, '', '') }
  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date()

  const statusOptions = activeTab === 'homework'
    ? [{ v: 'OPEN', l: '진행중' }, { v: 'CLOSED', l: '마감' }, { v: 'GRADED', l: '채점완료' }]
    : [{ v: 'OPEN', l: '진행중' }, { v: 'CLOSED', l: '마감' }]

  const selSt: React.CSSProperties = {
    padding: '5px 24px 5px 8px', border: '1px solid #d1d5db', borderRadius: 6,
    fontSize: 13, background: '#fff', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
  }

  return (
    <DashboardLayout>
      {/* [soojin] 화면 꽉 채우기 - TeacherList 동일 패턴 */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4.5rem - 48px)' }}>

        {/* 제목 */}
        <div style={{ marginBottom: 12, flexShrink: 0 }}>
          <h6 style={{ fontWeight: 700, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            {activeTab === 'homework' ? '과제 목록' : '퀴즈 목록'}
            <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>전체 {totalAll ?? 0}건</span>
          </h6>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            {activeTab === 'homework'
              ? (isTeacher ? '출제한 과제 목록입니다.' : '과제 목록입니다.')
              : (isTeacher ? '출제한 퀴즈 목록입니다.' : '퀴즈 목록입니다.')}
          </p>
        </div>

        {/* [soojin] 탭 - 클릭 시 전용 라우트로 이동 */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 12, flexShrink: 0 }}>
          {(['homework', 'quiz'] as const).map(tab => (
            <button
              key={tab}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? '#25A194' : '#6b7280',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #25A194' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: -1,
              }}
              onClick={() => navigate(tab === 'homework' ? '/homework' : '/quiz')}
            >
              <i className={tab === 'homework' ? 'ri-draft-line' : 'ri-question-answer-line'} style={{ marginRight: 4 }} />
              {tab === 'homework' ? '과제' : '퀴즈'}
            </button>
          ))}
        </div>

        {/* [soojin] 컨트롤 바: 필터/검색(좌) + 출제 버튼(우) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
          <form style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }} onSubmit={search}>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select style={selSt} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">모든 상태</option>
                {statusOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              <i className="ri-arrow-down-s-line" style={{ position: 'absolute', right: 4, pointerEvents: 'none', fontSize: 16, color: '#6b7280' }} />
            </div>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 8, color: '#9ca3af', fontSize: 13, pointerEvents: 'none' }} />
              <input
                style={{ padding: '5px 8px 5px 28px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, minWidth: 150, background: '#fff' }}
                placeholder="제목 검색"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            <button type="submit" style={{ padding: '5px 12px', background: '#25A194', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              검색
            </button>
            <button type="button" onClick={reset} style={{ padding: '5px 10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}>
              초기화
            </button>
            {(status || keyword) && (
              <span style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600, color: '#111827' }}>{totalElements}건</span> / 전체 {totalAll ?? 0}건
              </span>
            )}
          </form>
          {isTeacher && (
            <button
              type="button"
              style={{ padding: '5px 12px', background: '#25A194', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}
              onClick={() => navigate(activeTab === 'homework' ? '/homework/create' : '/quiz/create')}
            >
              + {activeTab === 'homework' ? '과제 출제' : '퀴즈 출제'}
            </button>
          )}
        </div>

        {/* [soojin] 카드 - flex:1로 화면 꽉 채움 */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', minHeight: 0 }}>

            {/* ===== 과제 테이블 ===== */}
            {activeTab === 'homework' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: 55 }} />
                  <col style={{ width: 240 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 110 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={thSt}>번호</th>
                    <th style={thSt}>제목</th>
                    <th style={thSt}>{isTeacher ? '학급' : '출제 교사'}</th>
                    <th style={thSt}>마감일</th>
                    <th style={thSt}>상태</th>
                    <th style={thSt}>{isTeacher ? '제출 현황' : '제출 여부'}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ ...tdSt, textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>불러오는 중...</td></tr>
                  ) : homeworks.length === 0 ? (
                    <tr><td colSpan={6} style={{ ...tdSt, textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>등록된 과제가 없습니다.</td></tr>
                  ) : homeworks.map((hw, i) => {
                    const isGraded = hw.status === 'GRADED'
                    const isStudentRevealed = isStudent && revealedStudentScores.has(hw.id)
                    return (
                      <Fragment key={hw.id}>
                        <tr>
                          <td style={tdSt}>{totalElements - currentPage * 10 - i}</td>
                          <td style={{ ...tdSt, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Link to={`/homework/${hw.id}`} style={{ color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>
                              {hw.title}
                              {hw.hasAttachment && <i className="ri-attachment-2" style={{ marginLeft: 4, color: '#9ca3af' }} />}
                            </Link>
                          </td>
                          <td style={{ ...tdSt, color: '#6b7280' }}>{isTeacher ? hw.classroomName : hw.teacherName}</td>
                          <td style={{ ...tdSt, color: isOverdue(hw.dueDate) ? '#dc2626' : '#6b7280' }}>{hw.dueDate?.slice(0, 10)}</td>
                          <td style={tdSt}>
                            {isGraded && isStudent ? (
                              <span
                                style={{ ...badgeBase, ...HW_BADGE[hw.status], cursor: 'pointer' }}
                                onClick={() => toggleStudentScore(hw.id)}
                                title="클릭하여 점수 확인"
                              >
                                {isStudentRevealed ? HW_LABEL[hw.status] : `${HW_LABEL[hw.status]} (점수확인)`}
                              </span>
                            ) : (
                              <span style={{ ...badgeBase, ...(HW_BADGE[hw.status] ?? HW_BADGE.OPEN) }}>{HW_LABEL[hw.status] ?? '진행중'}</span>
                            )}
                          </td>
                          <td style={tdSt}>
                            {isTeacher ? (
                              <span style={{ color: '#6b7280' }}>{hw.submissionCount}/{hw.totalStudentCount}</span>
                            ) : hw.submitted ? (
                              <span style={{ ...badgeBase, background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>제출완료</span>
                            ) : (
                              <span style={{ ...badgeBase, background: 'rgba(234,179,8,0.1)', color: '#ca8a04' }}>미제출</span>
                            )}
                          </td>
                        </tr>
                        {isStudentRevealed && hw.submissionStatus === 'GRADED' && (
                          <tr key={`${hw.id}-myscore`}>
                            <td colSpan={6} style={{ padding: 0 }}>
                              <div style={{ padding: '12px 16px', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>내 점수:</span>
                                <span style={{ fontWeight: 700, color: '#25A194', fontSize: 15 }}>
                                  {hw.score !== null && hw.score !== undefined ? `${hw.score}/${hw.maxScore ?? 100}` : '-'}
                                </span>
                                {hw.feedback && (
                                  <>
                                    <span style={{ color: '#9ca3af' }}>|</span>
                                    <span style={{ fontSize: 13 }}><span style={{ fontWeight: 600 }}>피드백:</span> {hw.feedback}</span>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            )}

            {/* ===== 퀴즈 테이블 ===== */}
            {activeTab === 'quiz' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: 55 }} />
                  <col style={{ width: 200 }} />
                  <col style={{ width: 70 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 80 }} />
                  <col style={{ width: 70 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 90 }} />
                  {isStudent && <col style={{ width: 90 }} />}
                </colgroup>
                <thead>
                  <tr>
                    <th style={thSt}>번호</th>
                    <th style={thSt}>제목</th>
                    <th style={thSt}>주차</th>
                    <th style={thSt}>{isTeacher ? '학급' : '출제 교사'}</th>
                    <th style={thSt}>문제수</th>
                    <th style={thSt}>총점</th>
                    <th style={thSt}>마감일</th>
                    <th style={thSt}>상태</th>
                    {isStudent && <th style={thSt}>내 성적</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={isStudent ? 9 : 8} style={{ ...tdSt, textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>불러오는 중...</td></tr>
                  ) : quizzes.length === 0 ? (
                    <tr><td colSpan={isStudent ? 9 : 8} style={{ ...tdSt, textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>등록된 퀴즈가 없습니다.</td></tr>
                  ) : quizzes.map((q, i) => (
                    <tr key={q.id}>
                      <td style={tdSt}>{totalElements - currentPage * 10 - i}</td>
                      <td style={{ ...tdSt, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Link to={`/quiz/${q.id}`} style={{ color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>
                          {q.title}
                        </Link>
                      </td>
                      <td style={{ ...tdSt, color: '#6b7280' }}>{q.week ? `${q.week}주차` : '-'}</td>
                      <td style={{ ...tdSt, color: '#6b7280' }}>{isTeacher ? q.classroomName : q.teacherName}</td>
                      <td style={{ ...tdSt, color: '#6b7280' }}>{q.questionCount}문제</td>
                      <td style={{ ...tdSt, color: '#6b7280' }}>{q.totalPoints}점</td>
                      <td style={{ ...tdSt, color: isOverdue(q.dueDate) ? '#dc2626' : '#6b7280' }}>{q.dueDate?.slice(0, 10)}</td>
                      <td style={tdSt}>
                        <span style={{ ...badgeBase, ...(QZ_BADGE[q.status] ?? QZ_BADGE.OPEN) }}>{QZ_LABEL[q.status] ?? '진행중'}</span>
                      </td>
                      {isStudent && (
                        <td style={tdSt}>
                          {q.myAttemptCount != null && q.myAttemptCount > 0
                            ? <span style={{ fontWeight: 700, color: '#25A194' }}>{q.myBestScore}/{q.totalPoints}</span>
                            : <span style={{ color: '#9ca3af' }}>미응시</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </div>

        {/* [soojin] 페이지네이션 - 카드 밖, 우측 정렬, 28×28 정사각형 */}
        {totalPages >= 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 0', gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => load(currentPage - 1)}
              disabled={currentPage === 0}
              style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', color: currentPage === 0 ? '#d1d5db' : '#374151', fontSize: 12 }}
            >‹</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => load(i)}
                style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${i === currentPage ? '#25A194' : '#e5e7eb'}`, borderRadius: 6, background: i === currentPage ? '#25A194' : '#fff', color: i === currentPage ? '#fff' : '#374151', cursor: 'pointer', fontSize: 12, fontWeight: i === currentPage ? 600 : 400 }}
              >{i + 1}</button>
            ))}
            <button
              onClick={() => load(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer', color: currentPage >= totalPages - 1 ? '#d1d5db' : '#374151', fontSize: 12 }}
            >›</button>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
