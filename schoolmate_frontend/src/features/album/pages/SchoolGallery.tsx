import { Link } from 'react-router-dom'
import DashboardLayout from '@/shared/components/layout/DashboardLayout'

// [soojin] /school/gallery - 학교 갤러리

export default function SchoolGallery() {
  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">학교 갤러리</h6>
          <p className="text-neutral-600 mt-4 mb-0">학교 사진 갤러리</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">학교 갤러리</li>
        </ul>
      </div>

      <div className="card radius-12">
        <div className="card-body text-center py-80">
          <i className="ri-image-2-line text-neutral-400" style={{ fontSize: 64 }} />
          <h5 className="mt-16 text-neutral-600">학교 갤러리 준비 중</h5>
          <p className="text-secondary-light mb-0">곧 서비스를 제공할 예정입니다.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
