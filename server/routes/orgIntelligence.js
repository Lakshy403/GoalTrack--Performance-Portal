import { Router } from 'express';
import { query, transaction } from '../config/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

async function columnExists(tableName, columnName) {
  const [rows] = await query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return Number(rows[0].count) > 0;
}

async function indexExists(tableName, indexName) {
  const [rows] = await query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  return Number(rows[0].count) > 0;
}

async function ensureOrgSchema() {
  if (!(await columnExists('goals', 'parent_goal_id'))) {
    await query('ALTER TABLE goals ADD COLUMN parent_goal_id INT UNSIGNED NULL AFTER shared_goal_id');
  }
  if (!(await indexExists('goals', 'idx_goals_parent_goal'))) {
    await query('CREATE INDEX idx_goals_parent_goal ON goals(parent_goal_id)');
  }
  if (!(await indexExists('audit_logs', 'idx_audit_changed_by'))) {
    await query('CREATE INDEX idx_audit_changed_by ON audit_logs(user_id)');
  }
  if (!(await indexExists('audit_logs', 'idx_audit_timestamp'))) {
    await query('CREATE INDEX idx_audit_timestamp ON audit_logs(created_at)');
  }
}

function getVisibleUsers(users, requester) {
  if (requester.role === 'admin') return users;
  const visible = new Set([requester.id]);
  let changed = true;
  while (changed) {
    changed = false;
    users.forEach((user) => {
      if (user.manager_id && visible.has(user.manager_id) && !visible.has(user.id)) {
        visible.add(user.id);
        changed = true;
      }
    });
  }
  return users.filter((user) => visible.has(user.id));
}

function statusFromCompletion(completion) {
  if (completion >= 90) return 'completed';
  if (completion >= 35) return 'on_track';
  return 'not_started';
}

function buildTimeline(sheet, checkins = []) {
  if (!sheet) return [];
  const sheetId = sheet.id || sheet.goal_sheet_id;
  const events = [
    { stage: 'Draft', timestamp: sheet.created_at, actor: 'Employee', reference: `GS-${sheetId}` },
  ];
  if (sheet.submitted_at) events.push({ stage: 'Submitted', timestamp: sheet.submitted_at, actor: 'Employee', reference: `GS-${sheetId}` });
  if (sheet.reviewed_at) events.push({ stage: sheet.status === 'approved' ? 'Approved' : 'Reviewed', timestamp: sheet.reviewed_at, actor: sheet.reviewer_name || 'Manager', comment: sheet.review_comments, reference: `GS-${sheetId}` });
  checkins.slice(0, 4).forEach((entry, index) => {
    events.push({
      stage: `Q${index + 1} Updated`,
      timestamp: entry.checkin_date || entry.created_at,
      actor: 'Employee',
      comment: entry.employee_comment,
      reference: `CHK-${entry.id}`,
    });
  });
  return events;
}

