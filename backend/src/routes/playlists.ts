import express from 'express'
import { z } from 'zod'
import { prisma } from '../index'
import { authenticateToken } from '../middleware/auth'
import { generatePlaylist } from '../services/openai'

const router = express.Router()

// Get event playlist
router.get('/events/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        playlist: true,
        creator: {
          select: {
            id: true,
            musicProvider: true
          }
        },
        participants: {
          where: { id: userId }
        }
      }
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Check if user has access to the event
    if (!event.isPublic && event.creatorId !== userId && event.participants.length === 0) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json(event.playlist)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching playlist' })
  }
})

// Regenerate playlist
router.post('/events/:eventId/regenerate', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          select: {
            id: true,
            musicProvider: true
          }
        },
        participants: {
          include: {
            listeningHistory: true
          }
        },
        playlist: true
      }
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Check if user is the creator
    if (event.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the creator can regenerate the playlist' })
    }

    // Keep current and next song
    const currentSong = event.playlist[0]
    const nextSong = event.playlist[1]

    // Generate new playlist
    const newPlaylist = await generatePlaylist({
      theme: event.theme,
      participants: event.participants.map(p => ({
        listeningHistory: p.listeningHistory.map(song => ({
          title: song.title,
          artist: song.artist
        }))
      })),
      creatorProvider: event.creator.musicProvider
    })

    // Update playlist
    await prisma.event.update({
      where: { id: eventId },
      data: {
        playlist: {
          deleteMany: {},
          create: [
            ...(currentSong ? [{
              title: currentSong.title,
              artist: currentSong.artist,
              album: currentSong.album,
              providerId: currentSong.providerId,
              provider: currentSong.provider
            }] : []),
            ...(nextSong ? [{
              title: nextSong.title,
              artist: nextSong.artist,
              album: nextSong.album,
              providerId: nextSong.providerId,
              provider: nextSong.provider
            }] : []),
            ...newPlaylist.slice(2).map(song => ({
              title: song.title,
              artist: song.artist,
              album: song.album,
              providerId: song.providerId,
              provider: song.provider
            }))
          ]
        }
      }
    })

    res.json({ message: 'Playlist regenerated successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Error regenerating playlist' })
  }
})

// Generate next song
router.post('/events/:eventId/generate-next', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: true,
        participants: {
          include: {
            listeningHistory: true
          }
        },
        playlist: true
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is the creator
    if (event.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the creator can control playback' });
    }

    // Generate new song based on event context and participants
    const newPlaylist = await generatePlaylist({
      theme: event.theme,
      participants: event.participants.map(p => ({
        listeningHistory: p.listeningHistory.map(song => ({
          title: song.title,
          artist: song.artist
        }))
      })),
      creatorProvider: event.creator.musicProvider
    });
    const newSong = newPlaylist[0];

    if (!newSong) {
      return res.status(500).json({ error: 'Failed to generate next song' });
    }

    // Add the new song to the playlist
    await prisma.event.update({
      where: { id: eventId },
      data: {
        playlist: {
          create: {
            title: newSong.title,
            artist: newSong.artist,
            album: newSong.album,
            providerId: newSong.providerId,
            provider: newSong.provider
          }
        }
      }
    });

    res.json(newSong);
  } catch (error) {
    console.error('Error generating next song:', error);
    res.status(500).json({ error: 'Error generating next song' });
  }
});

export default router 