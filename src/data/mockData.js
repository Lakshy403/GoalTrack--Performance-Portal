// ============================================================
// GoalTrack — Real Data (aligned with database/seed.sql)
// All IDs, names, and relationships match the MySQL schema
// ============================================================

export const thrustAreas = [
  'Technical Excellence', 'Innovation', 'Customer Impact', 'Team Development',
  'Process Improvement', 'Revenue Growth', 'Quality Assurance', 'Leadership',
];

export const uomTypes = ['Percentage', 'Number', 'Currency', 'Rating', 'Boolean', 'Date'];

export const quarters = ['Q1 FY25-26', 'Q2 FY25-26', 'Q3 FY25-26', 'Q4 FY25-26'];

// --- GOALS (DB: goals table) ---
export const mockGoals = [
  { id: 1, goalSheetId: 1, thrustArea: 'Technical Excellence', title: 'Migrate microservices to Kubernetes', description: 'Complete migration of 5 core microservices from Docker Compose to Kubernetes with Helm charts, auto-scaling, and monitoring.', uomType: 'Percentage', target: '100', weightage: 25, achievement: 65, status: 'On Track', isShared: false, quarter: 'Q4 FY25-26' },
  { id: 2, goalSheetId: 1, thrustArea: 'Innovation', title: 'Implement AI-powered code review', description: 'Design and deploy an AI assistant that reviews pull requests for security vulnerabilities, code quality, and best practices.', uomType: 'Boolean', target: 'Yes', weightage: 20, achievement: 40, status: 'On Track', isShared: false, quarter: 'Q4 FY25-26' },
  { id: 3, goalSheetId: 1, thrustArea: 'Team Development', title: 'Conduct technical workshops', description: 'Deliver 4 internal workshops on advanced React patterns, system design, and cloud architecture.', uomType: 'Number', target: '4', weightage: 15, achievement: 75, status: 'On Track', isShared: false, quarter: 'Q4 FY25-26' },
  { id: 4, goalSheetId: 1, thrustArea: 'Customer Impact', title: 'Reduce API response time', description: 'Optimize critical API endpoints to achieve sub-200ms p95 response time.', uomType: 'Number', target: '200', weightage: 20, achievement: 50, status: 'At Risk', isShared: true, sharedGoalId: 1, quarter: 'Q4 FY25-26' },
  { id: 5, goalSheetId: 1, thrustArea: 'Process Improvement', title: 'Achieve 95% test coverage', description: 'Increase unit and integration test coverage across all production services.', uomType: 'Percentage', target: '95', weightage: 20, achievement: 30, status: 'Not Started', isShared: true, sharedGoalId: 2, quarter: 'Q4 FY25-26' },
];

