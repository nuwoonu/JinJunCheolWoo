import { createContext, useContext, useState, type ReactNode } from 'react'
import ProfileModal from '@/features/profile/components/ProfileModal'

interface ProfileModalContextType {
  openProfileModal: () => void
}

const ProfileModalContext = createContext<ProfileModalContextType>({
  openProfileModal: () => {},
})

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <ProfileModalContext.Provider value={{ openProfileModal: () => setIsOpen(true) }}>
      {children}
      <ProfileModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </ProfileModalContext.Provider>
  )
}

export const useProfileModal = () => useContext(ProfileModalContext)
