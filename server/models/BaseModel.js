/**
 * BaseModel — Provides common CRUD operations.
 * All domain models extend this class.
 */
import { query, transaction } from '../config/database.js';

export default class BaseModel {
  /**
   * @param {string} table   - Table name
   * @param {string} primary - Primary key column (default: 'id')
   */
  constructor(table, primary = 'id') {
    this.table = table;
    this.primary = primary;
  }

  /** Find by primary key */
  async findById(id) {
    const [rows] = await query(`SELECT * FROM \`${this.table}\` WHERE \`${this.primary}\` = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  /** Find one row matching conditions */
  async findOne(conditions = {}) {
    const { clause, values } = this._buildWhere(conditions);
    const [rows] = await query(`SELECT * FROM \`${this.table}\` ${clause} LIMIT 1`, values);
    return rows[0] || null;
  }

  /** Find all rows matching conditions with optional ordering & pagination */
  async findAll({ where = {}, orderBy = null, limit = null, offset = null } = {}) {
    const { clause, values } = this._buildWhere(where);
    let sql = `SELECT * FROM \`${this.table}\` ${clause}`;
    if (orderBy) sql += ` ORDER BY ${orderBy}`;
    if (limit) { sql += ` LIMIT ?`; values.push(limit); }
    if (offset) { sql += ` OFFSET ?`; values.push(offset); }
    const [rows] = await query(sql, values);
    return rows;
  }

  /** Count rows matching conditions */
  async count(conditions = {}) {
    const { clause, values } = this._buildWhere(conditions);
    const [rows] = await query(`SELECT COUNT(*) AS cnt FROM \`${this.table}\` ${clause}`, values);
    return rows[0].cnt;
  }

  /** Insert a new row, returns insertId */
  async create(data) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO \`${this.table}\` (${keys.map(k => `\`${k}\``).join(', ')}) VALUES (${placeholders})`;
    const [result] = await query(sql, Object.values(data));
    return result.insertId;
  }

  /** Update by primary key */
  async update(id, data) {
    const keys = Object.keys(data);
    const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
    const sql = `UPDATE \`${this.table}\` SET ${setClause} WHERE \`${this.primary}\` = ?`;
    const [result] = await query(sql, [...Object.values(data), id]);
    return result.affectedRows;
  }

  /** Delete by primary key */
  async delete(id) {
    const [result] = await query(`DELETE FROM \`${this.table}\` WHERE \`${this.primary}\` = ?`, [id]);
    return result.affectedRows;
  }

  /** Soft delete (set is_active = 0) */
  async softDelete(id) {
    return this.update(id, { is_active: 0 });
  }

  /** Raw query passthrough */
  async raw(sql, params = []) {
    return query(sql, params);
  }

  /** Build WHERE clause from object */
  _buildWhere(conditions) {
    const keys = Object.keys(conditions);
    if (!keys.length) return { clause: '', values: [] };
    const parts = keys.map(k => `\`${k}\` = ?`);
    return { clause: `WHERE ${parts.join(' AND ')}`, values: Object.values(conditions) };
  }
}
