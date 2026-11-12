import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'buildbond.db');

export const db = createClient({ url: `file:${dbPath}` });

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      homeowner_email TEXT NOT NULL,
      contractor_email TEXT NOT NULL,
      total_amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'draft',
      paypal_order_id TEXT,
      paypal_auth_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      sequence_num INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      photo_path TEXT,
      ai_verdict INTEGER,
      ai_confidence REAL,
      ai_reasoning TEXT,
      submitted_at TEXT,
      paid_at TEXT,
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    )
  `);
}
