import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../api/client'

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
}

export default function Home() {
  const { user, setUser } = useAuthStore()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events')
        setEvents(response.data)
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

  const handleUpgradeToPremium = async () => {
    try {
      const response = await api.post('/users/upgrade-to-premium')
      setUser(response.data)
      setShowPremiumModal(false)
    } catch (err) {
      setError('Failed to upgrade to premium')
      console.error(err)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Music Event Manager
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Join music events, create playlists, and enjoy music with others!
        </p>
        <Link to="/login" className="btn btn-primary">
          Get Started
        </Link>
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Events</h1>
        <div className="flex gap-4">
          {!user.isSuperUser && (
            <button
              onClick={() => setShowPremiumModal(true)}
              className="btn btn-primary bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Upgrade to Premium
            </button>
          )}
          {user.isSuperUser && (
            <Link to="/create-event" className="btn btn-primary">
              Create Event
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {event.name}
            </h2>
            <p className="text-gray-600 mb-4">{event.description}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Theme: {event.theme}</span>
              <span>{event.isPublic ? 'Public' : 'Private'}</span>
            </div>
          </Link>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No events found</p>
        </div>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upgrade to Premium</h2>
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Premium Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Create Unlimited Events</h4>
                  <p className="text-gray-600">Create up to 50 events with custom themes and playlists</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Advanced Playlist Management</h4>
                  <p className="text-gray-600">Create and manage multiple playlists for your events</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Priority Support</h4>
                  <p className="text-gray-600">Get priority access to customer support</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Exclusive Features</h4>
                  <p className="text-gray-600">Access to upcoming premium features first</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowPremiumModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradeToPremium}
                className="btn btn-primary bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 