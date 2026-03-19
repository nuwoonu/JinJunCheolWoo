// [jin] 우리 반 알림장 위젯 (교사용)
// 백엔드 API 미구현 → mock 데이터로 UI만 표시
// TODO: 백엔드 연동 시 api.get(`/notebook/class/${classroomId}`) 로 교체

interface NotebookEntry {
  id: number
  date: string
  content: string
}

interface Props {
  classroomId: number | null
  readonly?: boolean
  moreHref?: string
}

const MOCK_ENTRIES: NotebookEntry[] = [
  { id: 1, date: '2026-03-18', content: '내일 현장학습 준비물을 꼭 챙겨오세요. 도시락, 물, 편한 복장 착용 바랍니다.' },
  { id: 2, date: '2026-03-17', content: '이번 주 금요일 학부모 상담 주간입니다. 상담 신청 여부를 확인해 주세요.' },
  { id: 3, date: '2026-03-14', content: '수학 단원평가가 다음 주 월요일에 진행됩니다. 3단원까지 복습하세요.' },
  { id: 4, date: '2026-03-13', content: '봄 소풍 동의서를 내일까지 제출해 주세요. 미제출 시 참가가 어렵습니다.' },
]

export default function ClassNotebookWidget({ classroomId: _classroomId, readonly = false, moreHref }: Props) {
  const entries = MOCK_ENTRIES

  return (
    <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: '1px solid #e5e7eb' }}>
      {/* 헤더 */}
      <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
        <div className="d-flex align-items-center gap-8">
          <iconify-icon icon="mdi:notebook-outline" className="text-primary-600 text-xl" />
          <h6 className="fw-bold mb-0 text-sm">우리 반 알림장</h6>
        </div>
        {moreHref && <a href={moreHref} className="text-primary-600 text-sm" style={{ lineHeight: 1 }}>더보기</a>}
        {!readonly && (
          <button
            style={{ background: '#25A194', color: 'white', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            작성
          </button>
        )}
      </div>

      {/* 목록 */}
      <div className="p-16">
        {entries.length === 0 ? (
          <div className="text-center text-secondary-light text-sm py-24">
            등록된 알림장이 없습니다.
          </div>
        ) : (
          <div className="d-flex flex-column gap-0">
            {/* 기존 UI 주석처리
            {entries.map((entry, i) => (
              <div key={entry.id} className="py-14 px-4" style={{ borderBottom: i < entries.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div className="d-flex align-items-center gap-8 mb-4">
                  <span className="text-xs fw-semibold px-8 py-2 rounded" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>{entry.date}</span>
                </div>
                <p className="text-sm mb-0" style={{ color: '#374151', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{entry.content}</p>
              </div>
            ))}
            */}
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className="d-flex align-items-center justify-content-between py-12"
                style={{ borderBottom: i < entries.length - 1 ? '1px solid #f3f4f6' : 'none' }}
              >
                <div className="d-flex align-items-center gap-12">
                  <i className="ri-notification-3-line text-secondary-light" />
                  <span className="text-sm" style={{ color: '#374151' }}>{entry.content}</span>
                </div>
                <span className="text-xs text-secondary-light flex-shrink-0 ms-8">{entry.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
