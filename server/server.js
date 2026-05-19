import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('.env', import.meta.url) });

import authRoutes from './routes/auth.js';
import goalSheetRoutes from './routes/goalSheets.js';
import goalRoutes from './routes/goals.js';
import checkInRoutes from './routes/checkIns.js';
import masterRoutes from './routes/master.js';
import orgIntelligenceRoutes from './routes/orgIntelligence.js';
import managerRoutes from './routes/manager.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON request body' });
  }
  next(err);
});

// Request logging
app.use((req, _res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/goal-sheets', goalSheetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/check-ins', checkInRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/org-intelligence', orgIntelligenceRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.VERCEL !== '1') {
app.listen(PORT, () => {
  console.log(`\n🚀 GoalTrack API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
}

export default app;
