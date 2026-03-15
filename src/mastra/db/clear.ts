import Database from 'better-sqlite3';

const db = new Database('./mastra.db');
db.prepare('DELETE FROM todos').run();
db.prepare('DELETE FROM expenses').run();
db.prepare('DELETE FROM ideas').run();
db.prepare('DELETE FROM deadlines').run();
console.log('✅ Database cleared!');