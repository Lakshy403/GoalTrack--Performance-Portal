import { Router } from 'express';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const UOM_TYPES = new Set(['percentage', 'number', 'currency', 'rating', 'boolean', 'date']);
const SCORE_METHODS = new Set(['min', 'max', 'timeline', 'zero']);

async function columnExists(tableName, columnName) {
  const [rows] = await query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return Number(rows[0].count) > 0;
}

async function ensureGoalSchema() {
  if (!(await columnExists('goals', 'score_method'))) {
    await query("ALTER TABLE goals ADD COLUMN score_method ENUM('min','max','timeline','zero') NOT NULL DEFAULT 'min' AFTER uom_type");
  }
}

function validateGoalPayload({ thrustAreaId, title, targetValue, weightage, uomType, scoreMethod }, { partial = false } = {}) {
  if (!partial || thrustAreaId !== undefined) {
    if (!Number.isInteger(Number(thrustAreaId)) || Number(thrustAreaId) <= 0) return 'Valid thrust area is required';
  }
  if (!partial || title !== undefined) {
    if (!title?.trim()) return 'Goal title is required';
  }
  if (!partial || targetValue !== undefined) {
    if (targetValue === undefined || targetValue === null || String(targetValue).trim() === '') return 'Target value is required';
  }
  if (!partial || weightage !== undefined) {
    const numericWeightage = Number(weightage);
    if (!Number.isFinite(numericWeightage) || numericWeightage < 10 || numericWeightage > 100) {
      return 'Weightage must be between 10% and 100%';
    }
  }
  if (uomType !== undefined && !UOM_TYPES.has(uomType)) return 'Invalid UoM type';
  if (scoreMethod !== undefined && !SCORE_METHODS.has(scoreMethod)) return 'Invalid score method';
  return null;
}

async function getSheetWeightage(goalSheetId, excludingGoalId = null) {
  const params = excludingGoalId ? [goalSheetId, excludingGoalId] : [goalSheetId];
  const predicate = excludingGoalId ? 'goal_sheet_id = ? AND id <> ?' : 'goal_sheet_id = ?';
  const [rows] = await query(`SELECT COALESCE(SUM(weightage), 0) AS total FROM goals WHERE ${predicate}`, params);
  return Number(rows[0]?.total || 0);
}

