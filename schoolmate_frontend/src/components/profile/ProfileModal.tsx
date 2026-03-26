import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/api/auth'

// 어디서든 openProfileModal()로 열 수 있는 프로필 모달
// 사용: const { openProfileModal } = useProfileModal()

const ROLE_LABEL: Record<string, string> = {
  STUDENT: '학생', TEACHER: '교사', ADMIN: '관리자',
  PARENT: '학부모', GUEST: '게스트',
}

const PROVIDERS = [
  { key: 'email',  label: '이메일',  icon: 'ri-mail-line',       color: '#6366f1' },
  { key: 'google', label: 'Google',  icon: 'ri-google-fill',     color: '#ea4335' },
  { key: 'kakao',  label: 'Kakao',   icon: 'ri-kakao-talk-fill', color: '#f9e000' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: Props) {
  const { user, refetch } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [imgLoading, setImgLoading] = useState(false)

  // 비밀번호 변경 뷰 전환
  const [view, setView] = useState<'profile' | 'password'>('profile')
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [pwLoading, setPwLoading] = useState(false)

  // 모달 열릴 때 최신 이미지 동기화
  useEffect(() => {
    if (isOpen) {
      setImgSrc(user?.profileImageUrl ?? null)
      setView('profile')
      setPw({ current: '', next: '', confirm: '' })
      setPwMsg(null)
    }
  }, [isOpen, user?.profileImageUrl])

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isSocial = user?.provider != null

  // ── 이미지 업로드 ──────────────────────────────────────────────────────────
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImgLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post('/user/profile/image', fd)
      setImgSrc(res.data.profileImageUrl)
      refetch()
    } catch {
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      setImgLoading(false)
      e.target.value = ''
    }
  }

  // ── 비밀번호 변경 ──────────────────────────────────────────────────────────
  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.next !== pw.confirm) {
      setPwMsg({ text: '새 비밀번호가 일치하지 않습니다.', ok: false })
      return
    }
    setPwLoading(true)
    setPwMsg(null)
    try {
      await api.post('/user/password', { currentPassword: pw.current, newPassword: pw.next })
      setPwMsg({ text: '비밀번호가 변경되었습니다.', ok: true })
      setPw({ current: '', next: '', confirm: '' })
    } catch (err: any) {
      setPwMsg({ text: err?.response?.data?.message ?? '비밀번호 변경에 실패했습니다.', ok: false })
    } finally {
      setPwLoading(false)
    }
  }

  // ── 공통 스타일 ────────────────────────────────────────────────────────────
  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 0', borderBottom: '1px solid #f3f4f6',
  }
  const iconWrap: React.CSSProperties = {
    width: 34, height: 34, borderRadius: '50%', background: '#f3f4f6',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
  const labelStyle: React.CSSProperties = { fontSize: 13, color: '#6b7280' }
  const valueStyle: React.CSSProperties = { fontSize: 14, fontWeight: 500, color: '#111827' }

  // ── 렌더 ──────────────────────────────────────────────────────────────────
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999, padding: '16px',
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440,
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }}>

        {/* 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {view === 'password' && (
              <button
                onClick={() => { setView('profile'); setPwMsg(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px 4px', marginRight: 2 }}
              >
                <i className="ri-arrow-left-line" style={{ fontSize: 18 }} />
              </button>
            )}
            <h6 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
              {view === 'profile' ? '내 프로필' : '비밀번호 변경'}
            </h6>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {view === 'profile' && (
            <>
              {/* 프로필 이미지 영역 */}
              <div style={{
                background: 'linear-gradient(135deg, #25A194 0%, #1a7a6e 100%)',
                padding: '28px 0 52px',
                textAlign: 'center',
              }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <div style={{
                    width: 88, height: 88, borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.8)',
                    background: '#e5e7eb', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    {imgSrc ? (
                      <img src={imgSrc} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgSrc(null)} />
                    ) : (
                      <i className="ri-user-3-line" style={{ fontSize: 40, color: '#9ca3af' }} />
                    )}
                    {imgLoading && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                      }}>
                        <div className="spinner-border spinner-border-sm text-light" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={imgLoading}
                    title="프로필 이미지 변경"
                    style={{
                      position: 'absolute', bottom: 1, right: 1,
                      width: 26, height: 26, borderRadius: '50%',
                      background: '#fff', border: '2px solid #25A194',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    }}
                  >
                    <i className="ri-pencil-line" style={{ fontSize: 12, color: '#25A194' }} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                </div>
              </div>

              {/* 정보 카드 — 이미지 아래 겹침 */}
              <div style={{ margin: '-36px 20px 0', position: 'relative', zIndex: 1 }}>
                <div style={{
                  background: '#fff', borderRadius: 16,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  padding: '16px 20px',
                }}>
                  {/* 이름 + 역할 */}
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <p style={{ fontWeight: 700, fontSize: 17, margin: '0 0 6px', color: '#111827' }}>
                      {user?.name ?? '-'}
                    </p>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      background: '#e6f7f6', color: '#25A194',
                      borderRadius: 20, padding: '3px 14px',
                    }}>
                      {ROLE_LABEL[user?.role ?? ''] ?? user?.role ?? '-'}
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 4 }}>
                    {/* 이메일 */}
                    <div style={rowStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={iconWrap}><i className="ri-mail-line" style={{ fontSize: 15, color: '#6b7280' }} /></div>
                        <span style={labelStyle}>이메일</span>
                      </div>
                      <span style={valueStyle}>{user?.email ?? '-'}</span>
                    </div>

                    {/* 연동 계정 */}
                    <div style={rowStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={iconWrap}><i className="ri-links-line" style={{ fontSize: 15, color: '#6b7280' }} /></div>
                        <span style={labelStyle}>연동 계정</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {PROVIDERS.map(p => {
                          const on = p.key === 'email' ? !isSocial : user?.provider === p.key
                          return (
                            <span key={p.key} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                              fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                              background: on ? p.color + '18' : '#f3f4f6',
                              color: on ? p.color : '#9ca3af',
                              border: `1px solid ${on ? p.color + '40' : '#e5e7eb'}`,
                            }}>
                              <i className={p.icon} style={{ fontSize: 12 }} />
                              {p.label}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    {/* 비밀번호 변경 */}
                    <div style={{ ...rowStyle, borderBottom: 'none', paddingBottom: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={iconWrap}><i className="ri-lock-2-line" style={{ fontSize: 15, color: '#6b7280' }} /></div>
                        <span style={labelStyle}>비밀번호</span>
                      </div>
                      <button
                        onClick={() => setView('password')}
                        disabled={isSocial}
                        title={isSocial ? '소셜 로그인 계정은 비밀번호 변경이 불가합니다' : undefined}
                        style={{
                          padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          border: 'none', cursor: isSocial ? 'not-allowed' : 'pointer',
                          background: isSocial ? '#f3f4f6' : 'linear-gradient(135deg, #25A194, #1a7a6e)',
                          color: isSocial ? '#9ca3af' : '#fff',
                        }}
                      >
                        변경
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ height: 20 }} />
            </>
          )}

          {view === 'password' && (
            <div style={{ padding: '24px 20px' }}>
              {isSocial ? (
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 14, padding: '32px 0' }}>
                  <i className="ri-lock-2-line" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} />
                  소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.
                </div>
              ) : (
                <form onSubmit={handlePwSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {([
                    { label: '현재 비밀번호',    key: 'current'  },
                    { label: '새 비밀번호',      key: 'next'     },
                    { label: '새 비밀번호 확인', key: 'confirm'  },
                  ] as { label: string; key: keyof typeof pw }[]).map(({ label, key }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                        {label}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        required
                        value={pw[key]}
                        onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                      />
                    </div>
                  ))}

                  {pwMsg && (
                    <p style={{ margin: 0, fontSize: 13, color: pwMsg.ok ? '#16a34a' : '#ef4444' }}>
                      {pwMsg.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={pwLoading}
                    style={{
                      padding: '10px 0', borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #25A194, #1a7a6e)',
                      color: '#fff', fontWeight: 700, fontSize: 14,
                      cursor: pwLoading ? 'not-allowed' : 'pointer',
                      opacity: pwLoading ? 0.7 : 1,
                    }}
                  >
                    {pwLoading ? '변경 중...' : '비밀번호 변경'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body,
  )
}
