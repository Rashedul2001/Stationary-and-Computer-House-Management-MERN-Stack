import mongoose from 'mongoose';
import { bilingualSchema, userSnapshotSchema } from './shared.js';

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, trim: true, default: '' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    courseTitleSnapshot: { type: bilingualSchema, required: true },
    totalFee: { type: Number, required: true, min: 0 },
    totalPaid: { type: Number, required: true, min: 0, default: 0 },
    dueFee: { type: Number, required: true, min: 0 },
    enrolledAt: { type: Date, default: Date.now },
    createdBy: { type: userSnapshotSchema, default: null },
    updatedBy: { type: userSnapshotSchema, default: null },
  },
  { timestamps: true }
);

export const Student = mongoose.model('Student', studentSchema);
