import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createMockEvent() {
  try {
    // First, create a super user if it doesn't exist
    const superUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'admin123', // You should hash this in production
        isSuperUser: true,
        musicProvider: 'spotify'
      }
    })

    // Create a mock event
    const event = await prisma.event.create({
      data: {
        name: 'Summer Music Festival 2024',
        description: 'Join us for an amazing summer music festival with the best artists from around the world!',
        theme: 'Summer Vibes',
        isPublic: true,
        creatorId: superUser.id
      }
    })

    console.log('Mock event created:', event)
  } catch (error) {
    console.error('Error creating mock event:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMockEvent() 