import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../../api/auth'
import { useAuth } from '../../../contexts/AuthContext'
import DashboardLayout from '../../../components/layout/DashboardLayout'

// [woo] 과제/퀴즈 통합 목록 페이지
// - 탭으로 과제 / 퀴즈 전환
// - 교사: 내가 출제한 목록
// - 학생: 내 학급 목록

// ========== 과제 타입 ==========
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

// ========== 퀴즈 타입 ==========
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

const HW_STATUS: Record<string, { text: string; cls: string }> = {
  OPEN: { text: '진행중', cls: 'bg-success-100 text-success-600' },
  CLOSED: { text: '마감', cls: 'bg-danger-100 text-danger-600' },
  GRADED: { text: '채점완료', cls: 'bg-primary-100 text-primary-600' },
}

const QUIZ_STATUS: Record<string, { text: string; cls: string }> = {
  OPEN: { text: '진행중', cls: 'bg-success-100 text-success-600' },
  CLOSED: { text: '마감', cls: 'bg-danger-100 text-danger-600' },
}

export default function HomeworkList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const role = user?.role ?? ''
  const isTeacher = role === 'TEACHER'
  const isStudent = role === 'STUDENT'

  // [woo] 탭 상태 (URL ?tab=quiz 로 유지)
  const activeTab = searchParams.get('tab') === 'quiz' ? 'quiz' : 'homework'
  const setTab = (tab: string) => setSearchParams(tab === 'homework' ? {} : { tab })

  // ========== 과제 상태 ==========
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [hwLoading, setHwLoading] = useState(true)
  const [hwPage, setHwPage] = useState(0)
  const [hwTotalPages, setHwTotalPages] = useState(1)
  const [hwTotalElements, setHwTotalElements] = useState(0)
  const [revealedStudentScores, setRevealedStudentScores] = useState<Set<number>>(new Set())

  const toggleStudentScore = (hwId: number) => {
    setRevealedStudentScores(prev => {
      const next = new Set(prev)
      if (next.has(hwId)) next.delete(hwId)
      else next.add(hwId)
      return next
    })
  }

  const fetchHomeworks = (p = 0) => {
    setHwLoading(true)
    const endpoint = isTeacher ? '/homework/teacher' : '/homework/student'
    api.get(`${endpoint}?page=${p}&size=10`)
      .then(res => {
        setHomeworks(res.data.content)
        setHwTotalPages(res.data.totalPages)
        setHwTotalElements(res.data.totalElements)
        setHwPage(res.data.currentPage)
      })
      .catch(() => {})
      .finally(() => setHwLoading(false))
  }

  // ========== 퀴즈 상태 ==========
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [qzLoading, setQzLoading] = useState(true)
  const [qzPage, setQzPage] = useState(0)
  const [qzTotalPages, setQzTotalPages] = useState(1)
  const [qzTotalElements, setQzTotalElements] = useState(0)

  const fetchQuizzes = (p = 0) => {
    setQzLoading(true)
    const endpoint = isTeacher ? '/quiz/teacher' : '/quiz/student'
    api.get(`${endpoint}?page=${p}&size=10`)
      .then(res => {
        setQuizzes(res.data.content)
        setQzTotalPages(res.data.totalPages)
        setQzTotalElements(res.data.totalElements)
        setQzPage(res.data.currentPage)
      })
      .catch(() => {})
      .finally(() => setQzLoading(false))
  }

  useEffect(() => { fetchHomeworks() }, [])
  useEffect(() => { if (activeTab === 'quiz') fetchQuizzes() }, [activeTab])

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date()

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">과제 / 퀴즈</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            {isTeacher ? '출제한 과제 및 퀴즈' : '과제 및 퀴즈 목록'}
          </p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">과제 / 퀴즈</li>
        </ul>
      </div>

      <div className="card radius-12">
        {/* [woo] 탭 헤더 */}
        <div className="card-header py-0 px-24 border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <ul className="nav nav-tabs border-0 mb-0" style={{ gap: 0 }}>
              <li className="nav-item">
                <button
                  className={`nav-link px-20 py-16 border-0 ${activeTab === 'homework' ? 'active fw-semibold text-primary-600' : 'text-secondary-light'}`}
                  style={activeTab === 'homework' ? { borderBottom: '2px solid var(--primary-600, #4F46E5)' } : {}}
                  onClick={() => setTab('homework')}
                >
                  <i className="ri-draft-line me-4" />
                  과제
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link px-20 py-16 border-0 ${activeTab === 'quiz' ? 'active fw-semibold text-primary-600' : 'text-secondary-light'}`}
                  style={activeTab === 'quiz' ? { borderBottom: '2px solid var(--primary-600, #4F46E5)' } : {}}
                  onClick={() => setTab('quiz')}
                >
                  <i className="ri-question-answer-line me-4" />
                  퀴즈
                </button>
              </li>
            </ul>
            {/* [woo] 교사: 출제 버튼 */}
            {isTeacher && (
              <button
                type="button"
                className="btn btn-primary-600 radius-8"
                onClick={() => navigate(activeTab === 'homework' ? '/homework/create' : '/quiz/create')}
              >
                <iconify-icon icon="mdi:plus" className="me-4" />
                {activeTab === 'homework' ? '과제 출제' : '퀴즈 출제'}
              </button>
            )}
          </div>
        </div>

        {/* ========== 과제 탭 ========== */}
        {activeTab === 'homework' && (
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table bordered-table mb-0">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: 60 }}>번호</th>
                    <th scope="col">제목</th>
                    <th scope="col" style={{ width: 120 }}>
                      {isTeacher ? '학급' : '출제 교사'}
                    </th>
                    <th scope="col" style={{ width: 100 }}>마감일</th>
                    <th scope="col" style={{ width: 100 }}>상태</th>
                    <th scope="col" style={{ width: 100 }}>
                      {isTeacher ? '제출 현황' : '제출 여부'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hwLoading ? (
                    <tr><td colSpan={6} className="text-center py-24 text-secondary-light">불러오는 중...</td></tr>
                  ) : homeworks.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-24 text-secondary-light">등록된 과제가 없습니다.</td></tr>
                  ) : (
                    homeworks.map((hw, i) => {
                      const st = HW_STATUS[hw.status] ?? HW_STATUS.OPEN
                      const isGraded = hw.status === 'GRADED'
                      const isStudentRevealed = isStudent && revealedStudentScores.has(hw.id)
                      return (
                        <>
                          <tr key={hw.id}>
                            <td>{hwTotalElements - hwPage * 10 - i}</td>
                            <td>
                              <Link
                                to={`/homework/${hw.id}`}
                                className="text-primary-600 hover-text-primary-700 fw-medium"
                              >
                                {hw.title}
                                {hw.hasAttachment && (
                                  <iconify-icon icon="mdi:attachment" className="ms-4 text-secondary-light" />
                                )}
                              </Link>
                            </td>
                            <td className="text-secondary-light">
                              {isTeacher ? hw.classroomName : hw.teacherName}
                            </td>
                            <td className={`text-secondary-light ${isOverdue(hw.dueDate) ? 'text-danger-600' : ''}`}>
                              {hw.dueDate?.slice(0, 10)}
                            </td>
                            <td>
                              {isGraded && isStudent ? (
                                <span
                                  className={`badge ${st.cls}`}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => toggleStudentScore(hw.id)}
                                  title="클릭하여 점수 확인"
                                >
                                  {isStudentRevealed ? st.text : st.text + ' (점수확인)'}
                                </span>
                              ) : (
                                <span className={`badge ${st.cls}`}>{st.text}</span>
                              )}
                            </td>
                            <td>
                              {isTeacher ? (
                                <span className="text-secondary-light">
                                  {hw.submissionCount}/{hw.totalStudentCount}
                                </span>
                              ) : (
                                hw.submitted
                                  ? <span className="badge bg-success-100 text-success-600">제출완료</span>
                                  : <span className="badge bg-warning-100 text-warning-600">미제출</span>
                              )}
                            </td>
                          </tr>
                          {isStudentRevealed && hw.submissionStatus === 'GRADED' && (
                            <tr key={`${hw.id}-myscore`}>
                              <td colSpan={6} className="p-0">
                                <div className="p-16 bg-neutral-50 d-flex align-items-center gap-16">
                                  <span className="fw-semibold text-sm">내 점수:</span>
                                  <span className="fw-bold text-primary-600 text-lg">
                                    {hw.score !== null && hw.score !== undefined ? `${hw.score}/${hw.maxScore ?? 100}` : '-'}
                                  </span>
                                  {hw.feedback && (
                                    <>
                                      <span className="text-secondary-light">|</span>
                                      <span className="text-sm">
                                        <span className="fw-semibold">피드백:</span> {hw.feedback}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {hwTotalPages > 1 && (
              <div className="d-flex justify-content-center py-16">
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item${hwPage === 0 ? ' disabled' : ''}`}>
                      <button className="page-link" onClick={() => fetchHomeworks(hwPage - 1)}>
                        <iconify-icon icon="mdi:chevron-left" />
                      </button>
                    </li>
                    {Array.from({ length: hwTotalPages }, (_, i) => (
                      <li key={i} className={`page-item${i === hwPage ? ' active' : ''}`}>
                        <button className="page-link" onClick={() => fetchHomeworks(i)}>{i + 1}</button>
                      </li>
                    ))}
                    <li className={`page-item${hwPage >= hwTotalPages - 1 ? ' disabled' : ''}`}>
                      <button className="page-link" onClick={() => fetchHomeworks(hwPage + 1)}>
                        <iconify-icon icon="mdi:chevron-right" />
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        )}

        {/* ========== 퀴즈 탭 ========== */}
        {activeTab === 'quiz' && (
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table bordered-table mb-0">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: 60 }}>번호</th>
                    <th scope="col">제목</th>
                    <th scope="col" style={{ width: 80 }}>주차</th>
                    <th scope="col" style={{ width: 120 }}>
                      {isTeacher ? '학급' : '출제 교사'}
                    </th>
                    <th scope="col" style={{ width: 80 }}>문제수</th>
                    <th scope="col" style={{ width: 80 }}>총점</th>
                    <th scope="col" style={{ width: 100 }}>마감일</th>
                    <th scope="col" style={{ width: 80 }}>상태</th>
                    {isStudent && <th scope="col" style={{ width: 100 }}>내 성적</th>}
                  </tr>
                </thead>
                <tbody>
                  {qzLoading ? (
                    <tr><td colSpan={isStudent ? 9 : 8} className="text-center py-24 text-secondary-light">불러오는 중...</td></tr>
                  ) : quizzes.length === 0 ? (
                    <tr><td colSpan={isStudent ? 9 : 8} className="text-center py-24 text-secondary-light">등록된 퀴즈가 없습니다.</td></tr>
                  ) : (
                    quizzes.map((q, i) => {
                      const st = QUIZ_STATUS[q.status] ?? QUIZ_STATUS.OPEN
                      return (
                        <tr key={q.id}>
                          <td>{qzTotalElements - qzPage * 10 - i}</td>
                          <td>
                            <Link
                              to={`/quiz/${q.id}`}
                              className="text-primary-600 hover-text-primary-700 fw-medium"
                            >
                              {q.title}
                            </Link>
                          </td>
                          <td className="text-secondary-light">
                            {q.week ? `${q.week}주차` : '-'}
                          </td>
                          <td className="text-secondary-light">
                            {isTeacher ? q.classroomName : q.teacherName}
                          </td>
                          <td className="text-secondary-light">{q.questionCount}문제</td>
                          <td className="text-secondary-light">{q.totalPoints}점</td>
                          <td className={`text-secondary-light ${isOverdue(q.dueDate) ? 'text-danger-600' : ''}`}>
                            {q.dueDate?.slice(0, 10)}
                          </td>
                          <td>
                            <span className={`badge ${st.cls}`}>{st.text}</span>
                          </td>
                          {isStudent && (
                            <td>
                              {q.myAttemptCount != null && q.myAttemptCount > 0 ? (
                                <span className="fw-bold text-primary-600">
                                  {q.myBestScore}/{q.totalPoints}
                                </span>
                              ) : (
                                <span className="text-secondary-light">미응시</span>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {qzTotalPages > 1 && (
              <div className="d-flex justify-content-center py-16">
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item${qzPage === 0 ? ' disabled' : ''}`}>
                      <button className="page-link" onClick={() => fetchQuizzes(qzPage - 1)}>
                        <iconify-icon icon="mdi:chevron-left" />
                      </button>
                    </li>
                    {Array.from({ length: qzTotalPages }, (_, i) => (
                      <li key={i} className={`page-item${i === qzPage ? ' active' : ''}`}>
                        <button className="page-link" onClick={() => fetchQuizzes(i)}>{i + 1}</button>
                      </li>
                    ))}
                    <li className={`page-item${qzPage >= qzTotalPages - 1 ? ' disabled' : ''}`}>
                      <button className="page-link" onClick={() => fetchQuizzes(qzPage + 1)}>
                        <iconify-icon icon="mdi:chevron-right" />
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
