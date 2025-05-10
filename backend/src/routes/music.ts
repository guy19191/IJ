import express from 'express'
import { z } from 'zod'
import { prisma } from '../index'
import { authenticateToken } from '../middleware/auth'
import { MusicProviderService } from '../services/musicProvider'
import { SpotifyService } from '../services/spotify'
import { YouTubeMusicService } from '../services/youtubeMusic'

const router = express.Router()

// Get liked songs
router.get('/liked-songs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const songs = await MusicProviderService.getLikedSongs(userId, user.musicProvider)

    // Save songs to user's listening history
    await prisma.song.createMany({
      data: songs.map(song => ({
        ...song,
        userId
      })),
      skipDuplicates: true
    })

    res.json(songs)
  } catch (error) {
    console.error('Error fetching liked songs:', error)
    res.status(500).json({ error: 'Failed to fetch liked songs' })
  }
})

// Get playlists
router.get('/playlists', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const playlists = await MusicProviderService.getPlaylists(userId, user.musicProvider)
    res.json(playlists)
  } catch (error) {
    console.error('Error fetching playlists:', error)
    res.status(500).json({ error: 'Failed to fetch playlists' })
  }
})

// Get playlist tracks
router.get('/playlists/:playlistId/tracks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId
    const { playlistId } = req.params

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const songs = await MusicProviderService.getPlaylistTracks(
      userId,
      user.musicProvider,
      playlistId
    )

    // Save songs to user's listening history
    await prisma.song.createMany({
      data: songs.map(song => ({
        ...song,
        userId
      })),
      skipDuplicates: true
    })

    res.json(songs)
  } catch (error) {
    console.error('Error fetching playlist tracks:', error)
    res.status(500).json({ error: 'Failed to fetch playlist tracks' })
  }
})

// Get Spotify URI for a track
router.get('/spotify-uri', authenticateToken, async (req, res) => {
  try {
    const { title, artist, album } = req.query
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!title || !artist) {
      return res.status(400).json({ error: 'Missing required song information' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get Spotify URI for the track
    const song = {
      title: title as string,
      artist: artist as string,
      album: album as string || null,
      providerId: '', // Not needed for search
      provider: 'spotify'
    }
    
    const spotifyUri = await MusicProviderService.getSpotifyUri(userId, song)
    
    if (!spotifyUri) {
      return res.status(404).json({ error: 'Spotify URI not found' })
    }

    res.json({ uri: spotifyUri })
  } catch (error) {
    console.error('Error getting Spotify URI:', error)
    res.status(500).json({ error: 'Failed to get Spotify URI' })
  }
})

// Get Spotify token for Web Playback SDK
router.get('/spotify/token', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.musicProvider !== 'spotify') {
      return res.status(400).json({ error: 'User is not connected to Spotify' })
    }

    const accessToken = await SpotifyService.getWebPlaybackToken(userId)
    res.json({ accessToken })
  } catch (error) {
    console.error('Error getting Spotify token:', error)
    res.status(500).json({ error: 'Failed to get Spotify token' })
  }
})

// Get YouTube token for DJ SDK
router.get('/youtube/token', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.musicProvider !== 'youtube') {
      return res.status(400).json({ error: 'User is not connected to YouTube Music' })
    }

    const accessToken = await YouTubeMusicService.getAccessToken(userId)
    
    // Return token in the format expected by YouTube DJ SDK
    res.json({
      token: accessToken,
      expiresIn: 3600, // Token expires in 1 hour
      tokenType: 'Bearer'
    })
  } catch (error) {
    console.error('Error getting YouTube token:', error)
    res.status(500).json({ error: 'Failed to get YouTube token' })
  }
})

export default router 