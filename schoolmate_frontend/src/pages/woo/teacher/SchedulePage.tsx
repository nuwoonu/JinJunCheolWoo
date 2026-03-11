import { Link } from 'react-router-dom'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import TimetableApp from '../../../components/teacher/TimetableApp'

// [woo] /teacher/schedule - 수업 일정 페이지 (TimetableApp 래퍼)

export default function SchedulePage() {
  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">수업 일정</h6>
          <p className="text-neutral-600 mt-4 mb-0">나의 수업 시간표</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">수업 일정</li>
        </ul>
      </div>

      <TimetableApp />
    </DashboardLayout>
  )
}
