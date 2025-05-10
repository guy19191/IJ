import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import MusicPlayer from './MusicPlayer'
import { useAuthStore } from '../stores/authStore'

interface LayoutProps {
  children?: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user } = useAuthStore()
  const isEventPage = location.pathname.startsWith('/events/')
  const eventId = isEventPage ? location.pathname.split('/')[2] : null

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children || <Outlet />}
      </main>
      {user && isEventPage && eventId && (
        <MusicPlayer
          eventId={eventId}
          initialPlaylist={[]}
          onPlaylistUpdate={() => {}}
        />
      )}
    </div>
  )
} 