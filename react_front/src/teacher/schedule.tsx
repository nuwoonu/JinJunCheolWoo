import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import TimetableApp from './TimetableApp'

// [woo] React Island 마운트 진입점 - Thymeleaf의 <div id="schedule-root"> 에 마운트
const rootEl = document.getElementById('schedule-root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <TimetableApp />
    </StrictMode>
  )
}
