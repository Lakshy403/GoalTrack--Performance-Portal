const users = [
  { id: 1, email: 'admin@gmail.com', role: 'admin', name: 'Rajesh Kumar', firstName: 'Rajesh', lastName: 'Kumar', employeeCode: 'ATM-001', department: 'Human Resources', designation: 'HR Director', managerName: null },
  { id: 2, email: 'manager@gmail.com', role: 'manager', name: 'Priya Sharma', firstName: 'Priya', lastName: 'Sharma', employeeCode: 'ATM-002', department: 'Engineering', designation: 'Engineering Manager', managerName: 'Rajesh Kumar' },
  { id: 4, email: 'employee1@gmail.com', role: 'employee', name: 'Arjun Mehta', firstName: 'Arjun', lastName: 'Mehta', employeeCode: 'ATM-004', department: 'Engineering', designation: 'Senior Developer', managerName: 'Priya Sharma' },
  { id: 5, email: 'employee2@gmail.com', role: 'employee', name: 'Sneha Patel', firstName: 'Sneha', lastName: 'Patel', employeeCode: 'ATM-005', department: 'Engineering', designation: 'Frontend Lead', managerName: 'Priya Sharma' },
];

const goals = [
  { id: 1, goal_sheet_id: 1, title: 'Migrate microservices to Kubernetes', description: 'Complete migration of five core services.', thrust_area_id: 1, thrust_area_name: 'Technical Excellence', uom_type: 'percentage', score_method: 'min', target_value: '100', weightage: 25, achievement: 100, status: 'completed', is_shared: false, checkins: [{ id: 1, quarter: 'Q4', achievement_value: 100, status: 'completed', employee_comment: 'Migration completed.', manager_comment: 'Strong execution.' }] },
  { id: 2, goal_sheet_id: 1, title: 'Reduce API response time', description: 'Shared departmental KPI.', thrust_area_id: 3, thrust_area_name: 'Customer Impact', uom_type: 'number', score_method: 'max', target_value: '200', weightage: 20, achievement: 50, status: 'on_track', is_shared: true, parent_goal_id: 100, checkins: [{ id: 2, quarter: 'Q4', achievement_value: 240, status: 'on_track', employee_comment: 'p95 improved.', manager_comment: '' }] },
  { id: 3, goal_sheet_id: 1, title: 'Conduct technical workshops', description: 'Deliver internal workshops.', thrust_area_id: 4, thrust_area_name: 'Team Development', uom_type: 'number', score_method: 'min', target_value: '4', weightage: 15, achievement: 75, status: 'on_track', is_shared: false, checkins: [] },
  { id: 4, goal_sheet_id: 1, title: 'Achieve 95% test coverage', description: 'Increase test coverage.', thrust_area_id: 5, thrust_area_name: 'Process Improvement', uom_type: 'percentage', score_method: 'min', target_value: '95', weightage: 20, achievement: 90, status: 'on_track', is_shared: true, parent_goal_id: 101, checkins: [] },
  { id: 5, goal_sheet_id: 1, title: 'Zero critical incidents', description: 'Zero-based reliability goal.', thrust_area_id: 5, thrust_area_name: 'Process Improvement', uom_type: 'zero', score_method: 'zero', target_value: '0', weightage: 20, achievement: 100, status: 'completed', is_shared: false, checkins: [] },
  { id: 6, goal_sheet_id: 2, title: 'Build design system', description: 'Component library rollout.', thrust_area_id: 1, thrust_area_name: 'Technical Excellence', uom_type: 'zero', score_method: 'zero', target_value: '0', weightage: 30, achievement: 0, status: 'not_started', is_shared: false, checkins: [] },
  { id: 7, goal_sheet_id: 2, title: 'Improve Lighthouse scores', description: 'Performance quality.', thrust_area_id: 3, thrust_area_name: 'Customer Impact', uom_type: 'number', score_method: 'min', target_value: '95', weightage: 25, achievement: 0, status: 'not_started', is_shared: false, checkins: [] },
  { id: 8, goal_sheet_id: 2, title: 'Mentor junior developers', description: 'Mentor two developers.', thrust_area_id: 4, thrust_area_name: 'Team Development', uom_type: 'number', score_method: 'min', target_value: '2', weightage: 20, achievement: 0, status: 'not_started', is_shared: false, checkins: [] },
  { id: 9, goal_sheet_id: 2, title: 'Shared API KPI', description: 'Linked KPI from manager.', thrust_area_id: 3, thrust_area_name: 'Customer Impact', uom_type: 'number', score_method: 'max', target_value: '200', weightage: 25, achievement: 0, status: 'not_started', is_shared: true, parent_goal_id: 100, checkins: [] },
];