// --- GOAL SHEETS (DB: goal_sheets table) ---
export const mockGoalSheets = [
  {
    id: 1, employeeId: 4, employeeName: 'Arjun Mehta', employeeCode: 'ATM-004',
    department: 'Engineering', designation: 'Senior Developer',
    status: 'Approved', goals: mockGoals, submittedAt: '2026-01-15T10:30:00Z',
    reviewedAt: '2026-01-18T14:00:00Z', reviewedBy: 2, reviewerName: 'Priya Sharma',
    period: 'FY 2025-26', quarter: 'Q4 FY25-26', version: 1, isLocked: true,
  },
  {
    id: 2, employeeId: 5, employeeName: 'Sneha Patel', employeeCode: 'ATM-005',
    department: 'Engineering', designation: 'Frontend Lead',
    status: 'Submitted', submittedAt: '2026-01-20T09:15:00Z',
    reviewedAt: null, reviewedBy: null, period: 'FY 2025-26', quarter: 'Q4 FY25-26', version: 1, isLocked: false,
    goals: [
      { id: 6, goalSheetId: 2, thrustArea: 'Technical Excellence', title: 'Build design system', uomType: 'Boolean', target: 'Yes', weightage: 30, achievement: 0, status: 'Not Started', isShared: false },
      { id: 7, goalSheetId: 2, thrustArea: 'Innovation', title: 'POC for WebAssembly', uomType: 'Boolean', target: 'Yes', weightage: 25, achievement: 0, status: 'Not Started', isShared: false },
      { id: 8, goalSheetId: 2, thrustArea: 'Customer Impact', title: 'Improve Lighthouse scores', uomType: 'Number', target: '95', weightage: 25, achievement: 0, status: 'Not Started', isShared: false },
      { id: 9, goalSheetId: 2, thrustArea: 'Team Development', title: 'Mentor 2 junior developers', uomType: 'Number', target: '2', weightage: 20, achievement: 0, status: 'Not Started', isShared: false },
    ],
  },
  {
    id: 3, employeeId: 6, employeeName: 'Vikram Singh', employeeCode: 'ATM-006',
    department: 'Engineering', designation: 'Backend Developer',
    status: 'Rework', submittedAt: '2026-01-22T11:00:00Z',
    reviewedAt: '2026-01-23T16:30:00Z', reviewedBy: 2, reviewerName: 'Priya Sharma',
    reviewComments: 'Weightage distribution unbalanced — 40/60 split needs more granularity.',
    period: 'FY 2025-26', quarter: 'Q4 FY25-26', version: 1, isLocked: false,
    goals: [
      { id: 10, goalSheetId: 3, thrustArea: 'Technical Excellence', title: 'Database optimization', uomType: 'Percentage', target: '50', weightage: 40, achievement: 0, status: 'Not Started', isShared: false },
      { id: 11, goalSheetId: 3, thrustArea: 'Process Improvement', title: 'CI/CD pipeline setup', uomType: 'Boolean', target: 'Yes', weightage: 60, achievement: 0, status: 'Not Started', isShared: false },
    ],
  },
  {
    id: 4, employeeId: 10, employeeName: 'Anita Desai', employeeCode: 'ATM-010',
    department: 'Design', designation: 'UI/UX Designer',
    status: 'Draft', goals: [], submittedAt: null, reviewedAt: null,
    period: 'FY 2025-26', quarter: 'Q4 FY25-26', version: 1, isLocked: false,
  },
  {
    id: 5, employeeId: 9, employeeName: 'Karan Joshi', employeeCode: 'ATM-009',
    department: 'Product', designation: 'Product Manager',
    status: 'Approved', submittedAt: '2026-01-10T08:00:00Z',
    reviewedAt: '2026-01-12T10:00:00Z', reviewedBy: 3, reviewerName: 'Neeraj Verma',
    period: 'FY 2025-26', quarter: 'Q4 FY25-26', version: 1, isLocked: true,
    goals: [
      { id: 12, goalSheetId: 5, thrustArea: 'Customer Impact', title: 'Launch v2.0 features', uomType: 'Number', target: '5', weightage: 35, achievement: 80, status: 'On Track', isShared: false },
      { id: 13, goalSheetId: 5, thrustArea: 'Innovation', title: 'A/B testing framework', uomType: 'Boolean', target: 'Yes', weightage: 25, achievement: 100, status: 'Completed', isShared: false },
      { id: 14, goalSheetId: 5, thrustArea: 'Process Improvement', title: 'Stakeholder satisfaction', uomType: 'Rating', target: '4.5', weightage: 20, achievement: 60, status: 'On Track', isShared: false },
      { id: 15, goalSheetId: 5, thrustArea: 'Team Development', title: 'Cross-functional workshops', uomType: 'Number', target: '3', weightage: 20, achievement: 33, status: 'On Track', isShared: false },
    ],
  },
  {
    id: 6, employeeId: 7, employeeName: 'Meera Nair', employeeCode: 'ATM-007',
    department: 'DevOps', designation: 'DevOps Engineer',
    status: 'Approved', submittedAt: '2026-01-08T09:00:00Z',
    reviewedAt: '2026-01-09T11:00:00Z', reviewedBy: 2, reviewerName: 'Priya Sharma',
    period: 'FY 2025-26', quarter: 'Q4 FY25-26', version: 1, isLocked: true,
    goals: [
      { id: 16, goalSheetId: 6, thrustArea: 'Technical Excellence', title: 'Kubernetes cluster hardening', uomType: 'Percentage', target: '100', weightage: 35, achievement: 90, status: 'On Track', isShared: false },
      { id: 17, goalSheetId: 6, thrustArea: 'Process Improvement', title: 'Terraform IaC migration', uomType: 'Boolean', target: 'Yes', weightage: 35, achievement: 85, status: 'On Track', isShared: false },
      { id: 18, goalSheetId: 6, thrustArea: 'Quality Assurance', title: 'Disaster recovery drills', uomType: 'Number', target: '4', weightage: 30, achievement: 75, status: 'On Track', isShared: false },
    ],
  },
  {
    id: 7, employeeId: 11, employeeName: 'Rohit Gupta', employeeCode: 'ATM-011',
    department: 'QA', designation: 'QA Lead',
    status: 'Submitted', submittedAt: '2026-01-25T10:00:00Z',
    reviewedAt: null, period: 'FY 2025-26', quarter: 'Q4 FY25-26', version: 1, isLocked: false,
    goals: [
      { id: 19, goalSheetId: 7, thrustArea: 'Quality Assurance', title: 'Automated regression suite', uomType: 'Percentage', target: '100', weightage: 30, achievement: 0, status: 'Not Started', isShared: false },
      { id: 20, goalSheetId: 7, thrustArea: 'Process Improvement', title: 'Reduce defect leakage', uomType: 'Number', target: '5', weightage: 25, achievement: 0, status: 'Not Started', isShared: false },
      { id: 21, goalSheetId: 7, thrustArea: 'Innovation', title: 'AI test case generation', uomType: 'Boolean', target: 'Yes', weightage: 25, achievement: 0, status: 'Not Started', isShared: false },
      { id: 22, goalSheetId: 7, thrustArea: 'Team Development', title: 'QA guild sessions', uomType: 'Number', target: '6', weightage: 20, achievement: 0, status: 'Not Started', isShared: false },
    ],
  },
  {
    id: 8, employeeId: 8, employeeName: 'Divya Reddy', employeeCode: 'ATM-008',
    department: 'Data Science', designation: 'Data Engineer',
    status: 'Approved', submittedAt: '2026-01-12T08:30:00Z',
    reviewedAt: '2026-01-14T15:00:00Z', reviewedBy: 2, reviewerName: 'Priya Sharma',
    period: 'FY 2025-26', quarter: 'Q4 FY25-26', version: 1, isLocked: true,
    goals: [
      { id: 23, goalSheetId: 8, thrustArea: 'Technical Excellence', title: 'Real-time data pipeline', uomType: 'Boolean', target: 'Yes', weightage: 30, achievement: 55, status: 'On Track', isShared: false },
      { id: 24, goalSheetId: 8, thrustArea: 'Innovation', title: 'ML model serving platform', uomType: 'Percentage', target: '100', weightage: 25, achievement: 40, status: 'At Risk', isShared: false },
      { id: 25, goalSheetId: 8, thrustArea: 'Customer Impact', title: 'Dashboard analytics revamp', uomType: 'Boolean', target: 'Yes', weightage: 25, achievement: 35, status: 'On Track', isShared: false },
      { id: 26, goalSheetId: 8, thrustArea: 'Process Improvement', title: 'Data quality monitoring', uomType: 'Percentage', target: '99', weightage: 20, achievement: 40, status: 'On Track', isShared: false },
    ],
  },
];

