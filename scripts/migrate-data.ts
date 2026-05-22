import { PrismaClient } from '@prisma/client';
import { 
  mockInvestments, mockTransactions, mockBudgets, 
  mockEMIs, mockSIPs, mockProjects, mockTasks,
  mockGoals, mockHabits, mockJournalEntries, mockJournalBooks
} from '../data/mockData';

const prisma = new PrismaClient();

async function main() {
  const email = 'anshtank9@gmail.com';
  const password = 'abc@123';
  const name = 'Ansh Tank';

  console.log(`Starting comprehensive migration for user: ${email}`);

  // 1. Create or update the user
  const user = await prisma.user.upsert({
    where: { email },
    update: { password },
    create: {
      email,
      password,
      name,
    },
  });

  const newUserId = user.id;
  const oldUserId = 'user-1';

  console.log(`User created/found with ID: ${newUserId}`);

  // 2. Update existing data in the database
  console.log('Updating existing data in DB...');

  const collections = ['task', 'goal', 'habit', 'journalEntry', 'project'];
  for (const col of collections) {
    const result = await (prisma as any)[col].updateMany({
      where: { userId: oldUserId },
      data: { userId: newUserId },
    });
    console.log(`Updated ${result.count} ${col}s.`);
  }

  // 3. Seed financial data and projects
  console.log('Seeding data from mocks...');

  const slugify = (text: string) => {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
  };

  const cleanData = (data: any[]) => data.map(({ id, ...rest }) => ({ ...rest, userId: newUserId }));
  
  const cleanProjects = (data: any[]) => data.map(({ id, ...rest }) => ({ 
    ...rest, 
    userId: newUserId,
    slug: slugify(rest.title) + '-' + Math.random().toString(36).substring(2, 7)
  }));

  await prisma.investment.createMany({ data: cleanData(mockInvestments) });
  console.log('Seeded investments.');

  await prisma.transaction.createMany({ data: cleanData(mockTransactions) });
  console.log('Seeded transactions.');

  await prisma.budget.createMany({ data: cleanData(mockBudgets) });
  console.log('Seeded budgets.');

  await prisma.eMI.createMany({ data: cleanData(mockEMIs) });
  console.log('Seeded EMIs.');

  await prisma.sIP.createMany({ data: cleanData(mockSIPs) });
  console.log('Seeded SIPs.');

  await prisma.project.createMany({ data: cleanProjects(mockProjects) });
  console.log('Seeded projects.');

  console.log('Migration and seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
