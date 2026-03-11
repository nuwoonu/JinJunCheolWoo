import { useEffect, useState } from 'react'
import api from '../../../api/auth'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import DashboardScheduleWidget from '../../../components/teacher/DashboardScheduleWidget'
import NeisEventsWidget from '../../../components/NeisEventsWidget'

interface Notice {
  title: string
  writerName?: string
  content?: string
  createDate?: string
}

interface StudentInfo {
  name: string
  studentNumber?: number
}

interface ClassInfo {
  grade: number
  classNum: number
  totalStudents: number
  students: StudentInfo[]
}

interface TeacherDashboardData {
  teacherName?: string
  teacherSubject?: string
  classInfo?: ClassInfo
  notices?: Notice[]
}


export default function TeacherDashboard() {
  const [data, setData] = useState<TeacherDashboardData>({})

  useEffect(() => {
    api.get('/dashboard/teacher').then(res => setData(res.data)).catch(() => {})
  }, [])

  return (
    <DashboardLayout>
      {/* 브레드크럼 헤더 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">선생님 대시보드</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            {data.teacherSubject && <><span>{data.teacherSubject}</span> | </>}
            <span>{data.teacherName ?? '선생님'}</span>선생
          </p>
        </div>
      </div>

      <div className="mt-24">
        <div className="row gy-4">

          {/* 1. 알림 메시지 */}
          <div className="col-xxl-4 col-lg-6">
            <div className="card h-100">
              <div className="card-body p-0">
                <div className="d-flex align-items-center gap-10 px-20 py-16 border-bottom border-neutral-200">
                  <h6 className="text-lg mb-0 fw-semibold">알림 메시지</h6>
                </div>
                <div className="px-16 py-12">
                  {data.notices && data.notices.length > 0 ? (
                    <div className="d-flex flex-column gap-4">
                      {data.notices.map((notice, idx) => (
                        <div key={idx} className={`d-flex flex-column gap-6 p-12 radius-8${idx < 2 ? ' bg-warning-focus' : ''}`}>
                          <div className="d-flex align-items-start justify-content-between gap-8">
                            <h6 className="text-sm fw-semibold mb-0 flex-grow-1" style={{ wordBreak: 'keep-all' }}>{notice.title}</h6>
                            <div className="d-flex align-items-center gap-6 flex-shrink-0">
                              {idx < 2 && <span className="badge bg-danger text-white text-xs px-8 py-2 radius-4 fw-semibold">NEW</span>}
                              {notice.createDate && <span className="text-secondary-light text-xs">{notice.createDate.slice(5, 10).replace('-', '/')}</span>}
                            </div>
                          </div>
                          <p className="text-secondary-light text-xs mb-0">
                            {notice.writerName ? `${notice.writerName} | ` : ''}
                            {(notice.content ?? '').slice(0, 50)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-32 text-secondary-light">
                      <p className="text-sm mb-0">새로운 알림이 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. 오늘의 시간표 (React 컴포넌트) */}
          <div className="col-xxl-4 col-lg-6">
            <DashboardScheduleWidget />
          </div>

          {/* 3. 학교 일정 - [woo] NEIS API 연동 */}
          <div className="col-xxl-4 col-lg-6">
            <NeisEventsWidget />
          </div>

          {/* 4. 과제 제출 확인 */}
          <div className="col-xxl-8">
            <div className="card">
              <div className="card-body p-0">
                <div className="d-flex align-items-center gap-10 px-20 py-16 border-bottom border-neutral-200">
                  <h6 className="text-lg mb-0 fw-semibold">과제 제출 확인</h6>
                </div>
                <div className="p-20">
                  <div className="d-flex flex-column gap-24">
                    {[
                      { title: '기하학 프로젝트', cls: '3학년 4반', due: '01/29', done: 15, total: 29, pct: 52, color: 'warning' },
                      { title: '확률과 통계 과제', cls: '2학년 1반', due: '01/30', done: 25, total: 31, pct: 81, color: 'success' },
                      { title: '미적분 연습문제', cls: '3학년 2반', due: '02/01', done: 10, total: 28, pct: 36, color: 'danger' },
                    ].map((hw, i) => (
                      <div key={i}>
                        <div className="d-flex align-items-center justify-content-between mb-8">
                          <div>
                            <h6 className="text-md fw-semibold mb-2">{hw.title}</h6>
                            <span className="text-secondary-light text-sm">{hw.cls} &nbsp;마감: {hw.due}</span>
                          </div>
                          <span className={`badge bg-${hw.color}-100 text-${hw.color}-600 fw-semibold radius-4 px-12 py-6`}>{hw.done}/{hw.total}</span>
                        </div>
                        <div className="progress" style={{ height: 8, borderRadius: 4 }}>
                          <div className={`progress-bar bg-${hw.color}`} role="progressbar" style={{ width: `${hw.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. 학급 학생 출결 상태 */}
          <div className="col-xxl-4">
            <div className="card h-100">
              <div className="card-body p-0">
                <div className="d-flex align-items-center gap-10 px-20 py-16 border-bottom border-neutral-200">
                  <h6 className="text-lg mb-0 fw-semibold">학급 학생 출결 상태</h6>
                </div>
                {data.classInfo ? (
                  <div className="p-16">
                    <div className="mb-12">
                      <p className="text-sm text-secondary-light mb-8">
                        {data.classInfo.grade}학년 {data.classInfo.classNum}반 ({data.classInfo.totalStudents}명)
                      </p>
                      <div className="d-flex gap-6 flex-wrap">
                        <span className="badge bg-success-100 text-success-600 px-10 py-4 radius-4 fw-medium text-xs">출석: {data.classInfo.totalStudents}</span>
                        <span className="badge bg-warning-100 text-warning-600 px-10 py-4 radius-4 fw-medium text-xs">지각: 0</span>
                        <span className="badge bg-danger-100 text-danger-600 px-10 py-4 radius-4 fw-medium text-xs">결석: 0</span>
                        <span className="badge bg-secondary-100 text-secondary-600 px-10 py-4 radius-4 fw-medium text-xs">조퇴: 0</span>
                      </div>
                    </div>
                    <div className="d-flex flex-column gap-0 max-h-320-px overflow-y-auto scroll-sm">
                      {data.classInfo.students?.length > 0 ? data.classInfo.students.map((s, i) => (
                        <div key={i} className="d-flex align-items-center justify-content-between py-10 border-bottom border-neutral-100">
                          <div>
                            <h6 className="text-sm fw-medium mb-1">{s.name}</h6>
                            <span className="text-xs text-secondary-light">{s.studentNumber != null ? `${s.studentNumber}번` : '-'}</span>
                          </div>
                          <span className="badge bg-success-100 text-success-600 px-10 py-4 radius-4 fw-medium text-xs">출석</span>
                        </div>
                      )) : (
                        <div className="text-center py-16 text-secondary-light"><p className="text-sm mb-0">배정된 학생이 없습니다.</p></div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-20 text-center text-secondary-light">
                    <p className="text-sm mb-0">담당 학급 정보가 없습니다.</p>
                    <p className="text-xs mb-0 mt-4">관리자에게 학급 배정을 요청하세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
