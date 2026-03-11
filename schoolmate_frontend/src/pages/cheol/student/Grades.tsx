import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/auth'
import { useAuth } from '../../../contexts/AuthContext'
import DashboardLayout from '../../../components/layout/DashboardLayout'

// [cheol] /exam - 성적 조회 (cheol/exam/exam.html 마이그레이션)
// 학생 본인의 성적을 학년/학기별로 조회

const YEAR_LABEL: Record<string, string> = { FIRST: '1학년', SECOND: '2학년', THIRD: '3학년' }
const SEMESTER_LABEL: Record<string, string> = { FIRST: '1학기', FALL: '2학기' }
const EXAM_TYPE_LABEL: Record<string, string> = {
  MIDTERMTEST: '중간고사', FINALTEST: '기말고사', PERFORMANCEASSESSMENT: '수행평가',
}
const EXAM_TYPE_COLOR: Record<string, string> = {
  MIDTERMTEST: 'bg-primary-100 text-primary-600',
  FINALTEST: 'bg-danger-100 text-danger-600',
  PERFORMANCEASSESSMENT: 'bg-success-100 text-success-600',
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

export default function StudentGrades() {
  const { user } = useAuth()
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [studentInfoId, setStudentInfoId] = useState<number | null>(null)
  // [cheol] 필터: 학년/학기 선택
  const [filterYear, setFilterYear] = useState<string>('ALL')
  const [filterSemester, setFilterSemester] = useState<string>('ALL')

  useEffect(() => {
    if (!user?.uid) return
    // [cheol] 먼저 학생 정보 조회 → studentInfoId 획득 → 성적 조회
    api.get(`/students/${user.uid}`)
      .then(res => {
        const sid: number = res.data.id
        setStudentInfoId(sid)
        return api.get(`/grades/student/${sid}`)
      })
      .then(res => setGrades(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.uid])

  const filtered = grades.filter(g => {
    if (filterYear !== 'ALL' && g.year !== filterYear) return false
    if (filterSemester !== 'ALL' && g.semester !== filterSemester) return false
    return true
  })

  // [cheol] 학년별로 그룹핑
  const grouped = filtered.reduce<Record<string, Grade[]>>((acc, g) => {
    const key = `${g.year}_${g.semester}`
    if (!acc[key]) acc[key] = []
    acc[key].push(g)
    return acc
  }, {})

  const avgScore = filtered.length > 0 && filtered.some(g => g.score != null)
    ? (filtered.filter(g => g.score != null).reduce((sum, g) => sum + (g.score ?? 0), 0) / filtered.filter(g => g.score != null).length).toFixed(1)
    : '-'

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">성적</h6>
          <p className="text-neutral-600 mt-4 mb-0">성적 조회</p>
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
          <li className="fw-medium">성적 조회</li>
        </ul>
      </div>

      {/* 요약 카드 */}
      <div className="row gy-4 mb-24">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-20 text-center" style={{ borderRadius: 16 }}>
            <div className="w-56-px h-56-px rounded-circle bg-primary-100 d-flex align-items-center justify-content-center mx-auto mb-12">
              <i className="ri-bar-chart-line text-primary-600 text-2xl" />
            </div>
            <h4 className="fw-bold mb-4">{filtered.length}</h4>
            <p className="text-secondary-light text-sm mb-0">조회된 성적 수</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-20 text-center" style={{ borderRadius: 16 }}>
            <div className="w-56-px h-56-px rounded-circle bg-success-100 d-flex align-items-center justify-content-center mx-auto mb-12">
              <i className="ri-star-line text-success-600 text-2xl" />
            </div>
            <h4 className="fw-bold mb-4">{avgScore}</h4>
            <p className="text-secondary-light text-sm mb-0">평균 점수</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-20 text-center" style={{ borderRadius: 16 }}>
            <div className="w-56-px h-56-px rounded-circle bg-warning-100 d-flex align-items-center justify-content-center mx-auto mb-12">
              <i className="ri-book-open-line text-warning-main text-2xl" />
            </div>
            <h4 className="fw-bold mb-4">
              {new Set(filtered.map(g => g.subjectName)).size}
            </h4>
            <p className="text-secondary-light text-sm mb-0">과목 수</p>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="card radius-12">
        <div className="card-header py-16 px-24 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-12">
          <h6 className="mb-0">성적 목록</h6>
          <div className="d-flex gap-12 align-items-center flex-wrap">
            <select className="form-select form-select-sm" style={{ width: 120 }}
              value={filterYear} onChange={e => setFilterYear(e.target.value)}>
              <option value="ALL">전체 학년</option>
              <option value="FIRST">1학년</option>
              <option value="SECOND">2학년</option>
              <option value="THIRD">3학년</option>
            </select>
            <select className="form-select form-select-sm" style={{ width: 120 }}
              value={filterSemester} onChange={e => setFilterSemester(e.target.value)}>
              <option value="ALL">전체 학기</option>
              <option value="FIRST">1학기</option>
              <option value="FALL">2학기</option>
            </select>
          </div>
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
            Object.entries(grouped).map(([key, items]) => {
              const [yearKey, semKey] = key.split('_')
              const groupLabel = `${YEAR_LABEL[yearKey] ?? yearKey} ${SEMESTER_LABEL[semKey] ?? semKey}`
              const groupAvg = items.filter(i => i.score != null).length > 0
                ? (items.filter(i => i.score != null).reduce((s, i) => s + (i.score ?? 0), 0) / items.filter(i => i.score != null).length).toFixed(1)
                : '-'
              return (
                <div key={key}>
                  {/* [cheol] 학년/학기 구분 헤더 */}
                  <div className="px-24 py-12 bg-neutral-50 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-sm">{groupLabel}</span>
                    <span className="text-xs text-secondary-light">평균: <strong>{groupAvg}</strong>점</span>
                  </div>
                  <div className="table-responsive">
                    <table className="table bordered-table mb-0">
                      <thead>
                        <tr>
                          <th>과목명</th>
                          <th>과목코드</th>
                          <th>시험 유형</th>
                          <th className="text-center">점수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(g => (
                          <tr key={g.id}>
                            <td className="fw-medium">{g.subjectName}</td>
                            <td className="text-secondary-light">{g.subjectCode ?? '-'}</td>
                            <td>
                              <span className={`badge px-10 py-4 radius-4 fw-medium text-xs ${EXAM_TYPE_COLOR[g.examType] ?? 'bg-neutral-100 text-secondary-light'}`}>
                                {EXAM_TYPE_LABEL[g.examType] ?? g.examType}
                              </span>
                            </td>
                            <td className="text-center">
                              {g.score != null ? (
                                <span className={`fw-bold ${g.score >= 90 ? 'text-success-600' : g.score >= 70 ? 'text-primary-600' : 'text-danger-600'}`}>
                                  {g.score}점
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
