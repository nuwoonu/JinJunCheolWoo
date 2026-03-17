import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../../../api/auth'
import DashboardLayout from '../../../components/layout/DashboardLayout'

// [woo] 퀴즈 수정 페이지 (교사 전용)
// - 기존 퀴즈 데이터를 불러와 수정
// - 정답 수정 시 기존 응시 기록 자동 재채점

interface ClassroomOption {
  id: number
  name: string
}

interface OptionForm {
  optionText: string
  isCorrect: boolean
}

interface QuestionForm {
  questionText: string
  questionType: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER'
  points: number
  correctAnswer: string
  options: OptionForm[]
}

export default function QuizEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    title: '',
    description: '',
    week: '',
    classroomId: '',
    dueDate: '',
    maxAttempts: '',
    showAnswer: true,
  })

  const [questions, setQuestions] = useState<QuestionForm[]>([])

  // [woo] 기존 퀴즈 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const [quizRes, classroomRes] = await Promise.all([
          api.get(`/quiz/${id}`),
          api.get('/homework/classrooms'),
        ])

        const quiz = quizRes.data
        setClassrooms(classroomRes.data)

        // [woo] 기본 정보 세팅
        setForm({
          title: quiz.title || '',
          description: quiz.description || '',
          week: quiz.week != null ? String(quiz.week) : '',
          classroomId: quiz.classroomId != null ? String(quiz.classroomId) : '',
          dueDate: quiz.dueDate ? quiz.dueDate.slice(0, 10) : '',
          maxAttempts: quiz.maxAttempts != null ? String(quiz.maxAttempts) : '',
          showAnswer: quiz.showAnswer ?? true,
        })

        // [woo] 문제 세팅
        if (quiz.questions && quiz.questions.length > 0) {
          setQuestions(
            quiz.questions.map((q: any) => ({
              questionText: q.questionText || '',
              questionType: q.questionType,
              points: q.points || 1,
              correctAnswer: q.correctAnswer || '',
              options: q.questionType === 'MULTIPLE_CHOICE' && q.options
                ? q.options.map((o: any) => ({
                    optionText: o.optionText || '',
                    isCorrect: o.isCorrect || false,
                  }))
                : [],
            }))
          )
        }
      } catch {
        alert('퀴즈를 불러올 수 없습니다.')
        navigate('/homework?tab=quiz')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  // [woo] 문제 추가
  const addQuestion = (type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER') => {
    setQuestions(prev => [...prev, {
      questionText: '',
      questionType: type,
      points: 1,
      correctAnswer: '',
      options: type === 'MULTIPLE_CHOICE'
        ? [{ optionText: '', isCorrect: false }, { optionText: '', isCorrect: false },
           { optionText: '', isCorrect: false }, { optionText: '', isCorrect: false }]
        : [],
    }])
  }

  // [woo] 문제 삭제
  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return alert('최소 1문제가 필요합니다.')
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  // [woo] 문제 내용 수정
  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  // [woo] 선택지 수정
  const updateOption = (qIdx: number, oIdx: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, qi) => qi === qIdx ? {
      ...q,
      options: q.options.map((o, oi) => oi === oIdx ? { ...o, [field]: value } : o),
    } : q))
  }

  // [woo] 객관식 정답 선택 (라디오 방식)
  const setCorrectOption = (qIdx: number, oIdx: number) => {
    setQuestions(prev => prev.map((q, qi) => qi === qIdx ? {
      ...q,
      options: q.options.map((o, oi) => ({ ...o, isCorrect: oi === oIdx })),
    } : q))
  }

  // [woo] 선택지 추가/삭제
  const addOption = (qIdx: number) => {
    setQuestions(prev => prev.map((q, qi) => qi === qIdx ? {
      ...q,
      options: [...q.options, { optionText: '', isCorrect: false }],
    } : q))
  }

  // [woo] 선택지 삭제 (최소 2개 보장)
  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions(prev => prev.map((q, qi) => {
      if (qi !== qIdx) return q
      if (q.options.length <= 2) return q
      return { ...q, options: q.options.filter((_, oi) => oi !== oIdx) }
    }))
  }

  // [woo] 제출 (수정)
  const handleSubmit = async () => {
    if (!form.title.trim()) return alert('제목을 입력해주세요.')
    if (!form.classroomId) return alert('대상 학급을 선택해주세요.')
    if (!form.dueDate) return alert('마감일을 선택해주세요.')

    // [woo] 문제 검증
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.questionText.trim()) return alert(`${i + 1}번 문제 내용을 입력해주세요.`)
      if (q.questionType === 'MULTIPLE_CHOICE') {
        if (q.options.some(o => !o.optionText.trim())) return alert(`${i + 1}번 문제의 선택지를 모두 입력해주세요.`)
        if (!q.options.some(o => o.isCorrect)) return alert(`${i + 1}번 문제의 정답을 선택해주세요.`)
      } else {
        if (!q.correctAnswer.trim()) return alert(`${i + 1}번 문제의 정답을 입력해주세요.`)
      }
    }

    setSaving(true)
    try {
      await api.put(`/quiz/${id}`, {
        title: form.title,
        description: form.description || null,
        week: form.week ? Number(form.week) : null,
        classroomId: Number(form.classroomId),
        dueDate: form.dueDate + 'T23:59:59',
        maxAttempts: form.maxAttempts ? Number(form.maxAttempts) : null,
        showAnswer: form.showAnswer,
        questions: questions.map((q, i) => ({
          questionText: q.questionText,
          questionOrder: i + 1,
          points: q.points,
          questionType: q.questionType,
          correctAnswer: q.questionType === 'SHORT_ANSWER' ? q.correctAnswer : null,
          options: q.questionType === 'MULTIPLE_CHOICE'
            ? q.options.map((o, j) => ({
                optionText: o.optionText,
                optionOrder: j + 1,
                isCorrect: o.isCorrect,
              }))
            : null,
        })),
      })
      alert('퀴즈가 수정되었습니다.')
      navigate(`/quiz/${id}`)
    } catch (err: any) {
      alert(err.response?.data || '퀴즈 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-40 text-secondary-light">불러오는 중...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* [woo] 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">퀴즈</h6>
          <p className="text-neutral-600 mt-4 mb-0">퀴즈 수정</p>
        </div>
        <ul className="d-flex align-items-center gap-2">
          <li className="fw-medium">
            <Link to="/main" className="d-flex align-items-center gap-1 hover-text-primary">
              <iconify-icon icon="solar:home-smile-angle-outline" className="icon text-lg" />
              홈
            </Link>
          </li>
          <li>-</li>
          <li className="fw-medium">
            <Link to="/homework?tab=quiz" className="hover-text-primary">퀴즈</Link>
          </li>
          <li>-</li>
          <li className="fw-medium">퀴즈 수정</li>
        </ul>
      </div>

      {/* [woo] 기본 정보 카드 */}
      <div className="card radius-12 mb-24">
        <div className="card-header py-16 px-24 border-bottom">
          <h6 className="mb-0">기본 정보</h6>
        </div>
        <div className="card-body p-24">
          <div className="mb-20">
            <label className="form-label fw-semibold text-sm">제목 *</label>
            <input
              type="text"
              className="form-control radius-8"
              placeholder="퀴즈 제목을 입력하세요"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="row mb-20">
            <div className="col-md-3 mb-16 mb-md-0">
              <label className="form-label fw-semibold text-sm">대상 학급 *</label>
              <select
                className="form-select radius-8"
                value={form.classroomId}
                onChange={e => setForm(f => ({ ...f, classroomId: e.target.value }))}
              >
                <option value="">학급 선택</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 mb-16 mb-md-0">
              <label className="form-label fw-semibold text-sm">주차</label>
              <input
                type="number"
                className="form-control radius-8"
                placeholder="예: 1"
                min={1}
                value={form.week}
                onChange={e => setForm(f => ({ ...f, week: e.target.value }))}
              />
            </div>
            <div className="col-md-3 mb-16 mb-md-0">
              <label className="form-label fw-semibold text-sm">마감일 *</label>
              <input
                type="date"
                className="form-control radius-8"
                value={form.dueDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="col-md-2 mb-16 mb-md-0">
              <label className="form-label fw-semibold text-sm">응시 횟수</label>
              <input
                type="number"
                className="form-control radius-8"
                placeholder="무제한"
                min={1}
                value={form.maxAttempts}
                onChange={e => setForm(f => ({ ...f, maxAttempts: e.target.value }))}
              />
            </div>
            {/* [woo] 정답 공개 토글 - remixicon 버튼으로 표시 */}
            <div className="col-md-2 d-flex align-items-end">
              <button
                type="button"
                className={`btn btn-sm d-flex align-items-center gap-6 ${form.showAnswer ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setForm(f => ({ ...f, showAnswer: !f.showAnswer }))}
              >
                <i className={`ri-${form.showAnswer ? 'eye-line' : 'eye-off-line'}`} />
                정답 공개
              </button>
            </div>
          </div>

          <div className="mb-0">
            <label className="form-label fw-semibold text-sm">설명</label>
            <textarea
              className="form-control radius-8"
              rows={3}
              placeholder="퀴즈 설명 (선택)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* [woo] 문제 목록 */}
      {questions.map((q, qIdx) => (
        <div key={qIdx} className="card radius-12 mb-16">
          <div className="card-header py-12 px-24 border-bottom d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-12">
              <h6 className="mb-0 text-sm">문제 {qIdx + 1}</h6>
              <span className={`badge ${q.questionType === 'MULTIPLE_CHOICE' ? 'bg-primary-100 text-primary-600' : 'bg-warning-100 text-warning-600'}`}>
                {q.questionType === 'MULTIPLE_CHOICE' ? '객관식' : '단답형'}
              </span>
            </div>
            <div className="d-flex align-items-center gap-8">
              <div className="d-flex align-items-center gap-4">
                <label className="text-sm text-secondary-light">배점:</label>
                <input
                  type="number"
                  className="form-control form-control-sm radius-8"
                  style={{ width: 70 }}
                  min={1}
                  value={q.points}
                  onChange={e => updateQuestion(qIdx, 'points', Number(e.target.value) || 1)}
                />
              </div>
              <button
                className="btn btn-sm btn-outline-danger-600 radius-8"
                onClick={() => removeQuestion(qIdx)}
              >
                삭제
              </button>
            </div>
          </div>
          <div className="card-body p-24">
            {/* [woo] 문제 내용 */}
            <div className="mb-16">
              <textarea
                className="form-control radius-8"
                rows={2}
                placeholder="문제 내용을 입력하세요"
                value={q.questionText}
                onChange={e => updateQuestion(qIdx, 'questionText', e.target.value)}
              />
            </div>

            {q.questionType === 'MULTIPLE_CHOICE' ? (
              // [woo] 객관식 선택지
              <div>
                {q.options.map((o, oIdx) => (
                  <div key={oIdx} className="d-flex align-items-center gap-8 mb-8">
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={o.isCorrect}
                      onChange={() => setCorrectOption(qIdx, oIdx)}
                      className="form-check-input"
                      title="정답으로 선택"
                    />
                    <span className="text-sm text-secondary-light" style={{ width: 20 }}>{oIdx + 1}.</span>
                    <input
                      type="text"
                      className="form-control form-control-sm radius-8"
                      placeholder={`선택지 ${oIdx + 1}`}
                      value={o.optionText}
                      onChange={e => updateOption(qIdx, oIdx, 'optionText', e.target.value)}
                    />
                    {q.options.length > 2 && (
                      <button
                        className="btn btn-sm btn-outline-neutral-300 radius-8"
                        onClick={() => removeOption(qIdx, oIdx)}
                        title="선택지 삭제"
                      >
                        <iconify-icon icon="mdi:close" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="btn btn-sm btn-outline-primary-600 radius-8 mt-8"
                  onClick={() => addOption(qIdx)}
                >
                  <iconify-icon icon="mdi:plus" className="me-4" />
                  선택지 추가
                </button>
                <p className="text-xs text-secondary-light mt-8 mb-0">
                  라디오 버튼을 클릭하여 정답을 선택하세요.
                </p>
              </div>
            ) : (
              // [woo] 단답형 정답 입력
              <div>
                <label className="form-label fw-semibold text-sm">정답</label>
                <input
                  type="text"
                  className="form-control radius-8"
                  placeholder="정답을 입력하세요 (복수 정답은 쉼표로 구분, 예: 르네상스,Renaissance)"
                  value={q.correctAnswer}
                  onChange={e => updateQuestion(qIdx, 'correctAnswer', e.target.value)}
                />
                <p className="text-xs text-secondary-light mt-4 mb-0">
                  대소문자 구분 없이 채점됩니다. 쉼표로 구분하면 복수 정답을 허용합니다.
                </p>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* [woo] 문제 추가 버튼 */}
      <div className="d-flex gap-8 mb-24">
        <button
          className="btn btn-outline-primary-600 radius-8"
          onClick={() => addQuestion('MULTIPLE_CHOICE')}
        >
          <iconify-icon icon="mdi:plus" className="me-4" />
          객관식 문제 추가
        </button>
        <button
          className="btn btn-outline-warning-600 radius-8"
          onClick={() => addQuestion('SHORT_ANSWER')}
        >
          <iconify-icon icon="mdi:plus" className="me-4" />
          단답형 문제 추가
        </button>
      </div>

      {/* [woo] 제출 버튼 */}
      <div className="d-flex justify-content-end gap-8 mb-24">
        <button
          type="button"
          className="btn btn-outline-neutral-300 radius-8"
          onClick={() => navigate(`/quiz/${id}`)}
        >
          취소
        </button>
        <button
          type="button"
          className="btn btn-primary-600 radius-8"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? '저장 중...' : '퀴즈 수정'}
        </button>
      </div>
    </DashboardLayout>
  )
}
