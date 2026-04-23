import { PrismaClient } from '@prisma/client';

if (process.env.NODE_ENV !== 'production') {
  const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };
  // Force delete the old one to reload the newly generated models
  delete globalForPrisma.prisma;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
