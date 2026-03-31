import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminTopBar from '@/components/layout/admin/AdminTopBar'
import { ADMIN_ROUTES } from '@/constants/routes'
import adminApi from '@/api/adminApi'

interface Notice {
  id: number
  title: string
  writerName: string
  viewCount: number
  isPinned: boolean
  createDate: string
}

const th: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 600,
  color: '#6b7280',
  background: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
  textAlign: 'left',
}

const td: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 14,
  color: '#374151',
  borderBottom: '1px solid #f3f4f6',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
}

export default function ServiceNoticeList() {
  const navigate = useNavigate()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const fetchNotices = (p = 0, kw = keyword) => {
    setLoading(true)
    const params: Record<string, unknown> = { page: p, size: 10 }
    if (kw.trim()) params.keyword = kw.trim()
    adminApi.get('/service-notices', { params })
      .then(res => {
        setNotices(res.data.content)
        setTotalPages(res.data.totalPages)
        setTotalElements(res.data.totalElements)
        setPage(res.data.number ?? p)
      })
      .catch(() => setError('공지사항을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchNotices(0) }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setKeyword(searchInput)
    fetchNotices(0, searchInput)
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" 공지를 삭제하시겠습니까?`)) return
    try {
      await adminApi.delete(`/service-notices/${id}`)
      setMsg('공지가 삭제되었습니다.')
      setError('')
      fetchNotices(page)
    } catch {
      setError('삭제에 실패했습니다.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* [soojin] 사이드바 없는 페이지이므로 좌측 상단 로고 표시 */}
      <AdminTopBar position="sticky" showBackButton={true} sectionBadge="서비스 공지 관리" showLogo />

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>

        {/* 페이지 헤더 */}
        <div style={{ marginBottom: 28 }}>
          <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>서비스 공지 관리</h5>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>SchoolMate 서비스 공지사항을 작성·관리합니다.</p>
        </div>

        {msg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#065f46' }}>
            {msg}
          </div>
        )}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#991b1b' }}>
            {error}
          </div>
        )}

        {/* 검색 + 작성 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="제목 검색"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{
                padding: '9px 14px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                width: 240,
                outline: 'none',
                color: '#374151',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '9px 18px',
                background: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              검색
            </button>
          </form>
          <button
            onClick={() => navigate(ADMIN_ROUTES.SERVICE_NOTICES.CREATE)}
            style={{
              padding: '9px 20px',
              background: 'linear-gradient(135deg, #25A194, #1a7a6e)',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + 공지 작성
          </button>
        </div>

        {/* 테이블 */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 64 }} />
              <col />
              <col style={{ width: 100 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 64 }} />
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'center' }}>번호</th>
                <th style={th}>제목</th>
                <th style={{ ...th, textAlign: 'center' }}>작성자</th>
                <th style={{ ...th, textAlign: 'center' }}>작성일</th>
                <th style={{ ...th, textAlign: 'center' }}>조회</th>
                <th style={{ ...th, textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: '40px 0', whiteSpace: 'normal' }}>
                    불러오는 중...
                  </td>
                </tr>
              ) : notices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: '40px 0', whiteSpace: 'normal' }}>
                    등록된 공지가 없습니다.
                  </td>
                </tr>
              ) : (
                notices.map((notice, i) => (
                  <tr
                    key={notice.id}
                    style={{ background: notice.isPinned ? 'rgba(37,161,148,0.04)' : '#fff' }}
                  >
                    <td style={{ ...td, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                      {notice.isPinned ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          background: '#fef2f2',
                          color: '#dc2626',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}>
                          공지
                        </span>
                      ) : (
                        totalElements - page * 10 - i
                      )}
                    </td>
                    <td style={{ ...td, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => navigate(ADMIN_ROUTES.SERVICE_NOTICES.DETAIL(notice.id))}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: '#1d4ed8',
                          fontWeight: 500,
                          fontSize: 14,
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notice.title}
                      </button>
                    </td>
                    <td style={{ ...td, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>{notice.writerName}</td>
                    <td style={{ ...td, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>{notice.createDate?.slice(0, 10)}</td>
                    <td style={{ ...td, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>{notice.viewCount}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={() => navigate(ADMIN_ROUTES.SERVICE_NOTICES.EDIT(notice.id))}
                          style={{
                            padding: '4px 12px',
                            background: '#fff',
                            border: '1px solid #25A194',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#25A194',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(notice.id, notice.title)}
                          style={{
                            padding: '4px 12px',
                            background: '#fff',
                            border: '1px solid #ef4444',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#ef4444',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', borderTop: '1px solid #f3f4f6', gap: 4 }}>
              <button
                onClick={() => fetchNotices(page - 1)}
                disabled={page === 0}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  background: '#fff',
                  color: page === 0 ? '#d1d5db' : '#374151',
                  cursor: page === 0 ? 'default' : 'pointer',
                  fontSize: 14,
                }}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => fetchNotices(i)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid',
                    borderColor: i === page ? '#25A194' : '#e5e7eb',
                    borderRadius: 6,
                    background: i === page ? '#25A194' : '#fff',
                    color: i === page ? '#fff' : '#374151',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: i === page ? 600 : 400,
                    minWidth: 36,
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => fetchNotices(page + 1)}
                disabled={page >= totalPages - 1}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  background: '#fff',
                  color: page >= totalPages - 1 ? '#d1d5db' : '#374151',
                  cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                  fontSize: 14,
                }}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
