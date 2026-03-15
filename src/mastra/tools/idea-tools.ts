import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import Database from 'better-sqlite3';

const db = new Database('./mastra.db');

export const addIdeaTool = createTool({
  id: 'add-idea',
  description: 'Simpan ide baru',
  inputSchema: z.object({
    content: z.string().describe('Isi ide'),
    tags: z.string().optional().describe('Tags ide, pisah dengan koma'),
  }),
  execute: async (params) => {
    db.prepare('INSERT INTO ideas (content, tags) VALUES (?, ?)')
      .run(params.content, params.tags ?? '');
    return { success: true, message: `💡 Ide disimpan: "${params.content}"` };
  },
});