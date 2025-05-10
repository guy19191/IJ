"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePlaylist = generatePlaylist;
const openai_1 = __importDefault(require("openai"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    timeout: 20000,
    maxRetries: 1,
});
async function generatePlaylist(event) {
    try {
        const recentSongs = Array.from(new Map(event.participants
            .flatMap(p => p.listeningHistory)
            .reverse()
            .map(song => [`${song.title}-${song.artist}`, song])).values()).slice(0, 15); // even fewer to minimize cost
        const compactList = recentSongs.map((s) => `${s.title} - ${s.artist}`).join(", ");
        const prompt = `You are a music assistant. Based on the theme "${event.theme}" and songs: ${compactList}, generate a JSON array of 10 songs. Format:
[{"title":"", "artist":"", "album":"", "providerId":"", "provider":"${event.creatorProvider}"}]
Return ONLY the array, no markdown, no code blocks, no json prefix.`;
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are a music assistant. Return ONLY a raw JSON array of 10 songs, each with title, artist, album, providerId, and provider (${event.creatorProvider}). No markdown, no code blocks, no json prefix, no extra text.`
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.6,
            max_tokens: 600,
        });
        const response = completion.choices[0]?.message?.content;
        if (!response)
            throw new Error("No response");
        const playlist = JSON.parse(response);
        if (!Array.isArray(playlist))
            throw new Error("Invalid JSON format");
        return playlist;
    }
    catch (err) {
        console.error("Playlist generation failed:", err);
        throw new Error("Failed to generate playlist");
    }
}
