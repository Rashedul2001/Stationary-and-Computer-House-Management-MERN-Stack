import mongoose from 'mongoose';
import { bilingualSchema } from './shared.js';

const categoryItemSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true, lowercase: true },
    name: { type: bilingualSchema, required: true },
  },
  { _id: true }
);

const pageHeaderSchema = new mongoose.Schema(
  {
    title: { type: bilingualSchema, default: () => ({ en: '', bn: '' }) },
    subtitle: { type: bilingualSchema, default: () => ({ en: '', bn: '' }) },
  },
  { _id: false }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'main', unique: true },
    storeName: { type: bilingualSchema, required: true },
    proprietor: { type: bilingualSchema, required: true },
    heroTitle: { type: bilingualSchema, required: true },
    heroSubtitle: { type: bilingualSchema, required: true },
    heroImageUrl: { type: String, default: '/images/hero-default.jpeg' },
    heroImagePublicId: { type: String, default: '' },
    address: { type: bilingualSchema, required: true },
    coordinates: {
      lat: { type: Number, default: 23.24 },
      lng: { type: Number, default: 91.1214 },
    },
    phones: { type: [String], default: [] },
    whatsappNumber: { type: String, default: '' },
    email: { type: String, default: '' },
    facebookUrl: { type: String, default: '' },
    openingHours: { type: bilingualSchema, default: () => ({ en: '', bn: '' }) },
    githubUrl: { type: String, default: 'https://github.com/Rashedul2001' },
    pageHeaders: {
      home: { type: pageHeaderSchema, default: () => ({}) },
      products: { type: pageHeaderSchema, default: () => ({}) },
      services: { type: pageHeaderSchema, default: () => ({}) },
      courses: { type: pageHeaderSchema, default: () => ({}) },
    },
    productCategories: { type: [categoryItemSchema], default: [] },
    expenseCategories: { type: [categoryItemSchema], default: [] },
  },
  { timestamps: true }
);

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
