import { SpotifyService } from './spotify'
import { AppleMusicService } from './appleMusic'
import { YouTubeMusicService } from './youtubeMusic'
import { prisma } from '../lib/prisma'

export interface Song {
  title: string
  artist: string
  album: string | null
  providerId: string
  provider: string
  spotifyUri?: string
}

export interface Playlist {
  id: string
  name: string
  description: string
  tracks: number
  spotifyUri?: string
}

export class MusicProviderService {
  static async getLikedSongs(userId: string, provider: string): Promise<Song[]> {
    switch (provider) {
      case 'spotify':
        return SpotifyService.getLikedSongs(userId)
      case 'apple':
        return AppleMusicService.getLikedSongs(userId)
      case 'youtube':
        return YouTubeMusicService.getLikedSongs(userId)
      default:
        throw new Error(`Unsupported music provider: ${provider}`)
    }
  }

  static async getPlaylists(userId: string, provider: string): Promise<Playlist[]> {
    switch (provider) {
      case 'spotify':
        return SpotifyService.getPlaylists(userId)
      case 'apple':
        return AppleMusicService.getPlaylists(userId)
      case 'youtube':
        return YouTubeMusicService.getPlaylists(userId)
      default:
        throw new Error(`Unsupported music provider: ${provider}`)
    }
  }

  static async getPlaylistTracks(
    userId: string,
    provider: string,
    playlistId: string
  ): Promise<Song[]> {
    switch (provider) {
      case 'spotify':
        return SpotifyService.getPlaylistTracks(userId, playlistId)
      case 'apple':
        return AppleMusicService.getPlaylistTracks(userId, playlistId)
      case 'youtube':
        return YouTubeMusicService.getPlaylistTracks(userId, playlistId)
      default:
        throw new Error(`Unsupported music provider: ${provider}`)
    }
  }

  static async getSpotifyUri(userId: string, song: Song): Promise<string | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      if (!user.accessToken) {
        throw new Error('Spotify credentials not found')
      }

      // Clean and format the search query
      const cleanTitle = this.cleanSearchString(song.title)
      const cleanArtist = this.cleanSearchString(song.artist)
      const searchQuery = `${cleanTitle} ${cleanArtist}`

      // Try to find the track on Spotify
      const trackInfo = await SpotifyService.searchTrack(userId, searchQuery)
      
      if (!trackInfo) {
        console.error('No matching track found for:', searchQuery)
        return null
      }

      // Verify the match is close enough
      const isGoodMatch = this.isGoodMatch(trackInfo, song)
      if (!isGoodMatch) {
        console.error('No good match found for:', searchQuery)
        return null
      }

      return trackInfo.uri
    } catch (error) {
      console.error('Error getting Spotify URI:', error)
      return null
    }
  }

  private static cleanSearchString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
      .trim()
  }

  private static isGoodMatch(spotifyTrack: any, originalSong: Song): boolean {
    const spotifyTitle = this.cleanSearchString(spotifyTrack.name)
    const spotifyArtist = this.cleanSearchString(spotifyTrack.artists[0].name)
    const originalTitle = this.cleanSearchString(originalSong.title)
    const originalArtist = this.cleanSearchString(originalSong.artist)

    // Check if titles and artists are similar enough
    const titleSimilarity = this.calculateSimilarity(spotifyTitle, originalTitle)
    const artistSimilarity = this.calculateSimilarity(spotifyArtist, originalArtist)

    // Require high similarity for both title and artist
    return titleSimilarity > 0.8 && artistSimilarity > 0.8
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ')
    const words2 = str2.split(' ')
    
    // Count matching words
    const matches = words1.filter(word => words2.includes(word)).length
    
    // Calculate similarity as ratio of matching words to total unique words
    const totalWords = new Set([...words1, ...words2]).size
    return matches / totalWords
  }
} 