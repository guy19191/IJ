import axios from 'axios'

const api = axios.create({
  baseURL: '/api',  // Use the proxy path instead of full URL
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 30000,
})

// Add a request interceptor to add the auth token to requests and ensure /api prefix
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    console.log(`Making request to: ${config.url}`)
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Add a response interceptor to handle 401 responses and network errors
api.interceptors.response.use(
  (response) => {
    console.log(`Received response from: ${response.config.url}`, response.status)
    return response
  },
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - Unable to connect to the server. Please check if the server is running.')
      // You might want to show a user-friendly error message here
      return Promise.reject(new Error('Unable to connect to the server. Please check your internet connection and try again.'))
    }

    if (error.response?.status === 401) {
      console.log('Received 401 response - Clearing auth data')
      // Clear auth data from localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      
      // Clear auth state
      const authStore = (window as any).__AUTH_STORE__
      if (authStore) {
        authStore.getState().setUser(null)
      }

      // Redirect to auth page
      window.location.href = '/auth'
    }

    // Log other errors
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    })

    return Promise.reject(error)
  }
)

export default api 