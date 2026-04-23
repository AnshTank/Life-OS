import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing items
  await prisma.journalEntry.deleteMany({});
  await prisma.journalBook.deleteMany({});

  // Create Journal Books
  const book1 = await prisma.journalBook.create({
    data: {
      name: 'My Journal',
      ownerName: 'Alex',
      purpose: 'My personal growth journal — capturing thoughts, dreams, and daily reflections.',
      startedAt: new Date('2025-01-01'),
      chapters: ['New Beginnings', 'Building Momentum', 'Reflections'],
    },
  });

  const book2 = await prisma.journalBook.create({
    data: {
      name: 'Work Notes',
      ownerName: 'Alex',
      purpose: 'Professional insights, meeting notes, and career development tracking.',
      startedAt: new Date('2025-02-01'),
      chapters: ['Sprint Planning', 'Ideas', 'Retros'],
    },
  });

  console.log(`Created books: ${book1.name}, ${book2.name}`);

  // Create Journal Entries
  const entries = [
    {
      userId: 'user-1',
      bookId: book1.id,
      title: 'A Fresh Start',
      content: "Today feels like the start of something meaningful. I've decided to commit to journaling every day. There's something powerful about putting pen to paper — it makes thoughts feel real, tangible.\n\nI spent the morning reorganizing my workspace. A clean desk really does lead to a clearer mind. Made a list of goals for this quarter and I'm feeling optimistic.\n\nNote to self: don't overthink things. Just start.",
      mood: 'great',
      chapter: 'New Beginnings',
      tags: ['motivation', 'fresh-start'],
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userId: 'user-1',
      bookId: book1.id,
      title: 'Productive Day at Work',
      content: 'Had an incredibly productive day. Shipped the new feature module and got positive feedback from the team. Sometimes the best days are the ones where you just get into flow and everything clicks.\n\nAlso had a great conversation with my mentor about career growth. Key takeaway: focus on depth over breadth.',
      mood: 'good',
      chapter: 'Building Momentum',
      tags: ['work', 'productivity'],
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: 'user-1',
      bookId: book1.id,
      title: 'Book Recommendations',
      content: '• "Atomic Habits" by James Clear — re-read chapter on habit stacking\n• "Deep Work" by Cal Newport — apply time-blocking technique\n• "The Almanack of Naval Ravikant" — started this week\n• "Show Your Work" by Austin Kleon — for creative inspiration',
      mood: 'good',
      tags: ['books', 'reading-list'],
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: 'user-1',
      bookId: book1.id,
      title: 'Weekend Reflections',
      content: "Spent the morning meditating and then went for a long walk in the park. The weather was perfect — sunny with a cool breeze. It's amazing how much clarity comes from just being present.\n\nI've been thinking about what matters most to me. Health, meaningful work, and relationships with people I love. Everything else is noise.\n\nGratitude list for today:\n1. Good health\n2. Supportive family\n3. The ability to learn and grow every day",
      mood: 'great',
      chapter: 'Reflections',
      tags: ['gratitude', 'mindfulness', 'weekend'],
      date: new Date(),
    },
    {
      userId: 'user-1',
      bookId: book2.id,
      title: 'Sprint 14 Retrospective',
      content: 'What went well:\n• Shipped auth module ahead of schedule\n• Great pair programming session with Dev\n\nWhat to improve:\n• Code reviews took too long — set 24h SLA\n• Need better test coverage for edge cases',
      mood: 'good',
      chapter: 'Retros',
      tags: ['work', 'sprint', 'retro'],
      date: new Date(),
    }
  ];

  for (const entry of entries) {
    await prisma.journalEntry.create({
      data: entry
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
