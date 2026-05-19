import { Router } from 'express';
import { query } from '../config/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('manager', 'admin'));

// GET /api/manager/team-goals
router.get('/team-goals', async (req, res) => {
  try {
    const [sheets] = await query(
      `SELECT gs.*, q.label AS quarter_label, fy.label AS fy_label,
              u.first_name AS employee_first, u.last_name AS employee_last, u.employee_code,
              d.name AS department_name
       FROM goal_sheets gs
       JOIN users u ON gs.employee_id = u.id
       JOIN quarters q ON gs.quarter_id = q.id
       JOIN financial_years fy ON q.financial_year_id = fy.id
       JOIN departments d ON u.department_id = d.id
       WHERE u.manager_id = ? AND gs.status != 'draft'
       ORDER BY gs.submitted_at DESC`, [req.user.id]
    );

    const sheetIds = sheets.map(s => s.id);
    let allGoals = [];
    let allCheckins = [];
    if (sheetIds.length > 0) {
      const placeholders = sheetIds.map(() => '?').join(',');
      const [goals] = await query(
        `SELECT g.*, ta.name AS thrust_area_name 
         FROM goals g 
         JOIN thrust_areas ta ON g.thrust_area_id = ta.id
         WHERE g.goal_sheet_id IN (${placeholders})`,
        sheetIds
      );
      allGoals = goals;
      const goalIds = goals.map(goal => goal.id);
      if (goalIds.length) {
        const goalPlaceholders = goalIds.map(() => '?').join(',');
        const [checkins] = await query(
          `SELECT gc.*, g.goal_sheet_id
           FROM goal_checkins gc
           JOIN goals g ON g.id = gc.goal_id
           WHERE gc.goal_id IN (${goalPlaceholders})
           ORDER BY gc.checkin_date DESC`,
          goalIds
        );
        allCheckins = checkins;
      }
    }

    const result = sheets.map(s => ({
      ...s,
      employeeName: `${s.employee_first} ${s.employee_last}`,
      period: `${s.quarter_label} ${s.fy_label}`,
      goals: allGoals.filter(g => g.goal_sheet_id === s.id).map(goal => ({
        ...goal,
        checkins: allCheckins.filter(checkin => checkin.goal_id === goal.id),
      }))
    }));

    res.json(result);
  } catch (err) {
    console.error('Get team goals error:', err);
    res.status(500).json({ error: 'Failed to fetch team goals' });
  }
});

