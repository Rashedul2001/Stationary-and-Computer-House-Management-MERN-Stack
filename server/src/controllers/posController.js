import { Product } from '../models/Product.js';
import { Service } from '../models/Service.js';
import { Student } from '../models/Student.js';
import { Income } from '../models/Income.js';
import { Expense } from '../models/Expense.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { buildUserSnapshot, recordActivity } from '../services/activityLogService.js';
import { getDhakaInvoicePrefix } from '../utils/dhakaTime.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export async function generateNextInvoiceNumber() {
  const prefix = getDhakaInvoicePrefix(new Date());
  const latest = await Income.findOne({ invoiceNumber: new RegExp(`^${prefix}-`) })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber')
    .lean();

  let nextSeq = 1;
  if (latest?.invoiceNumber) {
    const lastPart = latest.invoiceNumber.split('-').pop();
    const parsed = Number.parseInt(lastPart, 10);
    if (!Number.isNaN(parsed)) {
      nextSeq = parsed + 1;
    }
  }
  return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
}

export async function createProductSale(req, res, next) {
  try {
    const { productId, priceType, quantity, customerName, details, totalAmount } = req.validatedBody;
    const product = await Product.findById(productId);
    if (!product) {
      return sendError(res, 'Selected product was not found.', 404);
    }

    if (product.availableUnits <= 0) {
      return sendError(
        res,
        `Stock is empty for ${product.name.en || product.name.bn}. Cannot complete sale.`,
        400
      );
    }

    if (quantity > product.availableUnits) {
      return sendError(
        res,
        `Insufficient stock! Only ${product.availableUnits} unit(s) available for ${product.name.en || product.name.bn}.`,
        400
      );
    }

    // Atomic conditional decrement to guarantee stock never drops below zero
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, availableUnits: { $gte: quantity } },
      { $inc: { availableUnits: -quantity }, $set: { updatedBy: buildUserSnapshot(req.user) } },
      { new: true }
    );

    if (!updatedProduct) {
      return sendError(res, 'Insufficient stock available for this quantity.', 400);
    }

    const unitPrice = priceType === 'wholesale' ? product.wholesalePrice : product.retailPrice;
    const calculatedTotal = Number((unitPrice * quantity).toFixed(2));
    const finalAmount = Number(totalAmount.toFixed(2));
    const isDiscounted = finalAmount !== calculatedTotal;
    const discountedPrice = isDiscounted ? finalAmount : null;

    const invoiceNumber = await generateNextInvoiceNumber();
    const income = await Income.create({
      invoiceNumber,
      type: 'product_sale',
      itemId: product._id,
      itemTitle: product.name,
      customerName: customerName || 'Walk-in Customer',
      details,
      quantity,
      priceType,
      unitPrice,
      calculatedTotal,
      isDiscounted,
      discountedPrice,
      finalAmount,
      enteredBy: buildUserSnapshot(req.user),
      transactionDate: new Date(),
    });

    await recordActivity({
      action: 'CREATE_PRODUCT_SALE',
      entityType: 'Income',
      entityId: income._id,
      summary: `Sold ${quantity}x ${product.name.en || product.name.bn} (${invoiceNumber}) for ${finalAmount} BDT`,
      dataSnapshot: income.toObject(),
      user: req.user,
    });

    return sendSuccess(res, { income, updatedStock: updatedProduct.availableUnits }, 'Product sale recorded.', 201);
  } catch (err) {
    return next(err);
  }
}

export async function createServiceSale(req, res, next) {
  try {
    const { serviceId, quantity = 1, customerName, details, totalAmount } = req.validatedBody;
    const service = await Service.findById(serviceId).lean();
    if (!service) {
      return sendError(res, 'Selected service was not found.', 404);
    }

    const unitPrice = service.cost;
    const calculatedTotal = Number((unitPrice * quantity).toFixed(2));
    const finalAmount = Number(totalAmount.toFixed(2));
    const isDiscounted = finalAmount !== calculatedTotal;
    const discountedPrice = isDiscounted ? finalAmount : null;

    const invoiceNumber = await generateNextInvoiceNumber();
    const income = await Income.create({
      invoiceNumber,
      type: 'service_sale',
      itemId: service._id,
      itemTitle: service.name,
      customerName: customerName || 'Walk-in Customer',
      details,
      quantity,
      priceType: 'service',
      unitPrice,
      calculatedTotal,
      isDiscounted,
      discountedPrice,
      finalAmount,
      enteredBy: buildUserSnapshot(req.user),
      transactionDate: new Date(),
    });

    await recordActivity({
      action: 'CREATE_SERVICE_SALE',
      entityType: 'Income',
      entityId: income._id,
      summary: `Service sale: ${service.name.en || service.name.bn} (${invoiceNumber}) for ${finalAmount} BDT`,
      dataSnapshot: income.toObject(),
      user: req.user,
    });

    return sendSuccess(res, { income }, 'Service income recorded.', 201);
  } catch (err) {
    return next(err);
  }
}

