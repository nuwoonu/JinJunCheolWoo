import { Link } from 'react-router-dom'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import MiniCalendar from '../../../components/MiniCalendar'
import NeisEventsWidget from '../../../components/NeisEventsWidget'

// [soojin] /school/schedule - 학교 일정 (NEIS 연동 캘린더)

export default function SchoolSchedule() {
  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학교 일정</h6>
          <p className="text-neutral-600 mt-4 mb-0">NEIS 연동 학사 일정</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">학교 일정</li>
        </ul>
      </div>

      <div className="row gy-4">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header py-16 px-24 border-bottom">
              <h6 className="mb-0">
                <i className="ri-calendar-2-line text-primary-600 me-8" />
                월별 캘린더
              </h6>
            </div>
            <div className="card-body p-24">
              <MiniCalendar />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <NeisEventsWidget />
        </div>
      </div>
    </DashboardLayout>
  )
}
