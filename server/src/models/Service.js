import mongoose from 'mongoose';
import { bilingualSchema, userSnapshotSchema } from './shared.js';

const serviceSchema = new mongoose.Schema(
  {
    name: { type: bilingualSchema, required: true },
    details: { type: bilingualSchema, default: () => ({ en: '', bn: '' }) },
    cost: { type: Number, required: true, min: 0 },
    createdBy: { type: userSnapshotSchema, default: null },
    updatedBy: { type: userSnapshotSchema, default: null },
  },
  { timestamps: true }
);

export const Service = mongoose.model('Service', serviceSchema);
