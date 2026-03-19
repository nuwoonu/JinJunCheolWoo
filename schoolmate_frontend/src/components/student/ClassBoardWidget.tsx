// [soojin] 학급 게시판 위젯
// GET /api/board/class-board/{classroomId}?page=0&size=5
// 백엔드 API 미완성 → classroomId null이거나 API 실패 시 빈 상태 표시
// ClassNoticeWidget과 동일한 패턴

import { useEffect, useState } from 'react'
import api from '../../api/auth'

interface BoardPost {
  id: number
  title: string
  writerName: string
  createDate: string
}

interface Props {
  classroomId: number | null
}

export default function ClassBoardWidget({ classroomId }: Props) {
  const [posts, setPosts] = useState<BoardPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (classroomId == null) {
      setLoading(false)
      return
    }
    api.get(`/board/class-board/${classroomId}?page=0&size=5`)
      .then(res => {
        const data = res.data
        setPosts(Array.isArray(data) ? data : (data.content ?? []))
      })
      .catch(() => {
        // API 미완성 상태 - 빈 배열 유지
      })
      .finally(() => setLoading(false))
  }, [classroomId])

  return (
    <div className="card shadow-sm p-20 h-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <div className="d-flex justify-content-between align-items-center mb-20">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-article-line text-primary-600 me-2" />
          학급 게시판
        </h6>
        <button style={{ background: '#25A194', color: 'white', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>작성</button>
      </div>

      {loading ? (
        <p className="text-secondary-light text-sm text-center py-20 mb-0">불러오는 중...</p>
      ) : classroomId == null ? (
        <div className="text-center py-20">
          <i className="ri-information-line text-secondary-light mb-8" style={{ fontSize: 32 }} />
          <p className="text-secondary-light text-sm mb-0">학급 배정 후 게시판을 이용할 수 있습니다.</p>
        </div>
      ) : posts.length > 0 ? (
        posts.map((post, i) => (
          <div
            key={post.id}
            className={`d-flex align-items-center justify-content-between py-12${i < posts.length - 1 ? ' border-bottom' : ''}`}
          >
            <div className="d-flex align-items-center gap-12">
              <i className="ri-article-line text-secondary-light" />
              <div>
                <span className="text-sm text-primary-light d-block">{post.title}</span>
                <span className="text-xs text-secondary-light">{post.writerName}</span>
              </div>
            </div>
            <span className="text-xs text-secondary-light flex-shrink-0 ms-8">
              {post.createDate?.slice(0, 10)}
            </span>
          </div>
        ))
      ) : (
        <div className="text-center text-secondary-light text-sm py-20">
          등록된 게시물이 없습니다.
        </div>
      )}
    </div>
  )
}
