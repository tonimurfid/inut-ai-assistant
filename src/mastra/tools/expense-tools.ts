import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import Database from 'better-sqlite3';

const db = new Database('./mastra.db');

const categoryEnum = z.enum([
  'food',
  'personal_maintenance',
  'transport',
  'social',
  'housing',
  'communication',
  'medical',
  'growth',
  'buffer',
  'emergency',
]);

export const addExpenseTool = createTool({
  id: 'add-expense',
  description: 'Catat pengeluaran baru',
  inputSchema: z.object({
    amount: z.number().describe('Jumlah dalam rupiah'),
    category: categoryEnum.describe(`Kategori pengeluaran:
      - food: makan, minum, groceries
      - personal_maintenance: skincare, haircut, laundry, kebersihan diri
      - transport: ojol, bensin, parkir, tiket
      - social: hangout, nongkrong, hadiah, donasi
      - housing: kos, listrik, air, internet rumah
      - communication: pulsa, paket data, langganan HP
      - medical: obat, dokter, vitamin, kesehatan
      - growth: buku, kursus, tools, investasi diri
      - buffer: tabungan, dana darurat rutin
      - emergency: pengeluaran mendadak tak terduga
    `),
    note: z.string().optional().describe('Catatan tambahan'),
  }),
  execute: async (params) => {
    db.prepare('INSERT INTO expenses (amount, category, note) VALUES (?, ?, ?)')
      .run(params.amount, params.category, params.note ?? '');
    return {
      success: true,
      message: `💸 Dicatat: Rp ${params.amount.toLocaleString('id-ID')} (${params.category})`,
    };
  },
});

export const expenseSummaryTool = createTool({
  id: 'expense-summary',
  description: 'Ringkasan pengeluaran minggu ini per kategori',
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
      message: `📊 *Pengeluaran minggu ini:*\n${breakdown}\n\n*Total: Rp ${totalAll.toLocaleString('id-ID')}*`,
    };
  },
});