// --- TEAM MEMBERS (DB: users table — employees under managers) ---
export const mockTeamMembers = [
  { id: 4, employeeCode: 'ATM-004', name: 'Arjun Mehta', department: 'Engineering', designation: 'Senior Developer', managerId: 2, goalStatus: 'Approved', completion: 52, goalsCount: 5 },
  { id: 5, employeeCode: 'ATM-005', name: 'Sneha Patel', department: 'Engineering', designation: 'Frontend Lead', managerId: 2, goalStatus: 'Submitted', completion: 0, goalsCount: 4 },
  { id: 6, employeeCode: 'ATM-006', name: 'Vikram Singh', department: 'Engineering', designation: 'Backend Developer', managerId: 2, goalStatus: 'Rework', completion: 0, goalsCount: 2 },
  { id: 7, employeeCode: 'ATM-007', name: 'Meera Nair', department: 'DevOps', designation: 'DevOps Engineer', managerId: 2, goalStatus: 'Approved', completion: 85, goalsCount: 3 },
  { id: 8, employeeCode: 'ATM-008', name: 'Divya Reddy', department: 'Data Science', designation: 'Data Engineer', managerId: 2, goalStatus: 'Approved', completion: 42, goalsCount: 4 },
  { id: 9, employeeCode: 'ATM-009', name: 'Karan Joshi', department: 'Product', designation: 'Product Manager', managerId: 3, goalStatus: 'Approved', completion: 68, goalsCount: 4 },
  { id: 10, employeeCode: 'ATM-010', name: 'Anita Desai', department: 'Design', designation: 'UI/UX Designer', managerId: 3, goalStatus: 'Draft', completion: 0, goalsCount: 0 },
  { id: 11, employeeCode: 'ATM-011', name: 'Rohit Gupta', department: 'QA', designation: 'QA Lead', managerId: 3, goalStatus: 'Submitted', completion: 0, goalsCount: 4 },
];

