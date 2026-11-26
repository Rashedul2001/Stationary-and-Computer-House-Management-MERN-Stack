import mongoose from 'mongoose';
import { userSnapshotSchema } from './shared.js';

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, default: '' },
    summary: { type: String, required: true },
    dataSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    performedBy: { type: userSnapshotSchema, required: true },
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
