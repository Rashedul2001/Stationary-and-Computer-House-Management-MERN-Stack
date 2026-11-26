import mongoose from 'mongoose';

export const bilingualSchema = new mongoose.Schema(
  {
    en: { type: String, trim: true, default: '' },
    bn: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

export const userSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: 'assistant' },
  },
  { _id: false }
);
