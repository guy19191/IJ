"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const musicProvider_1 = require("../services/musicProvider");
const router = express_1.default.Router();
// Get user profile
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await index_1.prisma.user.findUnique({
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
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Fetch liked songs and playlists from music provider
        const [likedSongs, playlists] = await Promise.all([
            musicProvider_1.MusicProviderService.getLikedSongs(userId, user.musicProvider),
            musicProvider_1.MusicProviderService.getPlaylists(userId, user.musicProvider)
        ]);
        // For each playlist, fetch its tracks
        const playlistsWithTracks = await Promise.all(playlists.map(async (playlist) => {
            const tracks = await musicProvider_1.MusicProviderService.getPlaylistTracks(userId, user.musicProvider, playlist.id);
            return {
                ...playlist,
                tracks
            };
        }));
        res.json({
            ...user,
            likedSongs,
            playlists: playlistsWithTracks
        });
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Error fetching user profile' });
    }
});
// Update user profile
router.put('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { name, musicProvider } = zod_1.z.object({
            name: zod_1.z.string().min(2).optional(),
            musicProvider: zod_1.z.enum(['spotify', 'apple', 'youtube']).optional()
        }).parse(req.body);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const updatedUser = await index_1.prisma.user.update({
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
        });
        res.json(updatedUser);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Error updating user profile' });
    }
});
// Upgrade to premium
router.post('/upgrade-to-premium', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const updatedUser = await index_1.prisma.user.update({
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
        });
        res.json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ error: 'Error upgrading to premium' });
    }
});
exports.default = router;
