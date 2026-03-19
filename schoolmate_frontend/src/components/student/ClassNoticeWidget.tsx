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
  title?: string
}

const MOCK_NOTICES: Notice[] = [
  { id: 1, title: '3월 가정통신문 안내', writerName: '담임', createDate: '2026-03-18' },
  { id: 2, title: '봄 소풍 사전 동의서 제출 안내', writerName: '담임', createDate: '2026-03-15' },
  { id: 3, title: '학부모 상담 주간 신청 안내', writerName: '교무', createDate: '2026-03-10' },
]

function isNew(dateStr: string) {
  return (new Date().getTime() - new Date(dateStr).getTime()) < 3 * 24 * 60 * 60 * 1000
}

export default function ClassNoticeWidget({ classroomId, title = '학급 알림장' }: Props) {
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
    <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-notification-badge-line text-primary-600 me-2" />
          {title}
        </h6>
        {classroomId != null && (
          <a href="/board/grade/1" className="text-primary-600 text-sm" style={{ lineHeight: 1 }}>더보기</a>
        )}
      </div>

      <div className="p-16">
      {loading ? (
        <p className="text-secondary-light text-sm text-center py-20 mb-0">불러오는 중...</p>
      ) : classroomId == null ? (
        <div className="text-center py-20">
          <i className="ri-information-line text-secondary-light mb-8" style={{ fontSize: 32 }} />
          <p className="text-secondary-light text-sm mb-0">학급 배정 후 공지사항을 확인할 수 있습니다.</p>
        </div>
      ) : (
        /* 기존 UI 주석처리
        notices.length > 0 ? (
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
        )
        */
        (() => {
          const list = notices.length > 0 ? notices : MOCK_NOTICES
          return list.map((n, i) => (
            <div
              key={n.id}
              className="d-flex align-items-center justify-content-between py-12"
              style={{ borderBottom: i < list.length - 1 ? '1px solid #f3f4f6' : 'none' }}
            >
              <div className="d-flex align-items-center gap-12">
                <i className="ri-file-text-line text-secondary-light" />
                <span className="text-sm" style={{ color: '#374151' }}>{n.title}</span>
                {isNew(n.createDate) && (
                  <span style={{ background: '#25A194', color: 'white', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>새글</span>
                )}
              </div>
              <span className="text-xs text-secondary-light flex-shrink-0 ms-8">{n.createDate?.slice(0, 10)}</span>
            </div>
          ))
        })()
      )}
      </div>
    </div>
  )
}
