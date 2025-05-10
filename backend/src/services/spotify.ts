import axios from 'axios'
import { prisma } from '../index'

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'
const SPOTIFY_AUTH_BASE = 'https://accounts.spotify.com'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
console.log('Current FRONTEND_URL:', FRONTEND_URL)

interface SpotifyToken {
  access_token: string
  refresh_token: string
  expires_in: number
}

interface SpotifyUser {
  id: string
  email: string
  display_name: string
}

export const getSpotifyAuthUrl = () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const redirectUri = `${FRONTEND_URL}/api/auth/spotify/callback`
  const scope = 'user-read-email user-read-private'

  if (!clientId) {
    throw new Error('Missing Spotify client ID')
  }

  console.log('Spotify Auth URL Redirect URI:', redirectUri)
  const authUrl = `${SPOTIFY_AUTH_BASE}/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`
  console.log('Full Spotify Auth URL:', authUrl)
  return authUrl
}

export const getSpotifyToken = async (code: string): Promise<SpotifyToken> => {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const redirectUri = `${FRONTEND_URL}/api/auth/spotify/callback`

  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify credentials')
  }

  console.log('Token Exchange Redirect URI:', redirectUri)
  const response = await axios.post<SpotifyToken>(
    `${SPOTIFY_AUTH_BASE}/api/token`,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
    }
  )

  return response.data
}

export const getSpotifyUser = async (accessToken: string): Promise<SpotifyUser> => {
  const response = await axios.get<SpotifyUser>('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return response.data
}

export class SpotifyService {
  private static async getAccessToken(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user?.refreshToken) {
      throw new Error('No refresh token found')
    }

    try {
      const response = await axios.post<SpotifyToken>(
        `${SPOTIFY_AUTH_BASE}/api/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: user.refreshToken
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
              `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString('base64')}`
          }
        }
      )

      // Update user's access token
      await prisma.user.update({
        where: { id: userId },
        data: {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token || user.refreshToken
        }
      })

      return response.data.access_token
    } catch (error) {
      console.error('Error refreshing Spotify token:', error)
      throw new Error('Failed to refresh Spotify token')
    }
  }

  static async getLikedSongs(userId: string) {
    const accessToken = await this.getAccessToken(userId)
    const songs = []

    try {
      let nextUrl = `${SPOTIFY_API_BASE}/me/tracks?limit=50`
      
      while (nextUrl) {
        const response = await axios.get(nextUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        const items = response.data.items.map((item: any) => ({
          title: item.track.name,
          artist: item.track.artists.map((a: any) => a.name).join(', '),
          album: item.track.album.name,
          providerId: item.track.id,
          provider: 'spotify'
        }))

        songs.push(...items)
        nextUrl = response.data.next
      }

      return songs
    } catch (error) {
      console.error('Error fetching liked songs:', error)
      throw new Error('Failed to fetch liked songs')
    }
  }

  static async getPlaylists(userId: string) {
    const accessToken = await this.getAccessToken(userId)
    const playlists = []

    try {
      let nextUrl = `${SPOTIFY_API_BASE}/me/playlists?limit=50`
      
      while (nextUrl) {
        const response = await axios.get(nextUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        const items = response.data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          tracks: item.tracks.total
        }))

        playlists.push(...items)
        nextUrl = response.data.next
      }

      return playlists
    } catch (error) {
      console.error('Error fetching playlists:', error)
      throw new Error('Failed to fetch playlists')
    }
  }

  static async getPlaylistTracks(userId: string, playlistId: string) {
    const accessToken = await this.getAccessToken(userId)
    const songs = []

    try {
      let nextUrl = `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=100`
      
      while (nextUrl) {
        const response = await axios.get(nextUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        const items = response.data.items.map((item: any) => ({
          title: item.track.name,
          artist: item.track.artists.map((a: any) => a.name).join(', '),
          album: item.track.album.name,
          providerId: item.track.id,
          provider: 'spotify'
        }))

        songs.push(...items)
        nextUrl = response.data.next
      }

      return songs
    } catch (error) {
      console.error('Error fetching playlist tracks:', error)
      throw new Error('Failed to fetch playlist tracks')
    }
  }

  static async getTrackInfo(userId: string, trackId: string): Promise<any> {
    const accessToken = await this.getAccessToken(userId);
    try {
      const response = await axios.get(
        `${SPOTIFY_API_BASE}/tracks/${trackId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching track info:', error);
      throw new Error('Failed to fetch track info');
    }
  }

  static async searchTrack(userId: string, query: string): Promise<any> {
    const accessToken = await this.getAccessToken(userId);
    try {
      // First try with exact match
      const exactResponse = await axios.get(
        `${SPOTIFY_API_BASE}/search`,
        {
          params: {
            q: `"${query}"`, // Use quotes for exact phrase matching
            type: 'track',
            limit: 5
          },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (exactResponse.data.tracks.items.length > 0) {
        return exactResponse.data.tracks.items[0];
      }

      // If no exact match, try with more flexible search
      const flexibleResponse = await axios.get(
        `${SPOTIFY_API_BASE}/search`,
        {
          params: {
            q: query,
            type: 'track',
            limit: 5
          },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      // Return the first track found
      return flexibleResponse.data.tracks.items[0] || null;
    } catch (error) {
      console.error('Error searching track:', error);
      throw new Error('Failed to search track');
    }
  }

  static async getWebPlaybackToken(userId: string): Promise<string> {
    return this.getAccessToken(userId);
  }
}