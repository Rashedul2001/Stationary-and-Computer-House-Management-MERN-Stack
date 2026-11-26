import { z } from 'zod';

const bilingualText = z.object({
  en: z.string().trim().default(''),
  bn: z.string().trim().default(''),
});

const nonEmptyBilingual = bilingualText.refine((v) => v.en.length > 0 || v.bn.length > 0, {
  message: 'Provide text in at least English or Bengali.',
});

export const productSchema = z.object({
  name: nonEmptyBilingual,
  details: bilingualText.optional().default({ en: '', bn: '' }),
  categorySlug: z.string().trim().min(1, 'Category is required'),
  imageUrl: z.string().trim().optional().default(''),
  retailPrice: z.coerce.number().min(0, 'Retail price must be >= 0'),
  wholesalePrice: z.coerce.number().min(0, 'Wholesale price must be >= 0'),
  availableUnits: z.coerce.number().int().min(0, 'Available units must be >= 0'),
});

export const productUpdateSchema = productSchema.extend({
  addUnits: z.coerce.number().int().min(0).optional().default(0),
});

export const serviceSchema = z.object({
  name: nonEmptyBilingual,
  details: bilingualText.optional().default({ en: '', bn: '' }),
  cost: z.coerce.number().min(0, 'Service cost must be >= 0'),
});

export const courseSchema = z.object({
  title: nonEmptyBilingual,
  description: bilingualText.optional().default({ en: '', bn: '' }),
  totalFee: z.coerce.number().min(0, 'Total fee must be >= 0'),
  duration: nonEmptyBilingual,
});

export const studentCreateSchema = z.object({
  name: z.string().trim().min(1, 'Student name is required'),
  phone: z.string().trim().min(6, 'Valid phone number is required'),
  email: z.string().trim().email('Invalid email').optional().or(z.literal('')).default(''),
  address: z.string().trim().optional().default(''),
  courseId: z.string().trim().min(1, 'Course is required'),
  enrolledAt: z.string().optional(),
  initialPayment: z.coerce.number().min(0).optional().default(0),
});

export const studentUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Student name is required'),
  phone: z.string().trim().min(6, 'Valid phone number is required'),
  email: z.string().trim().email('Invalid email').optional().or(z.literal('')).default(''),
  address: z.string().trim().optional().default(''),
  courseId: z.string().trim().min(1, 'Course is required'),
  enrolledAt: z.string().optional(),
  dueFee: z.coerce.number().min(0).optional(),
});

export const productSaleSchema = z.object({
  productId: z.string().trim().min(1, 'Please select a product'),
  priceType: z.enum(['retail', 'wholesale']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  customerName: z.string().trim().optional().default(''),
  details: z.string().trim().optional().default(''),
  totalAmount: z.coerce.number().min(0, 'Total amount must be >= 0'),
});

export const serviceSaleSchema = z.object({
  serviceId: z.string().trim().min(1, 'Please select a service'),
  quantity: z.coerce.number().int().min(1).optional().default(1),
  customerName: z.string().trim().optional().default(''),
  details: z.string().trim().optional().default(''),
  totalAmount: z.coerce.number().min(0, 'Total amount must be >= 0'),
});

export const studentFeeSchema = z.object({
  studentId: z.string().trim().min(1, 'Please select a student'),
  amount: z.coerce.number().positive('Payment amount must be greater than 0'),
  details: z.string().trim().optional().default(''),
});

export const expenseRecordSchema = z.object({
  categorySlug: z.string().trim().min(1, 'Expense category is required'),
  details: z.string().trim().optional().default(''),
  amount: z.coerce.number().positive('Expense amount must be greater than 0'),
});

export const categoryItemSchema = z.object({
  slug: z.string().trim().min(1).optional(),
  name: nonEmptyBilingual,
});
