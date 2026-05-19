-- ============================================================
-- GoalTrack — Enterprise Goal Setting & Tracking Portal
-- MySQL Database Schema v1.0
-- Normalized Relational Design
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS `goaltrack_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `goaltrack_db`;

-- ============================================================
-- 1. DEPARTMENTS
-- ============================================================
CREATE TABLE `departments` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100)    NOT NULL,
  `code`        VARCHAR(20)     NOT NULL,
  `description` TEXT            NULL,
  `head_id`     INT UNSIGNED    NULL COMMENT 'FK to users — set after users table exists',
  `is_active`   TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_departments_code` (`code`),
  UNIQUE KEY `uq_departments_name` (`name`),
  INDEX `idx_departments_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. DESIGNATIONS
-- ============================================================
CREATE TABLE `designations` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(100)    NOT NULL,
  `level`       TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=Junior, 2=Mid, 3=Senior, 4=Lead, 5=Manager, 6=Director, 7=VP, 8=CXO',
  `is_active`   TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_designations_title` (`title`),
  INDEX `idx_designations_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. USERS
-- ============================================================
CREATE TABLE `users` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `employee_code`   VARCHAR(20)     NOT NULL,
  `first_name`      VARCHAR(50)     NOT NULL,
  `last_name`       VARCHAR(50)     NOT NULL,
  `email`           VARCHAR(150)    NOT NULL,
  `password_hash`   VARCHAR(255)    NOT NULL,
  `role`            ENUM('employee','manager','admin') NOT NULL DEFAULT 'employee',
  `department_id`   INT UNSIGNED    NOT NULL,
  `designation_id`  INT UNSIGNED    NOT NULL,
  `manager_id`      INT UNSIGNED    NULL COMMENT 'Self-referencing FK — reporting manager',
  `phone`           VARCHAR(20)     NULL,
  `avatar_url`      VARCHAR(500)    NULL,
  `is_active`       TINYINT(1)      NOT NULL DEFAULT 1,
  `last_login_at`   TIMESTAMP       NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_employee_code` (`employee_code`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_department` (`department_id`),
  INDEX `idx_users_manager` (`manager_id`),
  INDEX `idx_users_active` (`is_active`),
  CONSTRAINT `fk_users_department`  FOREIGN KEY (`department_id`)  REFERENCES `departments`(`id`)  ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_users_designation` FOREIGN KEY (`designation_id`) REFERENCES `designations`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_users_manager`     FOREIGN KEY (`manager_id`)     REFERENCES `users`(`id`)        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Back-fill FK on departments.head_id
ALTER TABLE `departments`
  ADD CONSTRAINT `fk_departments_head` FOREIGN KEY (`head_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE SET NULL;

-- ============================================================
-- 4. FINANCIAL YEARS
-- ============================================================
CREATE TABLE `financial_years` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `label`       VARCHAR(20)   NOT NULL COMMENT 'e.g. FY 2025-26',
  `start_date`  DATE          NOT NULL,
  `end_date`    DATE          NOT NULL,
  `is_current`  TINYINT(1)    NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fy_label` (`label`),
  INDEX `idx_fy_current` (`is_current`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. QUARTERS
-- ============================================================
CREATE TABLE `quarters` (
  `id`                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `financial_year_id` INT UNSIGNED  NOT NULL,
  `label`             VARCHAR(10)   NOT NULL COMMENT 'Q1, Q2, Q3, Q4',
  `start_date`        DATE          NOT NULL,
  `end_date`          DATE          NOT NULL,
  `is_current`        TINYINT(1)    NOT NULL DEFAULT 0,
  `created_at`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quarters_fy_label` (`financial_year_id`, `label`),
  INDEX `idx_quarters_current` (`is_current`),
  CONSTRAINT `fk_quarters_fy` FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. THRUST AREAS (master list)
-- ============================================================
CREATE TABLE `thrust_areas` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100)  NOT NULL,
  `description` TEXT          NULL,
  `is_active`   TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_thrust_areas_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. GOAL SHEETS (one per employee per quarter)
