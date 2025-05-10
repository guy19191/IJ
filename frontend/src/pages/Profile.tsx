import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../api/client'

interface UserProfile {
  id: string
  name: string
  email: string
  isSuperUser: boolean
  musicProvider: string
  createdAt: string
  createdEvents: {
    id: string
    name: string
    description: string
    theme: string
    isPublic: boolean
    createdAt: string
  }[]
  joinedEvents: {
    id: string
    name: string
    description: string
    theme: string
    isPublic: boolean
    createdAt: string
  }[]
  listeningHistory: {
    id: string
    title: string
    artist: string
    album: string | null
    provider: string
    createdAt: string
  }[]
  likedSongs: {
    title: string
    artist: string
    album: string | null
    providerId: string
    provider: string
  }[]
  playlists: {
    id: string
    name: string
    description: string
    trackCount: number
    tracks: {
      title: string
      artist: string
      album: string | null
      providerId: string
      provider: string
    }[]
  }[]
}

export default function Profile() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile')
        setProfile(response.data)
      } catch (err) {
        setError('Failed to fetch profile')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchProfile()
    }
  }, [user])

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please login to view your profile</p>
        <Link to="/login" className="btn btn-primary mt-4">
          Login
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

  if (error || !profile) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Profile not found'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-gray-900">{profile.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{profile.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Music Provider</label>
            <p className="mt-1 text-gray-900 capitalize">{profile.musicProvider}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Member Since</label>
            <p className="mt-1 text-gray-900">
              {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {profile.isSuperUser && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Created Events</h2>
          <div className="space-y-4">
            {profile.createdEvents.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
              >
                <h3 className="font-medium text-gray-900">{event.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                  <span>Theme: {event.theme}</span>
                  <span>{event.isPublic ? 'Public' : 'Private'}</span>
                </div>
              </Link>
            ))}
            {profile.createdEvents.length === 0 && (
              <p className="text-gray-600">No events created yet</p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Joined Events</h2>
        <div className="space-y-4">
          {profile.joinedEvents.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
            >
              <h3 className="font-medium text-gray-900">{event.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <span>Theme: {event.theme}</span>
                <span>{event.isPublic ? 'Public' : 'Private'}</span>
              </div>
            </Link>
          ))}
          {profile.joinedEvents.length === 0 && (
            <p className="text-gray-600">No events joined yet</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Liked Songs</h2>
        <div className="space-y-4">
          {profile.likedSongs.map((song, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <h3 className="font-medium text-gray-900">{song.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{song.artist}</p>
              {song.album && (
                <p className="text-sm text-gray-500 mt-1">{song.album}</p>
              )}
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <span className="capitalize">{song.provider}</span>
              </div>
            </div>
          ))}
          {profile.likedSongs.length === 0 && (
            <p className="text-gray-600">No liked songs yet</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Playlists</h2>
        <div className="space-y-6">
          {profile.playlists.map((playlist) => (
            <div key={playlist.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">{playlist.name}</h3>
              {playlist.description && (
                <p className="text-sm text-gray-600 mt-1">{playlist.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">{playlist.trackCount} tracks</p>
              
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Tracks:</h4>
                {playlist.tracks.map((track, index) => (
                  <div key={index} className="pl-4 border-l-2 border-gray-200">
                    <p className="text-sm text-gray-900">{track.title}</p>
                    <p className="text-xs text-gray-600">{track.artist}</p>
                    {track.album && (
                      <p className="text-xs text-gray-500">{track.album}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {profile.playlists.length === 0 && (
            <p className="text-gray-600">No playlists yet</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Listening History</h2>
        <div className="space-y-4">
          {profile.listeningHistory.map((song) => (
            <div
              key={song.id}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <h3 className="font-medium text-gray-900">{song.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{song.artist}</p>
              {song.album && (
                <p className="text-sm text-gray-500 mt-1">{song.album}</p>
              )}
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <span className="capitalize">{song.provider}</span>
                <span>{new Date(song.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {profile.listeningHistory.length === 0 && (
            <p className="text-gray-600">No listening history yet</p>
          )}
        </div>
      </div>
    </div>
  )
} 