"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const spotify_1 = require("../services/spotify");
const appleMusic_1 = require("../services/appleMusic");
const youtubeMusic_1 = require("../services/youtubeMusic");
const router = express_1.default.Router();
// Validation schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(2),
    password: zod_1.z.string().min(6),
    musicProvider: zod_1.z.enum(['spotify', 'apple', 'youtube'])
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
// OAuth routes
router.get('/spotify', (req, res) => {
    const authUrl = (0, spotify_1.getSpotifyAuthUrl)();
    res.json({ url: authUrl });
});
router.get('/spotify/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?error=Invalid code`);
        }
        const token = await (0, spotify_1.getSpotifyToken)(code);
        const spotifyUser = await (0, spotify_1.getSpotifyUser)(token.access_token);
        // Check if user exists
        let user = await index_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: spotifyUser.email },
                    { providerId: spotifyUser.id }
                ]
            }
        });
        if (!user) {
            // Create new user
            user = await index_1.prisma.user.create({
                data: {
                    email: spotifyUser.email,
                    name: spotifyUser.display_name,
                    password: '', // No password for OAuth users
                    musicProvider: 'spotify',
                    providerId: spotifyUser.id,
                    accessToken: token.access_token,
                    refreshToken: token.refresh_token
                }
            });
        }
        else {
            // Update existing user's tokens
            user = await index_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    accessToken: token.access_token,
                    refreshToken: token.refresh_token,
                    providerId: spotifyUser.id,
                    musicProvider: 'spotify' // Update provider in case it changed
                }
            });
        }
        // Generate JWT
        const jwtToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        // Redirect to frontend with token and user data
        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            isSuperUser: user.isSuperUser,
            musicProvider: user.musicProvider
        };
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectUrl = `${frontendUrl}/auth/spotify/callback?token=${encodeURIComponent(jwtToken)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        console.log('Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
    }
    catch (error) {
        console.error('Spotify callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth?error=Error authenticating with Spotify`);
    }
});
router.get('/apple', (req, res) => {
    const authUrl = (0, appleMusic_1.getAppleMusicAuthUrl)();
    res.json({ url: authUrl });
});
router.get('/apple/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            return res.redirect(`${process.env.FRONTEND_URL}/auth?error=Invalid code`);
        }
        const token = await (0, appleMusic_1.getAppleMusicToken)(code);
        const appleUser = await (0, appleMusic_1.getAppleMusicUser)(token.access_token);
        // Check if user exists
        let user = await index_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: appleUser.email },
                    { providerId: appleUser.id }
                ]
            }
        });
        if (!user) {
            // Create new user
            user = await index_1.prisma.user.create({
                data: {
                    email: appleUser.email,
                    name: appleUser.name,
                    password: '', // No password for OAuth users
                    musicProvider: 'apple',
                    providerId: appleUser.id,
                    accessToken: token.access_token,
                    refreshToken: token.refresh_token
                }
            });
        }
        else {
            // Update existing user's tokens
            user = await index_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    accessToken: token.access_token,
                    refreshToken: token.refresh_token,
                    providerId: appleUser.id,
                    musicProvider: 'apple' // Update provider in case it changed
                }
            });
        }
        // Generate JWT
        const jwtToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        // Redirect to frontend with token
        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            isSuperUser: user.isSuperUser,
            musicProvider: user.musicProvider
        };
        const redirectUrl = `${process.env.FRONTEND_URL}/auth/apple/callback?token=${encodeURIComponent(jwtToken)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        res.redirect(redirectUrl);
    }
    catch (error) {
        console.error('Apple Music callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/auth?error=Error authenticating with Apple Music`);
    }
});
router.get('/youtube', (req, res) => {
    const authUrl = (0, youtubeMusic_1.getYouTubeMusicAuthUrl)();
    res.json({ url: authUrl });
});
router.get('/youtube/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            return res.redirect(`${process.env.FRONTEND_URL}/auth?error=Invalid code`);
        }
        const token = await (0, youtubeMusic_1.getYouTubeMusicToken)(code);
        const youtubeUser = await (0, youtubeMusic_1.getYouTubeMusicUser)(token.access_token);
        // Check if user exists
        let user = await index_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: youtubeUser.email },
                    { providerId: youtubeUser.id }
                ]
            }
        });
        if (!user) {
            // Create new user
            user = await index_1.prisma.user.create({
                data: {
                    email: youtubeUser.email,
                    name: youtubeUser.name,
                    password: '', // No password for OAuth users
                    musicProvider: 'youtube',
                    providerId: youtubeUser.id,
                    accessToken: token.access_token,
                    refreshToken: token.refresh_token
                }
            });
        }
        else {
            // Update existing user's tokens
            user = await index_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    accessToken: token.access_token,
                    refreshToken: token.refresh_token,
                    providerId: youtubeUser.id,
                    musicProvider: 'youtube' // Update provider in case it changed
                }
            });
        }
        // Generate JWT
        const jwtToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        // Redirect to frontend with token and user data
        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            isSuperUser: user.isSuperUser,
            musicProvider: user.musicProvider
        };
        const redirectUrl = `${process.env.FRONTEND_URL}/auth/youtube/callback?token=${encodeURIComponent(jwtToken)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        res.redirect(redirectUrl);
    }
    catch (error) {
        console.error('YouTube Music callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/auth?error=Error authenticating with YouTube Music`);
    }
});
// Register route
router.post('/register', async (req, res) => {
    try {
        const { email, name, password, musicProvider } = registerSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await index_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = await index_1.prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                musicProvider
            }
        });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isSuperUser: user.isSuperUser,
                musicProvider: user.musicProvider
            },
            token
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Error creating user' });
    }
});
// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        // Find user
        const user = await index_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check password
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isSuperUser: user.isSuperUser,
                musicProvider: user.musicProvider
            },
            token
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Error logging in' });
    }
});
exports.default = router;
