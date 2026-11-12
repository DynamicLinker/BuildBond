import { db, initDb } from './db.js';
import { randomUUID } from 'crypto';

initDb();

// Clear existing seed data
db.prepare("DELETE FROM milestones WHERE job_id IN (SELECT id FROM jobs WHERE homeowner_email = 'homeowner@demo.com')").run();
db.prepare("DELETE FROM jobs WHERE homeowner_email = 'homeowner@demo.com'").run();

// --- Job 1: Kitchen Renovation ---
const job1Id = randomUUID();

db.prepare(`
  INSERT INTO jobs (id, title, description, homeowner_email, contractor_email, total_amount, currency, status, paypal_order_id, paypal_auth_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  job1Id,
  'Kitchen Renovation',
  'Full kitchen renovation including cabinet removal, new cabinet installation, and countertop replacement.',
  'homeowner@demo.com',
  'contractor@demo.com',
  4500.00,
  'USD',
  'active',
  'PAYPAL-DEMO-ORDER-001',
  'PAYPAL-DEMO-AUTH-001'
);

const job1Milestones = [
  {
    id: randomUUID(),
    sequence_num: 1,
    title: 'Demo & Prep',
    description: 'Remove old cabinets, prep walls, patch drywall. Area should be clear and ready for installation.',
    amount: 500.00,
    status: 'pending',
  },
  {
    id: randomUUID(),
    sequence_num: 2,
    title: 'Cabinet Installation',
    description: 'All new cabinets installed, level, and secured. Doors attached and opening properly.',
    amount: 2000.00,
    status: 'pending',
  },
  {
    id: randomUUID(),
    sequence_num: 3,
    title: 'Countertop & Finishing',
    description: 'Countertops installed, sealed. Backsplash complete. Final cleanup done.',
    amount: 2000.00,
    status: 'pending',
  },
];

const insertMilestone = db.prepare(`
  INSERT INTO milestones (id, job_id, sequence_num, title, description, amount, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const m of job1Milestones) {
  insertMilestone.run(m.id, job1Id, m.sequence_num, m.title, m.description, m.amount, m.status);
}

// --- Job 2: Bathroom Remodel ---
const job2Id = randomUUID();

db.prepare(`
  INSERT INTO jobs (id, title, description, homeowner_email, contractor_email, total_amount, currency, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  job2Id,
  'Bathroom Remodel',
  'Master bathroom remodel: new tile, vanity, fixtures, and shower enclosure.',
  'homeowner@demo.com',
  'contractor@demo.com',
  2800.00,
  'USD',
  'draft'
);

const job2Milestones = [
  {
    id: randomUUID(),
    sequence_num: 1,
    title: 'Demolition & Rough-In',
    description: 'Remove old tile, vanity, and fixtures. Complete rough-in plumbing and electrical inspected and ready.',
    amount: 1200.00,
    status: 'pending',
  },
  {
    id: randomUUID(),
    sequence_num: 2,
    title: 'Tile, Fixtures & Final Finish',
    description: 'All tile installed and grouted. New vanity, toilet, and shower fixtures installed. Final walkthrough clean.',
    amount: 1600.00,
    status: 'pending',
  },
];

for (const m of job2Milestones) {
  insertMilestone.run(m.id, job2Id, m.sequence_num, m.title, m.description, m.amount, m.status);
}

console.log('Seed data created!');
console.log(`  Job 1 (active):  ${job1Id} — Kitchen Renovation ($4,500)`);
console.log(`  Job 2 (draft):   ${job2Id} — Bathroom Remodel ($2,800)`);
