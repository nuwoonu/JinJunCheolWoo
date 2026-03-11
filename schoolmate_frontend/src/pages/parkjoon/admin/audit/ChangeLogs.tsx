import AdminLayout from '../../../../components/layout/AdminLayout'

export default function ChangeLogs() {
  return (
    <AdminLayout>
      <h2 className="mb-4">정보 변경 이력</h2>
      <div className="card shadow-sm border-0">
        <div className="card-body text-center py-5 text-muted">
          <i className="bi bi-clock-history display-1 d-block mb-3" />
          <p className="mt-3">민감 정보 변경 이력을 조회합니다.</p>
        </div>
      </div>
    </AdminLayout>
  )
}
