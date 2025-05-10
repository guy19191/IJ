import { create } from 'zustand'
import api from '../api/client'

interface User {
  id: string
  email: string
  name: string
  isSuperUser: boolean
  musicProvider: 'spotify' | 'apple' | 'youtube'
  accessToken?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  loginWithProvider: (provider: 'spotify' | 'apple' | 'youtube') => Promise<string>
  logout: () => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user })
  },

  loginWithProvider: async (provider) => {
    try {
      const response = await api.get(`/auth/${provider}`)
      return response.data.url
    } catch (error) {
      console.error(`Error getting ${provider} auth URL:`, error)
      throw error
    }
  },

  logout: () => {
    // Clear localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    // Clear state
    set({ user: null, isAuthenticated: false })
  },

  initialize: () => {
    // Try to restore session from localStorage
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')

    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        set({ user: { ...user, accessToken: token }, isAuthenticated: true })
      } catch (error) {
        console.error('Error restoring session:', error)
        // Clear invalid data
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    }
  }
}))

// Expose the store to the window object for the API client
if (typeof window !== 'undefined') {
  (window as any).__AUTH_STORE__ = useAuthStore
} 