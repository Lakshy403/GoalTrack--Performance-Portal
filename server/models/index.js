import BaseModel from './BaseModel.js';

class GoalCheckin extends BaseModel {
  constructor() { super('goal_checkins'); }

  async findByGoal(goalId) {
    return this.findAll({ where: { goal_id: goalId }, orderBy: 'checkin_date ASC' });
  }

  async findByQuarter(quarterId) {
    return this.findAll({ where: { quarter_id: quarterId }, orderBy: 'checkin_date DESC' });
  }
}

class GoalReview extends BaseModel {
  constructor() { super('goal_reviews'); }

  async findBySheet(goalSheetId) {
    return this.findAll({ where: { goal_sheet_id: goalSheetId }, orderBy: 'created_at DESC' });
  }
}

class AuditLog extends BaseModel {
  constructor() { super('audit_logs'); }

  async log(userId, action, entityType, entityId, targetLabel, details, meta = {}) {
    return this.create({
      user_id: userId, action, entity_type: entityType,
      entity_id: entityId, target_label: targetLabel,
      details, metadata: JSON.stringify(meta),
    });
  }

  async findByEntity(entityType, entityId) {
    return this.findAll({ where: { entity_type: entityType, entity_id: entityId }, orderBy: 'created_at DESC' });
  }
}

class Escalation extends BaseModel {
  constructor() { super('escalations'); }

  async findOpen() {
    return this.findAll({ where: { status: 'open' }, orderBy: 'priority DESC, days_overdue DESC' });
  }
}

class Notification extends BaseModel {
  constructor() { super('notifications'); }

  async findUnread(userId) {
    return this.findAll({ where: { user_id: userId, is_read: 0 }, orderBy: 'created_at DESC' });
  }

  async markRead(id) {
    return this.update(id, { is_read: 1, read_at: new Date() });
  }

  async markAllRead(userId) {
    const [result] = await this.raw(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return result.affectedRows;
  }
}

class SharedGoal extends BaseModel {
  constructor() { super('shared_goals'); }

  async findActive(quarterId) {
    return this.findAll({ where: { quarter_id: quarterId, is_active: 1 }, orderBy: 'created_at DESC' });
  }
}

class Department extends BaseModel {
  constructor() { super('departments'); }
}

class Designation extends BaseModel {
  constructor() { super('designations'); }
}

class ThrustArea extends BaseModel {
  constructor() { super('thrust_areas'); }
}

class FinancialYear extends BaseModel {
  constructor() { super('financial_years'); }

  async findCurrent() {
    return this.findOne({ is_current: 1 });
  }
}

class Quarter extends BaseModel {
  constructor() { super('quarters'); }

  async findCurrent() {
    return this.findOne({ is_current: 1 });
  }
}

export const goalCheckin   = new GoalCheckin();
export const goalReview    = new GoalReview();
export const auditLog      = new AuditLog();
export const escalation    = new Escalation();
export const notification  = new Notification();
export const sharedGoal    = new SharedGoal();
export const department    = new Department();
export const designation   = new Designation();
export const thrustArea    = new ThrustArea();
export const financialYear = new FinancialYear();
export const quarter       = new Quarter();
