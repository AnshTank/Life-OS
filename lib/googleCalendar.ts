import { google } from 'googleapis';
import { auth } from '@/auth';

// ── Helper: get an authenticated OAuth2 client ──
async function getAuthClient() {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    throw new Error('Not authenticated with Google');
  }

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oAuth2Client.setCredentials({
    access_token: (session as any).accessToken,
    refresh_token: (session as any).refreshToken,
  });

  return oAuth2Client;
}

// ── READ: list events from primary calendar ──
export async function getCalendarEvents(timeMin: Date, timeMax: Date) {
  try {
    const authClient = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return res.data.items || [];
  } catch (error) {
    console.log('Skipping Google Calendar Event Sync (Demo Account or Unauthenticated)');
    return [];
  }
}

export async function getHolidayEvents(timeMin: Date, timeMax: Date) {
  try {
    const authClient = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const holidayCalendarId = 'en.indian#holiday@group.v.calendar.google.com';
    const res = await calendar.events.list({
      calendarId: holidayCalendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return res.data.items || [];
  } catch (error) {
    console.log('Skipping Google Holiday Sync (Demo Account or Unauthenticated)');
    return [];
  }
}

export async function createCalendarEvent(event: {
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}) {
  try {
    const authClient = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    return res.data;
  } catch (error) {
    console.log('Skipping Google Event Create (Unauthenticated)');
    return null;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
  }
) {
  try {
    const authClient = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const res = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: event,
    });
    return res.data;
  } catch (error) {
    console.log('Skipping Google Event Update (Unauthenticated)');
    return null;
  }
}

export async function deleteCalendarEvent(eventId: string) {
  try {
    const authClient = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    return { success: true };
  } catch (error) {
    console.log('Skipping Google Event Delete (Unauthenticated)');
    return { success: false };
  }
}
