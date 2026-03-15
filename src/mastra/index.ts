import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { lifeAgent } from './agents/life-agent';
import Database from 'better-sqlite3';
import { SCHEMA } from './db/schema';

// Init database tables
const db = new Database('./mastra.db');
db.exec(SCHEMA);

export const mastra = new Mastra({
  agents: { lifeAgent },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: "file:./mastra.db",
  }),
  logger: new PinoLogger({
    name: 'Inut',
    level: 'info',
  }),
});