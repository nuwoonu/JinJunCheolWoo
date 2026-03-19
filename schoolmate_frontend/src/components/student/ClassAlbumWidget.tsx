// [soojin] 학급 앨범 위젯
// GET /api/class/photos/{classroomId} - 미구현
// FileService 연동은 나중에 → 현재 "준비 중" 상태로 표시

interface Props {
  classroomId: number | null
}

export default function ClassAlbumWidget({ classroomId: _classroomId }: Props) {
  return (
    <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-image-2-line text-primary-600 me-2" />
          학급 앨범
        </h6>
        <button style={{ background: '#25A194', color: 'white', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>작성</button>
      </div>
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 160 }}>
        <div className="text-center py-32 px-20">
          <div className="w-64-px h-64-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center mx-auto mb-16">
            <i className="ri-image-2-line text-secondary-light" style={{ fontSize: 28 }} />
          </div>
          <p className="text-xs text-secondary-light mb-0">준비 중입니다.</p>
        </div>
      </div>
    </div>
  )
}
