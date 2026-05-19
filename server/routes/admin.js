import { Router } from 'express';
import { query } from '../config/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('admin', 'superadmin'));

// GET /api/admin/department-stats
router.get('/department-stats', async (req, res) => {
  try {
    const [stats] = await query(`
      SELECT 
        d.id, 
        d.name,
        d.name AS department,
        COUNT(DISTINCT u.id) AS employee_count,
        COUNT(DISTINCT gs.id) AS goalsSubmitted,
        SUM(CASE WHEN gs.status = 'approved' THEN 1 ELSE 0 END) AS goalsApproved,
        ROUND(COALESCE(
          (SELECT AVG(sub.completion)
           FROM (
             SELECT
               gs2.id AS sheet_id,
               CASE WHEN SUM(g.weightage) > 0
                    THEN SUM(g.achievement * g.weightage / 100) / SUM(g.weightage) * 100
                    ELSE 0
               END AS completion
             FROM goal_sheets gs2
             JOIN goals g ON g.goal_sheet_id = gs2.id
             JOIN users u2 ON gs2.employee_id = u2.id
             WHERE u2.department_id = d.id
             GROUP BY gs2.id
           ) sub
          ), 0
        ), 1) AS avgCompletion,
        0 AS onTrack,
        0 AS atRisk,
        0 AS overdue
      FROM departments d
      LEFT JOIN users u ON d.id = u.department_id AND u.is_active = 1
      LEFT JOIN (
          SELECT gs_inner.employee_id, gs_inner.status, gs_inner.id
          FROM goal_sheets gs_inner
          INNER JOIN (
              SELECT employee_id, MAX(version) AS max_version
              FROM goal_sheets
              GROUP BY employee_id
          ) latest ON gs_inner.employee_id = latest.employee_id AND gs_inner.version = latest.max_version
      ) gs ON u.id = gs.employee_id
      GROUP BY d.id, d.name
    `);
    res.json(stats);
  } catch (err) {
    console.error('Department stats error:', err);
    res.status(500).json({ error: 'Failed to fetch department stats' });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const [logs] = await query(`
      SELECT al.*, u.first_name, u.last_name, u.email
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// GET /api/admin/escalations
router.get('/escalations', async (req, res) => {
  try {
    // Escalate goal sheets that have been submitted but not reviewed for more than 7 days
    const [escalations] = await query(`
      SELECT gs.id as goal_sheet_id, gs.submitted_at, 
             u.first_name as emp_first, u.last_name as emp_last,
             m.first_name as mgr_first, m.last_name as mgr_last,
             DATEDIFF(NOW(), gs.submitted_at) as days_pending
      FROM goal_sheets gs
      JOIN users u ON gs.employee_id = u.id
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE gs.status = 'submitted' AND DATEDIFF(NOW(), gs.submitted_at) > 7
      ORDER BY days_pending DESC
    `);
    res.json(escalations);
  } catch (err) {
    console.error('Escalations error:', err);
    res.status(500).json({ error: 'Failed to fetch escalations' });
  }
});

// GET /api/admin/locked-sheets
router.get('/locked-sheets', async (req, res) => {
  try {
    const [sheets] = await query(`
      SELECT gs.*, u.first_name, u.last_name, d.name AS department_name,
             q.label AS quarter_label, fy.label AS fy_label
      FROM goal_sheets gs
      JOIN users u ON gs.employee_id = u.id
      JOIN departments d ON u.department_id = d.id
      JOIN quarters q ON gs.quarter_id = q.id
      JOIN financial_years fy ON q.financial_year_id = fy.id
      WHERE gs.is_locked = 1
      ORDER BY gs.updated_at DESC
    `);
    res.json(sheets);
  } catch (err) {
    console.error('Locked sheets error:', err);
    res.status(500).json({ error: 'Failed to fetch locked sheets' });
  }
});

// POST /api/admin/goal-sheets/:id/unlock
router.post('/goal-sheets/:id/unlock', async (req, res) => {
  try {
    const sheetId = parseInt(req.params.id);
    await query('UPDATE goal_sheets SET is_locked = 0 WHERE id = ?', [sheetId]);
    
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, target_label, details)
       VALUES (?, 'Goal Sheet Unlocked (Admin)', 'goal_sheet', ?, ?, ?)`,
      [req.user.id, sheetId, `GS-${String(sheetId).padStart(3, '0')}`, 'Admin unlocked the goal sheet']
    );

    res.json({ success: true, message: 'Goal sheet unlocked' });
  } catch (err) {
    console.error('Unlock error:', err);
    res.status(500).json({ error: 'Failed to unlock goal sheet' });
  }
});

// GET /api/admin/shared-goals
router.get('/shared-goals', async (req, res) => {
  try {
    const [goals] = await query(`
      SELECT sg.*, d.name AS department, ta.name AS thrust_area
      FROM shared_goals sg
      LEFT JOIN departments d ON sg.department_id = d.id
      JOIN thrust_areas ta ON sg.thrust_area_id = ta.id
      ORDER BY sg.created_at DESC
    `);
    res.json(goals);
  } catch (err) {
    console.error('Shared goals GET error:', err);
    res.status(500).json({ error: 'Failed to fetch shared goals' });
  }
});

