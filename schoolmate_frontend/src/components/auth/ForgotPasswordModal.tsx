import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import api from '@/api/auth'

type Step = 'email' | 'pending' | 'change' | 'done'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const EXPIRY_SECONDS = 5 * 60

export default function ForgotPasswordModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pw, setPw] = useState({ next: '', confirm: '' })
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [timerKey, setTimerKey] = useState(0)

  // 카운트다운 타이머
  useEffect(() => {
    if (step !== 'pending') return
    setCountdown(EXPIRY_SECONDS)
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

  const reset = () => {
    setStep('email')
    setEmail('')
    setCode('')
    setPw({ next: '', confirm: '' })
    setMsg(null)
    setLoading(false)
    setCountdown(0)
  }

  useEffect(() => {
    if (isOpen) reset()
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // ── 이메일 확인 + 코드 발송 ─────────────────────────────────────────────────
  const handleSendCode = async () => {
    setLoading(true)
    setMsg(null)
    try {
      await api.post('/auth/password/send-code', { email })
      setStep('pending')
      setCode('')
      setTimerKey(k => k + 1)
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.message ?? '코드 발송에 실패했습니다.', ok: false })
    } finally {
      setLoading(false)
    }
  }

  // ── 코드 확인 → 비밀번호 입력 단계 ────────────────────────────────────────
  const handleVerifyCode = (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!code.trim()) { setMsg({ text: '인증 코드를 입력해주세요.', ok: false }); return }
    if (countdown === 0) { setMsg({ text: '인증 코드가 만료되었습니다. 코드를 다시 발송해주세요.', ok: false }); return }
    setMsg(null)
    setStep('change')
  }

  // ── 비밀번호 재설정 ─────────────────────────────────────────────────────────
  const handleReset = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (pw.next !== pw.confirm) { setMsg({ text: '새 비밀번호가 일치하지 않습니다.', ok: false }); return }
    setLoading(true)
    setMsg(null)
    try {
      await api.post('/auth/password/reset', { email, verificationCode: code, newPassword: pw.next })
      setStep('done')
    } catch (err: any) {
      const text: string = err?.response?.data?.message ?? '비밀번호 변경에 실패했습니다.'
      setMsg({ text, ok: false })
      if (text.includes('코드')) setStep('pending')
    } finally {
      setLoading(false)
    }
  }

  // ── 공통 스타일 ─────────────────────────────────────────────────────────────
  const primaryBtn: React.CSSProperties = {
    width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #25A194, #1a7a6e)',
    color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', textAlign: 'center',
  }

  const STEPS: Step[] = ['email', 'pending', 'change']
  const stepIndex = STEPS.indexOf(step)

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999, padding: 16,
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {step !== 'email' && step !== 'done' && (
              <button
                onClick={() => { setStep(step === 'change' ? 'pending' : 'email'); setMsg(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px 4px' }}
              >
                <i className="ri-arrow-left-line" style={{ fontSize: 18 }} />
              </button>
            )}
            <h6 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>비밀번호 찾기</h6>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div style={{ padding: '24px 20px', overflowY: 'auto', flex: 1 }}>

          {/* 완료 화면 */}
          {step === 'done' ? (
            <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#e6f7f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ri-check-line" style={{ fontSize: 28, color: '#25A194' }} />
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>비밀번호 변경 완료!</p>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>새 비밀번호로 로그인해주세요.</p>
              <button onClick={onClose} style={{ ...primaryBtn, marginTop: 8 }}>
                로그인 화면으로
              </button>
            </div>
          ) : (
            <>
              {/* 단계 인디케이터 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
                {STEPS.map((s, i) => {
                  const isDone = i < stepIndex
                  const isActive = i === stepIndex
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDone || isActive ? '#25A194' : '#e5e7eb',
                        color: isDone || isActive ? '#fff' : '#9ca3af',
                      }}>
                        {isDone ? <i className="ri-check-line" style={{ fontSize: 12 }} /> : i + 1}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div style={{ width: 32, height: 2, background: isDone ? '#25A194' : '#e5e7eb', borderRadius: 2 }} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* 1단계: 이메일 입력 */}
              {step === 'email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: 10, padding: '14px 16px',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    <i className="ri-mail-lock-line" style={{ fontSize: 18, color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ margin: 0, fontSize: 13, color: '#166534' }}>
                      가입 시 사용한 이메일 주소를 입력하면 인증 코드를 발송합니다.
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                      이메일
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="가입한 이메일 주소"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && email) handleSendCode() }}
                      autoFocus
                    />
                  </div>
                  {msg && <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{msg.text}</p>}
                  <button
                    onClick={handleSendCode}
                    disabled={!email || loading}
                    style={{ ...primaryBtn, opacity: !email || loading ? 0.6 : 1, cursor: !email || loading ? 'not-allowed' : 'pointer' }}
                  >
                    {loading ? '발송 중...' : '인증 코드 발송'}
                  </button>
                </div>
              )}

              {/* 2단계: 코드 입력 */}
              {step === 'pending' && (
                <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                    <strong style={{ color: '#111827' }}>{email}</strong>로 발송된 6자리 코드를 입력해주세요.
                  </p>
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
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                      style={{ letterSpacing: 6, textAlign: 'center', fontSize: 18, fontWeight: 700 }}
                      autoFocus
                    />
                  </div>
                  {msg && <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{msg.text}</p>}
                  <button
                    type="submit"
                    disabled={code.length !== 6 || countdown === 0}
                    style={{
                      ...primaryBtn,
                      opacity: code.length !== 6 || countdown === 0 ? 0.5 : 1,
                      cursor: code.length !== 6 || countdown === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    확인
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, color: '#6b7280', textDecoration: 'underline', padding: 0 }}
                  >
                    {loading ? '발송 중...' : '코드 재발송'}
                  </button>
                </form>
              )}

              {/* 3단계: 새 비밀번호 입력 */}
              {step === 'change' && (
                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  {msg && <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{msg.text}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ ...primaryBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    {loading ? '변경 중...' : '비밀번호 재설정'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
