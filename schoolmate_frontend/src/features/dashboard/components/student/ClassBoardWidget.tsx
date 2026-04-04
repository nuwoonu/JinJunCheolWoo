// [woo] 학급 게시판 위젯
// apiEndpoint prop으로 호출 API 지정 (예: /board/grade/1)
// 기본 폴백: /board/grade/1

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/shared/api/authApi'

interface BoardPost {
  id: number
  title: string
  writerName: string
  createDate: string
}

interface Props {
  classroomId: number | null
  moreHref?: string
  apiEndpoint?: string // [woo] 커스텀 API 경로 (예: /board/grade/1)
  detailPrefix?: string // [woo] 항목 클릭 시 이동할 상세 경로 접두사 (예: /board/grade/1 → /board/grade/1/{id})
}

function isNew(dateStr: string) {
  return (new Date().getTime() - new Date(dateStr).getTime()) < 3 * 24 * 60 * 60 * 1000
}

export default function ClassBoardWidget({ classroomId, moreHref, apiEndpoint, detailPrefix }: Props) {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BoardPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // [woo] apiEndpoint가 있으면 그대로 사용
    const url = apiEndpoint
      ? `${apiEndpoint}?page=0&size=5`
      : null

    if (!url || classroomId == null) {
      setLoading(false)
      return
    }
    api.get(url)
      .then(res => {
        const data = res.data
        setPosts(Array.isArray(data) ? data : (data.content ?? []))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [classroomId, apiEndpoint])

  return (
    <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-article-line text-primary-600 me-2" />
          학급 게시판
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
      ) : classroomId == null ? (
        <div className="text-center py-20">
          <i className="ri-information-line text-secondary-light mb-8" style={{ fontSize: 32 }} />
          <p className="text-secondary-light text-sm mb-0">학급 배정 후 게시판을 이용할 수 있습니다.</p>
        </div>
      ) : (
        posts.length > 0 ? (
          posts.map((post, i) => (
            <div
              key={post.id}
              className="d-flex align-items-center justify-content-between py-12"
              style={{
                borderBottom: i < posts.length - 1 ? '1px solid #f3f4f6' : 'none',
                cursor: detailPrefix ? 'pointer' : 'default',
              }}
              onClick={() => detailPrefix && navigate(`${detailPrefix}/${post.id}`)}
            >
              <div className="d-flex align-items-center gap-12">
                <i className="ri-file-text-line text-secondary-light" />
                <span className="text-sm" style={{ color: '#374151' }}>{post.title}</span>
                <span className="text-xs text-secondary-light">{post.writerName}</span>
                {isNew(post.createDate) && (
                  <span style={{ background: '#25A194', color: 'white', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>새글</span>
                )}
              </div>
              <span className="text-xs text-secondary-light flex-shrink-0 ms-8">{post.createDate?.slice(0, 10)}</span>
            </div>
          ))
        ) : (
          <div className="text-center text-secondary-light text-sm py-20">
            등록된 게시글이 없습니다.
          </div>
        )
      )}
      </div>
    </div>
  )
}
