import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'


type EventWithParticipants = {
  id: string
  name: string
  description: string
  theme: string
  isPublic: boolean
  creatorId: string
  createdAt: Date
  updatedAt: Date
  participants: {
    id: string
    name: string
    email: string
    musicProvider: string
    listeningHistory: {
      id: string
      title: string
      artist: string
      album: string | null
      providerId: string
      provider: string
      createdAt: Date
    }[]
  }[]
  playlist: {
    id: string
    title: string
    artist: string
    album: string | null
    providerId: string
    provider: string
    createdAt: Date
  }[]
}


const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
  timeout: 20000,
  maxRetries: 1,
});

export async function generatePlaylist(event: {
  theme: string;
  participants: { listeningHistory: { title: string; artist: string }[] }[];
  creatorProvider: string;
}) {
  try {
    const recentSongs = Array.from(
      new Map(
        event.participants
          .flatMap(p => p.listeningHistory)
          .reverse()
          .map(song => [`${song.title}-${song.artist}`, song])
      ).values()
    ).slice(0, 15); // even fewer to minimize cost
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
    
  } catch (err) {
    console.error("Playlist generation failed:", err);
    throw new Error("Failed to generate playlist");
  }
}