// PUT /api/manager/goals/:id — inline review edit for target/weightage only
router.put('/goals/:id', async (req, res) => {
  try {
    const goalId = parseInt(req.params.id);
    const { targetValue, weightage } = req.body;
    if (targetValue === undefined && weightage === undefined) {
      return res.status(400).json({ error: 'Target or weightage is required' });
    }

    const [rows] = await query(
      `SELECT g.*, gs.id AS sheet_id, gs.status AS sheet_status, u.manager_id
       FROM goals g
       JOIN goal_sheets gs ON gs.id = g.goal_sheet_id
       JOIN users u ON u.id = gs.employee_id
       WHERE g.id = ?`,
      [goalId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Goal not found' });
    const goal = rows[0];
    if (goal.manager_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    if (goal.sheet_status !== 'submitted') return res.status(400).json({ error: 'Only submitted sheets can be edited during review' });
    if (goal.is_shared && targetValue !== undefined) return res.status(400).json({ error: 'Shared KPI title and target are read-only' });

    const updates = {};
    const before = {};
    const after = {};
    if (targetValue !== undefined) {
      before.targetValue = goal.target_value;
      after.targetValue = String(targetValue).trim();
      updates.target_value = after.targetValue;
    }
    if (weightage !== undefined) {
      const numericWeightage = Number(weightage);
      if (!Number.isFinite(numericWeightage) || numericWeightage < 10 || numericWeightage > 100) {
        return res.status(400).json({ error: 'Weightage must be between 10% and 100%' });
      }
      const [sumRows] = await query(
        'SELECT COALESCE(SUM(weightage), 0) AS total FROM goals WHERE goal_sheet_id = ? AND id <> ?',
        [goal.goal_sheet_id, goalId]
      );
      if (Number(sumRows[0].total) + numericWeightage > 100) {
        return res.status(400).json({ error: `Total weightage cannot exceed 100% (currently ${sumRows[0].total}%)` });
      }
      before.weightage = Number(goal.weightage);
      after.weightage = numericWeightage;
      updates.weightage = numericWeightage;
    }

    const keys = Object.keys(updates);
    const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
    await query(`UPDATE goals SET ${setClause} WHERE id = ?`, [...Object.values(updates), goalId]);
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, target_label, details, metadata)
       VALUES (?, 'Manager Inline Goal Edit', 'goal', ?, ?, ?, ?)`,
      [req.user.id, goalId, `GS-${String(goal.goal_sheet_id).padStart(3, '0')}`, 'Manager edited goal target/weightage during review', JSON.stringify({ before, after })]
    );

    const [updated] = await query(
      `SELECT g.*, ta.name AS thrust_area_name
       FROM goals g JOIN thrust_areas ta ON ta.id = g.thrust_area_id
       WHERE g.id = ?`,
      [goalId]
    );
    res.json(updated[0]);
  } catch (err) {
    console.error('Manager inline edit error:', err);
    res.status(500).json({ error: 'Failed to update goal during review' });
  }
});

// POST /api/manager/goal-sheets/:id/approve
router.post('/goal-sheets/:id/approve', async (req, res) => {
  try {
    const sheetId = parseInt(req.params.id);
    
    // verify the manager manages the employee who owns the sheet
    const [sheets] = await query(
      `SELECT gs.*, u.first_name, u.last_name, u.email 
       FROM goal_sheets gs
       JOIN users u ON gs.employee_id = u.id
       WHERE gs.id = ? AND u.manager_id = ?`,
       [sheetId, req.user.id]
    );
    if (!sheets.length) return res.status(404).json({ error: 'Goal sheet not found or unauthorized' });
    
    const sheet = sheets[0];
    if (sheet.status !== 'submitted') {
      return res.status(400).json({ error: 'Goal sheet is not pending review' });
    }

    const [goals] = await query('SELECT * FROM goals WHERE goal_sheet_id = ?', [sheetId]);
    if (!goals.length) return res.status(400).json({ error: 'No goals found on this sheet' });
    if (goals.length > 8) return res.status(400).json({ error: 'Maximum 8 goals allowed' });
    const totalWeightage = goals.reduce((sum, goal) => sum + Number(goal.weightage || 0), 0);
    if (Math.abs(totalWeightage - 100) > 0.01) {
      return res.status(400).json({ error: `Total weightage must equal 100% before approval (currently ${totalWeightage}%)` });
    }
    const underMin = goals.find(goal => Number(goal.weightage) < 10);
    if (underMin) return res.status(400).json({ error: `Each goal must have at least 10% weightage. "${underMin.title}" is below minimum.` });

    await query(
      'UPDATE goal_sheets SET status = ?, reviewed_by = ?, reviewed_at = NOW(), is_locked = 1 WHERE id = ?',
      ['approved', req.user.id, sheetId]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, target_label, details)
       VALUES (?, 'Goal Sheet Approved', 'goal_sheet', ?, ?, ?)`,
      [req.user.id, sheetId, `GS-${String(sheetId).padStart(3, '0')}`, 'Manager approved the goal sheet']
    );

    await query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'goal_approved', 'Goal Sheet Approved', ?, '/employee/goal-sheet')`,
      [sheet.employee_id, 'Your manager approved your goal sheet.']
    );

    // Record review
    await query(
      `INSERT INTO goal_reviews (goal_sheet_id, reviewer_id, action, comments)
       VALUES (?, ?, 'approved', 'Goal sheet looks good and is approved.')`,
      [sheetId, req.user.id]
    );

    res.json({ success: true, status: 'approved' });
  } catch (err) {
    console.error('Approve goal sheet error:', err);
    res.status(500).json({ error: 'Failed to approve goal sheet' });
  }
});

// POST /api/manager/goal-sheets/:id/rework
router.post('/goal-sheets/:id/rework', async (req, res) => {
  try {
    const sheetId = parseInt(req.params.id);
    const { comments } = req.body;
    if (!comments) return res.status(400).json({ error: 'Comments are required for rework' });
    
    const [sheets] = await query(
      `SELECT gs.*, u.first_name, u.last_name, u.email 
       FROM goal_sheets gs
       JOIN users u ON gs.employee_id = u.id
       WHERE gs.id = ? AND u.manager_id = ?`,
       [sheetId, req.user.id]
    );
    if (!sheets.length) return res.status(404).json({ error: 'Goal sheet not found or unauthorized' });
    
    const sheet = sheets[0];
    
    await query(
      'UPDATE goal_sheets SET status = ?, reviewed_by = ?, reviewed_at = NOW(), is_locked = 0 WHERE id = ?',
      ['rework', req.user.id, sheetId]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, target_label, details)
       VALUES (?, 'Goal Sheet Rework', 'goal_sheet', ?, ?, ?)`,
      [req.user.id, sheetId, `GS-${String(sheetId).padStart(3, '0')}`, 'Manager returned the goal sheet for rework']
    );

    await query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'goal_rework', 'Goal Sheet Returned for Rework', ?, '/employee/goal-sheet')`,
      [sheet.employee_id, 'Your manager returned your goal sheet for rework. Please check the comments.']
    );

    // Record review
    await query(
      `INSERT INTO goal_reviews (goal_sheet_id, reviewer_id, action, comments)
       VALUES (?, ?, 'returned_for_rework', ?)`,
      [sheetId, req.user.id, comments]
    );

    res.json({ success: true, status: 'rework' });
  } catch (err) {
    console.error('Rework goal sheet error:', err);
    res.status(500).json({ error: 'Failed to return goal sheet for rework' });
  }
});

// POST /api/manager/goal-sheets/:id/reject
router.post('/goal-sheets/:id/reject', async (req, res) => {
  try {
    const sheetId = parseInt(req.params.id);
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason is required for rejection' });
    
    const [sheets] = await query(
      `SELECT gs.*, u.first_name, u.last_name, u.email 
       FROM goal_sheets gs
       JOIN users u ON gs.employee_id = u.id
       WHERE gs.id = ? AND u.manager_id = ?`,
       [sheetId, req.user.id]
    );
    if (!sheets.length) return res.status(404).json({ error: 'Goal sheet not found or unauthorized' });
    
    const sheet = sheets[0];
    
    await query(
      'UPDATE goal_sheets SET status = ?, reviewed_by = ?, reviewed_at = NOW(), is_locked = 1 WHERE id = ?',
      ['rejected', req.user.id, sheetId]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, target_label, details)
       VALUES (?, 'Goal Sheet Rejected', 'goal_sheet', ?, ?, ?)`,
      [req.user.id, sheetId, `GS-${String(sheetId).padStart(3, '0')}`, 'Manager rejected the goal sheet']
    );

    await query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'goal_rejected', 'Goal Sheet Rejected', ?, '/employee/goal-sheet')`,
      [sheet.employee_id, 'Your manager rejected your goal sheet.']
    );

    // Record review
    await query(
      `INSERT INTO goal_reviews (goal_sheet_id, reviewer_id, action, comments)
       VALUES (?, ?, 'rejected', ?)`,
      [sheetId, req.user.id, reason]
    );

    res.json({ success: true, status: 'rejected' });
  } catch (err) {
    console.error('Reject goal sheet error:', err);
    res.status(500).json({ error: 'Failed to reject goal sheet' });
  }
});

// POST /api/manager/goal-sheets/:id/message
router.post('/goal-sheets/:id/message', async (req, res) => {
  try {
    const sheetId = parseInt(req.params.id);
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    
    const [sheets] = await query(
      `SELECT gs.*, u.first_name, u.last_name, u.email 
       FROM goal_sheets gs
       JOIN users u ON gs.employee_id = u.id
       WHERE gs.id = ? AND u.manager_id = ?`,
       [sheetId, req.user.id]
    );
    if (!sheets.length) return res.status(404).json({ error: 'Goal sheet not found or unauthorized' });
    
    const sheet = sheets[0];
    
    // No goal_reviews entry for messages (not part of ENUM); notification handles it

    await query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'system', 'New Message from Manager', ?, '/employee/goal-sheet')`,
      [sheet.employee_id, `Your manager sent you a message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// PUT /api/manager/check-ins/:id/comment
router.put('/check-ins/:id/comment', async (req, res) => {
  try {
    const checkinId = parseInt(req.params.id);
    const { managerComment } = req.body;
    if (!managerComment?.trim()) return res.status(400).json({ error: 'Manager comment is required' });

    const [rows] = await query(
      `SELECT gc.*, g.title, gs.employee_id, u.manager_id
       FROM goal_checkins gc
       JOIN goals g ON g.id = gc.goal_id
       JOIN goal_sheets gs ON gs.id = g.goal_sheet_id
       JOIN users u ON u.id = gs.employee_id
       WHERE gc.id = ?`,
      [checkinId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Check-in not found' });
    const checkin = rows[0];
    if (checkin.manager_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

    await query(
      'UPDATE goal_checkins SET manager_comment = ?, commented_by = ?, commented_at = NOW() WHERE id = ?',
      [managerComment.trim(), req.user.id, checkinId]
    );
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, target_label, details)
       VALUES (?, 'Manager Check-in Comment', 'goal_checkin', ?, ?, ?)`,
      [req.user.id, checkinId, `CHK-${String(checkinId).padStart(3, '0')}`, `Comment added for ${checkin.title}`]
    );
    await query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'system', 'Manager Check-in Comment', ?, '/employee/check-in')`,
      [checkin.employee_id, `Your manager commented on "${checkin.title}".`]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Manager check-in comment error:', err);
    res.status(500).json({ error: 'Failed to save manager comment' });
  }
});

export default router;
