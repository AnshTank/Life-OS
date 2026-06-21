import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // 2. Create the user (plain text password to match credentials provider config)
    const user = await prisma.user.create({
      data: {
        name: name || 'Explorer',
        email: email.toLowerCase(),
        password,
      },
    });

    // 3. Seed default starting data for the new user
    console.log(`Seeding starting data for registered user: ${user.email}`);

    // A. Seed Journal Book
    const defaultBook = await prisma.journalBook.create({
      data: {
        name: 'My Journal',
        ownerName: user.name || 'Explorer',
        purpose: 'My personal growth journal — capturing thoughts, dreams, and daily reflections.',
        startedAt: new Date(),
        chapters: ['Reflections', 'Ideas', 'Daily Log'],
        color: '#7a9eb8',
        bookType: 'journal',
      },
    });

    // B. Seed welcome entry
    await prisma.journalEntry.create({
      data: {
        userId: user.id,
        bookId: defaultBook.id,
        title: 'Welcome to Life OS! 🌟',
        content: `Welcome, ${user.name || 'friend'}!\n\nThis is your personal Life OS journal. Here, you can capture your daily thoughts, track your progress, build life-changing habits, and outline your goals.\n\nHere are some tips to get you started:\n1. Complete your first habit checklist\n2. Add a goal for this month\n3. Create a project under the Projects tab to build something cool!\n\nHave a great journey!`,
        mood: 'great',
        chapter: 'Reflections',
        tags: ['welcome', 'life-os'],
        date: new Date(),
      },
    });

    // C. Seed starter tasks
    await prisma.task.createMany({
      data: [
        {
          userId: user.id,
          title: 'Explore the Life OS Dashboard',
          description: 'Check out focus tasks, active projects, Net Savings, and more.',
          lifeArea: 'personal',
          impact: 5,
          urgency: 4,
          effort: 2,
          priorityScore: 5.2,
          status: 'todo',
          tags: ['onboarding'],
        },
        {
          userId: user.id,
          title: 'Create your first goal',
          description: 'Go to the Goals page and outline a personal or professional milestone.',
          lifeArea: 'career',
          impact: 6,
          urgency: 5,
          effort: 3,
          priorityScore: 5.8,
          status: 'todo',
          tags: ['onboarding'],
        },
      ],
    });

    // D. Seed starter habit
    await prisma.habit.create({
      data: {
        userId: user.id,
        title: 'Write a Journal Entry',
        description: 'Capture your thoughts daily.',
        lifeArea: 'health',
        frequency: 'daily',
        targetDays: 7,
        streak: 0,
        longestStreak: 0,
        color: '#8ab896',
        icon: 'book',
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration failed:', error);
    return NextResponse.json({ error: error.message || 'Internal server error during registration' }, { status: 500 });
  }
}
