import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/auth'
import { useAuth } from '../../../contexts/AuthContext'
import DashboardLayout from '../../../components/layout/DashboardLayout'

// [cheol] /exam/result - 성적 결과 분석 (cheol/exam/exam-result.html 마이그레이션)
// 과목별 점수 비교 및 통계 분석

const YEAR_LABEL: Record<string, string> = { FIRST: '1학년', SECOND: '2학년', THIRD: '3학년' }
const SEMESTER_LABEL: Record<string, string> = { FIRST: '1학기', FALL: '2학기' }
const EXAM_TYPE_LABEL: Record<string, string> = {
  MIDTERMTEST: '중간고사', FINALTEST: '기말고사', PERFORMANCEASSESSMENT: '수행평가',
}

interface Grade {
  id: number
  subjectName: string
  subjectCode: string
  examType: string
  score?: number
  semester: string
  year: string
}

function getGrade(score?: number): { label: string; color: string } {
  if (score == null) return { label: '-', color: 'text-secondary-light' }
  if (score >= 90) return { label: 'A', color: 'text-success-600' }
  if (score >= 80) return { label: 'B', color: 'text-primary-600' }
  if (score >= 70) return { label: 'C', color: 'text-warning-main' }
  if (score >= 60) return { label: 'D', color: 'text-danger-600' }
  return { label: 'F', color: 'text-danger-600' }
}

