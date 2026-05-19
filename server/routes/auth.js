import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [users] = await query(
      `SELECT u.*, d.name AS department_name, d.code AS department_code,
              des.title AS designation_title, des.level AS designation_level,
              mgr.first_name AS manager_first_name, mgr.last_name AS manager_last_name
       FROM users u
       JOIN departments d ON u.department_id = d.id
       JOIN designations des ON u.designation_id = des.id
       LEFT JOIN users mgr ON u.manager_id = mgr.id
       WHERE u.email = ? AND u.is_active = 1`, [email]
    );

    if (!users.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, employeeCode: user.employee_code },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    res.json({
      token,
      user: {
        id: user.id,
        employeeCode: user.employee_code,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        departmentId: user.department_id,
        department: user.department_name,
        designationId: user.designation_id,
        designation: user.designation_title,
        managerId: user.manager_id,
        managerName: user.manager_first_name ? `${user.manager_first_name} ${user.manager_last_name}` : null,
        avatar: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const employeeCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Default to 'employee' role, department 1, designation 1, active
    const result = await query(
      `INSERT INTO users (employee_code, first_name, last_name, email, password_hash, role, department_id, designation_id, is_active)
       VALUES (?, ?, ?, ?, ?, 'employee', 1, 1, 1)`,
      [employeeCode, firstName.trim(), lastName.trim(), email.trim(), passwordHash]
    );
    
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, target_label, details)
       VALUES (?, 'User Registered', 'user', ?, ?, ?)`,
      [result.insertId, result.insertId, employeeCode, 'New user self-registered']
    );
    
    res.status(201).json({ success: true, message: 'Registration successful. Please log in.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me — get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await query(
      `SELECT u.*, d.name AS department_name, des.title AS designation_title,
              mgr.first_name AS manager_first_name, mgr.last_name AS manager_last_name
       FROM users u
       JOIN departments d ON u.department_id = d.id
       JOIN designations des ON u.designation_id = des.id
       LEFT JOIN users mgr ON u.manager_id = mgr.id
       WHERE u.id = ?`, [req.user.id]
    );
    if (!users.length) return res.status(404).json({ error: 'User not found' });
    const u = users[0];
    res.json({
      id: u.id, employeeCode: u.employee_code,
      name: `${u.first_name} ${u.last_name}`,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      departmentId: u.department_id, department: u.department_name,
      designationId: u.designation_id, designation: u.designation_title,
      managerId: u.manager_id,
      managerName: u.manager_first_name ? `${u.manager_first_name} ${u.manager_last_name}` : null,
      avatar: u.avatar_url,
    });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/me — update editable profile fields
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, avatar } = req.body;
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    const [existing] = await query('SELECT id FROM users WHERE email = ? AND id <> ?', [email.trim(), req.user.id]);
    if (existing.length) {
      return res.status(409).json({ error: 'Email is already used by another employee' });
    }

    await query(
      `UPDATE users
       SET first_name = ?, last_name = ?, email = ?, phone = ?, avatar_url = ?
       WHERE id = ?`,
      [firstName.trim(), lastName.trim(), email.trim(), phone?.trim() || null, avatar?.trim() || null, req.user.id]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, target_label, details)
       VALUES (?, 'Profile Updated', 'user', ?, ?, ?)`,
      [req.user.id, req.user.id, req.user.employeeCode, 'Employee updated profile details']
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/auth/password — change own password
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const [rows] = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, target_label, details)
       VALUES (?, 'Password Changed', 'user', ?, ?, ?)`,
      [req.user.id, req.user.id, req.user.employeeCode, 'Employee changed password']
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