const sheets = [
  { id: 1, employee_id: 4, employeeName: 'Arjun Mehta', employee_code: 'ATM-004', department_name: 'Engineering', status: 'approved', is_locked: true, period: 'Q4 FY 2025-26', goals: goals.filter((g) => g.goal_sheet_id === 1) },
  { id: 2, employee_id: 5, employeeName: 'Sneha Patel', employee_code: 'ATM-005', department_name: 'Engineering', status: 'submitted', is_locked: true, period: 'Q4 FY 2025-26', goals: goals.filter((g) => g.goal_sheet_id === 2) },
];

const notifications = [
  { id: 1, type: 'goal_submitted', title: 'New Submission', message: 'Sneha Patel submitted a goal sheet.', link: '/manager/reviews', is_read: false, created_at: new Date().toISOString() },
  { id: 2, type: 'shared_goal', title: 'Linked KPI Assigned', message: 'Reduce API response time was cascaded to Engineering.', link: '/employee/goals', is_read: false, created_at: new Date().toISOString() },
];

function currentUser(config) {
  const token = String(config.headers?.Authorization || '').replace('Bearer ', '');
  return users.find((u) => token === `demo-${u.id}`) || users[0];
}

function response(config, data, status = 200, headers = {}) {
  return Promise.resolve({ data, status, statusText: 'OK', headers, config, request: {} });
}

function csv() {
  return '"Employee","Department","Manager","Goal Sheet","Sheet Status","Goal","Planned Target","Actual Score","Weightage"\n"Arjun Mehta","Engineering","Priya Sharma","GS-001","Approved","Reduce API response time","200","50","20"';
}

