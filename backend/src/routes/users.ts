import express from 'express'
import { z } from 'zod'
import { prisma } from '../index'
import { authenticateToken } from '../middleware/auth'
import { MusicProviderService } from '../services/musicProvider'

const router = express.Router()

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperUser: true,
        musicProvider: true,
        createdAt: true,
        createdEvents: {
          select: {
            id: true,
            name: true,
            description: true,
            theme: true,
            isPublic: true,
            createdAt: true
          }
        },
        joinedEvents: {
          select: {
            id: true,
            name: true,
            description: true,
            theme: true,
            isPublic: true,
            createdAt: true
          }
        },
        listeningHistory: {
          select: {
            id: true,
            title: true,
            artist: true,
            album: true,
            provider: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Fetch liked songs and playlists from music provider
    const [likedSongs, playlists] = await Promise.all([
      MusicProviderService.getLikedSongs(userId, user.musicProvider),
      MusicProviderService.getPlaylists(userId, user.musicProvider)
    ])

    // For each playlist, fetch its tracks
    const playlistsWithTracks = await Promise.all(
      playlists.map(async (playlist) => {
        const tracks = await MusicProviderService.getPlaylistTracks(
          userId,
          user.musicProvider,
          playlist.id
        )
        return {
          ...playlist,
          tracks
        }
      })
    )

    res.json({
      ...user,
      likedSongs,
      playlists: playlistsWithTracks
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ error: 'Error fetching user profile' })
  }
})

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId
    const { name, musicProvider } = z.object({
      name: z.string().min(2).optional(),
      musicProvider: z.enum(['spotify', 'apple', 'youtube']).optional()
    }).parse(req.body)

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        musicProvider
      },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperUser: true,
        musicProvider: true
      }
    })

    res.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Error updating user profile' })
  }
})

// Upgrade to premium
router.post('/upgrade-to-premium', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isSuperUser: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperUser: true,
        musicProvider: true
      }
    })

    res.json(updatedUser)
  } catch (error) {
    res.status(500).json({ error: 'Error upgrading to premium' })
  }
})

export default router 