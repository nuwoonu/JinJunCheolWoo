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

const MOCK_POSTS: BoardPost[] = [
  { id: 1, title: '우리 반 3월 단체 사진 올라왔다!', writerName: '학생1', createDate: '2026-03-18' },
  { id: 2, title: '이번 주 청소 당번 확인해~', writerName: '학생2', createDate: '2026-03-15' },
  { id: 3, title: '3월 행사 일정 같이 확인하자!!', writerName: '학생3', createDate: '2026-03-12' },
]

function isNew(dateStr: string) {
  return (new Date().getTime() - new Date(dateStr).getTime()) < 3 * 24 * 60 * 60 * 1000
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
    <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-article-line text-primary-600 me-2" />
          학급 게시판
        </h6>
        {classroomId != null && (
          <a href="/board/class" className="text-primary-600 text-sm" style={{ lineHeight: 1 }}>더보기</a>
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
        /* 기존: posts.length > 0 ? posts.map(...) : 빈상태
        posts.map((post, i) => (
          <div key={post.id} className={`d-flex align-items-center justify-content-between py-12${i < posts.length - 1 ? ' border-bottom' : ''}`}>
            <div className="d-flex align-items-center gap-12">
              <i className="ri-article-line text-secondary-light" />
              <div>
                <span className="text-sm text-primary-light d-block">{post.title}</span>
                <span className="text-xs text-secondary-light">{post.writerName}</span>
              </div>
            </div>
            <span className="text-xs text-secondary-light flex-shrink-0 ms-8">{post.createDate?.slice(0, 10)}</span>
          </div>
        ))
        */
        (() => {
          const list = posts.length > 0 ? posts : MOCK_POSTS
          return list.map((post, i) => (
            <div
              key={post.id}
              className="d-flex align-items-center justify-content-between py-12"
              style={{ borderBottom: i < list.length - 1 ? '1px solid #f3f4f6' : 'none' }}
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
        })()
      )}
      </div>
    </div>
  )
}
