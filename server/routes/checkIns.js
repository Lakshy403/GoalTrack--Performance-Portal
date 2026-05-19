import { Router } from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const STATUS_OPTIONS = new Set(['not_started', 'on_track', 'at_risk', 'completed', 'overdue']);

function validateCheckin({ achievementValue, status, employeeComment }) {
  const achievement = Number(achievementValue);
  if (!Number.isFinite(achievement) || achievement < 0) {
    return 'Actual achievement must be a valid non-negative number';
  }
  if (!STATUS_OPTIONS.has(status)) return 'Invalid goal status';
  if (!employeeComment?.trim()) return 'Progress notes are required';
  return null;
}

function computeProgressScore(goal, actualValue) {
  const method = goal.score_method || (goal.uom_type === 'date' ? 'timeline' : goal.uom_type === 'boolean' ? 'zero' : 'min');
  const target = Number(goal.target_value);
  const actual = Number(actualValue);
  if (method === 'zero') return actual === 0 ? 100 : 0;
  if (method === 'max') return actual > 0 && Number.isFinite(target) ? Math.min(100, Math.round((target / actual) * 100)) : 0;
  if (method === 'timeline') {
    const deadline = new Date(goal.target_value);
    const completion = new Date(actualValue);
    if (Number.isNaN(deadline.valueOf()) || Number.isNaN(completion.valueOf())) return 0;
    return completion <= deadline ? 100 : 0;
  }
  return target > 0 && Number.isFinite(target) ? Math.min(100, Math.round((actual / target) * 100)) : Math.min(100, actual);
}

// GET /api/check-ins/:goalId — all check-ins for a goal
router.get('/:goalId', async (req, res) => {
  try {
    const goalId = parseInt(req.params.goalId);
    // Verify ownership
    const [goals] = await query(
      `SELECT g.id FROM goals g JOIN goal_sheets gs ON g.goal_sheet_id = gs.id
       WHERE g.id = ? AND gs.employee_id = ?`, [goalId, req.user.id]
    );
    if (!goals.length) return res.status(404).json({ error: 'Goal not found' });

    const [checkins] = await query(
      `SELECT gc.*, u.first_name AS commenter_first, u.last_name AS commenter_last
       FROM goal_checkins gc
       LEFT JOIN users u ON gc.commented_by = u.id
       WHERE gc.goal_id = ?
       ORDER BY gc.checkin_date ASC`, [goalId]
    );
    res.json(checkins);
  } catch (err) {
    console.error('Get check-ins error:', err);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

// POST /api/check-ins — create a check-in entry
router.post('/', async (req, res) => {
  try {
    const { goalId, achievementValue, status, employeeComment, checkinDate } = req.body;
    const validationError = validateCheckin({ achievementValue, status, employeeComment });
    if (validationError) return res.status(400).json({ error: validationError });

    // Verify goal ownership and sheet is approved
    const [goals] = await query(
      `SELECT g.*, gs.employee_id, gs.status AS sheet_status FROM goals g
       JOIN goal_sheets gs ON g.goal_sheet_id = gs.id
       WHERE g.id = ? AND gs.employee_id = ?`, [goalId, req.user.id]
    );
    if (!goals.length) return res.status(404).json({ error: 'Goal not found' });
    if (goals[0].sheet_status !== 'approved') {
      return res.status(400).json({ error: 'Can only create check-ins for approved goal sheets' });
    }

    // Get current quarter
    const [quarters] = await query('SELECT id FROM quarters WHERE is_current = 1 LIMIT 1');
    const quarterId = quarters[0]?.id;

    const progressScore = computeProgressScore(goals[0], achievementValue);

    const [result] = await query(
      `INSERT INTO goal_checkins (goal_id, quarter_id, achievement_value, status, employee_comment, checkin_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [goalId, quarterId, Number(achievementValue), status, employeeComment.trim(), checkinDate || new Date().toISOString().split('T')[0]]
    );

    // Update goal's achievement and status
    await query(
      'UPDATE goals SET achievement = ?, status = ? WHERE id = ?',
      [progressScore, status, goalId]
    );

    if (goals[0].shared_goal_id || goals[0].parent_goal_id) {
      await query(
        `UPDATE goals
         SET achievement = ?, status = ?
         WHERE id <> ? AND (shared_goal_id = ? OR parent_goal_id = ? OR id = ?)`,
        [progressScore, status, goalId, goals[0].shared_goal_id, goals[0].parent_goal_id || goals[0].id, goals[0].parent_goal_id || 0]
      );
    }

    await query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'system', 'Quarterly Check-in Saved', ?, '/employee/check-in')`,
      [req.user.id, `Actual achievement for "${goals[0].title}" was logged as ${Number(achievementValue)}. Progress score is ${progressScore}%.`]
    );

    res.status(201).json({ id: result.insertId, success: true });
  } catch (err) {
    console.error('Create check-in error:', err);
    res.status(500).json({ error: 'Failed to create check-in' });
  }
});

// PUT /api/check-ins/:id — update a check-in
router.put('/:id', async (req, res) => {
  try {
    const { achievementValue, status, employeeComment } = req.body;
    const checkinId = parseInt(req.params.id);
    const validationError = validateCheckin({ achievementValue, status, employeeComment });
    if (validationError) return res.status(400).json({ error: validationError });

    // Verify ownership
    const [checkins] = await query(
      `SELECT gc.*, gs.employee_id FROM goal_checkins gc
       JOIN goals g ON gc.goal_id = g.id
       JOIN goal_sheets gs ON g.goal_sheet_id = gs.id
       WHERE gc.id = ?`, [checkinId]
    );
    if (!checkins.length) return res.status(404).json({ error: 'Check-in not found' });
    if (checkins[0].employee_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const [goalRows] = await query('SELECT * FROM goals WHERE id = ?', [checkins[0].goal_id]);
    const progressScore = computeProgressScore(goalRows[0], achievementValue);

    await query(
      'UPDATE goal_checkins SET achievement_value = ?, status = ?, employee_comment = ? WHERE id = ?',
      [Number(achievementValue), status, employeeComment.trim(), checkinId]
    );

    // Also update the goal
    await query(
      'UPDATE goals SET achievement = ?, status = ? WHERE id = ?',
      [progressScore, status, checkins[0].goal_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Update check-in error:', err);
    res.status(500).json({ error: 'Failed to update check-in' });
  }
});

export default router;
