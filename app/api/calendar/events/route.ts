import { NextResponse } from 'next/server';
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/googleCalendar';

// ── GET: fetch events ──
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const timeMin = startParam ? new Date(startParam) : defaultStart;
    const timeMax = endParam ? new Date(endParam) : defaultEnd;

    const events = await getCalendarEvents(timeMin, timeMax);

    const mappedEvents = events.map((ev: any) => ({
      id: ev.id,
      googleId: ev.id,
      title: ev.summary || 'Untitled Event',
      description: ev.description || '',
      date: ev.start?.dateTime || ev.start?.date,
      type: 'meeting',
      color: '#d49191',
      completed: false,
      time: ev.start?.dateTime
        ? new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        : undefined,
      endTime: ev.end?.dateTime
        ? new Date(ev.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        : undefined,
      lifeArea: 'career',
      source: 'google',
    }));

    return NextResponse.json({ events: mappedEvents });
  } catch (error: any) {
    console.error('API GET Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ── POST: create event ──
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, start, end } = body;

    if (!title || !start || !end) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const googleEvent = await createCalendarEvent({
      summary: title,
      description: description || '',
      start: { dateTime: start },
      end: { dateTime: end },
    });

    return NextResponse.json({ success: true, event: googleEvent });
  } catch (error: any) {
    console.error('API POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ── PUT: update event ──
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { eventId, title, description, start, end } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const updatePayload: any = {};
    if (title !== undefined) updatePayload.summary = title;
    if (description !== undefined) updatePayload.description = description;
    if (start) updatePayload.start = { dateTime: start };
    if (end) updatePayload.end = { dateTime: end };

    const updated = await updateCalendarEvent(eventId, updatePayload);
    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    console.error('API PUT Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ── DELETE: remove event ──
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    await deleteCalendarEvent(eventId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
