// [woo] 학급 앨범 위젯 — 최근 그룹별 첫 번째 사진 썸네일 6개
// GET /api/class/photos/{classroomId} → grouped response
// 호버 시 캡션 표시, 수정/삭제 메뉴 포함

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/shared/api/authApi'
import { useAuth } from '@/shared/contexts/AuthContext'

interface PhotoItem {
  id: number
  imageUrl: string
  caption: string
}

interface PhotoGroup {
  groupId: string
  photos: PhotoItem[]
  uploaderName: string
  createDate: string
}

interface Props {
  classroomId: number | null
  moreHref?: string
}

export default function ClassAlbumWidget({ classroomId, moreHref }: Props) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [groups, setGroups] = useState<PhotoGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<PhotoItem | null>(null)
  // [woo] 수정/삭제 메뉴 열린 그룹
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const canManage = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  useEffect(() => {
    if (!classroomId) { setLoading(false); return }
    api.get(`/class/photos/${classroomId}`)
      .then(res => setGroups(Array.isArray(res.data) ? res.data.slice(0, 6) : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [classroomId])

  // [woo] 그룹 삭제
  const handleDelete = async (group: PhotoGroup) => {
    if (!confirm(`사진 ${group.photos.length}장을 모두 삭제하시겠습니까?`)) return
    try {
      await Promise.all(group.photos.map(p => api.delete(`/class/photos/${p.id}`)))
      setGroups(prev => prev.filter(g => g.groupId !== group.groupId))
    } catch {
      alert('삭제에 실패했습니다.')
    }
    setMenuOpenId(null)
  }

  // [woo] 수정 — 앨범 페이지로 이동
  const handleEdit = () => {
    setMenuOpenId(null)
    if (moreHref) navigate(moreHref)
    else alert('앨범 페이지에서 수정할 수 있습니다.')
  }

  return (
    <>
      <div className="card shadow-sm h-100 dash-card">
        <div className="d-flex justify-content-between align-items-center dash-card-header">
          <div className="d-flex align-items-center gap-8">
            <i className="ri-image-2-line text-primary-600" style={{ fontSize: 18 }} />
            <h6 className="fw-bold mb-0 text-sm">학급 앨범</h6>
          </div>
          {moreHref && (
            <button
              type="button"
              className="btn p-0 text-primary-600 text-sm"
              style={{ lineHeight: 1, background: 'none', border: 'none' }}
              onClick={() => navigate(moreHref)}
            >
              더보기
            </button>
          )}
        </div>
        <div className="p-12">
          {loading ? (
            <div className="text-center text-secondary-light text-sm py-20">불러오는 중...</div>
          ) : groups.length === 0 ? (
            <div className="text-center text-secondary-light text-sm py-20">등록된 사진이 없습니다.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {groups.map(group => {
                const caption = group.photos.find(p => p.caption)?.caption
                return (
                  <div
                    key={group.groupId}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 8,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'var(--bg-color, #f3f4f6)',
                      border: '2px solid var(--primary-200, #99DDD5)',
                      boxSizing: 'border-box',
                      position: 'relative',
                    }}
                    onClick={() => setLightbox(group.photos[0])}
                  >
                    <img
                      src={group.photos[0].imageUrl}
                      alt={group.photos[0].caption || '학급 사진'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* [woo] 여러 장 표시 뱃지 */}
                    {group.photos.length > 1 && (
                      <div style={{
                        position: 'absolute', bottom: 4, right: 4,
                        background: 'rgba(0,0,0,0.5)', color: '#fff',
                        fontSize: 10, borderRadius: 10, padding: '1px 6px',
                      }}>
                        +{group.photos.length - 1}
                      </div>
                    )}
                    {/* [woo] 호버 시 캡션 오버레이 */}
                    {caption && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                        color: '#fff', fontSize: 10, padding: '12px 6px 4px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        opacity: 0, transition: 'opacity 0.2s',
                        pointerEvents: 'none',
                      }}
                        className="album-caption-overlay"
                      >
                        {caption}
                      </div>
                    )}
                    {/* [woo] 수정/삭제 메뉴 버튼 */}
                    {canManage && (
                      <div style={{ position: 'absolute', top: 2, right: 2 }}>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setMenuOpenId(menuOpenId === group.groupId ? null : group.groupId)
                          }}
                          style={{
                            background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer',
                            color: '#fff', fontSize: 14, borderRadius: '50%',
                            width: 22, height: 22,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <i className="ri-more-2-fill" />
                        </button>
                        {menuOpenId === group.groupId && (
                          <>
                            <div
                              onClick={e => { e.stopPropagation(); setMenuOpenId(null) }}
                              style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                            />
                            <div
                              onClick={e => e.stopPropagation()}
                              style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: 2,
                                background: 'white', borderRadius: 8,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                padding: 4, zIndex: 10, minWidth: 72,
                              }}
                            >
                              <button
                                onClick={() => handleEdit()}
                                style={{
                                  display: 'block', width: '100%', background: 'none', border: 'none',
                                  padding: '5px 10px', fontSize: 12, cursor: 'pointer',
                                  textAlign: 'left', color: '#374151', borderRadius: 4,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDelete(group)}
                                style={{
                                  display: 'block', width: '100%', background: 'none', border: 'none',
                                  padding: '5px 10px', fontSize: 12, cursor: 'pointer',
                                  textAlign: 'left', color: '#dc2626', borderRadius: 4,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                              >
                                삭제
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* [woo] 라이트박스 */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 24,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 700, width: '100%', textAlign: 'center' }}>
            <img
              src={lightbox.imageUrl}
              alt={lightbox.caption}
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 12, objectFit: 'contain' }}
            />
            {lightbox.caption && (
              <p style={{ color: '#fff', marginTop: 12, fontSize: 14 }}>{lightbox.caption}</p>
            )}
          </div>
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* [woo] 호버 시 캡션 표시용 CSS */}
      <style>{`
        [style*="aspect-ratio"]:hover .album-caption-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </>
  )
}
