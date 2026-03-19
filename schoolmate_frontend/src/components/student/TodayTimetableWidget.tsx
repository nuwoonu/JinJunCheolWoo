// [soojin] 오늘의 시간표 위젯
// 기존 src/pages/cheol/student/Dashboard.tsx 시간표 섹션을 컴포넌트로 분리
// 데이터는 부모(StudentDashboard)에서 fetch 후 props로 전달 (기존 Dashboard.tsx 패턴 동일)

interface TimetableItem {
  period: number
  subject: string
}

interface Props {
  timetable: TimetableItem[]
  loading: boolean
  title?: string
}

export default function TodayTimetableWidget({ timetable, loading, title }: Props) {
  return (
    <div className="card shadow-sm h-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <div className="d-flex justify-content-between align-items-center p-16 border-bottom">
        <h6 className="fw-bold mb-0 text-sm">
          <i className="ri-time-line text-primary-600 me-2" />
          {title ?? '오늘의 시간표'}{timetable.length > 0 && ` (${timetable.length}교시)`}
        </h6>
      </div>
      <div className="p-16" style={{ overflowY: 'auto' }}>
        {loading ? (
          <p className="text-secondary-light text-sm text-center py-16 mb-0">
            시간표를 불러오는 중...
          </p>
        ) : timetable.length > 0 ? (
          timetable.map((item, i) => (
            <div
              key={item.period}
              className={`p-10 bg-neutral-50 rounded-8 d-flex justify-content-between align-items-center${i < timetable.length - 1 ? ' mb-8' : ''}`}
            >
              <span className="text-sm fw-bold text-secondary-light">{item.period}교시</span>
              <span className="fw-medium text-dark text-sm">{item.subject}</span>
            </div>
          ))
        ) : (
          <p className="text-secondary-light text-sm text-center py-16 mb-0">
            오늘 시간표 정보가 없습니다.
          </p>
        )}
      </div>
    </div>
  )
}
