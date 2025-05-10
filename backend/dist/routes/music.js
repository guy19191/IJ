"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const musicProvider_1 = require("../services/musicProvider");
const spotify_1 = require("../services/spotify");
const youtubeMusic_1 = require("../services/youtubeMusic");
const router = express_1.default.Router();
// Get liked songs
router.get('/liked-songs', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const songs = await musicProvider_1.MusicProviderService.getLikedSongs(userId, user.musicProvider);
        // Save songs to user's listening history
        await index_1.prisma.song.createMany({
            data: songs.map(song => ({
                ...song,
                userId
            })),
            skipDuplicates: true
        });
        res.json(songs);
    }
    catch (error) {
        console.error('Error fetching liked songs:', error);
        res.status(500).json({ error: 'Failed to fetch liked songs' });
    }
});
// Get playlists
router.get('/playlists', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const playlists = await musicProvider_1.MusicProviderService.getPlaylists(userId, user.musicProvider);
        res.json(playlists);
    }
    catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).json({ error: 'Failed to fetch playlists' });
    }
});
// Get playlist tracks
router.get('/playlists/:playlistId/tracks', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { playlistId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const songs = await musicProvider_1.MusicProviderService.getPlaylistTracks(userId, user.musicProvider, playlistId);
        // Save songs to user's listening history
        await index_1.prisma.song.createMany({
            data: songs.map(song => ({
                ...song,
                userId
            })),
            skipDuplicates: true
        });
        res.json(songs);
    }
    catch (error) {
        console.error('Error fetching playlist tracks:', error);
        res.status(500).json({ error: 'Failed to fetch playlist tracks' });
    }
});
// Get Spotify URI for a track
router.get('/spotify-uri', auth_1.authenticateToken, async (req, res) => {
    try {
        const { title, artist, album } = req.query;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!title || !artist) {
            return res.status(400).json({ error: 'Missing required song information' });
        }
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Get Spotify URI for the track
        const song = {
            title: title,
            artist: artist,
            album: album || null,
            providerId: '', // Not needed for search
            provider: 'spotify'
        };
        const spotifyUri = await musicProvider_1.MusicProviderService.getSpotifyUri(userId, song);
        if (!spotifyUri) {
            return res.status(404).json({ error: 'Spotify URI not found' });
        }
        res.json({ uri: spotifyUri });
    }
    catch (error) {
        console.error('Error getting Spotify URI:', error);
        res.status(500).json({ error: 'Failed to get Spotify URI' });
    }
});
// Get Spotify token for Web Playback SDK
router.get('/spotify/token', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.musicProvider !== 'spotify') {
            return res.status(400).json({ error: 'User is not connected to Spotify' });
        }
        const accessToken = await spotify_1.SpotifyService.getWebPlaybackToken(userId);
        res.json({ accessToken });
    }
    catch (error) {
        console.error('Error getting Spotify token:', error);
        res.status(500).json({ error: 'Failed to get Spotify token' });
    }
});
// Get YouTube token for DJ SDK
router.get('/youtube/token', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.musicProvider !== 'youtube') {
            return res.status(400).json({ error: 'User is not connected to YouTube Music' });
        }
        const accessToken = await youtubeMusic_1.YouTubeMusicService.getAccessToken(userId);
        // Return token in the format expected by YouTube DJ SDK
        res.json({
            token: accessToken,
            expiresIn: 3600, // Token expires in 1 hour
            tokenType: 'Bearer'
        });
    }
    catch (error) {
        console.error('Error getting YouTube token:', error);
        res.status(500).json({ error: 'Failed to get YouTube token' });
    }
});
exports.default = router;