// --- CHECK-INS (DB: goal_checkins table) ---
export const mockCheckIns = [
  {
    goalId: 1, quarter: 'Q4 FY25-26',
    entries: [
      { id: 1, date: '2026-01-31', achievement: 20, status: 'On Track', comment: 'Migrated 1 of 5 services. Helm charts ready for auth-service.', managerComment: 'Good start. Keep momentum.', commentedBy: 2, commentedAt: '2026-02-01T10:00:00Z' },
      { id: 2, date: '2026-02-28', achievement: 45, status: 'On Track', comment: 'Migrated 3 services. Auto-scaling configured for 2.', managerComment: 'Excellent progress.', commentedBy: 2, commentedAt: '2026-03-01T09:00:00Z' },
      { id: 3, date: '2026-03-31', achievement: 65, status: 'On Track', comment: '4 services migrated. Monitoring setup in progress.', managerComment: null, commentedBy: null, commentedAt: null },
    ],
  },
  {
    goalId: 2, quarter: 'Q4 FY25-26',
    entries: [
      { id: 4, date: '2026-01-31', achievement: 10, status: 'On Track', comment: 'Research completed. Evaluating OpenAI and local LLM options.', managerComment: 'Consider cost implications.', commentedBy: 2, commentedAt: '2026-02-02T11:00:00Z' },
      { id: 5, date: '2026-02-28', achievement: 30, status: 'On Track', comment: 'POC built with local LLM. Testing on sample PRs.', managerComment: null, commentedBy: null, commentedAt: null },
      { id: 6, date: '2026-03-31', achievement: 40, status: 'At Risk', comment: 'Integration challenges with GitHub Actions. Need more time.', managerComment: 'Discuss blockers in 1:1.', commentedBy: 2, commentedAt: '2026-04-01T10:00:00Z' },
    ],
  },
];

