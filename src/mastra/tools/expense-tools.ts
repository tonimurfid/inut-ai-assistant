import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import Database from 'better-sqlite3';

const db = new Database('./mastra.db');

export const addExpenseTool = createTool({
  id: 'add-expense',
  description: 'Catat pengeluaran baru',
  inputSchema: z.object({
    amount: z.number().describe('Jumlah dalam rupiah'),
    category: z.enum(['food', 'transport', 'shopping', 'health', 'other']),
    note: z.string().optional(),
  }),
  execute: async (params) => {
    db.prepare('INSERT INTO expenses (amount, category, note) VALUES (?, ?, ?)')
      .run(params.amount, params.category, params.note ?? '');
    return {
      success: true,
      message: `💸 Dicatat: Rp ${params.amount.toLocaleString('id-ID')} (${params.category})`
    };
  },
});

export const expenseSummaryTool = createTool({
  id: 'expense-summary',
  description: 'Ringkasan pengeluaran minggu ini',
  inputSchema: z.object({}),
  execute: async () => {
    const rows = db.prepare(`
      SELECT category, SUM(amount) as total
      FROM expenses
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY category
      ORDER BY total DESC
    `).all() as any[];

    if (rows.length === 0) return { message: '📊 Belum ada pengeluaran minggu ini.' };

    const totalAll = rows.reduce((sum: number, r: any) => sum + r.total, 0);
    const breakdown = rows.map((r: any) =>
      `• ${r.category}: Rp ${r.total.toLocaleString('id-ID')}`
    ).join('\n');

    return {
      message: `📊 Pengeluaran minggu ini:\n${breakdown}\n\nTotal: Rp ${totalAll.toLocaleString('id-ID')}`
    };
  },
});