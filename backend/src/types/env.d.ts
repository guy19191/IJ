declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test'
    PORT?: string
    JWT_SECRET: string
    FRONTEND_URL: string
    
    // Spotify
    SPOTIFY_CLIENT_ID: string
    SPOTIFY_CLIENT_SECRET: string
    SPOTIFY_REDIRECT_URI: string
    
    // Apple Music
    APPLE_CLIENT_ID: string
    APPLE_CLIENT_SECRET: string
    APPLE_REDIRECT_URI: string
    APPLE_MUSIC_TEAM_ID: string
    APPLE_MUSIC_KEY_ID: string
    APPLE_MUSIC_PRIVATE_KEY: string
    
    // YouTube Music
    YOUTUBE_CLIENT_ID: string
    YOUTUBE_CLIENT_SECRET: string
    YOUTUBE_REDIRECT_URI: string
    
    // OpenAI
    OPENROUTER_API_KEY: string
    
    // AI
    ANTHROPIC_API_KEY: string
  }
} 