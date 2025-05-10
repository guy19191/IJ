import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../api/client'

interface FormData {
  name: string;
  description: string;
  theme: string;
  isPublic: boolean;
  provider: 'spotify' | 'youtube';
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    theme: '',
    isPublic: true,
    provider: 'spotify' // Default provider
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await api.post('/events', formData)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  if (!user?.isSuperUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Only super users can create events</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Event Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input mt-1"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="input mt-1"
          />
        </div>

        <div>
          <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
            Theme
          </label>
          <input
            type="text"
            id="theme"
            name="theme"
            value={formData.theme}
            onChange={handleChange}
            required
            className="input mt-1"
            placeholder="e.g., Summer Vibes, Rock Classics, etc."
          />
        </div>

        <div>
          <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
            Music Provider
          </label>
          <select
            id="provider"
            name="provider"
            value={formData.provider}
            onChange={handleChange}
            required
            className="input mt-1"
          >
            <option value="spotify">Spotify</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            name="isPublic"
            checked={formData.isPublic}
            onChange={handleChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
            Public Event
          </label>
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  )
} 