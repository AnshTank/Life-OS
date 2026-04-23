const { PrismaClient } = require('@prisma/client');

async function test() {
  console.log('Testing Prisma connection...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Engine Type:', process.env.PRISMA_CLIENT_ENGINE_TYPE);
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    await prisma.$connect();
    console.log('Connected successfully!');
    const booksCount = await prisma.journalBook.count();
    console.log('Books count:', booksCount);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
