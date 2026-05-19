import { Router } from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/goal-sheets — employee's goal sheets
router.get('/', async (req, res) => {
  try {
    const [sheets] = await query(
      `SELECT gs.*, q.label AS quarter_label, fy.label AS fy_label,
              (SELECT COUNT(*) FROM goals WHERE goal_sheet_id = gs.id) AS goal_count,
              (SELECT COALESCE(SUM(weightage), 0) FROM goals WHERE goal_sheet_id = gs.id) AS total_weightage,
              r.first_name AS reviewer_first, r.last_name AS reviewer_last
       FROM goal_sheets gs
       JOIN quarters q ON gs.quarter_id = q.id
       JOIN financial_years fy ON q.financial_year_id = fy.id
       LEFT JOIN users r ON gs.reviewed_by = r.id
       WHERE gs.employee_id = ?
       ORDER BY gs.created_at DESC`, [req.user.id]
    );
    const result = sheets.map(s => ({
      ...s,
      reviewerName: s.reviewer_first ? `${s.reviewer_first} ${s.reviewer_last}` : null,
      period: `${s.quarter_label} ${s.fy_label}`,
    }));
    res.json(result);
  } catch (err) {
    console.error('Get goal sheets error:', err);
    res.status(500).json({ error: 'Failed to fetch goal sheets' });
  }
});

// GET /api/goal-sheets/current — current quarter goal sheet with goals
router.get('/current', async (req, res) => {
  try {
    // Get current quarter
    const [quarters] = await query('SELECT * FROM quarters WHERE is_current = 1 LIMIT 1');
    if (!quarters.length) return res.status(404).json({ error: 'No active quarter found' });
    const quarterId = quarters[0].id;

    const [sheets] = await query(
      `SELECT gs.*, q.label AS quarter_label, fy.label AS fy_label,
              r.first_name AS reviewer_first, r.last_name AS reviewer_last
       FROM goal_sheets gs
       JOIN quarters q ON gs.quarter_id = q.id
       JOIN financial_years fy ON q.financial_year_id = fy.id
       LEFT JOIN users r ON gs.reviewed_by = r.id
       WHERE gs.employee_id = ? AND gs.quarter_id = ?`, [req.user.id, quarterId]
    );

    let sheet = sheets[0] || null;
    let goals = [];
    let sharedGoals = [];

    if (sheet) {
      const [goalRows] = await query(
        `SELECT g.*, ta.name AS thrust_area_name,
                sg.title AS shared_title, sg.target_value AS shared_target
         FROM goals g
         JOIN thrust_areas ta ON g.thrust_area_id = ta.id
         LEFT JOIN shared_goals sg ON g.shared_goal_id = sg.id
         WHERE g.goal_sheet_id = ?
         ORDER BY g.sort_order ASC`, [sheet.id]
      );
      goals = goalRows;

      const [reviews] = await query(
        `SELECT comments FROM goal_reviews WHERE goal_sheet_id = ? ORDER BY created_at DESC LIMIT 1`,
        [sheet.id]
      );
      if (reviews.length > 0) {
        sheet.review_comments = reviews[0].comments;
      }
      sheet.reviewerName = sheet.reviewer_first ? `${sheet.reviewer_first} ${sheet.reviewer_last}` : null;
      sheet.period = `${sheet.quarter_label} ${sheet.fy_label}`;
    }

    // Get shared goals for this quarter and user's department
    const [userRows] = await query('SELECT department_id FROM users WHERE id = ?', [req.user.id]);
    const deptId = userRows[0]?.department_id;
    const [sgRows] = await query(
      `SELECT sg.*, ta.name AS thrust_area_name
       FROM shared_goals sg
       JOIN thrust_areas ta ON sg.thrust_area_id = ta.id
       WHERE sg.quarter_id = ? AND sg.is_active = 1
         AND (sg.department_id IS NULL OR sg.department_id = ?)`, [quarterId, deptId]
    );
    sharedGoals = sgRows;

    res.json({ sheet, goals, sharedGoals, quarterId, quarter: quarters[0] });
  } catch (err) {
    console.error('Get current goal sheet error:', err);
    res.status(500).json({ error: 'Failed to fetch current goal sheet' });
  }
});

// POST /api/goal-sheets — create a new draft sheet
router.post('/', async (req, res) => {
  try {
    const [quarters] = await query('SELECT id FROM quarters WHERE is_current = 1 LIMIT 1');
    if (!quarters.length) return res.status(400).json({ error: 'No active quarter' });
    const quarterId = quarters[0].id;

    // Check if sheet already exists
    const [existing] = await query(
      'SELECT id FROM goal_sheets WHERE employee_id = ? AND quarter_id = ?',
      [req.user.id, quarterId]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Goal sheet already exists for this quarter', sheetId: existing[0].id });
    }

    const [result] = await query(
      'INSERT INTO goal_sheets (employee_id, quarter_id, status) VALUES (?, ?, ?)',
      [req.user.id, quarterId, 'draft']
    );
    res.status(201).json({ id: result.insertId, status: 'draft' });
  } catch (err) {
    console.error('Create goal sheet error:', err);
    res.status(500).json({ error: 'Failed to create goal sheet' });
  }
});