// GET /api/goals?sheetId=X — all goals for a sheet
router.get('/', async (req, res) => {
  try {
    const { sheetId } = req.query;
    if (!sheetId) return res.status(400).json({ error: 'sheetId is required' });

    // Verify ownership
    const [sheets] = await query(
      'SELECT id FROM goal_sheets WHERE id = ? AND employee_id = ?', [sheetId, req.user.id]
    );
    if (!sheets.length) return res.status(404).json({ error: 'Goal sheet not found' });

    const [goals] = await query(
      `SELECT g.*, ta.name AS thrust_area_name
       FROM goals g
       JOIN thrust_areas ta ON g.thrust_area_id = ta.id
       WHERE g.goal_sheet_id = ?
       ORDER BY g.sort_order ASC`, [sheetId]
    );
    res.json(goals);
  } catch (err) {
    console.error('Get goals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST /api/goals — add a goal to a sheet
router.post('/', async (req, res) => {
  try {
    await ensureGoalSchema();
    const { goalSheetId, thrustAreaId, title, description, uomType, targetValue, weightage, isShared, sharedGoalId, sortOrder, scoreMethod } = req.body;
    const payloadError = isShared
      ? validateGoalPayload({ thrustAreaId: 1, title: 'Shared goal', targetValue: 'Shared target', weightage, uomType: undefined, scoreMethod })
      : validateGoalPayload({ thrustAreaId, title, targetValue, weightage, uomType, scoreMethod });
    if (payloadError) return res.status(400).json({ error: payloadError });

    // Verify sheet ownership and status
    const [sheets] = await query(
      'SELECT * FROM goal_sheets WHERE id = ? AND employee_id = ?', [goalSheetId, req.user.id]
    );
    if (!sheets.length) return res.status(404).json({ error: 'Goal sheet not found' });
    if (!['draft', 'rework'].includes(sheets[0].status)) {
      return res.status(400).json({ error: 'Cannot add goals to a submitted/approved sheet' });
    }

    // Check goal count
    const [countRows] = await query('SELECT COUNT(*) AS cnt FROM goals WHERE goal_sheet_id = ?', [goalSheetId]);
    if (countRows[0].cnt >= 8) {
      return res.status(400).json({ error: 'Maximum 8 goals allowed per sheet' });
    }

    const existingWeightage = await getSheetWeightage(goalSheetId);
    if (existingWeightage + Number(weightage) > 100) {
      return res.status(400).json({ error: `Total weightage cannot exceed 100% (currently ${existingWeightage}%)` });
    }

    let finalGoal = {
      thrustAreaId,
      title: title?.trim(),
      description: description || null,
      uomType: uomType || 'percentage',
      scoreMethod: scoreMethod || 'min',
      targetValue: targetValue === undefined || targetValue === null ? '' : String(targetValue).trim(),
      weightage: Number(weightage),
      isShared: isShared ? 1 : 0,
      sharedGoalId: sharedGoalId || null,
    };

    if (isShared) {
      if (!sharedGoalId) return res.status(400).json({ error: 'sharedGoalId is required for shared goals' });
      const [sharedRows] = await query(
        `SELECT sg.*
         FROM shared_goals sg
         JOIN goal_sheets gs ON gs.quarter_id = sg.quarter_id
         JOIN users u ON u.id = gs.employee_id
         WHERE sg.id = ? AND gs.id = ? AND sg.is_active = 1
           AND (sg.department_id IS NULL OR sg.department_id = u.department_id)`,
        [sharedGoalId, goalSheetId]
      );
      if (!sharedRows.length) return res.status(400).json({ error: 'Shared goal is not available for this sheet' });
      const shared = sharedRows[0];
      finalGoal = {
        ...finalGoal,
        thrustAreaId: shared.thrust_area_id,
        title: shared.title,
        description: shared.description || description || null,
        uomType: shared.uom_type,
        scoreMethod: scoreMethod || 'min',
        targetValue: shared.target_value,
        isShared: 1,
        sharedGoalId: shared.id,
      };
    }

    const [result] = await query(
      `INSERT INTO goals (goal_sheet_id, thrust_area_id, title, description, uom_type, score_method, target_value, weightage, is_shared, shared_goal_id, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [goalSheetId, finalGoal.thrustAreaId, finalGoal.title, finalGoal.description, finalGoal.uomType, finalGoal.scoreMethod, finalGoal.targetValue, finalGoal.weightage, finalGoal.isShared, finalGoal.sharedGoalId, sortOrder || 0]
    );

    const [newGoal] = await query(
      `SELECT g.*, ta.name AS thrust_area_name FROM goals g
       JOIN thrust_areas ta ON g.thrust_area_id = ta.id WHERE g.id = ?`, [result.insertId]
    );
    res.status(201).json(newGoal[0]);
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT /api/goals/:id — update a goal
router.put('/:id', async (req, res) => {
  try {
    await ensureGoalSchema();
    const goalId = parseInt(req.params.id);
    const { thrustAreaId, title, description, uomType, targetValue, weightage, sortOrder, scoreMethod } = req.body;
    const payloadError = validateGoalPayload({ thrustAreaId, title, targetValue, weightage, uomType, scoreMethod }, { partial: true });
    if (payloadError) return res.status(400).json({ error: payloadError });

    // Verify ownership via sheet
    const [goals] = await query(
      `SELECT g.*, gs.employee_id, gs.status AS sheet_status FROM goals g
       JOIN goal_sheets gs ON g.goal_sheet_id = gs.id
       WHERE g.id = ?`, [goalId]
    );
    if (!goals.length) return res.status(404).json({ error: 'Goal not found' });
    if (goals[0].employee_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    if (!['draft', 'rework'].includes(goals[0].sheet_status)) {
      return res.status(400).json({ error: 'Cannot edit goals on a submitted/approved sheet' });
    }

    const updates = {};
    const isSharedGoal = Boolean(goals[0].is_shared);
    if (!isSharedGoal && thrustAreaId !== undefined) updates.thrust_area_id = thrustAreaId;
    if (!isSharedGoal && title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description;
    if (!isSharedGoal && uomType !== undefined) updates.uom_type = uomType;
    if (!isSharedGoal && scoreMethod !== undefined) updates.score_method = scoreMethod;
    if (!isSharedGoal && targetValue !== undefined) updates.target_value = String(targetValue).trim();
    if (weightage !== undefined) {
      const existingWeightage = await getSheetWeightage(goals[0].goal_sheet_id, goalId);
      if (existingWeightage + Number(weightage) > 100) {
        return res.status(400).json({ error: `Total weightage cannot exceed 100% (currently ${existingWeightage}%)` });
      }
      updates.weightage = Number(weightage);
    }
    if (sortOrder !== undefined) updates.sort_order = sortOrder;

    const keys = Object.keys(updates);
    if (!keys.length) return res.status(400).json({ error: 'No fields to update' });

    const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
    await query(`UPDATE goals SET ${setClause} WHERE id = ?`, [...Object.values(updates), goalId]);

    const [updated] = await query(
      `SELECT g.*, ta.name AS thrust_area_name FROM goals g
       JOIN thrust_areas ta ON g.thrust_area_id = ta.id WHERE g.id = ?`, [goalId]
    );
    res.json(updated[0]);
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', async (req, res) => {
  try {
    const goalId = parseInt(req.params.id);
    const [goals] = await query(
      `SELECT g.*, gs.employee_id, gs.status AS sheet_status FROM goals g
       JOIN goal_sheets gs ON g.goal_sheet_id = gs.id WHERE g.id = ?`, [goalId]
    );
    if (!goals.length) return res.status(404).json({ error: 'Goal not found' });
    if (goals[0].employee_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    if (!['draft', 'rework'].includes(goals[0].sheet_status)) {
      return res.status(400).json({ error: 'Cannot delete goals on a submitted/approved sheet' });
    }

    await query('DELETE FROM goals WHERE id = ?', [goalId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
