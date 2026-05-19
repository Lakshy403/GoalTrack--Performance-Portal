import BaseModel from './BaseModel.js';
import { query, transaction } from '../config/database.js';

class GoalSheet extends BaseModel {
  constructor() {
    super('goal_sheets');
  }

  /** Get a goal sheet with all goals expanded */
  async findWithGoals(id) {
    const sheet = await this.findById(id);
    if (!sheet) return null;
    const [goals] = await query(
      `SELECT g.*, ta.name AS thrust_area_name
       FROM goals g
       JOIN thrust_areas ta ON g.thrust_area_id = ta.id
       WHERE g.goal_sheet_id = ?
       ORDER BY g.sort_order ASC`, [id]
    );
    return { ...sheet, goals };
  }

  /** Get goal sheet for an employee in a specific quarter */
  async findByEmployeeQuarter(employeeId, quarterId) {
    return this.findOne({ employee_id: employeeId, quarter_id: quarterId });
  }

  /** Get all pending reviews for a manager */
  async findPendingReviews(managerId) {
    const [rows] = await query(`
      SELECT gs.*, u.first_name, u.last_name, u.employee_code,
             d.name AS department_name, des.title AS designation_title,
             (SELECT COUNT(*) FROM goals WHERE goal_sheet_id = gs.id) AS goal_count
      FROM goal_sheets gs
      JOIN users u ON gs.employee_id = u.id
      JOIN departments d ON u.department_id = d.id
      JOIN designations des ON u.designation_id = des.id
      WHERE u.manager_id = ? AND gs.status IN ('submitted','under_review')
      ORDER BY gs.submitted_at ASC
    `, [managerId]);
    return rows;
  }

  /** Submit a goal sheet (validate weightage = 100) */
  async submit(id) {
    return transaction(async (conn) => {
      // Validate total weightage
      const [[{ total }]] = await conn.execute(
        'SELECT COALESCE(SUM(weightage), 0) AS total FROM goals WHERE goal_sheet_id = ?', [id]
      );
      if (Math.abs(total - 100) > 0.01) {
        throw new Error(`Total weightage must equal 100% (currently ${total}%)`);
      }
      // Validate goal count
      const [[{ cnt }]] = await conn.execute(
        'SELECT COUNT(*) AS cnt FROM goals WHERE goal_sheet_id = ?', [id]
      );
      if (cnt < 1 || cnt > 8) {
        throw new Error(`Goal count must be between 1 and 8 (currently ${cnt})`);
      }
      // Update status
      await conn.execute(
        'UPDATE goal_sheets SET status = ?, submitted_at = NOW() WHERE id = ?',
        ['submitted', id]
      );
      return { success: true, goalCount: cnt, totalWeightage: total };
    });
  }

  /** Get department-level aggregation for admin dashboard */
  async getDepartmentStats() {
    const [rows] = await query(`
      SELECT d.name AS department, d.id AS department_id,
             COUNT(DISTINCT u.id) AS total_employees,
             COUNT(DISTINCT CASE WHEN gs.status = 'submitted' THEN gs.id END) AS goals_submitted,
             COUNT(DISTINCT CASE WHEN gs.status = 'approved' THEN gs.id END) AS goals_approved,
             ROUND(AVG(CASE WHEN g.achievement IS NOT NULL THEN g.achievement ELSE 0 END), 0) AS avg_completion,
             SUM(CASE WHEN g.status = 'on_track' THEN 1 ELSE 0 END) AS on_track,
             SUM(CASE WHEN g.status = 'at_risk' THEN 1 ELSE 0 END) AS at_risk,
             SUM(CASE WHEN g.status = 'overdue' THEN 1 ELSE 0 END) AS overdue
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id AND u.is_active = 1 AND u.role = 'employee'
      LEFT JOIN goal_sheets gs ON gs.employee_id = u.id
      LEFT JOIN goals g ON g.goal_sheet_id = gs.id
      WHERE d.id NOT IN (7)
      GROUP BY d.id, d.name
      ORDER BY d.name
    `);
    return rows;
  }
}

export default new GoalSheet();