// POST /api/goal-sheets/:id/submit
router.post('/:id/submit', async (req, res) => {
  try {
    const sheetId = parseInt(req.params.id);
    // Verify ownership
    const [sheets] = await query(
      'SELECT * FROM goal_sheets WHERE id = ? AND employee_id = ?', [sheetId, req.user.id]
    );
    if (!sheets.length) return res.status(404).json({ error: 'Goal sheet not found' });
    const sheet = sheets[0];
    if (!['draft', 'rework'].includes(sheet.status)) {
      return res.status(400).json({ error: `Cannot submit a sheet with status: ${sheet.status}` });
    }

    // Validate goals
    const [goals] = await query('SELECT * FROM goals WHERE goal_sheet_id = ?', [sheetId]);
    if (goals.length === 0) return res.status(400).json({ error: 'No goals added yet' });
    if (goals.length > 8) return res.status(400).json({ error: 'Maximum 8 goals allowed' });

    const totalWeightage = goals.reduce((sum, g) => sum + parseFloat(g.weightage), 0);
    if (Math.abs(totalWeightage - 100) > 0.01) {
      return res.status(400).json({ error: `Total weightage must equal 100% (currently ${totalWeightage}%)` });
    }

    const underMin = goals.find(g => parseFloat(g.weightage) < 10);
    if (underMin) {
      return res.status(400).json({ error: `Each goal must have at least 10% weightage. "${underMin.title}" has ${underMin.weightage}%` });
    }

    // Update status
    const currentVersion = Number(sheet.version) || 1;
    const newVersion = sheet.status === 'rework' ? currentVersion + 1 : currentVersion;
    await query(
      'UPDATE goal_sheets SET status = ?, submitted_at = NOW(), is_locked = 1, version = ? WHERE id = ?',
      ['submitted', newVersion, sheetId]
    );

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, target_label, details)
       VALUES (?, 'Goal Sheet Submitted', 'goal_sheet', ?, ?, ?)`,
      [req.user.id, sheetId, `GS-${String(sheetId).padStart(3, '0')}`, `Submitted ${goals.length} goals (v${newVersion})`]
    );

    await query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'goal_submitted', 'Goal Sheet Submitted', ?, '/employee/goal-sheet')`,
      [req.user.id, `Your goal sheet with ${goals.length} goals was submitted for manager review.`]
    );

    const [employeeRows] = await query('SELECT manager_id FROM users WHERE id = ?', [req.user.id]);
    const managerId = employeeRows[0]?.manager_id;
    if (managerId) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES (?, 'goal_submitted', 'Goal Sheet Ready for Review', ?, '/manager/reviews')`,
        [managerId, `${req.user.email} submitted a goal sheet for review.`]
      );
    }

    res.json({ success: true, status: 'submitted', version: newVersion });
  } catch (err) {
    console.error('Submit goal sheet error:', err);
    res.status(500).json({ error: 'Failed to submit goal sheet' });
  }
});

// GET /api/goal-sheets/:id — single sheet with goals
router.get('/:id', async (req, res) => {
  try {
    const [sheets] = await query(
      `SELECT gs.*, q.label AS quarter_label, fy.label AS fy_label,
              r.first_name AS reviewer_first, r.last_name AS reviewer_last
       FROM goal_sheets gs
       JOIN quarters q ON gs.quarter_id = q.id
       JOIN financial_years fy ON q.financial_year_id = fy.id
       LEFT JOIN users r ON gs.reviewed_by = r.id
       WHERE gs.id = ? AND gs.employee_id = ?`, [req.params.id, req.user.id]
    );
    if (!sheets.length) return res.status(404).json({ error: 'Goal sheet not found' });
    const sheet = sheets[0];
    sheet.reviewerName = sheet.reviewer_first ? `${sheet.reviewer_first} ${sheet.reviewer_last}` : null;
    sheet.period = `${sheet.quarter_label} ${sheet.fy_label}`;

    const [goals] = await query(
      `SELECT g.*, ta.name AS thrust_area_name FROM goals g
       JOIN thrust_areas ta ON g.thrust_area_id = ta.id
       WHERE g.goal_sheet_id = ? ORDER BY g.sort_order`, [sheet.id]
    );

    const [reviews] = await query(
      `SELECT gr.*, u.first_name, u.last_name FROM goal_reviews gr
       JOIN users u ON gr.reviewer_id = u.id
       WHERE gr.goal_sheet_id = ? ORDER BY gr.created_at DESC`, [sheet.id]
    );

    res.json({ ...sheet, goals, reviews });
  } catch (err) {
    console.error('Get goal sheet error:', err);
    res.status(500).json({ error: 'Failed to fetch goal sheet' });
  }
});

export default router;
