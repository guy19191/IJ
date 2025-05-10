"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotifyService = exports.getSpotifyUser = exports.getSpotifyToken = exports.getSpotifyAuthUrl = void 0;
const axios_1 = __importDefault(require("axios"));
const index_1 = require("../index");
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH_BASE = 'https://accounts.spotify.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
console.log('Current FRONTEND_URL:', FRONTEND_URL);
const getSpotifyAuthUrl = () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = `${FRONTEND_URL}/api/auth/spotify/callback`;
    const scope = 'user-read-email user-read-private';
    if (!clientId) {
        throw new Error('Missing Spotify client ID');
    }
    console.log('Spotify Auth URL Redirect URI:', redirectUri);
    const authUrl = `${SPOTIFY_AUTH_BASE}/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    console.log('Full Spotify Auth URL:', authUrl);
    return authUrl;
};
exports.getSpotifyAuthUrl = getSpotifyAuthUrl;
const getSpotifyToken = async (code) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = `${FRONTEND_URL}/api/auth/spotify/callback`;
    if (!clientId || !clientSecret) {
        throw new Error('Missing Spotify credentials');
    }
    console.log('Token Exchange Redirect URI:', redirectUri);
    const response = await axios_1.default.post(`${SPOTIFY_AUTH_BASE}/api/token`, new URLSearchParams({
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
exports.getSpotifyToken = getSpotifyToken;
const getSpotifyUser = async (accessToken) => {
    const response = await axios_1.default.get('https://api.spotify.com/v1/me', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    return response.data;
};
exports.getSpotifyUser = getSpotifyUser;
class SpotifyService {
    static async getAccessToken(userId) {
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user?.refreshToken) {
            throw new Error('No refresh token found');
        }
        try {
            const response = await axios_1.default.post(`${SPOTIFY_AUTH_BASE}/api/token`, new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: user.refreshToken
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
                }
            });
            // Update user's access token
            await index_1.prisma.user.update({
                where: { id: userId },
                data: {
                    accessToken: response.data.access_token,
                    refreshToken: response.data.refresh_token || user.refreshToken
                }
            });
            return response.data.access_token;
        }
        catch (error) {
            console.error('Error refreshing Spotify token:', error);
            throw new Error('Failed to refresh Spotify token');
        }
    }
    static async getLikedSongs(userId) {
        const accessToken = await this.getAccessToken(userId);
        const songs = [];
        try {
            let nextUrl = `${SPOTIFY_API_BASE}/me/tracks?limit=50`;
            while (nextUrl) {
                const response = await axios_1.default.get(nextUrl, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const items = response.data.items.map((item) => ({
                    title: item.track.name,
                    artist: item.track.artists.map((a) => a.name).join(', '),
                    album: item.track.album.name,
                    providerId: item.track.id,
                    provider: 'spotify'
                }));
                songs.push(...items);
                nextUrl = response.data.next;
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
            let nextUrl = `${SPOTIFY_API_BASE}/me/playlists?limit=50`;
            while (nextUrl) {
                const response = await axios_1.default.get(nextUrl, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const items = response.data.items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    tracks: item.tracks.total
                }));
                playlists.push(...items);
                nextUrl = response.data.next;
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
            let nextUrl = `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=100`;
            while (nextUrl) {
                const response = await axios_1.default.get(nextUrl, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const items = response.data.items.map((item) => ({
                    title: item.track.name,
                    artist: item.track.artists.map((a) => a.name).join(', '),
                    album: item.track.album.name,
                    providerId: item.track.id,
                    provider: 'spotify'
                }));
                songs.push(...items);
                nextUrl = response.data.next;
            }
            return songs;
        }
        catch (error) {
            console.error('Error fetching playlist tracks:', error);
            throw new Error('Failed to fetch playlist tracks');
        }
    }
    static async getTrackInfo(userId, trackId) {
        const accessToken = await this.getAccessToken(userId);
        try {
            const response = await axios_1.default.get(`${SPOTIFY_API_BASE}/tracks/${trackId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching track info:', error);
            throw new Error('Failed to fetch track info');
        }
    }
    static async searchTrack(userId, query) {
        const accessToken = await this.getAccessToken(userId);
        try {
            // First try with exact match
            const exactResponse = await axios_1.default.get(`${SPOTIFY_API_BASE}/search`, {
                params: {
                    q: `"${query}"`, // Use quotes for exact phrase matching
                    type: 'track',
                    limit: 5
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            if (exactResponse.data.tracks.items.length > 0) {
                return exactResponse.data.tracks.items[0];
            }
            // If no exact match, try with more flexible search
            const flexibleResponse = await axios_1.default.get(`${SPOTIFY_API_BASE}/search`, {
                params: {
                    q: query,
                    type: 'track',
                    limit: 5
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            // Return the first track found
            return flexibleResponse.data.tracks.items[0] || null;
        }
        catch (error) {
            console.error('Error searching track:', error);
            throw new Error('Failed to search track');
        }
    }
    static async getWebPlaybackToken(userId) {
        return this.getAccessToken(userId);
    }
}
exports.SpotifyService = SpotifyService;
