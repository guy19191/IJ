import axios from 'axios'
import { prisma } from '../index'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY


interface YouTubeMusicToken {
  access_token: string
  refresh_token: string
  expires_in: number
}

interface YouTubeMusicUser {
  id: string
  email: string
  name: string
}

interface YouTubeChannelResponse {
  items: Array<{
    id: string
    snippet: {
      title: string
    }
  }>
}

export const getYouTubeMusicAuthUrl = () => {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI
  const scope = 'https://www.googleapis.com/auth/youtube.readonly'

  if (!clientId || !redirectUri) {
    throw new Error('Missing YouTube client ID or redirect URI')
  }

  console.log('YouTube Auth URL Redirect URI:', redirectUri)
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scope)}`
  console.log('Full YouTube Auth URL:', authUrl)
  return authUrl
}

export const getYouTubeMusicToken = async (code: string): Promise<YouTubeMusicToken> => {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing YouTube credentials')
  }

  console.log('Token Exchange Redirect URI:', redirectUri)
  const response = await axios.post<YouTubeMusicToken>(
    'https://oauth2.googleapis.com/token',
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

export const getYouTubeMusicUser = async (accessToken: string): Promise<YouTubeMusicUser> => {
  const response = await axios.get<YouTubeChannelResponse>(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  const channel = response.data.items[0]
  return {
    id: channel.id,
    email: channel.snippet.title,
    name: channel.snippet.title,
  }
}

export class YouTubeMusicService {
  static async getAccessToken(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user?.refreshToken) {
      throw new Error('No refresh token found')
    }

    try {
      const response = await axios.post<any>(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          client_id: process.env.YOUTUBE_CLIENT_ID || '',
          client_secret: process.env.YOUTUBE_CLIENT_SECRET || '',
          refresh_token: user.refreshToken || '',
          grant_type: 'refresh_token'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
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
      console.error('Error refreshing YouTube token:', error)
      throw new Error('Failed to refresh YouTube token')
    }
  }

  static async getLikedSongs(userId: string) {
    const accessToken = await this.getAccessToken(userId)
    const songs = []

    try {
      let nextPageToken: any

      while (true) {
        const response = await axios.get(
          `${YOUTUBE_API_BASE}/videos`,
          {
            params: {
              part: 'snippet,contentDetails,status',
              myRating: 'like',
              maxResults: 50,
              pageToken: nextPageToken,
              key: YOUTUBE_API_KEY
            },
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )

        // Filter out non-embeddable videos and validate video IDs
        const validItems = response.data.items.filter((item: any) => {
          return item.status && item.status.embeddable && this.validateVideoId(item.id);
        });

        const items = validItems.map((item: any) => ({
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          album: null,
          providerId: item.id,
          provider: 'youtube',
          duration: item.contentDetails?.duration || null,
          thumbnail: item.snippet.thumbnails?.default?.url || null
        }))

        songs.push(...items)
        nextPageToken = response.data.nextPageToken

        if (!nextPageToken) {
          break
        }
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
      let nextPageToken: any

      while (true) {
        const response = await axios.get(
          `${YOUTUBE_API_BASE}/playlists`,
          {
            params: {
              part: 'snippet,contentDetails',
              mine: true,
              maxResults: 50,
              pageToken: nextPageToken
            },
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )

        const items = response.data.items.map((item: any) => ({
          id: item.id,
          name: item.snippet.title,
          description: item.snippet.description,
          tracks: item.contentDetails.itemCount
        }))

        playlists.push(...items)
        nextPageToken = response.data.nextPageToken

        if (!nextPageToken) {
          break
        }
      }

      return playlists
    } catch (error) {
      console.error('Error fetching playlists:', error)
      throw new Error('Failed to fetch playlists')
    }
  }

  private static validateVideoId(videoId: string): boolean {
    // YouTube video IDs are 11 characters long and contain only alphanumeric characters, dashes, and underscores
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  }

  private static async extractVideoId(urlOrId: string): Promise<string | null> {
    // If it's already a valid video ID, return it
    if (this.validateVideoId(urlOrId)) {
      return urlOrId;
    }

    // Try to extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*&v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = urlOrId.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // If no direct video ID found, search YouTube
    try {
      const response = await axios.get(
        `${YOUTUBE_API_BASE}/search`,
        {
          params: {
            part: 'snippet',
            q: urlOrId,
            type: 'video',
            maxResults: 1,
            key: YOUTUBE_API_KEY
          }
        }
      );

      if (response.data.items && response.data.items.length > 0) {
        const videoId = response.data.items[0].id.videoId;
        if (this.validateVideoId(videoId)) {
          return videoId;
        }
      }
    } catch (error) {
      console.error('Error searching YouTube:', error);
    }

    return null;
  }

  static async getStreamUrl(userId: string, providerId: string): Promise<string> {
    try {
      // First try to get video details directly
      const directResponse = await axios.get(
        `${YOUTUBE_API_BASE}/videos`,
        {
          params: {
            part: 'snippet,status',
            id: providerId,
            key: YOUTUBE_API_KEY
          }
        }
      );

      // If video exists and is embeddable, return its ID
      if (directResponse.data.items?.length > 0) {
        const video = directResponse.data.items[0];
        if (video.status.embeddable) {
          return video.id;
        }
      }

      // If direct lookup fails, search for the video
      const searchResponse = await axios.get(
        `${YOUTUBE_API_BASE}/search`,
        {
          params: {
            part: 'snippet',
            q: providerId, // Use the providerId as search query
            type: 'video',
            videoEmbeddable: true,
            maxResults: 1,
            key: YOUTUBE_API_KEY
          }
        }
      );

      if (!searchResponse.data.items?.length) {
        throw new Error('No matching videos found');
      }

      const videoId = searchResponse.data.items[0].id.videoId;

      // Verify the found video is embeddable
      const verifyResponse = await axios.get(
        `${YOUTUBE_API_BASE}/videos`,
        {
          params: {
            part: 'status',
            id: videoId,
            key: YOUTUBE_API_KEY
          }
        }
      );

      if (!verifyResponse.data.items?.length || !verifyResponse.data.items[0].status.embeddable) {
        throw new Error('Found video is not embeddable');
      }

      return videoId;
    } catch (error) {
      console.error('Error getting YouTube stream URL:', error);
      throw new Error('Failed to get YouTube stream URL');
    }
  }

  static async getPlaylistTracks(userId: string, playlistId: string) {
    const accessToken = await this.getAccessToken(userId)
    const songs = []

    try {
      let nextPageToken: any

      while (true) {
        const response = await axios.get(
          `${YOUTUBE_API_BASE}/playlistItems`,
          {
            params: {
              part: 'snippet,contentDetails',
              playlistId,
              maxResults: 50,
              pageToken: nextPageToken,
              key: YOUTUBE_API_KEY
            },
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )

        // Get video details for each playlist item to check embeddable status
        const videoIds = response.data.items
          .filter((item: any) => item.snippet.resourceId.kind === 'youtube#video')
          .map((item: any) => item.snippet.resourceId.videoId)
          .filter(this.validateVideoId);

        if (videoIds.length > 0) {
          const videoDetailsResponse = await axios.get(
            `${YOUTUBE_API_BASE}/videos`,
            {
              params: {
                part: 'snippet,contentDetails,status',
                id: videoIds.join(','),
                key: YOUTUBE_API_KEY
              }
            }
          );

          const validVideos = videoDetailsResponse.data.items.filter(
            (video: any) => video.status && video.status.embeddable
          );

          const items = validVideos.map((video: any) => ({
            title: video.snippet.title,
            artist: video.snippet.channelTitle,
            album: null,
            providerId: video.id,
            provider: 'youtube',
            duration: video.contentDetails?.duration || null,
            thumbnail: video.snippet.thumbnails?.default?.url || null
          }));

          songs.push(...items);
        }

        nextPageToken = response.data.nextPageToken

        if (!nextPageToken) {
          break
        }
      }

      return songs
    } catch (error) {
      console.error('Error fetching playlist tracks:', error)
      throw new Error('Failed to fetch playlist tracks')
    }
  }
} 