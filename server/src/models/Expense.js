import mongoose from 'mongoose';
import { bilingualSchema, userSnapshotSchema } from './shared.js';

const expenseSchema = new mongoose.Schema(
  {
    categorySlug: { type: String, required: true, trim: true, lowercase: true, index: true },
    title: { type: bilingualSchema, required: true },
    details: { type: String, trim: true, default: '' },
    amount: { type: Number, required: true, min: 0 },
    enteredBy: { type: userSnapshotSchema, required: true },
    transactionDate: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const Expense = mongoose.model('Expense', expenseSchema);
