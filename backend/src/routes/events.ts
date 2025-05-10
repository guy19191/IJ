import express from 'express'
import { z } from 'zod'
import { prisma } from '../index'
import { authenticateToken } from '../middleware/auth'
import { generatePlaylist } from '../services/openai'
import QRCode from 'qrcode'

const router = express.Router()

// Validation schemas
const createEventSchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  theme: z.string(),
  isPublic: z.boolean().default(true)
})

const updateEventSchema = createEventSchema.partial()

// Create event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, theme, isPublic } = createEventSchema.parse(req.body)
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if user is super user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user?.isSuperUser) {
      return res.status(403).json({ error: 'Only super users can create events' })
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        name,
        description,
        theme,
        isPublic,
        creatorId: userId
      }
    })

    res.status(201).json(event)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Error creating event' })
  }
})

// Get all events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { isPublic: true },
          { participants: { some: { id: userId } } },
          { creatorId: userId }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            musicProvider: true
          }
        },
        participants: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    res.json(events)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching events' })
  }
})

// Get event by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            musicProvider: true
          }
        },
        participants: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        playlist: true
      }
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Check if user has access to the event
    if (!event.isPublic && event.creatorId !== userId && !event.participants.some(p => p.id === userId)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json(event)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching event' })
  }
})

// Update event
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const updates = updateEventSchema.parse(req.body)
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if user is the creator
    const event = await prisma.event.findUnique({
      where: { id }
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    if (event.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the creator can update the event' })
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updates
    })

    res.json(updatedEvent)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Error updating event' })
  }
})

// Join event
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        participants: true,
        playlist: true
      }
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    if (!event.isPublic) {
      return res.status(403).json({ error: 'This is a private event' })
    }

    // Add user to participants
    await prisma.event.update({
      where: { id },
      data: {
        participants: {
          connect: { id: userId }
        }
      }
    })

    // Regenerate playlist with new participant
    const updatedEvent = await prisma.event.findUnique({
      where: { id },
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

    if (updatedEvent) {
      const newPlaylist = await generatePlaylist({
        theme: updatedEvent.theme,
        participants: updatedEvent.participants.map(p => ({
          listeningHistory: p.listeningHistory.map(song => ({
            title: song.title,
            artist: song.artist
          }))
        })),
        creatorProvider: updatedEvent.creator.musicProvider
      })
      
      // Keep current and next song
      const currentSong = updatedEvent.playlist[0]
      const nextSong = updatedEvent.playlist[1]

      // Update playlist
      await prisma.event.update({
        where: { id },
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
    }

    res.json({ message: 'Successfully joined event' })
  } catch (error) {
    res.status(500).json({ error: 'Error joining event' })
  }
})

// Get event share info
router.get('/:id/share', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true
      }
    })

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    if (!event.isPublic) {
      return res.status(403).json({ error: 'Cannot share private events' })
    }

    // Generate shareable link
    const shareableLink = `${process.env.FRONTEND_URL}/events/${event.id}`

    // Generate QR code
    const qrCode = await QRCode.toDataURL(shareableLink)

    res.json({
      shareableLink,
      qrCode,
      eventName: event.name,
      eventDescription: event.description
    })
  } catch (error) {
    console.error('Error generating share info:', error)
    res.status(500).json({ error: 'Error generating share info' })
  }
})

export default router 