router.get('/dashboard', requireRole('admin', 'manager'), async (req, res) => {
  try {
    await ensureOrgSchema();
    const [users] = await query(
      `SELECT u.id, u.employee_code, u.first_name, u.last_name, u.email, u.role, u.manager_id,
              d.id AS department_id, d.name AS department, des.title AS designation
       FROM users u
       JOIN departments d ON d.id = u.department_id
       JOIN designations des ON des.id = u.designation_id
       WHERE u.is_active = 1
       ORDER BY FIELD(u.role, 'admin', 'manager', 'employee'), d.name, u.first_name`
    );
    const visibleUsers = getVisibleUsers(users, req.user);
    const visibleIds = visibleUsers.map((user) => user.id);
    if (!visibleIds.length) return res.json({ nodes: [], edges: [], analytics: {}, notifications: [], auditLogs: [], escalations: [], timelines: [] });

    const placeholders = visibleIds.map(() => '?').join(',');
    const [goalRows] = await query(
      `SELECT gs.id AS sheet_id, gs.employee_id, gs.status AS sheet_status, gs.submitted_at, gs.reviewed_at, gs.review_comments,
              CONCAT(rv.first_name, ' ', rv.last_name) AS reviewer_name,
              g.id AS goal_id, g.title, g.weightage, g.achievement, g.status AS goal_status, g.is_shared, g.shared_goal_id, g.parent_goal_id,
              q.label AS quarter_label, fy.label AS fy_label
       FROM goal_sheets gs
       JOIN quarters q ON q.id = gs.quarter_id
       JOIN financial_years fy ON fy.id = q.financial_year_id
       LEFT JOIN users rv ON rv.id = gs.reviewed_by
       LEFT JOIN goals g ON g.goal_sheet_id = gs.id
       WHERE gs.employee_id IN (${placeholders}) AND q.is_current = 1`,
      visibleIds
    );
    const [checkins] = await query(
      `SELECT gc.*
       FROM goal_checkins gc
       JOIN goals g ON g.id = gc.goal_id
       JOIN goal_sheets gs ON gs.id = g.goal_sheet_id
       WHERE gs.employee_id IN (${placeholders})
       ORDER BY gc.checkin_date DESC`,
      visibleIds
    );
    const [notifications] = await query(
      `SELECT n.*, CONCAT(u.first_name, ' ', u.last_name) AS user_name
       FROM notifications n
       JOIN users u ON u.id = n.user_id
       WHERE n.user_id IN (${placeholders})
       ORDER BY n.created_at DESC LIMIT 30`,
      visibleIds
    );
    const [auditLogs] = await query(
      `SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) AS actor_name
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.user_id IS NULL OR a.user_id IN (${placeholders})
       ORDER BY a.created_at DESC LIMIT 40`,
      visibleIds
    );
    const [escalations] = await query(
      `SELECT e.*, CONCAT(emp.first_name, ' ', emp.last_name) AS employee_name,
              CONCAT(owner.first_name, ' ', owner.last_name) AS owner_name
       FROM escalations e
       JOIN users emp ON emp.id = e.employee_id
       LEFT JOIN users owner ON owner.id = e.assigned_to
       WHERE e.employee_id IN (${placeholders})
       ORDER BY e.created_at DESC LIMIT 30`,
      visibleIds
    );
    const [sharedGoals] = await query(
      `SELECT sg.*, d.name AS department, ta.name AS thrust_area
       FROM shared_goals sg
       LEFT JOIN departments d ON d.id = sg.department_id
       JOIN thrust_areas ta ON ta.id = sg.thrust_area_id
       WHERE sg.is_active = 1
       ORDER BY sg.created_at DESC LIMIT 30`
    );

    const goalsByUser = new Map();
    const sheetsByUser = new Map();
    goalRows.forEach((row) => {
      if (!sheetsByUser.has(row.employee_id)) sheetsByUser.set(row.employee_id, row);
      if (row.goal_id) {
        const current = goalsByUser.get(row.employee_id) || [];
        current.push(row);
        goalsByUser.set(row.employee_id, current);
      }
    });
    const checkinsByUser = new Map();
    checkins.forEach((entry) => {
      const goal = goalRows.find((row) => row.goal_id === entry.goal_id);
      if (!goal) return;
      const current = checkinsByUser.get(goal.employee_id) || [];
      current.push(entry);
      checkinsByUser.set(goal.employee_id, current);
    });

    const nodes = visibleUsers.map((user) => {
      const goals = goalsByUser.get(user.id) || [];
      const completion = goals.length
        ? Math.round(goals.reduce((sum, goal) => sum + Number(goal.achievement || 0), 0) / goals.length)
        : 0;
      const pendingApprovals = goals.length ? 0 : 1;
      const userEscalations = escalations.filter((item) => item.employee_id === user.id && item.status !== 'resolved');
      return {
        id: `user-${user.id}`,
        type: user.role,
        userId: user.id,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        department: user.department,
        designation: user.designation,
        completion,
        status: statusFromCompletion(completion),
        activeGoals: goals.length,
        pendingApprovals,
        escalations: userEscalations.length,
        sheetStatus: sheetsByUser.get(user.id)?.sheet_status || 'missing',
        linkedGoals: goals.filter((goal) => goal.is_shared || goal.parent_goal_id).length,
      };
    });

    const visibleSet = new Set(visibleUsers.map((user) => user.id));
    const edges = visibleUsers
      .filter((user) => user.manager_id && visibleSet.has(user.manager_id))
      .map((user) => ({
        id: `edge-${user.manager_id}-${user.id}`,
        source: `user-${user.manager_id}`,
        target: `user-${user.id}`,
        animated: true,
      }));

    const departments = Array.from(new Set(visibleUsers.map((user) => user.department)));
    const departmentCompletion = departments.map((department) => {
      const deptNodes = nodes.filter((node) => node.department === department);
      return {
        department,
        completion: deptNodes.length ? Math.round(deptNodes.reduce((sum, node) => sum + node.completion, 0) / deptNodes.length) : 0,
        employees: deptNodes.length,
      };
    });

    const managerEffectiveness = nodes
      .filter((node) => node.role === 'manager' || node.role === 'admin')
      .map((manager) => {
        const childIds = visibleUsers.filter((user) => user.manager_id === manager.userId).map((user) => user.id);
        const childNodes = nodes.filter((node) => childIds.includes(node.userId));
        return {
          name: manager.name.split(' ')[0],
          completion: childNodes.length ? Math.round(childNodes.reduce((sum, node) => sum + node.completion, 0) / childNodes.length) : manager.completion,
          pending: childNodes.reduce((sum, node) => sum + node.pendingApprovals, 0),
        };
      });

    const statusCounts = ['not_started', 'on_track', 'completed'].map((status) => ({
      name: status.replace('_', ' '),
      value: nodes.filter((node) => node.status === status).length,
    }));
    const sharedDistribution = departments.map((department) => ({
      department,
      linked: nodes.filter((node) => node.department === department).reduce((sum, node) => sum + node.linkedGoals, 0),
    }));
    const quarterlyTrends = ['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, index) => ({
      quarter,
      completion: Math.min(100, Math.round((nodes.reduce((sum, node) => sum + node.completion, 0) / Math.max(nodes.length, 1)) * (0.7 + index * 0.1))),
    }));

    const timelines = Array.from(sheetsByUser.entries()).slice(0, 8).map(([userId, sheet]) => {
      const user = visibleUsers.find((entry) => entry.id === userId);
      return {
        userId,
        employeeName: user ? `${user.first_name} ${user.last_name}` : 'Employee',
        events: buildTimeline(sheet, checkinsByUser.get(userId) || []),
      };
    });

    res.json({
      nodes,
      edges,
      analytics: {
        totals: {
          people: nodes.length,
          managers: nodes.filter((node) => node.role === 'manager').length,
          employees: nodes.filter((node) => node.role === 'employee').length,
          avgCompletion: nodes.length ? Math.round(nodes.reduce((sum, node) => sum + node.completion, 0) / nodes.length) : 0,
          openEscalations: escalations.filter((item) => item.status !== 'resolved').length,
          sharedGoals: sharedGoals.length,
        },
        managerEffectiveness,
        departmentCompletion,
        statusCounts,
        sharedDistribution,
        quarterlyTrends,
        leaderboard: [...nodes].sort((a, b) => b.completion - a.completion).slice(0, 6),
      },
      sharedGoals,
      notifications,
      auditLogs,
      escalations,
      timelines,
    });
  } catch (err) {
    console.error('Org intelligence dashboard error:', err);
    res.status(500).json({ error: 'Failed to load organizational intelligence' });
  }
});

