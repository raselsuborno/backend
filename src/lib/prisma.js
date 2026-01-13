import { PrismaClient } from '@prisma/client';

// Use globalThis for Vercel serverless (works in both Node.js and Edge)
const globalForPrisma = globalThis;

let prisma = globalForPrisma.prisma;

if (!prisma) {
  try {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['warn', 'error'] 
        : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Cache Prisma client in global scope to avoid multiple instances
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma;
    }
  } catch (error) {
    console.error('[Prisma] Failed to initialize Prisma Client:', error.message);
    prisma = null;
  }
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

export default prisma;

