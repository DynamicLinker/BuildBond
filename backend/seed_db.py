import sqlite3
import os

db_path = "/home/chadpenguin/Projects/Brainstorm/buildbond/backend/buildbond.db"
con = sqlite3.connect(db_path)
cur = con.cursor()

# Ensure tables exist
cur.execute("""
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
""")

cur.execute("""
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
""")

# Clear old entries
cur.execute("DELETE FROM milestones")
cur.execute("DELETE FROM jobs")

job1_id = "job-kitchen-101"
cur.execute("""
INSERT INTO jobs (id, title, description, homeowner_email, contractor_email, total_amount, currency, status, paypal_order_id, paypal_auth_id)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    job1_id,
    "Modern Kitchen Renovation & Custom Cabinetry",
    "Complete kitchen overhaul: removal of old cabinetry, installation of custom solid oak cabinets, and fitting quartz countertops.",
    "aj@buildbond.dev",
    "mike.builders@contractor.com",
    4500.0,
    "USD",
    "active",
    "ORDER-PP-839210928",
    "AUTH-PP-981240182"
))

milestones = [
    ("m-1", job1_id, 1, "Demolition & Drywall Prep", "Strip existing fixtures, level walls, and inspect electrical rough-in.", 500.0, "paid", 1, 0.94, "Demo complete, walls prepped and clear of debris.", "2026-11-10 14:00:00", "2026-11-10 14:05:00"),
    ("m-2", job1_id, 2, "Cabinet Installation & Alignment", "Install upper and lower custom oak cabinets, level and secure.", 2000.0, "pending", None, None, None, None, None),
    ("m-3", job1_id, 3, "Quartz Countertop & Backsplash", "Cut and fit quartz countertop slabs, seal edges, and finish tile backsplash.", 2000.0, "pending", None, None, None, None, None)
]

for m in milestones:
    cur.execute("""
    INSERT INTO milestones (id, job_id, sequence_num, title, description, amount, status, ai_verdict, ai_confidence, ai_reasoning, submitted_at, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11]))

con.commit()
con.close()
print("Database seeded with job-kitchen-101 and 3 milestones successfully!")
