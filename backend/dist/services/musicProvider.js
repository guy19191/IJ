"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicProviderService = void 0;
const spotify_1 = require("./spotify");
const appleMusic_1 = require("./appleMusic");
const youtubeMusic_1 = require("./youtubeMusic");
const prisma_1 = require("../lib/prisma");
class MusicProviderService {
    static async getLikedSongs(userId, provider) {
        switch (provider) {
            case 'spotify':
                return spotify_1.SpotifyService.getLikedSongs(userId);
            case 'apple':
                return appleMusic_1.AppleMusicService.getLikedSongs(userId);
            case 'youtube':
                return youtubeMusic_1.YouTubeMusicService.getLikedSongs(userId);
            default:
                throw new Error(`Unsupported music provider: ${provider}`);
        }
    }
    static async getPlaylists(userId, provider) {
        switch (provider) {
            case 'spotify':
                return spotify_1.SpotifyService.getPlaylists(userId);
            case 'apple':
                return appleMusic_1.AppleMusicService.getPlaylists(userId);
            case 'youtube':
                return youtubeMusic_1.YouTubeMusicService.getPlaylists(userId);
            default:
                throw new Error(`Unsupported music provider: ${provider}`);
        }
    }
    static async getPlaylistTracks(userId, provider, playlistId) {
        switch (provider) {
            case 'spotify':
                return spotify_1.SpotifyService.getPlaylistTracks(userId, playlistId);
            case 'apple':
                return appleMusic_1.AppleMusicService.getPlaylistTracks(userId, playlistId);
            case 'youtube':
                return youtubeMusic_1.YouTubeMusicService.getPlaylistTracks(userId, playlistId);
            default:
                throw new Error(`Unsupported music provider: ${provider}`);
        }
    }
    static async getSpotifyUri(userId, song) {
        try {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new Error('User not found');
            }
            if (!user.accessToken) {
                throw new Error('Spotify credentials not found');
            }
            // Clean and format the search query
            const cleanTitle = this.cleanSearchString(song.title);
            const cleanArtist = this.cleanSearchString(song.artist);
            const searchQuery = `${cleanTitle} ${cleanArtist}`;
            // Try to find the track on Spotify
            const trackInfo = await spotify_1.SpotifyService.searchTrack(userId, searchQuery);
            if (!trackInfo) {
                console.error('No matching track found for:', searchQuery);
                return null;
            }
            // Verify the match is close enough
            const isGoodMatch = this.isGoodMatch(trackInfo, song);
            if (!isGoodMatch) {
                console.error('No good match found for:', searchQuery);
                return null;
            }
            return trackInfo.uri;
        }
        catch (error) {
            console.error('Error getting Spotify URI:', error);
            return null;
        }
    }
    static cleanSearchString(str) {
        return str
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
    }
    static isGoodMatch(spotifyTrack, originalSong) {
        const spotifyTitle = this.cleanSearchString(spotifyTrack.name);
        const spotifyArtist = this.cleanSearchString(spotifyTrack.artists[0].name);
        const originalTitle = this.cleanSearchString(originalSong.title);
        const originalArtist = this.cleanSearchString(originalSong.artist);
        // Check if titles and artists are similar enough
        const titleSimilarity = this.calculateSimilarity(spotifyTitle, originalTitle);
        const artistSimilarity = this.calculateSimilarity(spotifyArtist, originalArtist);
        // Require high similarity for both title and artist
        return titleSimilarity > 0.8 && artistSimilarity > 0.8;
    }
    static calculateSimilarity(str1, str2) {
        const words1 = str1.split(' ');
        const words2 = str2.split(' ');
        // Count matching words
        const matches = words1.filter(word => words2.includes(word)).length;
        // Calculate similarity as ratio of matching words to total unique words
        const totalWords = new Set([...words1, ...words2]).size;
        return matches / totalWords;
    }
}
exports.MusicProviderService = MusicProviderService;