export default function ExamResult() {
  const { user } = useAuth()
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string>('ALL')
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL')

  useEffect(() => {
    if (!user?.uid) return
    // [cheol] 학생 정보 → studentInfoId → 성적 조회
    api.get(`/students/${user.uid}`)
      .then(res => api.get(`/grades/student/${res.data.id}`))
      .then(res => setGrades(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.uid])

  const filtered = grades.filter(g => {
    if (selectedYear !== 'ALL' && g.year !== selectedYear) return false
    if (selectedSemester !== 'ALL' && g.semester !== selectedSemester) return false
    return true
  })

  // [cheol] 과목별로 그룹핑해서 시험 유형 비교
  const bySubject = filtered.reduce<Record<string, Grade[]>>((acc, g) => {
    if (!acc[g.subjectName]) acc[g.subjectName] = []
    acc[g.subjectName].push(g)
    return acc
  }, {})

  const validScores = filtered.filter(g => g.score != null)
  const avgScore = validScores.length > 0
    ? (validScores.reduce((s, g) => s + (g.score ?? 0), 0) / validScores.length).toFixed(1)
    : null
  const maxScore = validScores.length > 0 ? Math.max(...validScores.map(g => g.score ?? 0)) : null
  const minScore = validScores.length > 0 ? Math.min(...validScores.map(g => g.score ?? 0)) : null

  // [cheol] 등급 분포
  const gradeDistrib = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  validScores.forEach(g => {
    const lbl = getGrade(g.score).label
    if (lbl in gradeDistrib) gradeDistrib[lbl as keyof typeof gradeDistrib]++
  })

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">과제/성적</h6>
          <p className="text-neutral-600 mt-4 mb-0">성적 결과</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/student/dashboard" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">과제/성적</li>
          <li>-</li>
          <li className="fw-medium">성적 결과</li>
        </ul>
      </div>

      {/* 필터 */}
      <div className="d-flex gap-12 mb-24 flex-wrap">
        <select className="form-select form-select-sm" style={{ width: 130 }}
          value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
          <option value="ALL">전체 학년</option>
          <option value="FIRST">1학년</option>
          <option value="SECOND">2학년</option>
          <option value="THIRD">3학년</option>
        </select>
        <select className="form-select form-select-sm" style={{ width: 130 }}
          value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
          <option value="ALL">전체 학기</option>
          <option value="FIRST">1학기</option>
          <option value="FALL">2학기</option>
        </select>
        {(selectedYear !== 'ALL' || selectedSemester !== 'ALL') && (
          <span className="badge bg-primary-100 text-primary-600 px-12 py-6 radius-4 d-flex align-items-center">
            {selectedYear !== 'ALL' ? YEAR_LABEL[selectedYear] : ''} {selectedSemester !== 'ALL' ? SEMESTER_LABEL[selectedSemester] : ''}
          </span>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="row gy-4 mb-24">
        {[
          { label: '평균 점수', value: avgScore ? `${avgScore}점` : '-', icon: 'ri-bar-chart-line', color: 'primary' },
          { label: '최고 점수', value: maxScore != null ? `${maxScore}점` : '-', icon: 'ri-arrow-up-circle-line', color: 'success' },
          { label: '최저 점수', value: minScore != null ? `${minScore}점` : '-', icon: 'ri-arrow-down-circle-line', color: 'danger' },
          { label: '총 과목 수', value: `${Object.keys(bySubject).length}개`, icon: 'ri-book-open-line', color: 'warning' },
        ].map(card => (
          <div key={card.label} className="col-xl-3 col-md-6">
            <div className="card border-0 shadow-sm p-20 text-center" style={{ borderRadius: 16 }}>
              <div className={`w-52-px h-52-px rounded-circle bg-${card.color}-100 d-flex align-items-center justify-content-center mx-auto mb-12`}>
                <i className={`${card.icon} text-${card.color}-600 text-2xl`} />
              </div>
              <h4 className="fw-bold mb-4">{card.value}</h4>
              <p className="text-secondary-light text-sm mb-0">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="row gy-4">

        {/* 과목별 성적 테이블 */}
        <div className="col-xl-8">
          <div className="card radius-12">
            <div className="card-header py-16 px-24 border-bottom">
              <h6 className="mb-0">과목별 성적 상세</h6>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-48 text-secondary-light">
                  <i className="ri-file-search-line text-4xl d-block mb-12" />
                  등록된 성적이 없습니다.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table bordered-table mb-0">
                    <thead>
                      <tr>
                        <th>과목</th>
                        <th>학년/학기</th>
                        <th>시험 유형</th>
                        <th className="text-center">점수</th>
                        <th className="text-center">등급</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(g => {
                        const { label, color } = getGrade(g.score)
                        return (
                          <tr key={g.id}>
                            <td className="fw-medium">{g.subjectName}</td>
                            <td className="text-secondary-light text-sm">
                              {YEAR_LABEL[g.year] ?? g.year} {SEMESTER_LABEL[g.semester] ?? g.semester}
                            </td>
                            <td>
                              <span className="text-xs text-secondary-light">
                                {EXAM_TYPE_LABEL[g.examType] ?? g.examType}
                              </span>
                            </td>
                            <td className="text-center">
                              {g.score != null ? (
                                <div>
                                  <span className="fw-bold">{g.score}</span>
                                  {/* [cheol] 점수 바 시각화 */}
                                  <div className="progress mt-4" style={{ height: 4, borderRadius: 2 }}>
                                    <div
                                      className={`progress-bar ${g.score >= 90 ? 'bg-success' : g.score >= 70 ? 'bg-primary' : 'bg-danger'}`}
                                      role="progressbar"
                                      style={{ width: `${g.score}%` }}
                                    />
                                  </div>
                                </div>
                              ) : '-'}
                            </td>
                            <td className={`text-center fw-bold ${color}`}>{label}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 등급 분포 */}
        <div className="col-xl-4">
          <div className="card border-0 shadow-sm p-24" style={{ borderRadius: 16 }}>
            <h6 className="fw-bold mb-20 text-sm">
              <i className="ri-pie-chart-line text-primary-600 me-2" />등급 분포
            </h6>
            {validScores.length === 0 ? (
              <p className="text-secondary-light text-sm text-center py-20">데이터 없음</p>
            ) : (
              Object.entries(gradeDistrib).map(([lbl, cnt]) => {
                const pct = validScores.length > 0 ? Math.round((cnt / validScores.length) * 100) : 0
                const barColor = lbl === 'A' ? 'bg-success' : lbl === 'B' ? 'bg-primary' : lbl === 'C' ? 'bg-warning' : 'bg-danger'
                return (
                  <div key={lbl} className="mb-12">
                    <div className="d-flex justify-content-between mb-4">
                      <span className="text-sm fw-medium">{lbl}등급</span>
                      <span className="text-xs text-secondary-light">{cnt}개 ({pct}%)</span>
                    </div>
                    <div className="progress" style={{ height: 8, borderRadius: 4 }}>
                      <div className={`progress-bar ${barColor}`} role="progressbar" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* 빠른 이동 링크 */}
          <div className="card border-0 shadow-sm p-20 mt-24" style={{ borderRadius: 16 }}>
            <h6 className="fw-bold mb-16 text-sm">
              <i className="ri-links-line text-secondary-light me-2" />바로가기
            </h6>
            <div className="d-flex flex-column gap-8">
              <Link to="/exam" className="btn btn-outline-neutral-300 radius-8 text-start text-sm">
                <i className="ri-bar-chart-line me-8" />성적 조회
              </Link>
              <Link to="/exam/schedule" className="btn btn-outline-neutral-300 radius-8 text-start text-sm">
                <i className="ri-calendar-check-line me-8" />시험 일정
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
