import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/auth'
import DashboardLayout from '../../../components/layout/DashboardLayout'

// [woo] /teacher/myclass - 담당 학급 현황 페이지 (Thymeleaf teacher/myclass/index.html 마이그레이션)

interface Student {
  studentId: number
  name: string
  studentNumber: number
  phone?: string
  email?: string
}

interface ClassInfo {
  classroomId: number
  year: number
  grade: number
  classNum: number
  className: string
  totalStudents: number
  homeroomTeacherName?: string
  students: Student[]
}

interface NoClassResponse {
  hasClassroom: false
  message: string
}

export default function TeacherMyClass() {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/teacher/myclass')
      .then(res => {
        const data = res.data
        if (data.hasClassroom === false) {
          setErrorMessage(data.message ?? '담당 학급이 없습니다.')
        } else {
          setClassInfo(data)
        }
      })
      .catch(() => setErrorMessage('학급 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">나의 학급</h6>
          <p className="text-neutral-600 mt-4 mb-0">학급 현황</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">나의 학급</li>
          <li>-</li>
          <li className="fw-medium">학급 현황</li>
        </ul>
      </div>

      {loading && (
        <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
      )}

      {/* 학급 없음 */}
      {!loading && errorMessage && (
        <div className="card">
          <div className="card-body text-center py-48">
            <iconify-icon icon="mdi:account-group-outline" className="text-neutral-400 mb-16" style={{ fontSize: 64 }} />
            <h5 className="text-neutral-600 mb-8">담당 학급이 없습니다</h5>
            <p className="text-neutral-500 mb-0">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 학급 정보 */}
      {!loading && classInfo && (
        <div className="row gy-4">
          {/* 학급 정보 카드 */}
          <div className="col-xxl-4 col-lg-6">
            <div className="card radius-12 h-100">
              <div className="card-body p-24">
                <div className="d-flex align-items-center gap-16 mb-24">
                  <div className="w-64-px h-64-px bg-primary-100 rounded-circle d-flex justify-content-center align-items-center">
                    <iconify-icon icon="mdi:google-classroom" className="text-primary-600 text-3xl" />
                  </div>
                  <div>
                    <h6 className="mb-4">학급 정보</h6>
                    <span className="text-secondary-light">{classInfo.year}학년도</span>
                  </div>
                </div>
                <div className="d-flex flex-column gap-12">
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary-light">학년</span>
                    <span className="fw-semibold">{classInfo.grade}학년</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary-light">반</span>
                    <span className="fw-semibold">{classInfo.classNum}반</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary-light">학급명</span>
                    <span className="fw-semibold">{classInfo.className ?? '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 담임 교사 카드 */}
          <div className="col-xxl-4 col-lg-6">
            <div className="card radius-12 h-100">
              <div className="card-body p-24">
                <div className="d-flex align-items-center gap-16 mb-24">
                  <div className="w-64-px h-64-px bg-success-100 rounded-circle d-flex justify-content-center align-items-center">
                    <iconify-icon icon="mdi:account-tie" className="text-success-600 text-3xl" />
                  </div>
                  <div>
                    <h6 className="mb-4">담임 교사</h6>
                    <span className="text-secondary-light">담당 선생님 정보</span>
                  </div>
                </div>
                <div className="d-flex flex-column gap-12">
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary-light">이름</span>
                    <span className="fw-semibold">{classInfo.homeroomTeacherName ?? '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 학생 수 카드 */}
          <div className="col-xxl-4 col-lg-6">
            <div className="card radius-12 h-100">
              <div className="card-body p-24">
                <div className="d-flex align-items-center gap-16 mb-24">
                  <div className="w-64-px h-64-px bg-warning-100 rounded-circle d-flex justify-content-center align-items-center">
                    <iconify-icon icon="mdi:account-group" className="text-warning-600 text-3xl" />
                  </div>
                  <div>
                    <h6 className="mb-4">학생 현황</h6>
                    <span className="text-secondary-light">총 학생 수</span>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-5xl fw-bold text-primary-600">{classInfo.totalStudents}</span>
                  <span className="text-xl text-secondary-light">명</span>
                </div>
                <div className="mt-16 text-center">
                  <Link to="/teacher/myclass/students" className="btn btn-primary-600 radius-8">
                    <iconify-icon icon="mdi:account-details" className="me-4" />
                    학생 관리
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 학생 목록 미리보기 */}
          <div className="col-12">
            <div className="card radius-12">
              <div className="card-header d-flex justify-content-between align-items-center py-16 px-24 border-bottom">
                <h6 className="mb-0">학생 목록</h6>
                <Link to="/teacher/myclass/students" className="btn btn-sm btn-outline-primary-600">
                  전체 보기
                  <iconify-icon icon="mdi:arrow-right" className="ms-4" />
                </Link>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table bordered-table mb-0">
                    <thead>
                      <tr>
                        <th scope="col">번호</th>
                        <th scope="col">이름</th>
                        <th scope="col">연락처</th>
                        <th scope="col">이메일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classInfo.students.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-24 text-secondary-light">등록된 학생이 없습니다.</td></tr>
                      ) : (
                        classInfo.students.slice(0, 5).map(s => (
                          <tr key={s.studentId}>
                            <td>{s.studentNumber}</td>
                            <td>{s.name}</td>
                            <td>{s.phone ?? '-'}</td>
                            <td>{s.email ?? '-'}</td>
                          </tr>
                        ))
                      )}
                      {classInfo.totalStudents > 5 && (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-secondary-light">
                            외 {classInfo.totalStudents - 5}명...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
