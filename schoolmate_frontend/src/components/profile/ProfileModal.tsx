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

type PwStep = 'request' | 'pending' | 'change'

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

  // 비밀번호 변경 3단계 흐름
  const [pwStep, setPwStep] = useState<PwStep>('request')
  const [verificationCode, setVerificationCode] = useState('')
  const [pw, setPw] = useState({ next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [pwLoading, setPwLoading] = useState(false)

  // 카운트다운 (초 단위)
  const [countdown, setCountdown] = useState(0)
  const [timerKey, setTimerKey] = useState(0) // 재발송 시 타이머 재시작용

  // 카운트다운 타이머 — timerKey가 바뀔 때마다 재시작
  useEffect(() => {
    if (pwStep !== 'pending') return
    const SECONDS = 5 * 60
    setCountdown(SECONDS)
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const resetPwFlow = () => {
    setPwStep('request')
    setVerificationCode('')
    setPw({ next: '', confirm: '' })
    setPwMsg(null)
    setPwLoading(false)
    setCountdown(0)
  }

  // 모달 열릴 때 최신 이미지 동기화 및 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setImgSrc(user?.profileImageUrl ?? null)
      setView('profile')
      resetPwFlow()
    }
  }, [isOpen, user?.profileImageUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // 비밀번호 변경 성공 시 1.5초 후 프로필 뷰로 복귀
  useEffect(() => {
    if (!pwMsg?.ok) return
    const timer = setTimeout(() => {
      setView('profile')
      resetPwFlow()
    }, 1500)
    return () => clearTimeout(timer)
  }, [pwMsg]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── 인증 코드 발송 ─────────────────────────────────────────────────────────
  const handleSendCode = async () => {
    setPwLoading(true)
    setPwMsg(null)
    try {
      await api.post('/user/password/send-code')
      setPwStep('pending')
      setVerificationCode('')
      setTimerKey(k => k + 1) // 타이머 재시작
    } catch (err: any) {
      setPwMsg({ text: err?.response?.data?.message ?? '코드 발송에 실패했습니다. 잠시 후 다시 시도해주세요.', ok: false })
    } finally {
      setPwLoading(false)
    }
  }

  // ── 코드 확인 → 비밀번호 입력 단계로 이동 ─────────────────────────────────
  const handleVerifyCode = (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!verificationCode.trim()) {
      setPwMsg({ text: '인증 코드를 입력해주세요.', ok: false })
      return
    }
    if (countdown === 0) {
      setPwMsg({ text: '인증 코드가 만료되었습니다. 코드를 다시 발송해주세요.', ok: false })
      return
    }
    setPwMsg(null)
    setPwStep('change')
  }

  // ── 비밀번호 변경 최종 제출 ────────────────────────────────────────────────
  const handlePwSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (pw.next !== pw.confirm) {
      setPwMsg({ text: '새 비밀번호가 일치하지 않습니다.', ok: false })
      return
    }
    setPwLoading(true)
    setPwMsg(null)
    try {
      await api.post('/user/password', { verificationCode, newPassword: pw.next })
      setPwMsg({ text: '비밀번호가 변경되었습니다.', ok: true })
      setPw({ next: '', confirm: '' })
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? '비밀번호 변경에 실패했습니다.'
      setPwMsg({ text: msg, ok: false })
      // 코드 관련 오류면 코드 입력 단계로 되돌림
      if (msg.includes('코드')) setPwStep('pending')
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
  const primaryBtn: React.CSSProperties = {
    width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #25A194, #1a7a6e)',
    color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
    textAlign: 'center',
  }

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
                onClick={() => { setView('profile'); resetPwFlow() }}
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
                <>
                  {/* 단계 인디케이터 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
                    {(['request', 'pending', 'change'] as PwStep[]).map((step, i) => {
                      const steps: PwStep[] = ['request', 'pending', 'change']
                      const current = steps.indexOf(pwStep)
                      const isDone = i < current
                      const isActive = i === current
                      return (
                        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isDone ? '#25A194' : isActive ? '#25A194' : '#e5e7eb',
                            color: isDone || isActive ? '#fff' : '#9ca3af',
                          }}>
                            {isDone ? <i className="ri-check-line" style={{ fontSize: 12 }} /> : i + 1}
                          </div>
                          {i < 2 && (
                            <div style={{ width: 32, height: 2, background: isDone ? '#25A194' : '#e5e7eb', borderRadius: 2 }} />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* 1단계: 코드 발송 */}
                  {pwStep === 'request' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        borderRadius: 10, padding: '14px 16px',
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                      }}>
                        <i className="ri-shield-keyhole-line" style={{ fontSize: 18, color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#15803d' }}>이메일 인증 후 변경 가능합니다</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>
                            <strong>{user?.email}</strong>으로 6자리 인증 코드를 발송합니다.
                          </p>
                        </div>
                      </div>
                      {pwMsg && (
                        <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{pwMsg.text}</p>
                      )}
                      <button
                        onClick={handleSendCode}
                        disabled={pwLoading}
                        style={{ ...primaryBtn, opacity: pwLoading ? 0.7 : 1, cursor: pwLoading ? 'not-allowed' : 'pointer' }}
                      >
                        {pwLoading ? '발송 중...' : '인증 코드 발송'}
                      </button>
                    </div>
                  )}

                  {/* 2단계: 코드 입력 */}
                  {pwStep === 'pending' && (
                    <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>인증 코드</label>
                          <span style={{
                            fontSize: 12, fontWeight: 700,
                            color: countdown > 0 ? (countdown <= 60 ? '#ef4444' : '#25A194') : '#9ca3af',
                          }}>
                            {countdown > 0 ? formatCountdown(countdown) : '만료됨'}
                          </span>
                        </div>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="6자리 코드 입력"
                          maxLength={6}
                          value={verificationCode}
                          onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          style={{ letterSpacing: 6, textAlign: 'center', fontSize: 18, fontWeight: 700 }}
                          autoFocus
                        />
                      </div>
                      {pwMsg && (
                        <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{pwMsg.text}</p>
                      )}
                      <button
                        type="submit"
                        disabled={verificationCode.length !== 6 || countdown === 0}
                        style={{
                          ...primaryBtn,
                          opacity: verificationCode.length !== 6 || countdown === 0 ? 0.5 : 1,
                          cursor: verificationCode.length !== 6 || countdown === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        확인
                      </button>
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={pwLoading}
                        style={{
                          background: 'none', border: 'none', cursor: pwLoading ? 'not-allowed' : 'pointer',
                          fontSize: 13, color: '#6b7280', textDecoration: 'underline', padding: 0,
                        }}
                      >
                        {pwLoading ? '발송 중...' : '코드 재발송'}
                      </button>
                    </form>
                  )}

                  {/* 3단계: 새 비밀번호 입력 */}
                  {pwStep === 'change' && (
                    pwMsg?.ok ? (
                      <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          width: 56, height: 56, borderRadius: '50%',
                          background: '#e6f7f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className="ri-check-line" style={{ fontSize: 28, color: '#25A194' }} />
                        </div>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>비밀번호 변경 완료!</p>
                        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>잠시 후 프로필 화면으로 돌아갑니다.</p>
                      </div>
                    ) : (
                      <form onSubmit={handlePwSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {([
                          { label: '새 비밀번호',      key: 'next'    },
                          { label: '새 비밀번호 확인', key: 'confirm' },
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
                          <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{pwMsg.text}</p>
                        )}
                        <button
                          type="submit"
                          disabled={pwLoading}
                          style={{ ...primaryBtn, opacity: pwLoading ? 0.7 : 1, cursor: pwLoading ? 'not-allowed' : 'pointer' }}
                        >
                          {pwLoading ? '변경 중...' : '비밀번호 변경'}
                        </button>
                      </form>
                    )
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body,
  )
}
