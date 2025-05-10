import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth'
import eventRoutes from './routes/events'
import userRoutes from './routes/users'
import playlistRoutes from './routes/playlists'
import musicRoutes from './routes/music'
import path from 'path'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config()

// Initialize Prisma client
export const prisma = new PrismaClient()

// Create Express app
const app = express()

// Debug middleware for all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],  // Allow both backend and frontend dev servers
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/users', userRoutes)
app.use('/api/playlists', playlistRoutes)
app.use('/api/music', musicRoutes)
// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  // Don't serve index.html for /api routes
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API route not found' });
    return;
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log('Available routes:');
  console.log('- GET /api/test');
  console.log('- /api/auth/*');
  console.log('- /api/events/*');
  console.log('- /api/users/*');
  console.log('- /api/playlists/*');
}) 