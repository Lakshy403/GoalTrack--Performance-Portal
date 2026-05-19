/**
 * GoalTrack — Database Configuration
 * Uses mysql2 with connection pooling
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env', import.meta.url) });

const pool = mysql.createPool({
  host:               process.env.DB_HOST || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER || 'root',
  password:           process.env.DB_PASS || '',
  database:           process.env.DB_NAME || 'goaltrack_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           '+00:00',
  // Automatic date/string conversion
  typeCast: (field, next) => {
    if (field.type === 'TINY' && field.length === 1) {
      return field.string() === '1';
    }
    return next();
  },
});

/**
 * Execute a raw SQL query.
 * @param {string} sql  - The SQL query string
 * @param {any[]}  params - Parameterized values
 * @returns {Promise<[any[], any]>}
 */
export async function query(sql, params = []) {
  const [rows, fields] = await pool.execute(sql, params);
  return [rows, fields];
}

/**
 * Get a single connection from the pool (for transactions).
 * Caller MUST call conn.release() when done.
 */
export async function getConnection() {
  return pool.getConnection();
}

/**
 * Run a callback inside a transaction.
 * Auto-commits on success, rolls back on error.
 */
export async function transaction(callback) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export default pool;
