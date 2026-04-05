// [woo] 공지사항 위젯 — 가정통신문(PARENT_NOTICE) / 학급 공지(CLASS_NOTICE) 공용
// apiEndpoint prop으로 호출 API 구분
// - 가정통신문: /board/parent-notice?page=0&size=5
// - 학급 공지:  /board/class-notice/{classroomId}?page=0&size=5

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/shared/api/authApi'

interface Notice {
  id: number
  title: string
  writerName: string
  createDate: string
}

interface Props {
  classroomId: number | null
  title?: string
  moreHref?: string
  apiEndpoint?: string // [woo] 커스텀 API 경로 (없으면 class-notice/{classroomId} 기본)
  detailPrefix?: string // [woo] 항목 클릭 시 이동할 상세 경로 접두사 (예: /board/parent-notice → /board/parent-notice/{id})
}

function isNew(dateStr: string) {
  return (new Date().getTime() - new Date(dateStr).getTime()) < 3 * 24 * 60 * 60 * 1000
}

export default function ClassNoticeWidget({ classroomId, title = '학급 알림장', moreHref, apiEndpoint, detailPrefix }: Props) {
  const navigate = useNavigate()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // [woo] apiEndpoint가 있으면 그대로 사용, 없으면 classroomId 기반 기본 경로
    const url = apiEndpoint
      ? `${apiEndpoint}?page=0&size=5`
      : classroomId != null
        ? `/board/class-notice/${classroomId}?page=0&size=5`
        : null

    if (!url) {
      setLoading(false)
      return
    }
    api.get(url)
      .then(res => {
        const data = res.data
        setNotices(Array.isArray(data) ? data : (data.content ?? []))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [classroomId, apiEndpoint])

  return (
    <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-notification-badge-line text-primary-600 me-2" />
          {title}
        </h6>
        {moreHref && (
          <a
            href={moreHref}
            className="text-primary-600 text-sm"
            style={{ lineHeight: 1 }}
            onClick={(e) => { e.preventDefault(); navigate(moreHref) }}
          >
            더보기
          </a>
        )}
      </div>

      <div className="p-16">
      {loading ? (
        <p className="text-secondary-light text-sm text-center py-20 mb-0">불러오는 중...</p>
      ) : classroomId == null && !apiEndpoint ? (
        <div className="text-center py-20">
          <i className="ri-information-line text-secondary-light mb-8" style={{ fontSize: 32 }} />
          <p className="text-secondary-light text-sm mb-0">학급 배정 후 공지사항을 확인할 수 있습니다.</p>
        </div>
      ) : (
        notices.length > 0 ? (
          notices.map((n, i) => (
            <div
              key={n.id}
              className="d-flex align-items-center justify-content-between py-12"
              style={{
                borderBottom: i < notices.length - 1 ? '1px solid #f3f4f6' : 'none',
                cursor: detailPrefix ? 'pointer' : 'default',
              }}
              onClick={() => detailPrefix && navigate(`${detailPrefix}/${n.id}`)}
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
        ) : (
          <div className="text-center text-secondary-light text-sm py-20">
            등록된 공지사항이 없습니다.
          </div>
        )
      )}
      </div>
    </div>
  )
}
