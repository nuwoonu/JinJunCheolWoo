import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../../components/layout/AdminLayout'
import admin from '../../../api/adminApi'

// [joon] 관리자 대시보드

const BASE = '/parkjoon/admin'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, totalStaffs: 0, pendingParents: 0 })
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    admin.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📊 관리자 대시보드</h2>
        <span className="text-muted">{today}</span>
      </div>

      <div className="row">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-0 border-start border-primary border-4 shadow h-100 py-2">
            <div className="card-body">
              <div className="text-xs fw-bold text-primary text-uppercase mb-1">총 학생 수</div>
              <div className="h5 mb-0 fw-bold text-gray-800">{stats.totalStudents}명</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-0 border-start border-success border-4 shadow h-100 py-2">
            <div className="card-body">
              <div className="text-xs fw-bold text-success text-uppercase mb-1">재직 교직원</div>
              <div className="h5 mb-0 fw-bold">{stats.totalTeachers + stats.totalStaffs}명</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-0 border-start border-warning border-4 shadow h-100 py-2">
            <div className="card-body">
              <div className="text-xs fw-bold text-warning text-uppercase mb-1">학부모 승인 대기</div>
              <div className="h5 mb-0 fw-bold">{stats.pendingParents}건</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-0 border-start border-info border-4 shadow h-100 py-2">
            <div className="card-body">
              <div className="text-xs fw-bold text-info text-uppercase mb-1">주요 일정</div>
              <div className="h5 mb-0 fw-bold">
                <Link to={`${BASE}/master/schedule`} className="text-decoration-none text-dark">일정 확인 →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-2">
        <div className="col-lg-8">
          <div className="card shadow mb-4 border-0">
            <div className="card-header py-3 d-flex align-items-center justify-content-between bg-white">
              <h6 className="m-0 fw-bold text-primary">시스템 안내</h6>
            </div>
            <div className="card-body">
              <p>학교 관리 시스템 관리자 페이지에 오신 것을 환영합니다.</p>
              <p className="mb-0 text-muted small">* 왼쪽 메뉴를 통해 학급 편성, 교직원 관리 및 학생 DB 관리를 진행하실 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