export default function demoAdapter(config) {
  const url = String(config.url || '').replace(/^\/api/, '');
  const method = String(config.method || 'get').toLowerCase();
  const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});

  if (url === '/auth/login' && method === 'post') {
    const user = users.find((u) => u.email === body.email);
    if (!user || body.password !== 'Test@1234') return response(config, { error: 'Invalid credentials' }, 401);
    return response(config, { token: `demo-${user.id}`, user });
  }
  if (url === '/auth/me') return response(config, currentUser(config));
  if (url === '/auth/me' && method === 'put') return response(config, { success: true, user: { ...currentUser(config), ...body } });
  if (url === '/auth/password') return response(config, { success: true });

  if (url === '/master/thrust-areas') return response(config, [{ id: 1, name: 'Technical Excellence' }, { id: 2, name: 'Innovation' }, { id: 3, name: 'Customer Impact' }, { id: 4, name: 'Team Development' }, { id: 5, name: 'Process Improvement' }]);
  if (url === '/master/quarters') return response(config, [{ id: 4, label: 'Q4', fy_label: 'FY 2025-26' }]);
  if (url === '/master/current-quarter') return response(config, { id: 4, label: 'Q4', fy_label: 'FY 2025-26' });
  if (url === '/master/notifications') return response(config, notifications);
  if (url.startsWith('/master/notifications')) return response(config, { success: true });

  if (url === '/goal-sheets') return response(config, sheets.filter((s) => s.employee_id === currentUser(config).id));
  if (url === '/goal-sheets/current') return response(config, sheets.find((s) => s.employee_id === currentUser(config).id) || sheets[0]);
  if (url.startsWith('/goal-sheets/') && url.endsWith('/submit')) return response(config, { success: true, status: 'submitted' });
  if (url.startsWith('/goal-sheets/')) return response(config, sheets.find((s) => s.id === Number(url.split('/')[2])) || sheets[0]);
  if (url === '/goals') return response(config, goals.filter((g) => !config.params?.sheetId || g.goal_sheet_id === Number(config.params.sheetId)));
  if (url.startsWith('/goals') && method === 'post') return body.weightage < 10 ? response(config, { error: 'Minimum weightage is 10%' }, 400) : response(config, { id: Date.now(), ...body });
  if (url.startsWith('/goals') && method === 'put') return body.weightage < 10 ? response(config, { error: 'Minimum weightage is 10%' }, 400) : response(config, { id: Number(url.split('/')[2]), ...body });
  if (url.startsWith('/goals') && method === 'delete') return response(config, { success: true });

  if (url.startsWith('/check-ins/') && method === 'get') return response(config, goals.find((g) => g.id === Number(url.split('/')[2]))?.checkins || []);
  if (url === '/check-ins') return body.achievementValue < 0 ? response(config, { error: 'Actual achievement must be non-negative' }, 400) : response(config, { id: Date.now(), ...body });
  if (url.startsWith('/check-ins/')) return response(config, { id: Number(url.split('/')[2]), ...body });

  if (url === '/manager/team-goals') return response(config, sheets);
  if (url.startsWith('/manager/goals/')) return body.weightage < 10 ? response(config, { error: 'Minimum weightage is 10%' }, 400) : response(config, { id: Number(url.split('/')[3]), ...body });
  if (url.startsWith('/manager/')) return response(config, { success: true });

  if (url === '/admin/department-stats') return response(config, [{ department: 'Engineering', completion: 71, employees: 2 }]);
  if (url === '/admin/audit-logs') return response(config, [{ id: 1, action: 'Goal Sheet Approved', actor_name: 'Priya Sharma', details: '- Weightage: 20%\n+ Weightage: 25%', created_at: new Date().toISOString() }]);
  if (url === '/admin/escalations') return response(config, [{ id: 1, employee_name: 'Sneha Patel', reason: 'Manager approval pending', status: 'open', priority: 'medium' }]);
  if (url === '/admin/locked-sheets') return response(config, sheets.filter((s) => s.is_locked));
  if (url === '/admin/shared-goals') return response(config, goals.filter((g) => g.is_shared));
  if (url.startsWith('/admin/reports/')) return response(config, new Blob([csv()], { type: 'text/csv' }));
  if (url.startsWith('/admin/')) return response(config, { success: true });

  if (url === '/org-intelligence/dashboard') {
    const nodes = users.map((u) => ({ id: `user-${u.id}`, type: u.role, userId: u.id, name: u.name, role: u.role, department: u.department, completion: u.role === 'employee' ? 71 : 13, status: u.role === 'employee' ? 'on_track' : 'not_started', activeGoals: u.role === 'employee' ? 5 : 0, pendingApprovals: u.role === 'manager' ? 1 : 0, escalations: 1 }));
    return response(config, { nodes, edges: [{ id: 'edge-1-2', source: 'user-1', target: 'user-2', animated: true }, { id: 'edge-2-4', source: 'user-2', target: 'user-4', animated: true }, { id: 'edge-2-5', source: 'user-2', target: 'user-5', animated: true }], analytics: { totals: { people: 4, managers: 1, employees: 2, avgCompletion: 71, openEscalations: 1, sharedGoals: 2 }, managerEffectiveness: [{ name: 'Priya', completion: 71, pending: 1 }], departmentCompletion: [{ department: 'Engineering', completion: 71, employees: 2 }], statusCounts: [{ name: 'on track', value: 2 }, { name: 'completed', value: 1 }], quarterlyTrends: [{ quarter: 'Q1', completion: 40 }, { quarter: 'Q2', completion: 55 }, { quarter: 'Q3', completion: 66 }, { quarter: 'Q4', completion: 71 }], leaderboard: nodes }, notifications, auditLogs: [], escalations: [], timelines: [] });
  }
  if (url === '/org-intelligence/cascade-goal') return response(config, { success: true, created: 2 });

  return response(config, {});
}