router.post('/cascade-goal', requireRole('admin', 'manager'), async (req, res) => {
  try {
    await ensureOrgSchema();
    const { assigneeId, title, description, thrustAreaId, targetValue, uomType = 'percentage', weightage = 10, departmentId } = req.body;
    if (!assigneeId || !title?.trim() || !thrustAreaId || !targetValue) {
      return res.status(400).json({ error: 'Assignee, title, thrust area, and target are required' });
    }
    if (Number(weightage) < 10 || Number(weightage) > 100) {
      return res.status(400).json({ error: 'Weightage must be between 10 and 100' });
    }

    const [allUsers] = await query('SELECT id, manager_id, department_id, first_name, last_name, role FROM users WHERE is_active = 1');
    const visible = getVisibleUsers(allUsers, req.user);
    if (!visible.some((user) => user.id === Number(assigneeId))) {
      return res.status(403).json({ error: 'Assignee is outside your organization scope' });
    }

    const childIds = new Set();
    let changed = true;
    while (changed) {
      changed = false;
      allUsers.forEach((user) => {
        if ((user.manager_id === Number(assigneeId) || childIds.has(user.manager_id)) && user.role === 'employee' && !childIds.has(user.id)) {
          childIds.add(user.id);
          changed = true;
        }
      });
    }
    const employeeIds = [...childIds];
    if (!employeeIds.length) return res.status(400).json({ error: 'Selected node has no child employees to cascade to' });

    const result = await transaction(async (conn) => {
      const [quarterRows] = await conn.execute('SELECT id FROM quarters WHERE is_current = 1 LIMIT 1');
      if (!quarterRows.length) throw new Error('No active quarter');
      const quarterId = quarterRows[0].id;

      const [sharedResult] = await conn.execute(
        `INSERT INTO shared_goals (title, description, thrust_area_id, uom_type, target_value, department_id, quarter_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title.trim(), description || null, thrustAreaId, uomType, targetValue, departmentId || null, quarterId, req.user.id]
      );
      const sharedGoalId = sharedResult.insertId;

      let parentGoalId = null;
      const [assigneeSheets] = await conn.execute('SELECT id FROM goal_sheets WHERE employee_id = ? AND quarter_id = ?', [assigneeId, quarterId]);
      let assigneeSheetId = assigneeSheets[0]?.id;
      if (!assigneeSheetId) {
        const [sheetResult] = await conn.execute('INSERT INTO goal_sheets (employee_id, quarter_id, status) VALUES (?, ?, ?)', [assigneeId, quarterId, 'draft']);
        assigneeSheetId = sheetResult.insertId;
      }
      const [parentGoal] = await conn.execute(
        `INSERT INTO goals (goal_sheet_id, thrust_area_id, title, description, uom_type, target_value, weightage, is_shared, shared_goal_id, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 99)`,
        [assigneeSheetId, thrustAreaId, title.trim(), description || null, uomType, targetValue, weightage, sharedGoalId]
      );
      parentGoalId = parentGoal.insertId;

      let created = 0;
      for (const employeeId of employeeIds) {
        const [existingSheets] = await conn.execute('SELECT id, status FROM goal_sheets WHERE employee_id = ? AND quarter_id = ?', [employeeId, quarterId]);
        let sheetId = existingSheets[0]?.id;
        const sheetStatus = existingSheets[0]?.status;
        if (!sheetId) {
          const [sheetResult] = await conn.execute('INSERT INTO goal_sheets (employee_id, quarter_id, status) VALUES (?, ?, ?)', [employeeId, quarterId, 'draft']);
          sheetId = sheetResult.insertId;
        } else if (!['draft', 'rework'].includes(sheetStatus)) {
          continue;
        }
        const [duplicate] = await conn.execute('SELECT id FROM goals WHERE goal_sheet_id = ? AND shared_goal_id = ?', [sheetId, sharedGoalId]);
        if (duplicate.length) continue;
        const [totalRows] = await conn.execute('SELECT COALESCE(SUM(weightage), 0) AS total FROM goals WHERE goal_sheet_id = ?', [sheetId]);
        if (Number(totalRows[0].total) + Number(weightage) > 100) continue;
        await conn.execute(
          `INSERT INTO goals (goal_sheet_id, thrust_area_id, title, description, uom_type, target_value, weightage, is_shared, shared_goal_id, parent_goal_id, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 99)`,
          [sheetId, thrustAreaId, title.trim(), description || null, uomType, targetValue, weightage, sharedGoalId, parentGoalId]
        );
        await conn.execute(
          `INSERT INTO notifications (user_id, type, title, message, link)
           VALUES (?, 'shared_goal', 'Linked KPI Assigned', ?, '/employee/goal-sheet')`,
          [employeeId, `${title.trim()} was cascaded to your current goal sheet.`]
        );
        created += 1;
      }

      await conn.execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, target_label, details, metadata)
         VALUES (?, 'Cascading KPI Assigned', 'shared_goal', ?, ?, ?, ?)`,
        [req.user.id, sharedGoalId, title.trim(), `Cascaded to ${created} employees`, JSON.stringify({ before: null, after: { weightage, targetValue, assigneeId, employees: created } })]
      );

      return { sharedGoalId, parentGoalId, created };
    });

    res.status(201).json({ success: true, ...result });
  } catch (err) {
    console.error('Cascade goal error:', err);
    res.status(500).json({ error: err.message || 'Failed to cascade goal' });
  }
});

export default router;
