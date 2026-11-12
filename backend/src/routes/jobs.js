import 'dotenv/config';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { createOrder, authorizeOrder } from '../paypal.js';

const router = express.Router();
const { BASE_URL, FRONTEND_URL } = process.env;

// POST / — Create a new job with milestones
router.post('/', async (req, res) => {
  try {
    const {
      title, description, homeowner_email, contractor_email,
      total_amount, currency = 'USD', milestones,
    } = req.body;

    if (!title || !homeowner_email || !contractor_email || !total_amount ||
        !Array.isArray(milestones) || milestones.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const milestoneSum = milestones.reduce((sum, m) => sum + Number(m.amount), 0);
    if (Math.abs(milestoneSum - Number(total_amount)) > 0.01) {
      return res.status(400).json({
        error: `Milestone amounts (${milestoneSum.toFixed(2)}) must sum to total_amount (${Number(total_amount).toFixed(2)})`,
      });
    }

    const jobId = uuidv4();
    await db.execute({
      sql: `INSERT INTO jobs (id, title, description, homeowner_email, contractor_email, total_amount, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [jobId, title, description || null, homeowner_email, contractor_email, Number(total_amount), currency],
    });

    for (let idx = 0; idx < milestones.length; idx++) {
      const m = milestones[idx];
      await db.execute({
        sql: `INSERT INTO milestones (id, job_id, sequence_num, title, description, amount) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [uuidv4(), jobId, idx + 1, m.title, m.description, Number(m.amount)],
      });
    }

    const jobRow = await db.execute({ sql: 'SELECT * FROM jobs WHERE id = ?', args: [jobId] });
    const msRows = await db.execute({ sql: 'SELECT * FROM milestones WHERE job_id = ? ORDER BY sequence_num', args: [jobId] });

    const job = rowToObj(jobRow.rows[0], jobRow.columns);
    const jobMilestones = msRows.rows.map(r => rowToObj(r, msRows.columns));

    res.status(201).json({ ...job, milestones: jobMilestones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / — All jobs with milestone count
router.get('/', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT j.*, COUNT(m.id) as milestone_count
      FROM jobs j LEFT JOIN milestones m ON m.job_id = j.id
      GROUP BY j.id ORDER BY j.created_at DESC
    `);
    res.json(result.rows.map(r => rowToObj(r, result.columns)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id — Job + milestones
router.get('/:id', async (req, res) => {
  try {
    const jobResult = await db.execute({ sql: 'SELECT * FROM jobs WHERE id = ?', args: [req.params.id] });
    if (!jobResult.rows.length) return res.status(404).json({ error: 'Job not found' });

    const job = rowToObj(jobResult.rows[0], jobResult.columns);
    const msResult = await db.execute({ sql: 'SELECT * FROM milestones WHERE job_id = ? ORDER BY sequence_num', args: [job.id] });
    const milestones = msResult.rows.map(r => rowToObj(r, msResult.columns));

    res.json({ ...job, milestones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/initiate-payment
router.post('/:id/initiate-payment', async (req, res) => {
  try {
    const jobResult = await db.execute({ sql: 'SELECT * FROM jobs WHERE id = ?', args: [req.params.id] });
    if (!jobResult.rows.length) return res.status(404).json({ error: 'Job not found' });
    const job = rowToObj(jobResult.rows[0], jobResult.columns);

    const returnUrl = `${BASE_URL}/api/jobs/${job.id}/payment-approved`;
    const cancelUrl = `${FRONTEND_URL}/jobs/${job.id}?payment=cancelled`;

    const { orderId, approveLink } = await createOrder(job.id, job.total_amount, job.currency, returnUrl, cancelUrl);
    await db.execute({ sql: 'UPDATE jobs SET paypal_order_id = ? WHERE id = ?', args: [orderId, job.id] });

    res.json({ approveUrl: approveLink, orderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/payment-approved — PayPal redirect
router.get('/:id/payment-approved', async (req, res) => {
  try {
    const jobResult = await db.execute({ sql: 'SELECT * FROM jobs WHERE id = ?', args: [req.params.id] });
    if (!jobResult.rows.length) return res.status(404).json({ error: 'Job not found' });
    const job = rowToObj(jobResult.rows[0], jobResult.columns);

    const orderId = req.query.token;
    if (!orderId) return res.status(400).json({ error: 'Missing token param' });

    const { authId } = await authorizeOrder(orderId);
    await db.execute({ sql: "UPDATE jobs SET paypal_auth_id = ?, status = 'active' WHERE id = ?", args: [authId, job.id] });

    res.redirect(`${FRONTEND_URL}/jobs/${job.id}?payment=authorized`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: convert libsql row array + columns to plain object
function rowToObj(row, columns) {
  const obj = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });
  return obj;
}

export default router;
