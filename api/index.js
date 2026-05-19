import express from 'express';
import cors from 'cors';

let handler;

if (process.env.DB_HOST) {
  const { default: app } = await import('../server/server.js');
  handler = app;
} else {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const users = [
    { id: 1, email: 'admin@gmail.com', role: 'admin', name: 'Rajesh Kumar', firstName: 'Rajesh', lastName: 'Kumar', employeeCode: 'ATM-001', department: 'Human Resources', designation: 'HR Director', managerName: null },
    { id: 2, email: 'manager@gmail.com', role: 'manager', name: 'Priya Sharma', firstName: 'Priya', lastName: 'Sharma', employeeCode: 'ATM-002', department: 'Engineering', designation: 'Engineering Manager', managerName: 'Rajesh Kumar' },
    { id: 4, email: 'employee1@gmail.com', role: 'employee', name: 'Arjun Mehta', firstName: 'Arjun', lastName: 'Mehta', employeeCode: 'ATM-004', department: 'Engineering', designation: 'Senior Developer', managerName: 'Priya Sharma' },
    { id: 5, email: 'employee2@gmail.com', role: 'employee', name: 'Sneha Patel', firstName: 'Sneha', lastName: 'Patel', employeeCode: 'ATM-005', department: 'Engineering', designation: 'Frontend Lead', managerName: 'Priya Sharma' },
  ];

  const thrustAreas = [
    { id: 1, name: 'Technical Excellence' },
    { id: 2, name: 'Innovation' },
    { id: 3, name: 'Customer Impact' },
    { id: 4, name: 'Team Development' },
    { id: 5, name: 'Process Improvement' },
  ];

  const sheets = [
    { id: 1, employee_id: 4, employeeName: 'Arjun Mehta', employee_code: 'ATM-004', department_name: 'Engineering', status: 'approved', is_locked: true, period: 'Q4 FY 2025-26', goals: [
      { id: 1, goal_sheet_id: 1, title: 'Migrate microservices to Kubernetes', description: 'Complete migration of five core services.', thrust_area_id: 1, thrust_area_name: 'Technical Excellence', uom_type: 'percentage', score_method: 'min', target_value: '100', weightage: 25, achievement: 100, status: 'completed', is_shared: false, checkins: [{ id: 1, quarter: 'Q4', achievement_value: 100, status: 'completed', employee_comment: 'Migration completed.', manager_comment: 'Strong execution.' }] },
      { id: 2, goal_sheet_id: 1, title: 'Reduce API response time', description: 'Shared departmental KPI.', thrust_area_id: 3, thrust_area_name: 'Customer Impact', uom_type: 'number', score_method: 'max', target_value: '200', weightage: 20, achievement: 50, status: 'on_track', is_shared: true, parent_goal_id: 100, checkins: [{ id: 2, quarter: 'Q4', achievement_value: 240, status: 'on_track', employee_comment: 'p95 improved.', manager_comment: '' }] },
      { id: 3, goal_sheet_id: 1, title: 'Conduct technical workshops', description: 'Deliver internal workshops.', thrust_area_id: 4, thrust_area_name: 'Team Development', uom_type: 'number', score_method: 'min', target_value: '4', weightage: 15, achievement: 75, status: 'on_track', is_shared: false, checkins: [] },
      { id: 4, goal_sheet_id: 1, title: 'Achieve 95% test coverage', description: 'Increase test coverage.', thrust_area_id: 5, thrust_area_name: 'Process Improvement', uom_type: 'percentage', score_method: 'min', target_value: '95', weightage: 20, achievement: 90, status: 'on_track', is_shared: true, parent_goal_id: 101, checkins: [] },
      { id: 5, goal_sheet_id: 1, title: 'Zero critical incidents', description: 'Zero-based reliability goal.', thrust_area_id: 5, thrust_area_name: 'Process Improvement', uom_type: 'zero', score_method: 'zero', target_value: '0', weightage: 20, achievement: 100, status: 'completed', is_shared: false, checkins: [] },
    ] },
    { id: 2, employee_id: 5, employeeName: 'Sneha Patel', employee_code: 'ATM-005', department_name: 'Engineering', status: 'submitted', is_locked: true, period: 'Q4 FY 2025-26', goals: [
      { id: 6, goal_sheet_id: 2, title: 'Build design system', description: 'Component library rollout.', thrust_area_id: 1, thrust_area_name: 'Technical Excellence', uom_type: 'zero', score_method: 'zero', target_value: '0', weightage: 30, achievement: 0, status: 'not_started', is_shared: false, checkins: [] },
      { id: 7, goal_sheet_id: 2, title: 'Improve Lighthouse scores', description: 'Performance quality.', thrust_area_id: 3, thrust_area_name: 'Customer Impact', uom_type: 'number', score_method: 'min', target_value: '95', weightage: 25, achievement: 0, status: 'not_started', is_shared: false, checkins: [] },
      { id: 8, goal_sheet_id: 2, title: 'Mentor junior developers', description: 'Mentor two developers.', thrust_area_id: 4, thrust_area_name: 'Team Development', uom_type: 'number', score_method: 'min', target_value: '2', weightage: 20, achievement: 0, status: 'not_started', is_shared: false, checkins: [] },
      { id: 9, goal_sheet_id: 2, title: 'Shared API KPI', description: 'Linked KPI from manager.', thrust_area_id: 3, thrust_area_name: 'Customer Impact', uom_type: 'number', score_method: 'max', target_value: '200', weightage: 25, achievement: 0, status: 'not_started', is_shared: true, parent_goal_id: 100, checkins: [] },
    ] },
  ];

  const notifications = [
    { id: 1, type: 'goal_submitted', title: 'New Submission', message: 'Sneha Patel submitted a goal sheet.', link: '/manager/reviews', is_read: false, created_at: new Date().toISOString() },
    { id: 2, type: 'shared_goal', title: 'Linked KPI Assigned', message: 'Reduce API response time was cascaded to Engineering.', link: '/employee/goals', is_read: false, created_at: new Date().toISOString() },
  ];

  const currentUser = (req) => users.find((u) => `demo-${u.id}` === (req.headers.authorization || '').replace('Bearer ', '')) || users[0];
  const ok = (res, data) => res.json(data);

  app.get('/api/health', (_req, res) => ok(res, { status: 'ok', mode: 'vercel-demo', timestamp: new Date().toISOString() }));
  app.post('/api/auth/login', (req, res) => {
    const user = users.find((u) => u.email === req.body.email);
    if (!user || req.body.password !== 'Test@1234') return res.status(401).json({ error: 'Invalid credentials' });
    ok(res, { token: `demo-${user.id}`, user });
  });
  app.get('/api/auth/me', (req, res) => ok(res, currentUser(req)));
  app.put('/api/auth/me', (req, res) => ok(res, { success: true, user: { ...currentUser(req), ...req.body } }));
  app.put('/api/auth/password', (_req, res) => ok(res, { success: true }));

  app.get('/api/master/thrust-areas', (_req, res) => ok(res, thrustAreas));
  app.get('/api/master/quarters', (_req, res) => ok(res, [{ id: 4, label: 'Q4', fy_label: 'FY 2025-26' }]));
  app.get('/api/master/current-quarter', (_req, res) => ok(res, { id: 4, label: 'Q4', fy_label: 'FY 2025-26' }));
  app.get('/api/master/notifications', (_req, res) => ok(res, notifications));
  app.put('/api/master/notifications/:id/read', (_req, res) => ok(res, { success: true }));
  app.put('/api/master/notifications/read-all', (_req, res) => ok(res, { success: true }));

  app.get('/api/goal-sheets', (req, res) => ok(res, sheets.filter((s) => s.employee_id === currentUser(req).id)));
  app.get('/api/goal-sheets/current', (req, res) => ok(res, sheets.find((s) => s.employee_id === currentUser(req).id) || sheets[0]));
  app.get('/api/goal-sheets/:id', (req, res) => ok(res, sheets.find((s) => s.id === Number(req.params.id)) || sheets[0]));
  app.post('/api/goal-sheets', (req, res) => ok(res, sheets.find((s) => s.employee_id === currentUser(req).id) || sheets[0]));
  app.post('/api/goal-sheets/:id/submit', (_req, res) => ok(res, { success: true, status: 'submitted' }));
  app.get('/api/goals', (req, res) => ok(res, sheets.find((s) => s.id === Number(req.query.sheetId))?.goals || []));
  app.post('/api/goals', (req, res) => req.body.weightage < 10 ? res.status(400).json({ error: 'Minimum weightage is 10%' }) : ok(res, { id: Date.now(), ...req.body }));
  app.put('/api/goals/:id', (req, res) => req.body.weightage < 10 ? res.status(400).json({ error: 'Minimum weightage is 10%' }) : ok(res, { id: Number(req.params.id), ...req.body }));
  app.delete('/api/goals/:id', (_req, res) => ok(res, { success: true }));

  app.get('/api/check-ins/:goalId', (req, res) => ok(res, sheets.flatMap((s) => s.goals).find((g) => g.id === Number(req.params.goalId))?.checkins || []));
  app.post('/api/check-ins', (req, res) => req.body.achievementValue < 0 ? res.status(400).json({ error: 'Actual achievement must be non-negative' }) : ok(res, { id: Date.now(), ...req.body }));
  app.put('/api/check-ins/:id', (req, res) => ok(res, { id: Number(req.params.id), ...req.body }));

  app.get('/api/manager/team-goals', (_req, res) => ok(res, sheets));
  app.put('/api/manager/goals/:id', (req, res) => req.body.weightage < 10 ? res.status(400).json({ error: 'Minimum weightage is 10%' }) : ok(res, { id: Number(req.params.id), ...req.body }));
  app.post('/api/manager/goal-sheets/:id/approve', (_req, res) => ok(res, { success: true }));
  app.post('/api/manager/goal-sheets/:id/rework', (_req, res) => ok(res, { success: true }));
  app.post('/api/manager/goal-sheets/:id/reject', (_req, res) => ok(res, { success: true }));
  app.post('/api/manager/goal-sheets/:id/message', (_req, res) => ok(res, { success: true }));
  app.put('/api/manager/check-ins/:id/comment', (_req, res) => ok(res, { success: true }));

  app.get('/api/admin/department-stats', (_req, res) => ok(res, [{ department: 'Engineering', completion: 71, employees: 2 }]));
  app.get('/api/admin/audit-logs', (_req, res) => ok(res, [{ id: 1, action: 'Goal Sheet Approved', actor_name: 'Priya Sharma', details: '- Weightage: 20%\\n+ Weightage: 25%', created_at: new Date().toISOString() }]));
  app.get('/api/admin/escalations', (_req, res) => ok(res, [{ id: 1, employee_name: 'Sneha Patel', reason: 'Manager approval pending', status: 'open', priority: 'medium' }]));
  app.get('/api/admin/locked-sheets', (_req, res) => ok(res, sheets.filter((s) => s.is_locked)));
  app.post('/api/admin/goal-sheets/:id/unlock', (_req, res) => ok(res, { success: true }));
  app.get('/api/admin/shared-goals', (_req, res) => ok(res, sheets.flatMap((s) => s.goals).filter((g) => g.is_shared)));
  app.post('/api/admin/shared-goals', (_req, res) => ok(res, { success: true }));
  app.get('/api/admin/reports/:type', (_req, res) => res.type('text/csv').send('"Employee","Department","Manager","Goal Sheet","Sheet Status","Goal","Planned Target","Actual Score","Weightage"\\n"Arjun Mehta","Engineering","Priya Sharma","GS-001","Approved","Reduce API response time","200","50","20"'));

  app.get('/api/org-intelligence/dashboard', (_req, res) => ok(res, {
    nodes: users.map((u) => ({ id: `user-${u.id}`, type: u.role, userId: u.id, name: u.name, role: u.role, department: u.department, completion: u.role === 'employee' ? 71 : 13, status: u.role === 'employee' ? 'on_track' : 'not_started', activeGoals: u.role === 'employee' ? 5 : 0, pendingApprovals: u.role === 'manager' ? 1 : 0, escalations: 1 })),
    edges: [{ id: 'edge-1-2', source: 'user-1', target: 'user-2', animated: true }, { id: 'edge-2-4', source: 'user-2', target: 'user-4', animated: true }, { id: 'edge-2-5', source: 'user-2', target: 'user-5', animated: true }],
    analytics: { totals: { people: 4, managers: 1, employees: 2, avgCompletion: 71, openEscalations: 1, sharedGoals: 2 }, managerEffectiveness: [{ name: 'Priya', completion: 71, pending: 1 }], departmentCompletion: [{ department: 'Engineering', completion: 71, employees: 2 }], statusCounts: [{ name: 'on track', value: 2 }, { name: 'completed', value: 1 }], quarterlyTrends: [{ quarter: 'Q1', completion: 40 }, { quarter: 'Q2', completion: 55 }, { quarter: 'Q3', completion: 66 }, { quarter: 'Q4', completion: 71 }], leaderboard: [] },
    notifications,
    auditLogs: [{ id: 1, action: 'shared_goal_pushed', actor_name: 'Rajesh Kumar', details: 'Departmental KPI cascaded', created_at: new Date().toISOString() }],
    escalations: [{ id: 1, employee_name: 'Sneha Patel', reason: 'Approval pending', status: 'open', priority: 'medium' }],
    timelines: [{ userId: 4, employeeName: 'Arjun Mehta', events: [{ stage: 'Draft', reference: 'GS-1' }, { stage: 'Submitted', reference: 'GS-1' }, { stage: 'Approved', reference: 'GS-1' }, { stage: 'Q4 Updated', reference: 'CHK-1' }] }],
  }));
  app.post('/api/org-intelligence/cascade-goal', (_req, res) => ok(res, { success: true, created: 2 }));

  handler = app;
}

export default handler;
