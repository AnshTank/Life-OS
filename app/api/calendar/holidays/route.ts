import { NextResponse } from 'next/server';
import { getHolidayEvents } from '@/lib/googleCalendar';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), 0, 1);
    const defaultEnd = new Date(now.getFullYear(), 11, 31);

    const timeMin = startParam ? new Date(startParam) : defaultStart;
    const timeMax = endParam ? new Date(endParam) : defaultEnd;

    const holidays = await getHolidayEvents(timeMin, timeMax);

    const mappedHolidays = holidays.map((ev: any) => ({
      id: `holiday-${ev.id}`,
      title: ev.summary || 'Holiday',
      description: ev.description || '',
      date: ev.start?.date || ev.start?.dateTime,
      type: 'holiday',
      color: '#e8a87c',
      completed: false,
      time: undefined,
      endTime: undefined,
      lifeArea: undefined,
      source: 'holiday',
    }));

    return NextResponse.json({ holidays: mappedHolidays });
  } catch (error: any) {
    console.error('Holidays API Error:', error);
    return NextResponse.json({ holidays: [] });
  }
}