export async function collectStudentFee(req, res, next) {
  try {
    const { studentId, amount, details } = req.validatedBody;
    const student = await Student.findById(studentId);
    if (!student) {
      return sendError(res, 'Student not found.', 404);
    }

    if (student.dueFee <= 0) {
      return sendError(res, 'This student has no remaining due fee.', 400);
    }

    if (amount > student.dueFee) {
      return sendError(
        res,
        `Payment exceeds remaining due fee (${student.dueFee} BDT). Please adjust the amount.`,
        400
      );
    }

    const payAmount = Number(amount.toFixed(2));
    const updatedStudent = await Student.findOneAndUpdate(
      { _id: studentId, dueFee: { $gte: payAmount } },
      {
        $inc: { totalPaid: payAmount, dueFee: -payAmount },
        $set: { updatedBy: buildUserSnapshot(req.user) },
      },
      { new: true }
    );

    if (!updatedStudent) {
      return sendError(res, 'Unable to process fee payment. Check remaining due.', 400);
    }

    const invoiceNumber = await generateNextInvoiceNumber();
    const income = await Income.create({
      invoiceNumber,
      type: 'course_fee',
      itemId: student.courseId,
      itemTitle: student.courseTitleSnapshot,
      studentId: student._id,
      customerName: student.name,
      details: details || 'Course fee installment',
      quantity: 1,
      priceType: 'course',
      unitPrice: payAmount,
      calculatedTotal: payAmount,
      isDiscounted: false,
      discountedPrice: null,
      finalAmount: payAmount,
      enteredBy: buildUserSnapshot(req.user),
      transactionDate: new Date(),
    });

    await recordActivity({
      action: 'COLLECT_STUDENT_FEE',
      entityType: 'Income',
      entityId: income._id,
      summary: `Collected ${payAmount} BDT fee from ${student.name} (${invoiceNumber})`,
      dataSnapshot: { income: income.toObject(), remainingDue: updatedStudent.dueFee },
      user: req.user,
    });

    return sendSuccess(res, { income, student: updatedStudent }, 'Student fee collected.', 201);
  } catch (err) {
    return next(err);
  }
}

export async function createExpenseRecord(req, res, next) {
  try {
    const { categorySlug, details, amount } = req.validatedBody;
    const settings = await SiteSettings.findOne({ singletonKey: 'main' }).lean();
    const category = settings?.expenseCategories?.find(
      (c) => c.slug === categorySlug.toLowerCase()
    );

    const title = category?.name || { en: categorySlug, bn: categorySlug };
    const expense = await Expense.create({
      categorySlug: categorySlug.toLowerCase(),
      title,
      details,
      amount: Number(amount.toFixed(2)),
      enteredBy: buildUserSnapshot(req.user),
      transactionDate: new Date(),
    });

    await recordActivity({
      action: 'CREATE_EXPENSE',
      entityType: 'Expense',
      entityId: expense._id,
      summary: `Expense: ${title.en || title.bn} for ${expense.amount} BDT`,
      dataSnapshot: expense.toObject(),
      user: req.user,
    });

    return sendSuccess(res, { expense }, 'Expense recorded.', 201);
  } catch (err) {
    return next(err);
  }
}

export async function getPosStudents(req, res, next) {
  try {
    const { search = '' } = req.query;
    const filter = {};
    if (search && String(search).trim()) {
      const q = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(q, 'i');
      filter.$or = [{ name: regex }, { phone: regex }, { 'courseTitleSnapshot.en': regex }, { 'courseTitleSnapshot.bn': regex }];
    }
    const students = await Student.find(filter).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, students);
  } catch (err) {
    return next(err);
  }
}

export async function getRecentIncomesForInvoice(req, res, next) {
  try {
    const { search = '', limit = 50 } = req.query;
    const filter = {};
    if (search && String(search).trim()) {
      const q = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { invoiceNumber: regex },
        { customerName: regex },
        { 'itemTitle.en': regex },
        { 'itemTitle.bn': regex },
      ];
    }
    const incomes = await Income.find(filter)
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 100))
      .lean();
    return sendSuccess(res, incomes);
  } catch (err) {
    return next(err);
  }
}
