import mongoose from 'mongoose';
import { bilingualSchema, userSnapshotSchema } from './shared.js';

const incomeSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['product_sale', 'service_sale', 'course_fee'],
      required: true,
      index: true,
    },
    itemId: { type: mongoose.Schema.Types.ObjectId, default: null },
    itemTitle: { type: bilingualSchema, required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    customerName: { type: String, trim: true, default: '' },
    details: { type: String, trim: true, default: '' },
    quantity: { type: Number, min: 1, default: 1 },
    priceType: {
      type: String,
      enum: ['retail', 'wholesale', 'service', 'course'],
      required: true,
    },
    unitPrice: { type: Number, required: true, min: 0 },
    calculatedTotal: { type: Number, required: true, min: 0 },
    isDiscounted: { type: Boolean, default: false },
    discountedPrice: { type: Number, default: null, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
    enteredBy: { type: userSnapshotSchema, required: true },
    transactionDate: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const Income = mongoose.model('Income', incomeSchema);
