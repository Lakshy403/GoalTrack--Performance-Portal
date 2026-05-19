import { Router } from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/master/thrust-areas
router.get('/thrust-areas', async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM thrust_areas WHERE is_active = 1 ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch thrust areas' }); }
});

// GET /api/master/quarters
router.get('/quarters', async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT q.*, fy.label AS fy_label FROM quarters q
       JOIN financial_years fy ON q.financial_year_id = fy.id
       ORDER BY q.start_date DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch quarters' }); }
});

// GET /api/master/current-quarter
router.get('/current-quarter', async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT q.*, fy.label AS fy_label FROM quarters q
       JOIN financial_years fy ON q.financial_year_id = fy.id
       WHERE q.is_current = 1 LIMIT 1`
    );
    res.json(rows[0] || null);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch current quarter' }); }
});

// GET /api/master/notifications — employee notifications
router.get('/notifications', async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch notifications' }); }
});

// PUT /api/master/notifications/:id/read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to mark notification' }); }
});

// PUT /api/master/notifications/read-all
router.put('/notifications/read-all', async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to mark notifications' }); }
});

export default router;
