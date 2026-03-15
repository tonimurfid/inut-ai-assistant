import 'dotenv/config';
import cron from 'node-cron';
import Database from 'better-sqlite3';
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';

const db = new Database('./mastra.db');
const ALLOWED_NUMBER = process.env.ALLOWED_WA_NUMBER!;

async function sendReminder(sock: any, message: string) {
  await sock.sendMessage(`${ALLOWED_NUMBER}@s.whatsapp.net`, { text: message });
}

async function startReminder() {
  const { state, saveCreds } = await useMultiFileAuthState('./wa-session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({ version, auth: state, printQRInTerminal: false });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection }: any) => {
    if (connection === 'open') console.log('✅ Reminder worker connected!');
  });

  // Cron tiap 1 jam
  cron.schedule('0 * * * *', async () => {
    console.log('🔔 Checking deadlines...');

    const now = new Date();

    const deadlines = db.prepare(`
      SELECT * FROM deadlines
      WHERE due_date >= datetime('now')
      ORDER BY due_date ASC
    `).all() as any[];

    for (const d of deadlines) {
      const due = new Date(d.due_date);
      const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

      // H-72 (3 hari)
      if (diffHours <= 72 && diffHours > 71 && !d.reminded_h3) {
        await sendReminder(sock,
          `⏰ *Reminder Inut* 🐱\n\n"${d.title}" deadline dalam *3 hari* (${d.due_date})\n\nJangan lupa ya Ton! 👀`
        );
        db.prepare('UPDATE deadlines SET reminded_h3 = 1 WHERE id = ?').run(d.id);
      }

      // H-24 (1 hari)
      if (diffHours <= 24 && diffHours > 23 && !d.reminded_h1) {
        await sendReminder(sock,
          `⚠️ *Reminder Inut* 🐱\n\n"${d.title}" deadline *BESOK* (${d.due_date})\n\nUdah mulai belum Ton? 😬`
        );
        db.prepare('UPDATE deadlines SET reminded_h1 = 1 WHERE id = ?').run(d.id);
      }

      // H-0 (hari ini, < 3 jam)
      if (diffHours <= 3 && diffHours > 0 && !d.reminded_h0) {
        await sendReminder(sock,
          `🚨 *URGENT - Reminder Inut* 🐱\n\n"${d.title}" deadline dalam *${Math.round(diffHours)} jam lagi!*\n\nGAS TON! 🔥`
        );
        db.prepare('UPDATE deadlines SET reminded_h0 = 1 WHERE id = ?').run(d.id);
      }
    }
  });

  // Weekly summary — setiap Minggu jam 8 malam
  cron.schedule('0 20 * * 0', async () => {
    console.log('📊 Sending weekly summary...');

    const expenses = db.prepare(`
      SELECT category, SUM(amount) as total
      FROM expenses
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY category ORDER BY total DESC
    `).all() as any[];

    const todos = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
      FROM todos
      WHERE created_at >= datetime('now', '-7 days')
    `).get() as any;

    const ideas = db.prepare(`
      SELECT COUNT(*) as total FROM ideas
      WHERE created_at >= datetime('now', '-7 days')
    `).get() as any;

    const deadlines = db.prepare(`
      SELECT COUNT(*) as total FROM deadlines
      WHERE due_date >= datetime('now')
    `).get() as any;

    const totalExpense = expenses.reduce((sum: number, r: any) => sum + r.total, 0);
    const expenseBreakdown = expenses.length
      ? expenses.map((r: any) => `• ${r.category}: Rp ${r.total.toLocaleString('id-ID')}`).join('\n')
      : '• Tidak ada pengeluaran';

    const summary = `
📊 *Weekly Summary* 🐱

💸 *Pengeluaran minggu ini:*
${expenseBreakdown}
Total: Rp ${totalExpense.toLocaleString('id-ID')}

✅ *Todos:* ${todos.done}/${todos.total} selesai
💡 *Ide tersimpan:* ${ideas.total}
⏰ *Deadline upcoming:* ${deadlines.total}

Semangat minggu depannya Ton! 🚀
    `.trim();

    await sendReminder(sock, summary);
  });

  console.log('🔔 Reminder worker started!');
}

startReminder();