import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  try {
    const books = await prisma.journalBook.count();
    const entries = await prisma.journalEntry.count();
    console.log(`DATABASE_CHECK: Books=${books}, Entries=${entries}`);
  } catch (err) {
    console.error(`DATABASE_CHECK_ERROR: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await prisma.$disconnect();
  }
}

check();
