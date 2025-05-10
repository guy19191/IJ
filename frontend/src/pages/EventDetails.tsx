import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../api/client'
import ShareButton from '../components/ShareButton'

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

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/events/${eventId}`)
        setEvent(response.data)
      } catch (err) {
        setError('Failed to fetch event details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (user && eventId) {
      fetchEvent()
    }
  }, [user, eventId])

  const handleJoinEvent = async () => {
    if (!eventId) return

    setJoining(true)
    try {
      await api.post(`/events/${eventId}/join`)
      // Refresh event details
      const response = await api.get(`/events/${eventId}`)
      setEvent(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join event')
    } finally {
      setJoining(false)
    }
  }

  const handleRegeneratePlaylist = async () => {
    if (!eventId) return

    try {
      await api.post(`/playlists/events/${eventId}/regenerate`)
      // Refresh event details
      const response = await api.get(`/events/${eventId}`)
      setEvent(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to regenerate playlist')
    }
  }

  const handleDJMode = () => {
    navigate(`/dj/${eventId}`);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please login to view event details</p>
        <button
          onClick={() => navigate('/login')}
          className="btn btn-primary mt-4"
        >
          Login
        </button>
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

  if (error || !event) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Event not found'}</p>
      </div>
    )
  }

  const isParticipant = event.participants.some(p => p.id === user.id)
  const isCreator = event.creator.id === user.id

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
            <p className="text-gray-600 mt-2">{event.description}</p>
          </div>
          <div className="flex gap-2">
            {!isParticipant && !isCreator && event.isPublic && (
              <button
                onClick={handleJoinEvent}
                disabled={joining}
                className="btn btn-primary"
              >
                {joining ? 'Joining...' : 'Join Event'}
              </button>
            )}
            {event.isPublic && (
              <ShareButton url={`${window.location.origin}/events/${event.id}`} title={event.name} />
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Event Details</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Theme</dt>
                <dd className="text-gray-900">{event.theme}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created by</dt>
                <dd className="text-gray-900">{event.creator.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created on</dt>
                <dd className="text-gray-900">
                  {new Date(event.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Visibility</dt>
                <dd className="text-gray-900">
                  {event.isPublic ? 'Public' : 'Private'}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Participants</h2>
            <ul className="space-y-2">
              {event.participants.map((participant) => (
                <li key={participant.id} className="text-gray-900">
                  {participant.name}
                </li>
              ))}
              {event.participants.length === 0 && (
                <li className="text-gray-600">No participants yet</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Playlist</h2>
          <div className="flex gap-3">
            {isCreator && (
              <button
                onClick={handleRegeneratePlaylist}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Regenerate
              </button>
            )}
            <button
              onClick={handleDJMode}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
              DJ Mode
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {event.playlist.map((song, index) => (
            <div
              key={song.id}
              className="group p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-all duration-200 hover:shadow-md bg-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors duration-200 truncate">
                    {song.title}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">{song.artist}</p>
                  {song.album && (
                    <p className="text-xs text-gray-500 truncate">{song.album}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full capitalize">
                    {song.provider}
                  </span>
                  <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors duration-200 opacity-0 group-hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {event.playlist.length === 0 && (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <p className="mt-4 text-gray-600">No songs in the playlist yet</p>
              {isCreator && (
                <button
                  onClick={handleRegeneratePlaylist}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                >
                  Generate Playlist
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 