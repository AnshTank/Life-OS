import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('API Seeding started...');

    // Clear existing
    await prisma.journalEntry.deleteMany({});
    await prisma.journalBook.deleteMany({});

    // Create Books
    const book1 = await prisma.journalBook.create({
      data: {
        name: 'My Journal',
        ownerName: 'Ansh',
        bookType: 'journal',
        color: '#7a9eb8',
        purpose: 'My personal growth journal — capturing thoughts, dreams, and daily reflections.',
        startedAt: new Date('2026-01-15'),
        chapters: [],
      },
    });

    const book2 = await prisma.journalBook.create({
      data: {
        name: 'Work Notes',
        ownerName: 'Ansh',
        bookType: 'notebook',
        color: '#b87a7a',
        purpose: 'Professional insights, meeting notes, and career development tracking.',
        startedAt: new Date('2026-02-01'),
        chapters: ['Sprint Planning', 'Ideas', 'Retros', 'Learnings'],
      },
    });

    // Create Entries — 10 entries with varied moods, spread across Feb 2026
    const entries = [
      {
        userId: 'user-1',
        bookId: book1.id,
        title: 'February Reset',
        content: "New month, new energy. January was a blur — too much planning, not enough doing. This month I'm going all in on execution.\n\nSet up my workspace with a new monitor stand and cleaned everything out. Made a list of 3 key goals:\n1. Ship the journal feature\n2. Read 2 books\n3. Run 3x a week\n\nLet's see how this goes.",
        mood: 'great',
        tags: ['goals', 'fresh-start', 'february'],
        date: new Date('2026-02-01T09:30:00'),
      },
      {
        userId: 'user-1',
        bookId: book1.id,
        title: "Couldn't Sleep",
        content: "Brain wouldn't shut off last night. Kept thinking about the project deadline and whether I'm on track. Wrote down everything on my mind at 2am and somehow that helped.\n\nNote: anxiety is just excitement without breath. Need to remember that.",
        mood: 'bad',
        tags: ['anxiety', 'sleep', 'reflection'],
        date: new Date('2026-02-04T02:15:00'),
      },
      {
        userId: 'user-1',
        bookId: book2.id,
        title: 'Sprint Kickoff — Auth Module',
        content: "Started the new sprint today. We're building the authentication module from scratch.\n\nTech decisions:\n• NextAuth.js for session management\n• MongoDB for user store\n• JWT tokens with 7-day expiry\n\nTeam seems aligned. Should be a productive two weeks.",
        mood: 'good',
        chapter: 'Sprint Planning',
        tags: ['work', 'sprint', 'auth', 'planning'],
        date: new Date('2026-02-05T10:00:00'),
      },
      {
        userId: 'user-1',
        bookId: book1.id,
        title: 'Rainy Day Vibes',
        content: "It rained all day. Stayed in with chai and finished \"The Almanack of Naval Ravikant\". Some lines hit hard:\n\n\"Desire is a contract you make with yourself to be unhappy until you get what you want.\"\n\nI think I need to want less and appreciate more. The rain actually felt peaceful for once.",
        mood: 'okay',
        tags: ['reading', 'rain', 'philosophy', 'calm'],
        date: new Date('2026-02-08T16:00:00'),
      },
      {
        userId: 'user-1',
        bookId: book1.id,
        title: 'Best Run in Months',
        content: "Did a 5K this morning and hit my best time — 24:32! The cool February air made everything easier. Runner's high is real.\n\nAlso tried the new trail near the lake. Beautiful views at sunrise. Going to make this my regular route.\n\nBody feels great. Mind feels clearer. This is why I run.",
        mood: 'great',
        tags: ['running', 'fitness', 'personal-best', 'morning'],
        date: new Date('2026-02-10T07:00:00'),
      },
      {
        userId: 'user-1',
        bookId: book2.id,
        title: 'Code Review Frustrations',
        content: "Spent 4 hours on code reviews today. Half the PRs had no description and sloppy variable names. I don't want to be the \"nitpicky\" reviewer but quality matters.\n\nGoing to propose a PR template tomorrow. At minimum: description, screenshots for UI changes, and test coverage notes.\n\nAlso: need to stop taking bad code personally. It's not about me.",
        mood: 'bad',
        chapter: 'Retros',
        tags: ['work', 'code-review', 'frustration', 'process'],
        date: new Date('2026-02-12T18:30:00'),
      },
      {
        userId: 'user-1',
        bookId: book1.id,
        title: "Valentine's Day Reflections",
        content: "Not a traditional Valentine's Day — spent it with close friends instead. We cooked pasta together and played board games till midnight.\n\nRealized something: love isn't just romantic. The people who show up for you, who laugh with you, who check in on random Tuesdays — that's love too.\n\nGrateful for my circle.",
        mood: 'great',
        tags: ['valentines', 'friendship', 'gratitude', 'love'],
        date: new Date('2026-02-14T23:00:00'),
      },
      {
        userId: 'user-1',
        bookId: book1.id,
        title: 'Burnout Warning Signs',
        content: "Skipped my morning routine. Skipped the run. Ate junk food. Stared at my screen for an hour doing nothing.\n\nI think I'm approaching burnout. The signs are all there — loss of motivation, irritability, that \"what's the point\" feeling.\n\nAction plan:\n1. Take tomorrow off\n2. No screens after 8pm\n3. Call mom\n4. Sleep 8 hours minimum",
        mood: 'terrible',
        tags: ['burnout', 'mental-health', 'warning', 'self-care'],
        date: new Date('2026-02-17T21:00:00'),
      },
      {
        userId: 'user-1',
        bookId: book2.id,
        title: 'Shipped Auth — Finally!',
        content: "The auth module is LIVE! 🎉 Two weeks of grinding and it's finally deployed.\n\nHighlights:\n• Zero critical bugs in staging\n• Login flow is smooth — under 200ms response time\n• Got a shoutout from the CTO in standup\n\nThis is why we push through the hard days. The shipping feeling never gets old.",
        mood: 'great',
        chapter: 'Learnings',
        tags: ['work', 'shipped', 'achievement', 'celebration'],
        date: new Date('2026-02-20T17:00:00'),
      },
      {
        userId: 'user-1',
        bookId: book1.id,
        title: 'Today — Finding Balance',
        content: "Week has been a rollercoaster. Some days I'm on fire, others I can barely function. I think the key is accepting both.\n\nThings I'm doing right:\n• Journaling consistently\n• Asking for help when stuck\n• Prioritizing sleep over hustle\n\nThings to improve:\n• Social media time (still way too much)\n• Saying no to things that drain me\n• Actually using the meditation app I'm paying for\n\nOverall: I'm growing. It's messy, but it's real.",
        mood: 'good',
        tags: ['balance', 'self-awareness', 'growth', 'honesty'],
        date: new Date('2026-02-24T15:00:00'),
      },
    ];

    for (const entry of entries) {
      await prisma.journalEntry.create({ data: entry });
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      booksCreated: 2,
      entriesCreated: entries.length,
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Seeding failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
