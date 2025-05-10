"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const openai_1 = require("../services/openai");
const qrcode_1 = __importDefault(require("qrcode"));
const router = express_1.default.Router();
// Validation schemas
const createEventSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string(),
    theme: zod_1.z.string(),
    isPublic: zod_1.z.boolean().default(true)
});
const updateEventSchema = createEventSchema.partial();
// Create event
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name, description, theme, isPublic } = createEventSchema.parse(req.body);
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Check if user is super user
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user?.isSuperUser) {
            return res.status(403).json({ error: 'Only super users can create events' });
        }
        // Create event
        const event = await index_1.prisma.event.create({
            data: {
                name,
                description,
                theme,
                isPublic,
                creatorId: userId
            }
        });
        res.status(201).json(event);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Error creating event' });
    }
});
// Get all events
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const events = await index_1.prisma.event.findMany({
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
        });
        res.json(events);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching events' });
    }
});
// Get event by ID
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const event = await index_1.prisma.event.findUnique({
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
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        // Check if user has access to the event
        if (!event.isPublic && event.creatorId !== userId && !event.participants.some(p => p.id === userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(event);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching event' });
    }
});
// Update event
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = updateEventSchema.parse(req.body);
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Check if user is the creator
        const event = await index_1.prisma.event.findUnique({
            where: { id }
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (event.creatorId !== userId) {
            return res.status(403).json({ error: 'Only the creator can update the event' });
        }
        const updatedEvent = await index_1.prisma.event.update({
            where: { id },
            data: updates
        });
        res.json(updatedEvent);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Error updating event' });
    }
});
// Join event
router.post('/:id/join', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const event = await index_1.prisma.event.findUnique({
            where: { id },
            include: {
                participants: true,
                playlist: true
            }
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (!event.isPublic) {
            return res.status(403).json({ error: 'This is a private event' });
        }
        // Add user to participants
        await index_1.prisma.event.update({
            where: { id },
            data: {
                participants: {
                    connect: { id: userId }
                }
            }
        });
        // Regenerate playlist with new participant
        const updatedEvent = await index_1.prisma.event.findUnique({
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
        });
        if (updatedEvent) {
            const newPlaylist = await (0, openai_1.generatePlaylist)({
                theme: updatedEvent.theme,
                participants: updatedEvent.participants.map(p => ({
                    listeningHistory: p.listeningHistory.map(song => ({
                        title: song.title,
                        artist: song.artist
                    }))
                })),
                creatorProvider: updatedEvent.creator.musicProvider
            });
            // Keep current and next song
            const currentSong = updatedEvent.playlist[0];
            const nextSong = updatedEvent.playlist[1];
            // Update playlist
            await index_1.prisma.event.update({
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
            });
        }
        res.json({ message: 'Successfully joined event' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error joining event' });
    }
});
// Get event share info
router.get('/:id/share', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const event = await index_1.prisma.event.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                isPublic: true
            }
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (!event.isPublic) {
            return res.status(403).json({ error: 'Cannot share private events' });
        }
        // Generate shareable link
        const shareableLink = `${process.env.FRONTEND_URL}/events/${event.id}`;
        // Generate QR code
        const qrCode = await qrcode_1.default.toDataURL(shareableLink);
        res.json({
            shareableLink,
            qrCode,
            eventName: event.name,
            eventDescription: event.description
        });
    }
    catch (error) {
        console.error('Error generating share info:', error);
        res.status(500).json({ error: 'Error generating share info' });
    }
});
exports.default = router;