// --- AUDIT LOGS (DB: audit_logs table) ---
export const mockAuditLogs = [
  { id: 1, action: 'Goal Sheet Submitted', user: 'Arjun Mehta', userId: 4, entityType: 'goal_sheet', entityId: 1, target: 'GS-001', details: 'Submitted 5 goals for Q4 FY25-26', timestamp: '2026-01-15T10:30:00Z' },
  { id: 2, action: 'Goal Sheet Approved', user: 'Priya Sharma', userId: 2, entityType: 'goal_sheet', entityId: 1, target: 'GS-001', details: 'Approved with no modifications', timestamp: '2026-01-18T14:00:00Z' },
  { id: 3, action: 'Goal Sheet Returned', user: 'Priya Sharma', userId: 2, entityType: 'goal_sheet', entityId: 3, target: 'GS-003', details: 'Weightage distribution needs revision', timestamp: '2026-01-23T16:30:00Z' },
  { id: 4, action: 'Goal Sheet Submitted', user: 'Sneha Patel', userId: 5, entityType: 'goal_sheet', entityId: 2, target: 'GS-002', details: 'Submitted 4 goals for Q4 FY25-26', timestamp: '2026-01-20T09:15:00Z' },
  { id: 5, action: 'Shared Goal Pushed', user: 'Rajesh Kumar', userId: 1, entityType: 'shared_goal', entityId: 1, target: 'All Engineering', details: 'Reduce API response time — Departmental goal', timestamp: '2026-01-05T11:00:00Z' },
  { id: 6, action: 'Goal Sheet Unlocked', user: 'Rajesh Kumar', userId: 1, entityType: 'goal_sheet', entityId: 1, target: 'GS-001', details: 'Unlocked for Q1 mid-review update', timestamp: '2026-02-01T09:00:00Z' },
  { id: 7, action: 'Check-in Updated', user: 'Arjun Mehta', userId: 4, entityType: 'goal_sheet', entityId: 1, target: 'GS-001', details: 'Q4 quarterly check-in completed', timestamp: '2026-03-15T15:00:00Z' },
  { id: 8, action: 'Goal Achievement Updated', user: 'Karan Joshi', userId: 9, entityType: 'goal', entityId: 13, target: 'GS-005', details: 'A/B testing framework marked as Completed', timestamp: '2026-03-10T12:00:00Z' },
  { id: 9, action: 'Escalation Created', user: 'System', userId: null, entityType: 'escalation', entityId: 1, target: 'GS-004', details: 'No goals submitted — auto-escalation triggered', timestamp: '2026-02-15T08:00:00Z' },
  { id: 10, action: 'Report Exported', user: 'Rajesh Kumar', userId: 1, entityType: 'report', entityId: null, target: 'Q4 2026 Report', details: 'Exported department completion report as CSV', timestamp: '2026-03-31T17:00:00Z' },
];

// --- ESCALATIONS (DB: escalations table) ---
export const mockEscalations = [
  { id: 1, employeeId: 10, employee: 'Anita Desai', department: 'Design', goalSheetId: 4, reason: 'Goal sheet not submitted', daysOverdue: 45, priority: 'High', status: 'Open', assignedTo: 3, assignedToName: 'Neeraj Verma', createdAt: '2026-02-15T08:00:00Z' },
  { id: 2, employeeId: 6, employee: 'Vikram Singh', department: 'Engineering', goalSheetId: 3, reason: 'Rework pending for 30+ days', daysOverdue: 30, priority: 'Medium', status: 'Open', assignedTo: 2, assignedToName: 'Priya Sharma', createdAt: '2026-02-22T10:00:00Z' },
  { id: 3, employeeId: 11, employee: 'Rohit Gupta', department: 'QA', goalSheetId: 7, reason: 'Goal review pending from manager', daysOverdue: 15, priority: 'Low', status: 'Resolved', assignedTo: 3, assignedToName: 'Neeraj Verma', createdAt: '2026-03-01T09:00:00Z' },
];

// --- DEPARTMENT STATS (DB: aggregated from departments + goal_sheets + goals) ---
export const mockDepartmentStats = [
  { id: 1, department: 'Engineering', code: 'ENG', totalEmployees: 25, goalsSubmitted: 22, goalsApproved: 18, avgCompletion: 58, onTrack: 15, atRisk: 5, overdue: 2 },
  { id: 2, department: 'Product', code: 'PROD', totalEmployees: 8, goalsSubmitted: 8, goalsApproved: 7, avgCompletion: 72, onTrack: 6, atRisk: 1, overdue: 0 },
  { id: 3, department: 'Design', code: 'DES', totalEmployees: 6, goalsSubmitted: 4, goalsApproved: 3, avgCompletion: 45, onTrack: 2, atRisk: 1, overdue: 1 },
  { id: 4, department: 'QA', code: 'QA', totalEmployees: 10, goalsSubmitted: 9, goalsApproved: 8, avgCompletion: 63, onTrack: 7, atRisk: 1, overdue: 0 },
  { id: 5, department: 'DevOps', code: 'DEVOPS', totalEmployees: 5, goalsSubmitted: 5, goalsApproved: 5, avgCompletion: 81, onTrack: 5, atRisk: 0, overdue: 0 },
  { id: 6, department: 'Data Science', code: 'DS', totalEmployees: 7, goalsSubmitted: 6, goalsApproved: 5, avgCompletion: 55, onTrack: 4, atRisk: 1, overdue: 1 },
];

