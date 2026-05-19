import BaseModel from './BaseModel.js';
import { query } from '../config/database.js';

class Goal extends BaseModel {
  constructor() {
    super('goals');
  }

  /** Get all goals for a sheet with thrust area names */
  async findBySheet(goalSheetId) {
    const [rows] = await query(`
      SELECT g.*, ta.name AS thrust_area_name
      FROM goals g
      JOIN thrust_areas ta ON g.thrust_area_id = ta.id
      WHERE g.goal_sheet_id = ?
      ORDER BY g.sort_order ASC
    `, [goalSheetId]);
    return rows;
  }

  /** Update achievement and status */
  async updateProgress(id, achievement, status) {
    return this.update(id, { achievement, status });
  }

  /** Get total weightage for a sheet (for validation) */
  async getTotalWeightage(goalSheetId) {
    const [rows] = await query(
      'SELECT COALESCE(SUM(weightage), 0) AS total FROM goals WHERE goal_sheet_id = ?',
      [goalSheetId]
    );
    return parseFloat(rows[0].total);
  }
}

export default new Goal();