-- ============================================================
CREATE TABLE `goal_sheets` (
  `id`              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `employee_id`     INT UNSIGNED  NOT NULL,
  `quarter_id`      INT UNSIGNED  NOT NULL,
  `status`          ENUM('draft','submitted','under_review','approved','rejected','rework','unlocked') NOT NULL DEFAULT 'draft',
  `submitted_at`    TIMESTAMP     NULL,
  `reviewed_at`     TIMESTAMP     NULL,
  `reviewed_by`     INT UNSIGNED  NULL COMMENT 'Manager who reviewed',
  `review_comments` TEXT          NULL,
  `is_locked`       TINYINT(1)    NOT NULL DEFAULT 0,
  `version`         INT UNSIGNED  NOT NULL DEFAULT 1 COMMENT 'Increments on each resubmission',
  `created_at`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_goalsheets_emp_qtr` (`employee_id`, `quarter_id`),
  INDEX `idx_goalsheets_status` (`status`),
  INDEX `idx_goalsheets_quarter` (`quarter_id`),
  INDEX `idx_goalsheets_reviewer` (`reviewed_by`),
  CONSTRAINT `fk_goalsheets_employee` FOREIGN KEY (`employee_id`) REFERENCES `users`(`id`)    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_goalsheets_quarter`  FOREIGN KEY (`quarter_id`)  REFERENCES `quarters`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_goalsheets_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`)    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. GOALS (individual goals within a goal sheet)
-- ============================================================
CREATE TABLE `goals` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `goal_sheet_id`   INT UNSIGNED    NOT NULL,
  `thrust_area_id`  INT UNSIGNED    NOT NULL,
  `title`           VARCHAR(255)    NOT NULL,
  `description`     TEXT            NULL,
  `uom_type`        ENUM('percentage','number','currency','rating','boolean','date') NOT NULL DEFAULT 'percentage',
  `target_value`    VARCHAR(100)    NOT NULL,
  `weightage`       DECIMAL(5,2)    NOT NULL COMMENT 'Must sum to 100 per sheet',
  `achievement`     DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `status`          ENUM('not_started','on_track','at_risk','completed','overdue') NOT NULL DEFAULT 'not_started',
  `is_shared`       TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'True if pushed by admin',
  `shared_goal_id`  INT UNSIGNED    NULL COMMENT 'FK to shared_goals if is_shared=1',
  `parent_goal_id`  INT UNSIGNED    NULL COMMENT 'Parent goal for cascading KPI relationships',
  `sort_order`      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_goals_sheet` (`goal_sheet_id`),
  INDEX `idx_goals_thrust` (`thrust_area_id`),
  INDEX `idx_goals_status` (`status`),
  INDEX `idx_goals_shared` (`is_shared`),
  INDEX `idx_goals_parent_goal` (`parent_goal_id`),
  CONSTRAINT `fk_goals_sheet`  FOREIGN KEY (`goal_sheet_id`)  REFERENCES `goal_sheets`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_goals_thrust` FOREIGN KEY (`thrust_area_id`) REFERENCES `thrust_areas`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_goals_parent_goal` FOREIGN KEY (`parent_goal_id`) REFERENCES `goals`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `chk_goals_weightage` CHECK (`weightage` >= 10.00 AND `weightage` <= 100.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. SHARED GOALS (departmental goals pushed by admin)
-- ============================================================
CREATE TABLE `shared_goals` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `title`           VARCHAR(255)    NOT NULL,
  `description`     TEXT            NULL,
  `thrust_area_id`  INT UNSIGNED    NOT NULL,
  `uom_type`        ENUM('percentage','number','currency','rating','boolean','date') NOT NULL,
  `target_value`    VARCHAR(100)    NOT NULL,
  `department_id`   INT UNSIGNED    NULL COMMENT 'NULL = all departments',
  `quarter_id`      INT UNSIGNED    NOT NULL,
  `created_by`      INT UNSIGNED    NOT NULL COMMENT 'Admin who pushed',
  `is_active`       TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_shared_dept` (`department_id`),
  INDEX `idx_shared_qtr` (`quarter_id`),
  CONSTRAINT `fk_shared_thrust`    FOREIGN KEY (`thrust_area_id`) REFERENCES `thrust_areas`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_shared_dept`      FOREIGN KEY (`department_id`)  REFERENCES `departments`(`id`)  ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_shared_quarter`   FOREIGN KEY (`quarter_id`)     REFERENCES `quarters`(`id`)     ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_shared_creator`   FOREIGN KEY (`created_by`)     REFERENCES `users`(`id`)        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Back-fill FK on goals.shared_goal_id
ALTER TABLE `goals`
  ADD CONSTRAINT `fk_goals_shared_goal` FOREIGN KEY (`shared_goal_id`) REFERENCES `shared_goals`(`id`) ON UPDATE CASCADE ON DELETE SET NULL;

-- ============================================================
-- 10. GOAL CHECK-INS (quarterly progress entries)
-- ============================================================
CREATE TABLE `goal_checkins` (
  `id`                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `goal_id`           INT UNSIGNED    NOT NULL,
  `quarter_id`        INT UNSIGNED    NOT NULL,
  `achievement_value` DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `status`            ENUM('not_started','on_track','at_risk','completed','overdue') NOT NULL DEFAULT 'not_started',
  `employee_comment`  TEXT            NULL,
  `manager_comment`   TEXT            NULL,
  `commented_by`      INT UNSIGNED    NULL COMMENT 'Manager who commented',
  `commented_at`      TIMESTAMP       NULL,
  `checkin_date`      DATE            NOT NULL,
  `created_at`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_checkins_goal` (`goal_id`),
  INDEX `idx_checkins_quarter` (`quarter_id`),
  INDEX `idx_checkins_date` (`checkin_date`),
  CONSTRAINT `fk_checkins_goal`      FOREIGN KEY (`goal_id`)      REFERENCES `goals`(`id`)    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_checkins_quarter`   FOREIGN KEY (`quarter_id`)   REFERENCES `quarters`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_checkins_commenter` FOREIGN KEY (`commented_by`) REFERENCES `users`(`id`)    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. GOAL REVIEWS (manager review history)
-- ============================================================
CREATE TABLE `goal_reviews` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `goal_sheet_id`   INT UNSIGNED    NOT NULL,
  `reviewer_id`     INT UNSIGNED    NOT NULL,
  `action`          ENUM('approved','rejected','returned_for_rework','unlocked') NOT NULL,
  `comments`        TEXT            NULL,
  `modified_fields` JSON            NULL COMMENT 'Snapshot of target/weightage changes made by manager',
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_reviews_sheet` (`goal_sheet_id`),
  INDEX `idx_reviews_reviewer` (`reviewer_id`),
  INDEX `idx_reviews_action` (`action`),
  CONSTRAINT `fk_reviews_sheet`    FOREIGN KEY (`goal_sheet_id`) REFERENCES `goal_sheets`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_reviewer` FOREIGN KEY (`reviewer_id`)  REFERENCES `users`(`id`)        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. AUDIT LOGS
-- ============================================================
CREATE TABLE `audit_logs` (
  `id`            BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `user_id`       INT UNSIGNED      NULL COMMENT 'NULL for system-generated',
  `action`        VARCHAR(100)      NOT NULL,
  `entity_type`   VARCHAR(50)       NOT NULL COMMENT 'goal_sheet, goal, user, shared_goal, etc.',
  `entity_id`     INT UNSIGNED      NULL,
  `target_label`  VARCHAR(255)      NULL COMMENT 'Human-readable target e.g. GS-001',
  `details`       TEXT              NULL,
  `ip_address`    VARCHAR(45)       NULL,
  `user_agent`    VARCHAR(500)      NULL,
  `metadata`      JSON              NULL COMMENT 'Additional structured data',
  `created_at`    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_changed_by` (`user_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
  INDEX `idx_audit_created` (`created_at`),
  INDEX `idx_audit_timestamp` (`created_at`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. ESCALATIONS
-- ============================================================
CREATE TABLE `escalations` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `employee_id`     INT UNSIGNED    NOT NULL,
  `goal_sheet_id`   INT UNSIGNED    NULL,
  `reason`          VARCHAR(255)    NOT NULL,
  `priority`        ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `status`          ENUM('open','in_progress','resolved','dismissed') NOT NULL DEFAULT 'open',
  `days_overdue`    INT UNSIGNED    NOT NULL DEFAULT 0,
  `assigned_to`     INT UNSIGNED    NULL COMMENT 'Manager or admin handling',
  `resolution_note` TEXT            NULL,
  `resolved_at`     TIMESTAMP       NULL,
  `resolved_by`     INT UNSIGNED    NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_escalations_employee` (`employee_id`),
  INDEX `idx_escalations_status` (`status`),
  INDEX `idx_escalations_priority` (`priority`),
  INDEX `idx_escalations_assigned` (`assigned_to`),
  CONSTRAINT `fk_escalations_employee`   FOREIGN KEY (`employee_id`)   REFERENCES `users`(`id`)        ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_escalations_goalsheet`  FOREIGN KEY (`goal_sheet_id`) REFERENCES `goal_sheets`(`id`)  ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_escalations_assigned`   FOREIGN KEY (`assigned_to`)   REFERENCES `users`(`id`)        ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_escalations_resolver`   FOREIGN KEY (`resolved_by`)   REFERENCES `users`(`id`)        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. NOTIFICATIONS
-- ============================================================
CREATE TABLE `notifications` (
  `id`            BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `user_id`       INT UNSIGNED      NOT NULL,
  `type`          ENUM('goal_submitted','goal_approved','goal_rejected','goal_rework','checkin_reminder','escalation','shared_goal','sheet_unlocked','system') NOT NULL,
  `title`         VARCHAR(255)      NOT NULL,
  `message`       TEXT              NOT NULL,
  `link`          VARCHAR(500)      NULL COMMENT 'Deep link to relevant page',
  `is_read`       TINYINT(1)        NOT NULL DEFAULT 0,
  `read_at`       TIMESTAMP         NULL,
  `created_at`    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_notifications_user` (`user_id`),
  INDEX `idx_notifications_read` (`user_id`, `is_read`),
  INDEX `idx_notifications_type` (`type`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. SESSIONS (JWT token tracking)
-- ============================================================
CREATE TABLE `sessions` (
  `id`              BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `user_id`         INT UNSIGNED      NOT NULL,
  `token_hash`      VARCHAR(255)      NOT NULL COMMENT 'SHA-256 hash of JWT',
  `refresh_token`   VARCHAR(255)      NULL,
  `ip_address`      VARCHAR(45)       NULL,
  `user_agent`      VARCHAR(500)      NULL,
  `expires_at`      TIMESTAMP         NOT NULL,
  `is_revoked`      TINYINT(1)        NOT NULL DEFAULT 0,
  `created_at`      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sessions_user` (`user_id`),
  INDEX `idx_sessions_token` (`token_hash`),
  INDEX `idx_sessions_expires` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. REPORT EXPORTS (tracking exported reports)
-- ============================================================
CREATE TABLE `report_exports` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `exported_by`   INT UNSIGNED    NOT NULL,
  `report_type`   VARCHAR(100)    NOT NULL,
  `format`        ENUM('csv','excel','pdf') NOT NULL DEFAULT 'csv',
  `filters`       JSON            NULL COMMENT 'Applied filters snapshot',
  `file_path`     VARCHAR(500)    NULL,
  `record_count`  INT UNSIGNED    NOT NULL DEFAULT 0,
  `created_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_exports_user` (`exported_by`),
  INDEX `idx_exports_type` (`report_type`),
  CONSTRAINT `fk_exports_user` FOREIGN KEY (`exported_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
