"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleMusicService = exports.getAppleMusicUser = exports.getAppleMusicToken = exports.getAppleMusicAuthUrl = void 0;
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const APPLE_MUSIC_API_BASE = 'https://api.music.apple.com/v1';
const getAppleMusicAuthUrl = () => {
    const clientId = process.env.APPLE_CLIENT_ID;
    const redirectUri = process.env.APPLE_REDIRECT_URI;
    const scope = 'user-read-email user-read-private';
    return `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
};
exports.getAppleMusicAuthUrl = getAppleMusicAuthUrl;
const getAppleMusicToken = async (code) => {
    const clientId = process.env.APPLE_CLIENT_ID;
    const clientSecret = process.env.APPLE_CLIENT_SECRET;
    const redirectUri = process.env.APPLE_REDIRECT_URI;
    const response = await axios_1.default.post('https://appleid.apple.com/auth/token', new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
    }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
    });
    return response.data;
};
exports.getAppleMusicToken = getAppleMusicToken;
const getAppleMusicUser = async (accessToken) => {
    const response = await axios_1.default.get('https://api.music.apple.com/v1/me', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    return response.data;
};
exports.getAppleMusicUser = getAppleMusicUser;
class AppleMusicService {
    static async getAccessToken(userId) {
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user?.accessToken) {
            throw new Error('No access token found');
        }
        try {
            // Generate JWT for Apple Music API
            const token = jsonwebtoken_1.default.sign({
                iss: process.env.APPLE_MUSIC_TEAM_ID,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600
            }, process.env.APPLE_MUSIC_PRIVATE_KEY || '', {
                algorithm: 'ES256',
                keyid: process.env.APPLE_MUSIC_KEY_ID
            });
            // Get access token
            const response = await axios_1.default.post('https://api.music.apple.com/v1/me/token', {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            // Update user's access token
            await index_1.prisma.user.update({
                where: { id: userId },
                data: {
                    accessToken: response.data.access_token
                }
            });
            return response.data.access_token;
        }
        catch (error) {
            console.error('Error refreshing Apple Music token:', error);
            throw new Error('Failed to refresh Apple Music token');
        }
    }
    static async getLikedSongs(userId) {
        const accessToken = await this.getAccessToken(userId);
        const songs = [];
        try {
            let offset = 0;
            const limit = 100;
            while (true) {
                const response = await axios_1.default.get(`${APPLE_MUSIC_API_BASE}/me/library/songs?limit=${limit}&offset=${offset}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const items = response.data.data.map((item) => ({
                    title: item.attributes.name,
                    artist: item.attributes.artistName,
                    album: item.attributes.albumName,
                    providerId: item.id,
                    provider: 'apple'
                }));
                songs.push(...items);
                if (items.length < limit) {
                    break;
                }
                offset += limit;
            }
            return songs;
        }
        catch (error) {
            console.error('Error fetching liked songs:', error);
            throw new Error('Failed to fetch liked songs');
        }
    }
    static async getPlaylists(userId) {
        const accessToken = await this.getAccessToken(userId);
        const playlists = [];
        try {
            let offset = 0;
            const limit = 100;
            while (true) {
                const response = await axios_1.default.get(`${APPLE_MUSIC_API_BASE}/me/library/playlists?limit=${limit}&offset=${offset}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const items = response.data.data.map((item) => ({
                    id: item.id,
                    name: item.attributes.name,
                    description: item.attributes.description,
                    tracks: item.attributes.trackCount
                }));
                playlists.push(...items);
                if (items.length < limit) {
                    break;
                }
                offset += limit;
            }
            return playlists;
        }
        catch (error) {
            console.error('Error fetching playlists:', error);
            throw new Error('Failed to fetch playlists');
        }
    }
    static async getPlaylistTracks(userId, playlistId) {
        const accessToken = await this.getAccessToken(userId);
        const songs = [];
        try {
            let offset = 0;
            const limit = 100;
            while (true) {
                const response = await axios_1.default.get(`${APPLE_MUSIC_API_BASE}/me/library/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const items = response.data.data.map((item) => ({
                    title: item.attributes.name,
                    artist: item.attributes.artistName,
                    album: item.attributes.albumName,
                    providerId: item.id,
                    provider: 'apple'
                }));
                songs.push(...items);
                if (items.length < limit) {
                    break;
                }
                offset += limit;
            }
            return songs;
        }
        catch (error) {
            console.error('Error fetching playlist tracks:', error);
            throw new Error('Failed to fetch playlist tracks');
        }
    }
}
exports.AppleMusicService = AppleMusicService;
