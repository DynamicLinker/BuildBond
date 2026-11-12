import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { verifyMilestone } from '../ai.js';
import { captureAuthorization } from '../paypal.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/i;
    if (allowed.test(path.extname(file.originalname)) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = express.Router();

function rowToObj(row, columns) {
  const obj = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });
  return obj;
}

// POST /:id/submit — Contractor submits photo for milestone
router.post('/:id/submit', upload.single('photo'), async (req, res) => {
  try {
    const msResult = await db.execute({ sql: 'SELECT * FROM milestones WHERE id = ?', args: [req.params.id] });
    if (!msResult.rows.length) return res.status(404).json({ error: 'Milestone not found' });
    const milestone = rowToObj(msResult.rows[0], msResult.columns);

    if (milestone.status !== 'pending' && milestone.status !== 'rejected') {
      return res.status(400).json({ error: `Milestone is already ${milestone.status}` });
    }
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

    const jobResult = await db.execute({ sql: 'SELECT * FROM jobs WHERE id = ?', args: [milestone.job_id] });
    if (!jobResult.rows.length) return res.status(404).json({ error: 'Job not found' });
    const job = rowToObj(jobResult.rows[0], jobResult.columns);

    const imagePath = req.file.path;
    const { approved, confidence, reasoning } = await verifyMilestone(milestone.title, milestone.description, imagePath);

    let captureResult = null;
    const newStatus = approved ? 'paid' : 'rejected';

    if (approved && job.paypal_auth_id) {
      const allMsResult = await db.execute({ sql: 'SELECT * FROM milestones WHERE job_id = ?', args: [job.id] });
      const allMs = allMsResult.rows.map(r => rowToObj(r, allMsResult.columns));
      const paidCount = allMs.filter(m => m.status === 'paid' && m.id !== milestone.id).length;
      const isFinal = paidCount + 1 === allMs.length;

      captureResult = await captureAuthorization(job.paypal_auth_id, milestone.amount, job.currency, isFinal);
    }

    const now = new Date().toISOString();
    await db.execute({
      sql: `UPDATE milestones SET status = ?, photo_path = ?, ai_verdict = ?, ai_confidence = ?,
            ai_reasoning = ?, submitted_at = ?, paid_at = ? WHERE id = ?`,
      args: [newStatus, imagePath, approved ? 1 : 0, confidence, reasoning, now, approved ? now : null, milestone.id],
    });

    const updResult = await db.execute({ sql: 'SELECT * FROM milestones WHERE id = ?', args: [milestone.id] });
    const updated = rowToObj(updResult.rows[0], updResult.columns);

    res.json({ verdict: { approved, confidence, reasoning }, milestone: updated, capture: captureResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/dispute
router.post('/:id/dispute', async (req, res) => {
  try {
    const msResult = await db.execute({ sql: 'SELECT * FROM milestones WHERE id = ?', args: [req.params.id] });
    if (!msResult.rows.length) return res.status(404).json({ error: 'Milestone not found' });
    const milestone = rowToObj(msResult.rows[0], msResult.columns);

    await db.execute({ sql: "UPDATE milestones SET status = 'disputed' WHERE id = ?", args: [milestone.id] });

    const updResult = await db.execute({ sql: 'SELECT * FROM milestones WHERE id = ?', args: [milestone.id] });
    res.json(rowToObj(updResult.rows[0], updResult.columns));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const msResult = await db.execute({ sql: 'SELECT * FROM milestones WHERE id = ?', args: [req.params.id] });
    if (!msResult.rows.length) return res.status(404).json({ error: 'Milestone not found' });
    const milestone = rowToObj(msResult.rows[0], msResult.columns);

    const jobResult = await db.execute({ sql: 'SELECT * FROM jobs WHERE id = ?', args: [milestone.job_id] });
    const job = jobResult.rows.length ? rowToObj(jobResult.rows[0], jobResult.columns) : null;

    res.json({ ...milestone, job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