// POST /api/admin/shared-goals
router.post('/shared-goals', async (req, res) => {
  try {
    const { title, description, thrustAreaId, uomType, targetValue, departmentId } = req.body;
    
    const [quarterRows] = await query('SELECT id FROM quarters WHERE is_current = 1 LIMIT 1');
    if (!quarterRows.length) return res.status(400).json({ error: 'No active quarter' });
    const quarterId = quarterRows[0].id;
    
    const [result] = await query(
      `INSERT INTO shared_goals (title, description, thrust_area_id, uom_type, target_value, department_id, quarter_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description || null, thrustAreaId, uomType, targetValue, departmentId || null, quarterId, req.user.id]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, target_label, details)
       VALUES (?, 'Shared Goal Pushed', 'shared_goal', ?, ?, ?)`,
      [req.user.id, result.insertId, title.trim(), `Pushed shared goal to ${departmentId ? 'specific department' : 'all departments'}`]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Shared goals POST error:', err);
    res.status(500).json({ error: 'Failed to push shared goal' });
  }
});

// GET /api/admin/reports/:type
router.get('/reports/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { format } = req.query; // 'CSV' or 'Excel'
    const normalized = String(type).toLowerCase();
    let rows = [];
    let headers = [];

    if (normalized.includes('audit')) {
      headers = ['Timestamp', 'Actor', 'Action', 'Entity', 'Record', 'Details'];
      const [logs] = await query(
        `SELECT al.created_at, CONCAT(u.first_name, ' ', u.last_name) AS actor, al.action, al.entity_type, al.target_label, al.details
         FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
         ORDER BY al.created_at DESC LIMIT 500`
      );
      rows = logs.map(log => [log.created_at, log.actor || 'System', log.action, log.entity_type, log.target_label || '', log.details || '']);
    } else if (normalized.includes('escalation')) {
      headers = ['Employee', 'Reason', 'Priority', 'Status', 'Days Overdue', 'Assigned To', 'Created'];
      const [items] = await query(
        `SELECT CONCAT(emp.first_name, ' ', emp.last_name) AS employee, e.reason, e.priority, e.status, e.days_overdue,
                CONCAT(owner.first_name, ' ', owner.last_name) AS owner, e.created_at
         FROM escalations e
         JOIN users emp ON emp.id = e.employee_id
         LEFT JOIN users owner ON owner.id = e.assigned_to
         ORDER BY e.created_at DESC`
      );
      rows = items.map(item => [item.employee, item.reason, item.priority, item.status, item.days_overdue, item.owner || '', item.created_at]);
    } else if (normalized.includes('check')) {
      headers = ['Employee', 'Goal', 'Planned Target', 'Actual Achievement', 'Computed Score', 'Status', 'Employee Comment', 'Manager Comment', 'Date'];
      const [items] = await query(
        `SELECT CONCAT(u.first_name, ' ', u.last_name) AS employee, g.title, g.target_value, gc.achievement_value,
                g.achievement, gc.status, gc.employee_comment, gc.manager_comment, gc.checkin_date
         FROM goal_checkins gc
         JOIN goals g ON g.id = gc.goal_id
         JOIN goal_sheets gs ON gs.id = g.goal_sheet_id
         JOIN users u ON u.id = gs.employee_id
         ORDER BY gc.checkin_date DESC`
      );
      rows = items.map(item => [item.employee, item.title, item.target_value, item.achievement_value, item.achievement, item.status, item.employee_comment || '', item.manager_comment || '', item.checkin_date]);
    } else {
      headers = ['Employee', 'Department', 'Manager', 'Goal Sheet', 'Sheet Status', 'Goal', 'Thrust Area', 'UoM', 'Score Method', 'Planned Target', 'Actual Score', 'Weightage'];
      const [items] = await query(
        `SELECT CONCAT(u.first_name, ' ', u.last_name) AS employee, d.name AS department,
                CONCAT(m.first_name, ' ', m.last_name) AS manager, gs.id AS sheet_id, gs.status AS sheet_status,
                g.title, ta.name AS thrust_area, g.uom_type, COALESCE(g.score_method, 'min') AS score_method,
                g.target_value, g.achievement, g.weightage
         FROM goals g
         JOIN goal_sheets gs ON gs.id = g.goal_sheet_id
         JOIN users u ON u.id = gs.employee_id
         LEFT JOIN users m ON m.id = u.manager_id
         JOIN departments d ON d.id = u.department_id
         JOIN thrust_areas ta ON ta.id = g.thrust_area_id
         ORDER BY d.name, u.first_name, gs.id`
      );
      rows = items.map(item => [item.employee, item.department, item.manager || '', `GS-${String(item.sheet_id).padStart(3, '0')}`, item.sheet_status, item.title, item.thrust_area, item.uom_type, item.score_method, item.target_value, item.achievement, item.weightage]);
    }

    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const content = [headers, ...rows].map(row => row.map(escapeCsv).join(',')).join('\n');
    
    // Record audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, target_label, details)
       VALUES (?, 'Report Exported', 'report', 0, ?, ?)`,
      [req.user.id, type, `Exported ${type} in ${format} format`]
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type.replace(/\s+/g, '_')}.${format?.toLowerCase() === 'excel' ? 'xlsx' : 'csv'}"`);
    res.send(content);
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;
