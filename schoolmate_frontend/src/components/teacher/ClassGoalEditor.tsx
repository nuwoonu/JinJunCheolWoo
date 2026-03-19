// [soojin] 이달의 학급 목표 편집 위젯 (교사용)
// GET  /api/class/goal/{classroomId}?year=&month= → 조회
// POST /api/class/goal/{classroomId}?year=&month= → 저장/수정
// 교사 학급 대시보드에서 import해서 사용

import { useEffect, useState } from 'react'
import api from '@/api/auth'

interface ClassGoal {
  id: number
  year: number
  month: number
  goal: string
  actionItems: string[]
}

interface Props {
  classroomId: number
}

export default function ClassGoalEditor({ classroomId }: Props) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [goal, setGoal] = useState<ClassGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // 모달 편집 상태
  const [editGoal, setEditGoal] = useState('')
  const [editItems, setEditItems] = useState<string[]>([''])

  useEffect(() => {
    api.get(`/class/goal/${classroomId}?year=${year}&month=${month}`)
      .then(res => {
        if (res.status !== 204 && res.data?.goal) {
          setGoal(res.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [classroomId])

  // [woo] 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showModal])

  const openModal = () => {
    setEditGoal(goal?.goal ?? '')
    setEditItems(goal?.actionItems?.length ? [...goal.actionItems] : [''])
    setShowModal(true)
  }

  const closeModal = () => setShowModal(false)

  const addItem = () => setEditItems(prev => [...prev, ''])
  const removeItem = (idx: number) => setEditItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, val: string) =>
    setEditItems(prev => prev.map((v, i) => (i === idx ? val : v)))

  const save = () => {
    if (!editGoal.trim()) return
    setSaving(true)
    api.post(`/class/goal/${classroomId}?year=${year}&month=${month}`, {
      goal: editGoal.trim(),
      actionItems: editItems.filter(s => s.trim()),
    })
      .then(res => {
        setGoal(res.data)
        setShowModal(false)
      })
      .catch(() => alert('저장에 실패했습니다.'))
      .finally(() => setSaving(false))
  }

  return (
    <>
      <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: '1px solid #e5e7eb' }}>
        {/* 카드 헤더 */}
        <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
          <div className="d-flex align-items-center gap-10">
            <iconify-icon icon="ri:focus-3-line" className="text-primary-600 text-xl" />
            <h6 className="fw-bold mb-0 text-sm">{year}년 {month}월 학급 목표</h6>
          </div>
          <button
            onClick={openModal}
            style={{ background: '#25A194', color: 'white', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            작성
          </button>
        </div>

        {/* 카드 본문 */}
        <div className="p-16">
          {loading ? (
            <p className="text-secondary-light text-sm mb-0">불러오는 중...</p>

          ) : goal ? (
            <div>
              {/* 목표 텍스트 박스 */}
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 10, padding: '12px 16px', marginBottom: 16,
              }}>
                <p className="fw-semibold text-sm mb-0" style={{ color: '#15803d', lineHeight: 1.6 }}>
                  {goal.goal}
                </p>
              </div>

              {/* 실천 사항 */}
              {goal.actionItems.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {goal.actionItems.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{
                        width: 20, height: 20, minWidth: 20, borderRadius: '50%',
                        border: '2px solid #25A194', background: 'white',
                        marginTop: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#25A194', display: 'block' }} />
                      </span>
                      <span className="text-sm" style={{ color: '#374151', lineHeight: 1.5 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          ) : (
            <div className="text-center py-24 text-secondary-light">
              <iconify-icon icon="ri:focus-3-line" style={{ fontSize: 36 }} />
              <p className="text-sm mb-4 mt-8">이번 달 학급 목표가 없습니다.</p>
              <p className="text-xs mb-0" style={{ color: '#9ca3af' }}>위 버튼을 눌러 목표를 설정해보세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* 편집 모달 */}
      {showModal && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 12, width: '100%',
              maxWidth: 480, margin: '0 16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            {/* 모달 헤더 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
            }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                {year}년 {month}월 학급 목표 {goal ? '수정' : '설정'}
              </h6>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* 모달 본문 */}
            <div style={{ padding: '20px' }}>
              {/* 목표 입력 */}
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                이달의 목표
              </label>
              <textarea
                value={editGoal}
                onChange={e => setEditGoal(e.target.value)}
                placeholder="예: 모두가 서로 존중하는 따뜻한 학급 만들기"
                rows={3}
                style={{
                  width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
                  padding: '8px 12px', fontSize: 14, resize: 'none',
                  outline: 'none', boxSizing: 'border-box', color: '#111827',
                }}
              />

              {/* 실천 사항 입력 */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    실천 사항
                  </label>
                  <button
                    onClick={addItem}
                    style={{
                      background: 'none', border: '1px solid #25A194', borderRadius: 6,
                      color: '#25A194', fontSize: 12, fontWeight: 600,
                      padding: '2px 10px', cursor: 'pointer',
                    }}
                  >
                    + 추가
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {editItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 20, height: 20, minWidth: 20, borderRadius: '50%',
                        border: '2px solid #25A194',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#25A194', display: 'block' }} />
                      </span>
                      <input
                        type="text"
                        value={item}
                        onChange={e => updateItem(i, e.target.value)}
                        placeholder={`실천 사항 ${i + 1}`}
                        style={{
                          flex: 1, border: '1px solid #d1d5db', borderRadius: 6,
                          padding: '6px 10px', fontSize: 13, outline: 'none', color: '#111827',
                        }}
                      />
                      {editItems.length > 1 && (
                        <button
                          onClick={() => removeItem(i)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: 16, lineHeight: 1 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 20px 20px' }}>
              <button
                onClick={closeModal}
                style={{
                  background: '#f3f4f6', color: '#374151', border: 'none',
                  borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 14,
                }}
              >
                취소
              </button>
              <button
                onClick={save}
                disabled={saving || !editGoal.trim()}
                style={{
                  background: saving || !editGoal.trim() ? '#9ca3af' : '#25A194',
                  color: 'white', border: 'none', borderRadius: 6,
                  padding: '8px 20px', fontSize: 14, fontWeight: 500,
                  cursor: saving || !editGoal.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
