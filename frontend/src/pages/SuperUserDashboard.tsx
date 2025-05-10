import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../api/client'
import MusicPlayer from '../components/MusicPlayer'

interface Event {
  id: string
  name: string
  description: string
  theme: string
  isPublic: boolean
  createdAt: string
  creator: {
    id: string
    name: string
    email: string
  }
  participants: {
    id: string
    name: string
    email: string
  }[]
  playlist: {
    id: string
    title: string
    artist: string
    album: string | null
    providerId: string
    provider: string
  }[]
}

export default function SuperUserDashboard() {
  const { user } = useAuthStore()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events')
        // Ensure each event has the required properties with default values
        const eventsWithDefaults = response.data.map((event: Event) => ({
          ...event,
          participants: event.participants || [],
          playlist: event.playlist || []
        }))
        setEvents(eventsWithDefaults)
      } catch (err) {
        setError('Failed to fetch events')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchEvents()
    }
  }, [user])

  const handlePlaylistUpdate = (newPlaylist: Event['playlist']) => {
    if (selectedEvent) {
      setSelectedEvent({
        ...selectedEvent,
        playlist: newPlaylist
      });
    }
  };

  const handleEventSelect = (event: Event) => {
    console.log('Selected event:', event);
    console.log('Event playlist:', event.playlist);
    setSelectedEvent(event);
  };

  if (!user?.isSuperUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Access denied. Super user privileges required.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  const createdEvents = events.filter(event => event.creator?.id === user.id)
  const otherEvents = events.filter(event => event.creator?.id !== user.id)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Super User Dashboard</h1>
        <Link to="/create-event" className="btn btn-primary">
          Create Event
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Events</h2>
        <div className="space-y-4">
          {createdEvents.map((event) => (
            <div
              key={event.id}
              className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{event.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500">
                    {event.participants?.length || 0} participants
                  </span>
                  <button
                    onClick={() => handleEventSelect(event)}
                    className="btn btn-secondary"
                  >
                    Play
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <span>Theme: {event.theme}</span>
                <span>{event.isPublic ? 'Public' : 'Private'}</span>
              </div>
            </div>
          ))}
          {createdEvents.length === 0 && (
            <p className="text-gray-600">No events created yet</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Other Events</h2>
        <div className="space-y-4">
          {otherEvents.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{event.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {event.participants?.length || 0} participants
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <span>Theme: {event.theme}</span>
                <span>{event.isPublic ? 'Public' : 'Private'}</span>
              </div>
            </Link>
          ))}
          {otherEvents.length === 0 && (
            <p className="text-gray-600">No other events found</p>
          )}
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <MusicPlayer
            eventId={selectedEvent.id}
            initialPlaylist={selectedEvent.playlist || []}
            onPlaylistUpdate={handlePlaylistUpdate}
          />
        </div>
      )}
    </div>
  )
} 