import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';

function calculateStreak(dates: Date[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };
  
  const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());
  const startOfDays = sortedDates.map(d => startOfDay(new Date(d)).getTime());
  const uniqueDays = Array.from(new Set(startOfDays));
  
  const today = startOfDay(new Date()).getTime();
  const yesterday = today - 86400000;
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const diff = uniqueDays[i] - uniqueDays[i + 1];
    if (diff === 86400000) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, uniqueDays.length > 0 ? 1 : 0);
  
  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    currentStreak = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
        const diff = uniqueDays[i] - uniqueDays[i + 1];
        if (diff === 86400000) {
            currentStreak++;
        } else {
            break;
        }
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

// POST /api/habits/[id]/checkin — Add or toggle checkin for a habit
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;
    const body = await req.json();
    const { date, note, value = 1 } = body;
    
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const checkinDate = startOfDay(new Date(date));

    // Verify habit exists
    const habit = await prisma.habit.findFirst({
        where: { id: habitId, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
        include: { checkins: true }
    });

    if (!habit) {
        return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    if (habit.habitType === 'quantifiable') {
      // For quantifiable habits: always add a new check-in with the given value
      await prisma.habitCheckin.create({
        data: {
          habitId,
          date: checkinDate,
          note,
          value: value || 1,
        }
      });
    } else {
      // For boolean habits: toggle on/off
      const existingCheckin = habit.checkins.find(
        c => startOfDay(new Date(c.date)).getTime() === checkinDate.getTime()
      );

      if (existingCheckin) {
        await prisma.habitCheckin.delete({
          where: { id: existingCheckin.id }
        });
      } else {
        await prisma.habitCheckin.create({
          data: {
            habitId,
            date: checkinDate,
            note,
            value: 1,
          }
        });
      }
    }

    // Re-fetch checkins to recalculate streaks
    // For quantifiable habits, a day "counts" only if total value >= targetValue
    const allCheckins = await prisma.habitCheckin.findMany({
        where: { habitId },
        select: { date: true, value: true }
    });

    let completedDates: Date[];

    if (habit.habitType === 'quantifiable' && habit.targetValue) {
      // Group check-ins by day and sum values
      const dayMap = new Map<number, number>();
      for (const c of allCheckins) {
        const dayKey = startOfDay(new Date(c.date)).getTime();
        dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + (c.value || 1));
      }
      // Only days where sum >= targetValue count as completed
      completedDates = [];
      Array.from(dayMap.entries()).forEach(([dayKey, total]) => {
        if (total >= habit.targetValue!) {
          completedDates.push(new Date(dayKey));
        }
      });
    } else {
      completedDates = allCheckins.map(c => c.date);
    }

    const { current, longest } = calculateStreak(completedDates);

    // Update habit with new streaks
    const updatedHabit = await prisma.habit.update({
        where: { id: habitId },
        data: {
            streak: current,
            longestStreak: Math.max(habit.longestStreak, longest)
        },
        include: {
            checkins: {
                orderBy: { date: 'desc' }
            }
        }
    });

    return NextResponse.json(updatedHabit);
  } catch (error) {
    console.error('Failed to toggle habit checkin:', error);
    return NextResponse.json({ error: 'Failed to toggle habit checkin' }, { status: 500 });
  }
}

// DELETE /api/habits/[id]/checkin — Remove a specific check-in by checkinId
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;
    const { searchParams } = new URL(req.url);
    const checkinId = searchParams.get('checkinId');

    if (!checkinId) {
      return NextResponse.json({ error: 'checkinId is required' }, { status: 400 });
    }

    const habit = await prisma.habit.findFirst({
      where: { id: habitId, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    await prisma.habitCheckin.delete({
      where: { id: checkinId }
    });

    // Recalculate streaks
    const allCheckins = await prisma.habitCheckin.findMany({
      where: { habitId },
      select: { date: true, value: true }
    });

    let completedDates: Date[];

    if (habit.habitType === 'quantifiable' && habit.targetValue) {
      const dayMap = new Map<number, number>();
      for (const c of allCheckins) {
        const dayKey = startOfDay(new Date(c.date)).getTime();
        dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + (c.value || 1));
      }
      completedDates = [];
      Array.from(dayMap.entries()).forEach(([dayKey, total]) => {
        if (total >= habit.targetValue!) {
          completedDates.push(new Date(dayKey));
        }
      });
    } else {
      completedDates = allCheckins.map(c => c.date);
    }

    const { current, longest } = calculateStreak(completedDates);

    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        streak: current,
        longestStreak: Math.max(habit.longestStreak, longest)
      },
      include: {
        checkins: { orderBy: { date: 'desc' } }
      }
    });

    return NextResponse.json(updatedHabit);
  } catch (error) {
    console.error('Failed to delete checkin:', error);
    return NextResponse.json({ error: 'Failed to delete checkin' }, { status: 500 });
  }
}
