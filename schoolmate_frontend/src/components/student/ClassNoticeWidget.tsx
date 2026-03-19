// [soojin] 학급 공지사항 위젯
// 기존 Dashboard.tsx 공지사항 섹션 참고 + classroomId 기반 API로 교체
// GET /api/board/class-notice/{classroomId}?page=0&size=5
// classroomId가 null이면 빈 상태 표시 (백엔드 미연동 상태)

import { useEffect, useState } from 'react'
import api from '../../api/auth'

interface Notice {
  id: number
  title: string
  writerName: string
  createDate: string
}

interface Props {
  classroomId: number | null
}

export default function ClassNoticeWidget({ classroomId }: Props) {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (classroomId == null) {
      setLoading(false)
      return
    }
    api.get(`/board/class-notice/${classroomId}?page=0&size=5`)
      .then(res => {
        // Spring Page 응답: { content: [] } 또는 배열 직접 반환 모두 대응
        const data = res.data
        setNotices(Array.isArray(data) ? data : (data.content ?? []))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [classroomId])

  return (
    <div className="card shadow-sm p-20 h-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <div className="d-flex justify-content-between align-items-center mb-20">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-notification-badge-line text-primary-600 me-2" />
          학급 공지사항
        </h6>
        <div className="d-flex align-items-center gap-12">
          {classroomId != null && (
            <a href="/board/grade/1" className="text-primary-600 text-sm">더보기</a>
          )}
          <button style={{ background: '#25A194', color: 'white', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>작성</button>
        </div>
      </div>

      {loading ? (
        <p className="text-secondary-light text-sm text-center py-20 mb-0">불러오는 중...</p>
      ) : classroomId == null ? (
        <div className="text-center py-20">
          <i className="ri-information-line text-secondary-light mb-8" style={{ fontSize: 32 }} />
          <p className="text-secondary-light text-sm mb-0">학급 배정 후 공지사항을 확인할 수 있습니다.</p>
        </div>
      ) : notices.length > 0 ? (
        notices.map((n, i) => (
          <div
            key={n.id}
            className={`d-flex align-items-center justify-content-between py-12${i < notices.length - 1 ? ' border-bottom' : ''}`}
          >
            <div className="d-flex align-items-center gap-12">
              <i className="ri-file-text-line text-secondary-light" />
              <span className="text-sm text-primary-light">{n.title}</span>
            </div>
            <span className="text-xs text-secondary-light flex-shrink-0 ms-8">
              {n.createDate?.slice(0, 10)}
            </span>
          </div>
        ))
      ) : (
        <div className="text-center text-secondary-light text-sm py-20">
          등록된 공지사항이 없습니다.
        </div>
      )}
    </div>
  )
}
