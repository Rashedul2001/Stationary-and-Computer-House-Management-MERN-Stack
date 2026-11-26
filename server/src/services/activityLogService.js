import { ActivityLog } from '../models/ActivityLog.js';

export function buildUserSnapshot(user) {
  if (!user) {
    return {
      userId: 'system',
      name: 'System',
      email: 'system@laksam.local',
      role: 'admin',
    };
  }
  return {
    userId: String(user.id || user._id || ''),
    name: user.name || 'User',
    email: user.email || '',
    role: user.role || 'assistant',
  };
}

export async function recordActivity({ action, entityType, entityId = '', summary, dataSnapshot = {}, user }) {
  try {
    await ActivityLog.create({
      action,
      entityType,
      entityId: String(entityId || ''),
      summary,
      dataSnapshot,
      performedBy: buildUserSnapshot(user),
    });
  } catch (err) {
    console.error('[ActivityLog] Failed to record activity:', err.message);
  }
}
