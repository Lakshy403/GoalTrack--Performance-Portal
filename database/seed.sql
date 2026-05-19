-- ============================================================
-- GoalTrack — Seed Data
-- Run AFTER schema.sql
-- ============================================================

USE `goaltrack_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- DEPARTMENTS
-- ============================================================
INSERT INTO `departments` (`id`, `name`, `code`, `description`) VALUES
(1, 'Engineering',    'ENG',  'Software engineering and architecture'),
(2, 'Product',        'PROD', 'Product management and strategy'),
(3, 'Design',         'DES',  'UI/UX design and research'),
(4, 'Quality Assurance', 'QA', 'Testing, automation, and quality'),
(5, 'DevOps',         'DEVOPS','Infrastructure and cloud operations'),
(6, 'Data Science',   'DS',   'Analytics, ML, and data engineering'),
(7, 'Human Resources','HR',   'People operations and talent management');

-- ============================================================
-- DESIGNATIONS
-- ============================================================
INSERT INTO `designations` (`id`, `title`, `level`) VALUES
(1,  'Junior Developer',      1),
(2,  'Developer',             2),
(3,  'Senior Developer',      3),
(4,  'Lead Developer',        4),
(5,  'Frontend Lead',         4),
(6,  'Backend Developer',     2),
(7,  'DevOps Engineer',       3),
(8,  'QA Lead',               4),
(9,  'UI/UX Designer',        3),
(10, 'Product Manager',       4),
(11, 'Data Engineer',         3),
(12, 'Engineering Manager',   5),
(13, 'HR Director',           6),
(14, 'VP Engineering',        7);

-- ============================================================
-- USERS
-- All passwords = 'Test@1234' (bcrypt hash)
-- ============================================================
INSERT INTO `users` (`id`, `employee_code`, `first_name`, `last_name`, `email`, `password_hash`, `role`, `department_id`, `designation_id`, `manager_id`) VALUES
-- Admin / HR
(1,  'ATM-001', 'Rajesh',  'Kumar',   'admin@gmail.com',      '$2a$10$yVWCn30T1HtP7Cc/XovhgO0zIeAtTj7fhQQoVU1LrjeYa4MKK5jci', 'admin',    7, 13, NULL),
-- Managers
(2,  'ATM-002', 'Priya',   'Sharma',  'manager@gmail.com',    '$2a$10$yVWCn30T1HtP7Cc/XovhgO0zIeAtTj7fhQQoVU1LrjeYa4MKK5jci', 'manager',  1, 12, 1),
(3,  'ATM-003', 'Neeraj',  'Verma',   'manager2@gmail.com',   '$2a$10$yVWCn30T1HtP7Cc/XovhgO0zIeAtTj7fhQQoVU1LrjeYa4MKK5jci', 'manager',  2, 10, 1),
-- Employees under Priya (Engineering)
(4,  'ATM-004', 'Arjun',   'Mehta',   'employee1@gmail.com',  '$2a$10$yVWCn30T1HtP7Cc/XovhgO0zIeAtTj7fhQQoVU1LrjeYa4MKK5jci', 'employee', 1, 3,  2),
(5,  'ATM-005', 'Sneha',   'Patel',   'employee2@gmail.com',  '$2a$10$yVWCn30T1HtP7Cc/XovhgO0zIeAtTj7fhQQoVU1LrjeYa4MKK5jci', 'employee', 1, 5,  2),
(6,  'ATM-006', 'Vikram',  'Singh',   'employee3@gmail.com',  '$2a$10$yVWCn30T1HtP7Cc/XovhgO0zIeAtTj7fhQQoVU1LrjeYa4MKK5jci', 'employee', 1, 6,  2),
(7,  'ATM-007', 'Meera',   'Nair',    'employee4@gmail.com',  '$2a$10$yVWCn30T1HtP7Cc/XovhgO0zIeAtTj7fhQQoVU1LrjeYa4MKK5jci', 'employee', 5, 7,  2),
(8,  'ATM-008', 'Divya',   'Reddy',   'employee5@gmail.com',  '$2a$10$yVWCn30T1HtP7Cc/XovhgO0zIeAtTj7fhQQoVU1LrjeYa4MKK5jci', 'employee', 6, 11, 2),
-- Employees under Neeraj (Product, Design, QA)
(9,  'ATM-009', 'Karan',   'Joshi',   'employee6@gmail.com',  '$2a$10$yVWCn30T1HtP7Cc/XovhgO0zIeAtTj7fhQQoVU1LrjeYa4MKK5jci', 'employee', 2, 10, 3),
(10, 'ATM-010', 'Anita',   'Desai',   'employee7@gmail.com',  '$2a$10$yVWCn30T1HtP7Cc/XovhgO0zIeAtTj7fhQQoVU1LrjeYa4MKK5jci', 'employee', 3, 9,  3),
(11, 'ATM-011', 'Rohit',   'Gupta',   'employee8@gmail.com',  '$2a$10$yVWCn30T1HtP7Cc/XovhgO0zIeAtTj7fhQQoVU1LrjeYa4MKK5jci', 'employee', 4, 8,  3);

-- Update department heads
UPDATE `departments` SET `head_id` = 2  WHERE `id` = 1;
UPDATE `departments` SET `head_id` = 3  WHERE `id` = 2;
UPDATE `departments` SET `head_id` = 1  WHERE `id` = 7;

-- ============================================================
-- FINANCIAL YEARS
-- ============================================================
INSERT INTO `financial_years` (`id`, `label`, `start_date`, `end_date`, `is_current`) VALUES
(1, 'FY 2024-25', '2024-04-01', '2025-03-31', 0),
(2, 'FY 2025-26', '2025-04-01', '2026-03-31', 1),
(3, 'FY 2026-27', '2026-04-01', '2027-03-31', 0);

-- ============================================================
-- QUARTERS
-- ============================================================
INSERT INTO `quarters` (`id`, `financial_year_id`, `label`, `start_date`, `end_date`, `is_current`) VALUES
-- FY 2025-26
(1, 2, 'Q1', '2025-04-01', '2025-06-30', 0),
(2, 2, 'Q2', '2025-07-01', '2025-09-30', 0),
(3, 2, 'Q3', '2025-10-01', '2025-12-31', 0),
(4, 2, 'Q4', '2026-01-01', '2026-03-31', 1);

-- ============================================================
-- THRUST AREAS
-- ============================================================
INSERT INTO `thrust_areas` (`id`, `name`, `description`) VALUES
(1, 'Technical Excellence',  'Deep technical skills, architecture, and code quality'),
(2, 'Innovation',            'New ideas, POCs, and cutting-edge technology adoption'),
(3, 'Customer Impact',       'Direct customer value, satisfaction, and revenue impact'),
(4, 'Team Development',      'Mentoring, knowledge sharing, and team capability building'),
(5, 'Process Improvement',   'Efficiency, automation, and process optimization'),
(6, 'Revenue Growth',        'Business development, sales enablement, and monetization'),
(7, 'Quality Assurance',     'Testing, reliability, and production stability'),
(8, 'Leadership',            'Strategic thinking, decision making, and influence');

-- ============================================================
-- GOAL SHEETS
-- ============================================================
INSERT INTO `goal_sheets` (`id`, `employee_id`, `quarter_id`, `status`, `submitted_at`, `reviewed_at`, `reviewed_by`, `is_locked`, `version`) VALUES
(1, 4,  4, 'approved',   '2026-01-15 10:30:00', '2026-01-18 14:00:00', 2, 1, 1),
(2, 5,  4, 'submitted',  '2026-01-20 09:15:00', NULL,                  NULL, 0, 1),
(3, 6,  4, 'rework',     '2026-01-22 11:00:00', '2026-01-23 16:30:00', 2, 0, 1),
(4, 10, 4, 'draft',      NULL,                  NULL,                  NULL, 0, 1),
(5, 9,  4, 'approved',   '2026-01-10 08:00:00', '2026-01-12 10:00:00', 3, 1, 1),
(6, 7,  4, 'approved',   '2026-01-08 09:00:00', '2026-01-09 11:00:00', 2, 1, 1),
(7, 11, 4, 'submitted',  '2026-01-25 10:00:00', NULL,                  NULL, 0, 1),
(8, 8,  4, 'approved',   '2026-01-12 08:30:00', '2026-01-14 15:00:00', 2, 1, 1);

-- ============================================================
-- GOALS for Arjun (goal_sheet 1)
-- ============================================================
INSERT INTO `goals` (`id`, `goal_sheet_id`, `thrust_area_id`, `title`, `description`, `uom_type`, `target_value`, `weightage`, `achievement`, `status`, `is_shared`, `sort_order`) VALUES
(1, 1, 1, 'Migrate microservices to Kubernetes',   'Complete migration of 5 core microservices from Docker Compose to Kubernetes with Helm charts, auto-scaling, and monitoring.', 'percentage', '100', 25.00, 65.00, 'on_track', 0, 1),
(2, 1, 2, 'Implement AI-powered code review',      'Design and deploy an AI assistant that reviews pull requests for security vulnerabilities, code quality, and best practices.', 'boolean',    'Yes', 20.00, 40.00, 'on_track', 0, 2),
(3, 1, 4, 'Conduct technical workshops',            'Deliver 4 internal workshops on advanced React patterns, system design, and cloud architecture.', 'number', '4', 15.00, 75.00, 'on_track', 0, 3),
(4, 1, 3, 'Reduce API response time',               'Optimize critical API endpoints to achieve sub-200ms p95 response time.', 'number', '200', 20.00, 50.00, 'at_risk', 1, 4),
(5, 1, 5, 'Achieve 95% test coverage',              'Increase unit and integration test coverage across all production services.', 'percentage', '95', 20.00, 30.00, 'not_started', 1, 5);

-- GOALS for Sneha (goal_sheet 2)
INSERT INTO `goals` (`goal_sheet_id`, `thrust_area_id`, `title`, `uom_type`, `target_value`, `weightage`, `status`, `sort_order`) VALUES
(2, 1, 'Build design system',          'boolean',    'Yes', 30.00, 'not_started', 1),
(2, 2, 'POC for WebAssembly',          'boolean',    'Yes', 25.00, 'not_started', 2),
(2, 3, 'Improve Lighthouse scores',    'number',     '95',  25.00, 'not_started', 3),
(2, 4, 'Mentor 2 junior developers',   'number',     '2',   20.00, 'not_started', 4);

-- GOALS for Vikram (goal_sheet 3) — needs rework on weightage
INSERT INTO `goals` (`goal_sheet_id`, `thrust_area_id`, `title`, `uom_type`, `target_value`, `weightage`, `status`, `sort_order`) VALUES
(3, 1, 'Database optimization',   'percentage', '50', 40.00, 'not_started', 1),
(3, 5, 'CI/CD pipeline setup',    'boolean',    'Yes', 60.00, 'not_started', 2);

-- GOALS for Karan (goal_sheet 5)
INSERT INTO `goals` (`goal_sheet_id`, `thrust_area_id`, `title`, `uom_type`, `target_value`, `weightage`, `achievement`, `status`, `sort_order`) VALUES
(5, 3, 'Launch v2.0 features',       'number',  '5',   35.00, 80.00,  'on_track',  1),
(5, 2, 'A/B testing framework',      'boolean', 'Yes', 25.00, 100.00, 'completed', 2),
(5, 5, 'Stakeholder satisfaction',    'rating',  '4.5', 20.00, 60.00,  'on_track',  3),
(5, 4, 'Cross-functional workshops',  'number',  '3',   20.00, 33.00,  'on_track',  4);

-- ============================================================
-- SHARED GOALS
-- ============================================================
INSERT INTO `shared_goals` (`id`, `title`, `description`, `thrust_area_id`, `uom_type`, `target_value`, `department_id`, `quarter_id`, `created_by`) VALUES
(1, 'Reduce API response time',  'All engineering teams must optimize API p95 to sub-200ms', 3, 'number',     '200', 1, 4, 1),
(2, 'Achieve 95% test coverage', 'Organization-wide test coverage improvement initiative',   5, 'percentage', '95',  NULL, 4, 1);

-- Link shared goals
UPDATE `goals` SET `shared_goal_id` = 1 WHERE `id` = 4;
UPDATE `goals` SET `shared_goal_id` = 2 WHERE `id` = 5;

-- ============================================================
-- GOAL CHECK-INS for Arjun
-- ============================================================
INSERT INTO `goal_checkins` (`goal_id`, `quarter_id`, `achievement_value`, `status`, `employee_comment`, `manager_comment`, `commented_by`, `commented_at`, `checkin_date`) VALUES
-- Goal 1: K8s migration
(1, 4, 20.00, 'on_track', 'Migrated 1 of 5 services. Helm charts ready for auth-service.',    'Good start. Keep momentum.', 2, '2026-02-01 10:00:00', '2026-01-31'),
(1, 4, 45.00, 'on_track', 'Migrated 3 services. Auto-scaling configured for 2.',              'Excellent progress.',         2, '2026-03-01 09:00:00', '2026-02-28'),
(1, 4, 65.00, 'on_track', '4 services migrated. Monitoring setup in progress.',                NULL,                          NULL, NULL,                '2026-03-31'),
-- Goal 2: AI code review
(2, 4, 10.00, 'on_track', 'Research completed. Evaluating OpenAI and local LLM options.',      'Consider cost implications.', 2, '2026-02-02 11:00:00', '2026-01-31'),
(2, 4, 30.00, 'on_track', 'POC built with local LLM. Testing on sample PRs.',                  NULL,                          NULL, NULL,                '2026-02-28'),
(2, 4, 40.00, 'at_risk',  'Integration challenges with GitHub Actions. Need more time.',       'Discuss blockers in 1:1.',    2, '2026-04-01 10:00:00', '2026-03-31');

-- ============================================================
-- GOAL REVIEWS
-- ============================================================
INSERT INTO `goal_reviews` (`goal_sheet_id`, `reviewer_id`, `action`, `comments`, `created_at`) VALUES
(1, 2, 'approved',              'Well-structured goals. Approved with no changes.',                       '2026-01-18 14:00:00'),
(3, 2, 'returned_for_rework',   'Weightage distribution unbalanced — 40/60 split needs more granularity.','2026-01-23 16:30:00'),
(5, 3, 'approved',              'Good alignment with product roadmap. Approved.',                         '2026-01-12 10:00:00'),
(6, 2, 'approved',              'Infrastructure goals look solid.',                                       '2026-01-09 11:00:00'),
(8, 2, 'approved',              'Data pipeline goals approved.',                                           '2026-01-14 15:00:00');

-- ============================================================
-- AUDIT LOGS
-- ============================================================
INSERT INTO `audit_logs` (`user_id`, `action`, `entity_type`, `entity_id`, `target_label`, `details`, `created_at`) VALUES
(4,   'goal_sheet_submitted',  'goal_sheet', 1,  'GS-001',          'Submitted 5 goals for Q4 FY25-26',                   '2026-01-15 10:30:00'),
(2,   'goal_sheet_approved',   'goal_sheet', 1,  'GS-001',          'Approved with no modifications',                      '2026-01-18 14:00:00'),
(2,   'goal_sheet_returned',   'goal_sheet', 3,  'GS-003',          'Weightage distribution needs revision',               '2026-01-23 16:30:00'),
(5,   'goal_sheet_submitted',  'goal_sheet', 2,  'GS-002',          'Submitted 4 goals for Q4 FY25-26',                   '2026-01-20 09:15:00'),
(1,   'shared_goal_pushed',    'shared_goal',1,  'All Engineering', 'Reduce API response time — Departmental goal',        '2026-01-05 11:00:00'),
(1,   'goal_sheet_unlocked',   'goal_sheet', 1,  'GS-001',          'Unlocked for mid-review update',                      '2026-02-01 09:00:00'),
(4,   'checkin_updated',       'goal_sheet', 1,  'GS-001',          'Q4 quarterly check-in completed',                    '2026-03-15 15:00:00'),
(9,   'achievement_updated',   'goal',       12, 'GS-005',          'A/B testing framework marked as Completed',           '2026-03-10 12:00:00'),
(NULL, 'escalation_created',   'escalation', 1,  'GS-004',          'No goals submitted — auto-escalation triggered',      '2026-02-15 08:00:00'),
(1,   'report_exported',       'report',     NULL,'Q4 2026 Report',  'Exported department completion report as CSV',         '2026-03-31 17:00:00');

-- ============================================================
-- ESCALATIONS
-- ============================================================
INSERT INTO `escalations` (`employee_id`, `goal_sheet_id`, `reason`, `priority`, `status`, `days_overdue`, `assigned_to`, `created_at`) VALUES
(10, 4,    'Goal sheet not submitted',       'high',   'open',     45, 3, '2026-02-15 08:00:00'),
(6,  3,    'Rework pending for 30+ days',    'medium', 'open',     30, 2, '2026-02-22 10:00:00'),
(11, 7,    'Goal review pending from manager','low',   'resolved', 15, 3, '2026-03-01 09:00:00');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
INSERT INTO `notifications` (`user_id`, `type`, `title`, `message`, `link`, `is_read`) VALUES
(4,  'goal_approved',    'Goals Approved',           'Your goal sheet for Q4 has been approved by Priya Sharma.',  '/employee/goals',       1),
(5,  'goal_submitted',   'Submission Received',      'Your goal sheet has been submitted for review.',             '/employee/goals',       0),
(6,  'goal_rework',      'Revision Required',        'Your goal sheet has been returned for rework by Priya Sharma.', '/employee/goal-sheet', 0),
(2,  'goal_submitted',   'New Submission',           'Sneha Patel has submitted their goal sheet for review.',     '/manager/reviews',      0),
(2,  'goal_submitted',   'New Submission',           'Rohit Gupta has submitted their goal sheet for review.',     '/manager/reviews',      0),
(10, 'checkin_reminder', 'Check-in Reminder',        'Your Q4 quarterly check-in is due. Please update your progress.', '/employee/check-in', 0),
(1,  'escalation',       'Auto-Escalation',          'Anita Desai has not submitted goals for 45 days.',           '/admin/escalations',    0);

UPDATE `goals` SET `score_method` = 'zero' WHERE `uom_type` = 'boolean';
UPDATE `goals` SET `score_method` = 'timeline' WHERE `uom_type` = 'date';
UPDATE `goals` SET `score_method` = 'max'
WHERE LOWER(`title`) LIKE '%response time%' OR LOWER(`title`) LIKE '%defect leakage%';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Verify counts
-- ============================================================
SELECT 'departments'     AS tbl, COUNT(*) AS cnt FROM departments
UNION ALL SELECT 'designations', COUNT(*) FROM designations
UNION ALL SELECT 'users',        COUNT(*) FROM users
UNION ALL SELECT 'goal_sheets',  COUNT(*) FROM goal_sheets
UNION ALL SELECT 'goals',        COUNT(*) FROM goals
UNION ALL SELECT 'shared_goals', COUNT(*) FROM shared_goals
UNION ALL SELECT 'checkins',     COUNT(*) FROM goal_checkins
UNION ALL SELECT 'reviews',      COUNT(*) FROM goal_reviews
UNION ALL SELECT 'audit_logs',   COUNT(*) FROM audit_logs
UNION ALL SELECT 'escalations',  COUNT(*) FROM escalations
UNION ALL SELECT 'notifications',COUNT(*) FROM notifications;
