import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initDb } from './db.js';
import jobsRouter from './routes/jobs.js';
import milestonesRouter from './routes/milestones.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// Routes
app.use('/api/jobs', jobsRouter);
app.use('/api/milestones', milestonesRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'buildbond-backend' }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`BuildBond backend running on http://localhost:${PORT}`);
    console.log(`CORS allowed origin: ${FRONTEND_URL}`);
  });
}).catch(err => {
  console.error('Failed to init DB:', err);
  process.exit(1);
});
