import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { SchoolProvider } from '@/contexts/SchoolContext'
import { ProfileModalProvider } from '@/contexts/ProfileModalContext'
import './index.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import App from '@/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProfileModalProvider>
          <SchoolProvider>
            <App />
          </SchoolProvider>
        </ProfileModalProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
