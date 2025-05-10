import { Request as ExpressRequest } from 'express'
import { User } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
        name: string
        isSuperUser: boolean
        musicProvider?: string
      }
    }
  }
} 