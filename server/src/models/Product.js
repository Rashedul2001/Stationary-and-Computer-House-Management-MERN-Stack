import mongoose from 'mongoose';
import { bilingualSchema, userSnapshotSchema } from './shared.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: bilingualSchema, required: true },
    details: { type: bilingualSchema, default: () => ({ en: '', bn: '' }) },
    categorySlug: { type: String, required: true, trim: true, lowercase: true, index: true },
    imageUrl: { type: String, trim: true, default: '' },
    retailPrice: { type: Number, required: true, min: 0 },
    wholesalePrice: { type: Number, required: true, min: 0 },
    availableUnits: { type: Number, required: true, min: 0, default: 0 },
    createdBy: { type: userSnapshotSchema, default: null },
    updatedBy: { type: userSnapshotSchema, default: null },
  },
  { timestamps: true }
);

productSchema.index({ 'name.en': 'text', 'name.bn': 'text', 'details.en': 'text', 'details.bn': 'text' });

export const Product = mongoose.model('Product', productSchema);
