import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/auth'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import NeisEventsWidget from '../../../components/NeisEventsWidget'

// [soojin] 학부모 대시보드 - Thymeleaf parent/dashboard.html 기반 마이그레이션

interface Child {
  id: number
  name: string
  studentNumber: string
  grade: number | null
  classNum: number | null
  profileImageUrl: string | null
}

interface Notice {
  nno: number
  title: string
  createDate: string
}

interface Board {
  bno: number
  title: string
  createDate: string
}

interface ParentDashboardData {
  children: Child[]
  notices: Notice[]
  boards: Board[]
}

function formatDate(dt: string | null) {
  if (!dt) return ''
  return dt.slice(0, 10) // [soojin] "2026-03-08T..." → "2026-03-08"
}

export default function ParentDashboard() {
  const [data, setData] = useState<ParentDashboardData>({ children: [], notices: [], boards: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/parent')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학부모</h6>
          <p className="text-neutral-600 mt-4 mb-0">어서오세요, 부모님</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
      ) : (
        <div className="mt-24">

          {/* 나의 자녀 */}
          <div className="row gy-4 mb-24">
            <div className="col-12">
              <div className="card h-100">
                <div className="card-body p-0">
                  <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                    <h6 className="text-lg mb-0">나의 자녀</h6>
                    <Link to="/parent/children/status" className="text-primary-600 hover-text-primary-700">더보기</Link>
                  </div>
                  <div className="p-20">
                    {data.children.length === 0 ? (
                      <div className="text-center py-20">
                        <p className="mb-0 text-secondary-light">등록된 학생이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="d-flex flex-wrap gap-16">
                        {data.children.map(child => (
                          <Link
                            key={child.id}
                            to="/parent/children/status"
                            className="p-20 rounded text-decoration-none"
                            style={{ backgroundColor: '#e0f4f0', width: 300, cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center gap-16">
                              <figure className="w-120-px h-120-px rounded-circle overflow-hidden mb-0 border border-width-4-px border-white flex-shrink-0">
                                <img
                                  src={child.profileImageUrl ?? '/images/thumbs/student-details-img.png'}
                                  alt="Student Image"
                                  className="w-100 h-100 object-fit-cover"
                                />
                              </figure>
                              <div>
                                <h2 className="h6 text-primary-light mb-16 fw-semibold">{child.name}</h2>
                                <p className="mb-0">
                                  학번: <span className="text-primary-600 fw-semibold">{child.studentNumber}</span>
                                </p>
                              </div>
                            </div>
                            <div className="d-flex flex-column gap-8 border-top border-neutral-300 mt-16 pt-16">
                              <div className="d-flex gap-4">
                                <span className="fw-semibold text-sm text-primary-light w-110-px">학년</span>
                                <span className="fw-normal text-sm text-secondary-light">: {child.grade ?? '-'}학년</span>
                              </div>
                              <div className="d-flex gap-4">
                                <span className="fw-semibold text-sm text-primary-light w-110-px">반</span>
                                <span className="fw-normal text-sm text-secondary-light">: {child.classNum ?? '-'}반</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 학교 공지 */}
          <div className="row gy-4 mb-24">
            <div className="col-12">
              <div className="card h-100">
                <div className="card-body p-0">
                  <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                    <h6 className="text-lg mb-0">학교 공지</h6>
                    <Link to="/board/school-notice" className="text-primary-600 hover-text-primary-700">더보기</Link>
                  </div>
                  <div className="p-20">
                    {data.notices.length === 0 ? (
                      <div className="text-center py-20">
                        <p className="mb-0 text-secondary-light">등록된 공지사항이 없습니다.</p>
                      </div>
                    ) : (
                      <ul className="list-unstyled mb-0">
                        {data.notices.map((notice, i) => (
                          <li
                            key={notice.nno}
                            className={`d-flex justify-content-between align-items-center py-12${i < data.notices.length - 1 ? ' border-bottom border-neutral-200' : ''}`}
                          >
                            <Link
                              to={`/board/school-notice/${notice.nno}`}
                              className="text-primary-light hover-text-primary-600 fw-medium text-truncate"
                              style={{ maxWidth: '70%' }}
                            >
                              {notice.title}
                            </Link>
                            <span className="text-secondary-light text-sm">{formatDate(notice.createDate)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 학부모 게시판 */}
          <div className="row gy-4 mb-24">
            <div className="col-12">
              <div className="card h-100">
                <div className="card-body p-0">
                  <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                    <h6 className="text-lg mb-0">학부모 게시판</h6>
                    <Link to="/board/parent" className="text-primary-600 hover-text-primary-700">더보기</Link>
                  </div>
                  <div className="p-20">
                    {data.boards.length === 0 ? (
                      <div className="text-center py-20">
                        <p className="mb-0 text-secondary-light">등록된 게시글이 없습니다.</p>
                      </div>
                    ) : (
                      <ul className="list-unstyled mb-0">
                        {data.boards.map((board, i) => (
                          <li
                            key={board.bno}
                            className={`d-flex justify-content-between align-items-center py-12${i < data.boards.length - 1 ? ' border-bottom border-neutral-200' : ''}`}
                          >
                            <Link
                              to={`/board/parent/${board.bno}`}
                              className="text-primary-light hover-text-primary-600 fw-medium text-truncate"
                              style={{ maxWidth: '70%' }}
                            >
                              {board.title}
                            </Link>
                            <span className="text-secondary-light text-sm">{formatDate(board.createDate)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 학교 일정 - [woo] NEIS API 연동 */}
          <div className="row gy-4 mb-24">
            <div className="col-12">
              <NeisEventsWidget />
            </div>
          </div>

        </div>
      )}
    </DashboardLayout>
  )
}
