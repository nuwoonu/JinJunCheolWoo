import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import DormitoryManagementSystem from './DormitoryManagement'

// React Island 마운트 진입점 - Thymeleaf의 <div id="dormitory-root"> 에 마운트
const rootEl = document.getElementById('dormitory-root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <DormitoryManagementSystem />
    </StrictMode>
  )
}
