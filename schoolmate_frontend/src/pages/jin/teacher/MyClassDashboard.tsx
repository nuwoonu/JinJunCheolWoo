// [jin] 교사 학급 대시보드
// 라우트: /teacher/myclass/dashboard
// 권한: TEACHER, ADMIN
//
// 레이아웃:
//   1행: 우리 반 출결 상태 (col-4) | 이번 주 일정 캘린더 (col-8)
//   2행: 학급 공지사항 (col-8)     | 우리 반 시간표 (col-4)
//   3행: 학급 게시판 (col-8)       | 이달의 학급 목표 (col-4)
//   4행: 우리 반 알림장 (col-4)    | 학급 앨범 (col-8)

import { useEffect, useState } from 'react'
import api from '@/api/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ClassAttendanceWidget from '@/components/teacher/ClassAttendanceWidget'
import WeeklyCalendarWidget from '@/components/student/WeeklyCalendarWidget'
import ClassNoticeWidget from '@/components/student/ClassNoticeWidget'
import TodayTimetableWidget from '@/components/student/TodayTimetableWidget'
import ClassBoardWidget from '@/components/student/ClassBoardWidget'
import ClassGoalEditor from '@/components/teacher/ClassGoalEditor'
import ClassNotebookWidget from '@/components/teacher/ClassNotebookWidget'
import ClassAlbumWidget from '@/components/student/ClassAlbumWidget'

interface TimetableItem {
  period: number
  subject: string
}

interface ClassInfo {
  classroomId: number
  year: number
  grade: number
  classNum: number
  totalStudents: number
}

export default function TeacherMyClassDashboard() {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [timetable, setTimetable] = useState<TimetableItem[]>([])
  const [timetableLoading, setTimetableLoading] = useState(true)

  useEffect(() => {
    api.get('/teacher/myclass')
      .then(res => {
        const data = res.data
        if (data.hasClassroom === false) return
        setClassInfo(data)
        // 학급 정보 획득 후 시간표 fetch
        if (data.grade && data.classNum) {
          fetch(`/api/calendar/timetable?grade=${data.grade}&classNum=${data.classNum}`)
            .then(r => r.ok ? r.json() : [])
            .then(d => { setTimetable(d); setTimetableLoading(false) })
            .catch(() => setTimetableLoading(false))
        } else {
          setTimetableLoading(false)
        }
      })
      .catch(() => setTimetableLoading(false))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 400 }}>
          <p className="text-secondary-light">불러오는 중...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!classInfo) {
    return (
      <DashboardLayout>
        <div className="card shadow-sm p-80 text-center" style={{ borderRadius: 16, border: '1px solid #e5e7eb' }}>
          <iconify-icon icon="mdi:google-classroom" className="text-secondary-light mb-16" style={{ fontSize: 48 }} />
          <h5 className="text-secondary-light">담당 학급 정보를 불러올 수 없습니다.</h5>
        </div>
      </DashboardLayout>
    )
  }

  const { classroomId, grade, classNum } = classInfo

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학급 대시보드</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            {grade}학년 {classNum}반
          </p>
        </div>
      </div>

      {/* 1행: 우리 반 출결 상태 (col-4) | 이번 주 일정 캘린더 (col-8) */}
      <div className="row gy-4 mb-24">
        <div className="col-xl-4 d-flex flex-column">
          <ClassAttendanceWidget grade={grade} classNum={classNum} />
        </div>
        <div className="col-xl-8 d-flex flex-column">
          <WeeklyCalendarWidget />
        </div>
      </div>

      {/* 2행: 학급 공지사항 (col-8) | 우리 반 시간표 (col-4) */}
      <div className="row gy-4 mb-24" style={{ minHeight: 320 }}>
        <div className="col-xl-8 d-flex flex-column">
          <ClassNoticeWidget classroomId={classroomId} />
        </div>
        <div className="col-xl-4 d-flex flex-column">
          <TodayTimetableWidget timetable={timetable} loading={timetableLoading} title="우리 반 시간표" />
        </div>
      </div>

      {/* 3행: 우리 반 알림장 (col-8) | 이달의 학급 목표 (col-4) */}
      <div className="row gy-4 mb-24" style={{ minHeight: 320 }}>
        <div className="col-xl-8 d-flex flex-column">
          <ClassNotebookWidget classroomId={classroomId} />
        </div>
        <div className="col-xl-4 d-flex flex-column">
          <ClassGoalEditor classroomId={classroomId} />
        </div>
      </div>

      {/* 4행: 학급 게시판 (col-6) | 학급 앨범 (col-6) */}
      <div className="row gy-4">
        <div className="col-xl-6 d-flex flex-column">
          <ClassBoardWidget classroomId={classroomId} />
        </div>
        <div className="col-xl-6 d-flex flex-column">
          <ClassAlbumWidget classroomId={classroomId} />
        </div>
      </div>
    </DashboardLayout>
  )
}
