// [soojin] 학급 앨범 위젯
// GET /api/class/photos/{classroomId} - 미구현
// FileService 연동은 나중에 → 현재 "준비 중" 상태로 표시

interface Props {
  classroomId: number | null
}

export default function ClassAlbumWidget({ classroomId: _classroomId }: Props) {
  return (
    <div className="card shadow-sm h-100 d-flex align-items-center justify-content-center" style={{ borderRadius: 16, minHeight: 200, border: "1px solid #e5e7eb" }}>
      <div className="text-center py-32 px-20">
        <div className="w-64-px h-64-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center mx-auto mb-16">
          <i className="ri-image-2-line text-secondary-light" style={{ fontSize: 28 }} />
        </div>
        <h6 className="fw-semibold text-secondary-light mb-4">학급 앨범</h6>
        <p className="text-xs text-secondary-light mb-0">준비 중입니다.</p>
      </div>
    </div>
  )
}
