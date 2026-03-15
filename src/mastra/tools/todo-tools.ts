import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import Database from 'better-sqlite3';

const db = new Database('./mastra.db');

export const addTodoTool = createTool({
  id: 'add-todo',
  description: 'Tambah todo/tugas baru',
  inputSchema: z.object({
    task: z.string().describe('Deskripsi tugas'),
  }),
  execute: async (params) => {
    db.prepare('INSERT INTO todos (task) VALUES (?)').run(params.task);
    return { success: true, message: `✅ Todo ditambahkan: "${params.task}"` };
  },
});

export const completeTodoTool = createTool({
  id: 'complete-todo',
  description: 'Tandai todo sebagai selesai',
  inputSchema: z.object({
    id: z.number().describe('ID todo yang selesai'),
  }),
  execute: async (params) => {
    db.prepare('UPDATE todos SET status = ? WHERE id = ?').run('done', params.id);
    return { success: true, message: `✅ Todo #${params.id} selesai!` };
  },
});

export const listTodoTool = createTool({
  id: 'list-todos',
  description: 'Tampilkan semua todo yang masih pending',
  inputSchema: z.object({}),
  execute: async () => {
    const todos = db.prepare(
      'SELECT * FROM todos WHERE status = ? ORDER BY created_at DESC'
    ).all('pending') as any[];

    if (todos.length === 0) return { message: '🎉 Tidak ada todo pending!' };
    const list = todos.map(t => `#${(t as any).id} ${(t as any).task}`).join('\n');
    return { message: `📋 Todo kamu:\n${list}` };
  },
});