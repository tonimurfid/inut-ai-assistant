import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import Database from 'better-sqlite3';

const db = new Database('./mastra.db');

export const addDeadlineTool = createTool({
  id: 'add-deadline',
  description: 'Tambah deadline baru',
  inputSchema: z.object({
    title: z.string().describe('Nama deadline/event'),
    due_date: z.string().describe('Tanggal deadline format YYYY-MM-DD HH:MM'),
  }),
  execute: async (params) => {
    db.prepare('INSERT INTO deadlines (title, due_date) VALUES (?, ?)')
      .run(params.title, params.due_date);
    return { success: true, message: `⏰ Deadline: "${params.title}" pada ${params.due_date}` };
  },
});

export const listDeadlineTool = createTool({
  id: 'list-deadlines',
  description: 'Tampilkan semua deadline yang akan datang',
  inputSchema: z.object({}),
  execute: async () => {
    const deadlines = db.prepare(`
      SELECT * FROM deadlines
      WHERE due_date >= datetime('now')
      ORDER BY due_date ASC
    `).all() as any[];

    if (deadlines.length === 0) return { message: '✅ Tidak ada deadline mendatang!' };

    const list = deadlines.map((d: any) =>
      `⏰ ${d.title}\n   📅 ${d.due_date}`
    ).join('\n\n');

    return { message: `📋 Deadline kamu:\n\n${list}` };
  },
});