import BaseModel from './BaseModel.js';
import { query } from '../config/database.js';

class User extends BaseModel {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    return this.findOne({ email });
  }

  async findByEmployeeCode(code) {
    return this.findOne({ employee_code: code });
  }

  /** Get user with department and designation joined */
  async findWithDetails(id) {
    const [rows] = await query(`
      SELECT u.*, d.name AS department_name, d.code AS department_code,
             des.title AS designation_title, des.level AS designation_level,
             mgr.first_name AS manager_first_name, mgr.last_name AS manager_last_name
      FROM users u
      JOIN departments d ON u.department_id = d.id
      JOIN designations des ON u.designation_id = des.id
      LEFT JOIN users mgr ON u.manager_id = mgr.id
      WHERE u.id = ?
    `, [id]);
    return rows[0] || null;
  }

  /** Get all direct reports for a manager */
  async findDirectReports(managerId) {
    return this.findAll({ where: { manager_id: managerId, is_active: 1 }, orderBy: 'first_name ASC' });
  }

  /** Get users by department */
  async findByDepartment(departmentId) {
    return this.findAll({ where: { department_id: departmentId, is_active: 1 }, orderBy: 'first_name ASC' });
  }

  /** Get users by role */
  async findByRole(role) {
    return this.findAll({ where: { role, is_active: 1 }, orderBy: 'first_name ASC' });
  }

  /** Update last login */
  async updateLastLogin(id) {
    return this.update(id, { last_login_at: new Date() });
  }
}

export default new User();
