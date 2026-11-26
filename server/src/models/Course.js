import mongoose from 'mongoose';
import { bilingualSchema, userSnapshotSchema } from './shared.js';

const courseSchema = new mongoose.Schema(
  {
    title: { type: bilingualSchema, required: true },
    description: { type: bilingualSchema, default: () => ({ en: '', bn: '' }) },
    totalFee: { type: Number, required: true, min: 0 },
    duration: { type: bilingualSchema, required: true },
    createdBy: { type: userSnapshotSchema, default: null },
    updatedBy: { type: userSnapshotSchema, default: null },
  },
  { timestamps: true }
);

export const Course = mongoose.model('Course', courseSchema);
