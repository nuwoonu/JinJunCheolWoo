// [soojin] 학급 앨범 위젯
// GET /api/class/photos/{classroomId} - 미구현
// 현재 placeholder 이미지로 반응형 그리드 표시

interface Props {
  classroomId: number | null
}

const MOCK_PHOTOS = Array.from({ length: 5 }, (_, i) => i)

export default function ClassAlbumWidget({ classroomId: _classroomId }: Props) {
  return (
    <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: '1px solid #e5e7eb' }}>
      <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-image-2-line text-primary-600 me-2" />
          학급 앨범
        </h6>
        {_classroomId != null && (
          <a href="/class/album" className="text-primary-600 text-sm" style={{ lineHeight: 1 }}>더보기</a>
        )}
      </div>
      <div className="p-16">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 10,
        }}>
          {MOCK_PHOTOS.map((i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 10,
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="ri-image-line" style={{ fontSize: 28, color: '#9ca3af' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
