import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { google } from 'googleapis';

function getCalendar() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export const addGCalEventTool = createTool({
  id: 'add-gcal-event',
  description: 'Tambah event ke Google Calendar',
  inputSchema: z.object({
    title: z.string().describe('Judul event'),
    date: z.string().describe('Tanggal format YYYY-MM-DD'),
    time: z.string().optional().describe('Jam format HH:MM, default 09:00'),
    duration: z.number().optional().describe('Durasi dalam menit, default 60'),
    description: z.string().optional().describe('Deskripsi event'),
  }),
  execute: async (params) => {
    try {
      const calendar = getCalendar();
      const startTime = params.time || '09:00';
      const duration = params.duration || 60;

      const startDateTime = new Date(`${params.date}T${startTime}:00+07:00`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

      const event = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: params.title,
          description: params.description || '',
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'Asia/Jakarta',
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'Asia/Jakarta',
          },
        },
      });

      return {
        success: true,
        message: `📅 Event "${params.title}" ditambahkan ke Google Calendar!\n🕐 ${params.date} jam ${startTime} WIB`,
        eventId: event.data.id,
      };
    } catch (err) {
      return { success: false, message: `❌ Gagal tambah event: ${err}` };
    }
  },
});

export const listGCalEventsTool = createTool({
  id: 'list-gcal-events',
  description: 'Tampilkan event Google Calendar yang akan datang',
  inputSchema: z.object({
    days: z.number().optional().describe('Berapa hari ke depan, default 7'),
  }),
  execute: async (params) => {
    try {
      const calendar = getCalendar();
      const days = params.days || 7;

      const now = new Date();
      const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: future.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 10,
      });

      const events = res.data.items || [];
      if (events.length === 0) {
        return { message: `📅 Tidak ada event dalam ${days} hari ke depan.` };
      }

      const list = events.map(e => {
        const start = e.start?.dateTime || e.start?.date || '';
        const date = new Date(start).toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        return `📌 ${e.summary}\n   🕐 ${date}`;
      }).join('\n\n');

      return { message: `📅 *Event ${days} hari ke depan:*\n\n${list}` };
    } catch (err) {
      return { success: false, message: `❌ Gagal ambil events: ${err}` };
    }
  },
});