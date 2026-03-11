import AdminLayout from '../../../../components/layout/AdminLayout'

export default function AccessLogs() {
  return (
    <AdminLayout>
      <h2 className="mb-4">시스템 접속 기록</h2>
      <div className="card shadow-sm border-0">
        <div className="card-body text-center py-5 text-muted">
          <i className="bi bi-box-arrow-in-right display-1 d-block mb-3" />
          <p className="mt-3">사용자들의 시스템 로그인/로그아웃 기록을 조회합니다.</p>
        </div>
      </div>
    </AdminLayout>
  )
}