// --- GOAL REVIEWS (DB: goal_reviews table) ---
export const mockGoalReviews = [
  { id: 1, goalSheetId: 1, reviewerId: 2, reviewerName: 'Priya Sharma', action: 'approved', comments: 'Well-structured goals. Approved with no changes.', createdAt: '2026-01-18T14:00:00Z' },
  { id: 2, goalSheetId: 3, reviewerId: 2, reviewerName: 'Priya Sharma', action: 'returned_for_rework', comments: 'Weightage distribution unbalanced — 40/60 split needs more granularity.', createdAt: '2026-01-23T16:30:00Z' },
  { id: 3, goalSheetId: 5, reviewerId: 3, reviewerName: 'Neeraj Verma', action: 'approved', comments: 'Good alignment with product roadmap. Approved.', createdAt: '2026-01-12T10:00:00Z' },
  { id: 4, goalSheetId: 6, reviewerId: 2, reviewerName: 'Priya Sharma', action: 'approved', comments: 'Infrastructure goals look solid.', createdAt: '2026-01-09T11:00:00Z' },
  { id: 5, goalSheetId: 8, reviewerId: 2, reviewerName: 'Priya Sharma', action: 'approved', comments: 'Data pipeline goals approved.', createdAt: '2026-01-14T15:00:00Z' },
];

// --- SHARED GOALS (DB: shared_goals table) ---
export const mockSharedGoals = [
  { id: 1, title: 'Reduce API response time', description: 'All engineering teams must optimize API p95 to sub-200ms', thrustArea: 'Customer Impact', uomType: 'Number', target: '200', departmentId: 1, department: 'Engineering', quarterId: 4, createdBy: 1, creatorName: 'Rajesh Kumar', isActive: true, createdAt: '2026-01-05T11:00:00Z' },
  { id: 2, title: 'Achieve 95% test coverage', description: 'Organization-wide test coverage improvement initiative', thrustArea: 'Process Improvement', uomType: 'Percentage', target: '95', departmentId: null, department: 'All', quarterId: 4, createdBy: 1, creatorName: 'Rajesh Kumar', isActive: true, createdAt: '2026-01-06T09:00:00Z' },
];

// --- NOTIFICATIONS (DB: notifications table) ---
export const mockNotifications = [
  { id: 1, userId: 4, type: 'goal_approved', title: 'Goals Approved', message: 'Your goal sheet for Q4 has been approved by Priya Sharma.', link: '/employee/goals', isRead: true, createdAt: '2026-01-18T14:00:00Z' },
  { id: 2, userId: 5, type: 'goal_submitted', title: 'Submission Received', message: 'Your goal sheet has been submitted for review.', link: '/employee/goals', isRead: false, createdAt: '2026-01-20T09:15:00Z' },
  { id: 3, userId: 6, type: 'goal_rework', title: 'Revision Required', message: 'Your goal sheet has been returned for rework by Priya Sharma.', link: '/employee/goal-sheet', isRead: false, createdAt: '2026-01-23T16:30:00Z' },
  { id: 4, userId: 2, type: 'goal_submitted', title: 'New Submission', message: 'Sneha Patel has submitted their goal sheet for review.', link: '/manager/reviews', isRead: false, createdAt: '2026-01-20T09:15:00Z' },
  { id: 5, userId: 2, type: 'goal_submitted', title: 'New Submission', message: 'Rohit Gupta has submitted their goal sheet for review.', link: '/manager/reviews', isRead: false, createdAt: '2026-01-25T10:00:00Z' },
  { id: 6, userId: 10, type: 'checkin_reminder', title: 'Check-in Reminder', message: 'Your Q4 quarterly check-in is due. Please update your progress.', link: '/employee/check-in', isRead: false, createdAt: '2026-03-15T08:00:00Z' },
  { id: 7, userId: 1, type: 'escalation', title: 'Auto-Escalation', message: 'Anita Desai has not submitted goals for 45 days.', link: '/admin/escalations', isRead: false, createdAt: '2026-02-15T08:00:00Z' },
];
