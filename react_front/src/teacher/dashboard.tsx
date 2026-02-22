import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import DashboardScheduleWidget from './DashboardScheduleWidget'

// [woo] 대시보드 수업 일정 React Island 진입점
// Thymeleaf teacher.html 의 <div id="dashboard-schedule-root"> 에 마운트
const rootEl = document.getElementById('dashboard-schedule-root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <DashboardScheduleWidget />
    </StrictMode>
  )
}
