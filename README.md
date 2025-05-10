# Music Event Manager

A full-stack web application for managing music events and playlists, integrating with various music providers (Spotify, Apple Music, YouTube Music).

## Features

- OAuth authentication with music providers
- Event creation and management
- AI-powered playlist generation based on event themes
- Real-time playlist updates
- Multiple event modes (public/private)
- In-app music playback
- Super user management
- User profiles and history

## Tech Stack

### Frontend
- React + TypeScript
- TailwindCSS
- Zustand
- Vite
- Vercel (hosting)

### Backend
- Node.js + Express + TypeScript
- PostgreSQL
- Prisma ORM
- OpenAI API
- Render/Railway (hosting)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create `.env` files in both frontend and backend directories
   - See `.env.example` files for required variables

4. Start development servers:
   ```bash
   npm run dev
   ```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
VITE_SPOTIFY_CLIENT_ID=
VITE_APPLE_MUSIC_CLIENT_ID=
VITE_YOUTUBE_CLIENT_ID=
```

### Backend (.env)
```
DATABASE_URL=
OPENAI_API_KEY=
JWT_SECRET=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
APPLE_MUSIC_KEY_ID=
APPLE_MUSIC_TEAM_ID=
APPLE_MUSIC_PRIVATE_KEY=
YOUTUBE_API_KEY=
```

## Project Structure

```
music-event-manager/
├── frontend/           # React frontend
├── backend/           # Node.js backend
├── package.json       # Root package.json
└── README.md         # This file
```

## License

MIT 