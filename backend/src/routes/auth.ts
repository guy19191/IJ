import express from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../index'
import { getSpotifyAuthUrl, getSpotifyToken, getSpotifyUser } from '../services/spotify'
import { getAppleMusicAuthUrl, getAppleMusicToken, getAppleMusicUser } from '../services/appleMusic'
import { getYouTubeMusicAuthUrl, getYouTubeMusicToken, getYouTubeMusicUser } from '../services/youtubeMusic'

const router = express.Router()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  musicProvider: z.enum(['spotify', 'apple', 'youtube'])
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

// OAuth routes
router.get('/spotify', (req, res) => {
  const authUrl = getSpotifyAuthUrl()
  res.json({ url: authUrl })
})

router.get('/spotify/callback', async (req, res) => {
  try {
    const { code } = req.query
    if (!code || typeof code !== 'string') {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?error=Invalid code`)
    }

    const token = await getSpotifyToken(code)
    const spotifyUser = await getSpotifyUser(token.access_token)

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: spotifyUser.email },
          { providerId: spotifyUser.id }
        ]
      }
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: spotifyUser.email,
          name: spotifyUser.display_name,
          password: '', // No password for OAuth users
          musicProvider: 'spotify',
          providerId: spotifyUser.id,
          accessToken: token.access_token,
          refreshToken: token.refresh_token
        }
      })
    } else {
      // Update existing user's tokens
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          providerId: spotifyUser.id,
          musicProvider: 'spotify' // Update provider in case it changed
        }
      })
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Redirect to frontend with token and user data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperUser: user.isSuperUser,
      musicProvider: user.musicProvider
    }
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const redirectUrl = `${frontendUrl}/auth/spotify/callback?token=${encodeURIComponent(jwtToken)}&user=${encodeURIComponent(JSON.stringify(userData))}`
    
    console.log('Redirecting to:', redirectUrl)
    res.redirect(redirectUrl)
  } catch (error) {
    console.error('Spotify callback error:', error)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    res.redirect(`${frontendUrl}/auth?error=Error authenticating with Spotify`)
  }
})

router.get('/apple', (req, res) => {
  const authUrl = getAppleMusicAuthUrl()
  res.json({ url: authUrl })
})

router.get('/apple/callback', async (req, res) => {
  try {
    const { code } = req.query
    if (!code || typeof code !== 'string') {
      return res.redirect(`${process.env.FRONTEND_URL}/auth?error=Invalid code`)
    }

    const token = await getAppleMusicToken(code)
    const appleUser = await getAppleMusicUser(token.access_token)

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: appleUser.email },
          { providerId: appleUser.id }
        ]
      }
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: appleUser.email,
          name: appleUser.name,
          password: '', // No password for OAuth users
          musicProvider: 'apple',
          providerId: appleUser.id,
          accessToken: token.access_token,
          refreshToken: token.refresh_token
        }
      })
    } else {
      // Update existing user's tokens
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          providerId: appleUser.id,
          musicProvider: 'apple' // Update provider in case it changed
        }
      })
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Redirect to frontend with token
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperUser: user.isSuperUser,
      musicProvider: user.musicProvider
    }
    
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/apple/callback?token=${encodeURIComponent(jwtToken)}&user=${encodeURIComponent(JSON.stringify(userData))}`
    res.redirect(redirectUrl)
  } catch (error) {
    console.error('Apple Music callback error:', error)
    res.redirect(`${process.env.FRONTEND_URL}/auth?error=Error authenticating with Apple Music`)
  }
})

router.get('/youtube', (req, res) => {
  const authUrl = getYouTubeMusicAuthUrl()
  res.json({ url: authUrl })
})

router.get('/youtube/callback', async (req, res) => {
  try {
    const { code } = req.query
    if (!code || typeof code !== 'string') {
      return res.redirect(`${process.env.FRONTEND_URL}/auth?error=Invalid code`)
    }

    const token = await getYouTubeMusicToken(code)
    const youtubeUser = await getYouTubeMusicUser(token.access_token)

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: youtubeUser.email },
          { providerId: youtubeUser.id }
        ]
      }
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: youtubeUser.email,
          name: youtubeUser.name,
          password: '', // No password for OAuth users
          musicProvider: 'youtube',
          providerId: youtubeUser.id,
          accessToken: token.access_token,
          refreshToken: token.refresh_token
        }
      })
    } else {
      // Update existing user's tokens
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          providerId: youtubeUser.id,
          musicProvider: 'youtube' // Update provider in case it changed
        }
      })
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Redirect to frontend with token and user data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperUser: user.isSuperUser,
      musicProvider: user.musicProvider
    }
    
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/youtube/callback?token=${encodeURIComponent(jwtToken)}&user=${encodeURIComponent(JSON.stringify(userData))}`
    res.redirect(redirectUrl)
  } catch (error) {
    console.error('YouTube Music callback error:', error)
    res.redirect(`${process.env.FRONTEND_URL}/auth?error=Error authenticating with YouTube Music`)
  }
})

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, name, password, musicProvider } = registerSchema.parse(req.body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        musicProvider
      }
    })

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSuperUser: user.isSuperUser,
        musicProvider: user.musicProvider
      },
      token
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Error creating user' })
  }
})

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSuperUser: user.isSuperUser,
        musicProvider: user.musicProvider
      },
      token
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Error logging in' })
  }
})

export default router 