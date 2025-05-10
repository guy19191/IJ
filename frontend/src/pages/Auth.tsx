import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'


export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithProvider, setUser, isAuthenticated } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(location.search)
      const code = searchParams.get('code')
      const token = searchParams.get('token')
      const userData = searchParams.get('user')
      const error = searchParams.get('error')
      const provider = location.pathname.split('/')[2] as 'spotify' | 'apple' | 'youtube' // Type assertion for provider

      if (error) {
        setError(error)
        setLoading(false)
        return
      }

      if (token && userData) {
        try {
          const user = JSON.parse(decodeURIComponent(userData))
          // Store auth data in localStorage
          localStorage.setItem('auth_token', token)
          localStorage.setItem('user_data', JSON.stringify(user))
          // Set user in auth store
          setUser({ ...user, accessToken: token })
          navigate('/')
        } catch (err: any) {
          setError('Failed to process authentication data')
        }
        return
      }

      if (code && provider) {
        setLoading(true)
        try {
          // Let the auth store handle the callback
          await loginWithProvider(provider)
          navigate('/')
        } catch (err: any) {
          setError(err.response?.data?.error || `Failed to authenticate with ${provider}`)
        } finally {
          setLoading(false)
        }
      }
    }

    handleCallback()
  }, [location, navigate, setUser])

  const handleProviderLogin = async (provider: 'spotify' | 'apple' | 'youtube') => {
    setLoading(true)
    try {
      const authUrl = await loginWithProvider(provider)
      window.location.href = authUrl
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to authenticate with ${provider}`)
      setLoading(false)
    }
  }

  // Don't render anything if already authenticated
  if (isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Music Project
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in with your music provider to continue
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <button
            onClick={() => handleProviderLogin('spotify')}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1DB954] hover:bg-[#1ed760] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1DB954]"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Continue with Spotify
          </button>

          <button
            onClick={() => handleProviderLogin('apple')}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.41-1.09-.47-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.41C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.31-.89 3.51-.84 1.54.07 2.7.61 3.44 1.57-3.14 1.88-2.29 5.13.89 6.41-.65 1.29-1.51 2.58-2.92 4.03zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple Music
          </button>

          <button
            onClick={() => handleProviderLogin('youtube')}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF0000] hover:bg-[#cc0000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF0000]"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Continue with YouTube Music
          </button>
        </div>
      </div>
    </div>
  )
} 