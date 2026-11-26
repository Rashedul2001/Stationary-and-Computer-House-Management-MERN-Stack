import { Product } from '../models/Product.js';
import { Service } from '../models/Service.js';
import { Course } from '../models/Course.js';
import { Student } from '../models/Student.js';
import { Income } from '../models/Income.js';
import { buildUserSnapshot, recordActivity } from '../services/activityLogService.js';
import { generateNextInvoiceNumber } from './posController.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

// ---------- PRODUCTS ----------
export async function createProduct(req, res, next) {
  try {
    const userSnap = buildUserSnapshot(req.user);
    const product = await Product.create({
      ...req.validatedBody,
      createdBy: userSnap,
      updatedBy: userSnap,
    });
    await recordActivity({
      action: 'CREATE_PRODUCT',
      entityType: 'Product',
      entityId: product._id,
      summary: `Created product ${product.name.en || product.name.bn}`,
      dataSnapshot: product.toObject(),
      user: req.user,
    });
    return sendSuccess(res, product, 'Product created.', 201);
  } catch (err) {
    return next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { addUnits = 0, ...rest } = req.validatedBody;
    const existing = await Product.findById(req.params.id);
    if (!existing) return sendError(res, 'Product not found.', 404);

    const updatedUnits = Math.max(0, Number(rest.availableUnits) + Number(addUnits || 0));
    Object.assign(existing, {
      ...rest,
      availableUnits: updatedUnits,
      updatedBy: buildUserSnapshot(req.user),
    });
    await existing.save();

    await recordActivity({
      action: 'UPDATE_PRODUCT',
      entityType: 'Product',
      entityId: existing._id,
      summary: `Updated product ${existing.name.en || existing.name.bn} (stock: ${existing.availableUnits})`,
      dataSnapshot: existing.toObject(),
      user: req.user,
    });
    return sendSuccess(res, existing, 'Product updated.');
  } catch (err) {
    return next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Product not found.', 404);

    await recordActivity({
      action: 'DELETE_PRODUCT',
      entityType: 'Product',
      entityId: deleted._id,
      summary: `Deleted product ${deleted.name.en || deleted.name.bn}`,
      dataSnapshot: deleted.toObject(),
      user: req.user,
    });
    return sendSuccess(res, { id: deleted._id }, 'Product deleted.');
  } catch (err) {
    return next(err);
  }
}

// ---------- SERVICES ----------
export async function createService(req, res, next) {
  try {
    const userSnap = buildUserSnapshot(req.user);
    const service = await Service.create({
      ...req.validatedBody,
      createdBy: userSnap,
      updatedBy: userSnap,
    });
    await recordActivity({
      action: 'CREATE_SERVICE',
      entityType: 'Service',
      entityId: service._id,
      summary: `Created service ${service.name.en || service.name.bn}`,
      dataSnapshot: service.toObject(),
      user: req.user,
    });
    return sendSuccess(res, service, 'Service created.', 201);
  } catch (err) {
    return next(err);
  }
}

export async function updateService(req, res, next) {
  try {
    const updated = await Service.findByIdAndUpdate(
      req.params.id,
      { ...req.validatedBody, updatedBy: buildUserSnapshot(req.user) },
      { new: true }
    );
    if (!updated) return sendError(res, 'Service not found.', 404);

    await recordActivity({
      action: 'UPDATE_SERVICE',
      entityType: 'Service',
      entityId: updated._id,
      summary: `Updated service ${updated.name.en || updated.name.bn}`,
      dataSnapshot: updated.toObject(),
      user: req.user,
    });
    return sendSuccess(res, updated, 'Service updated.');
  } catch (err) {
    return next(err);
  }
}

export async function deleteService(req, res, next) {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Service not found.', 404);

    await recordActivity({
      action: 'DELETE_SERVICE',
      entityType: 'Service',
      entityId: deleted._id,
      summary: `Deleted service ${deleted.name.en || deleted.name.bn}`,
      dataSnapshot: deleted.toObject(),
      user: req.user,
    });
    return sendSuccess(res, { id: deleted._id }, 'Service deleted.');
  } catch (err) {
    return next(err);
  }
}

// ---------- COURSES ----------
export async function createCourse(req, res, next) {
  try {
    const userSnap = buildUserSnapshot(req.user);
    const course = await Course.create({
      ...req.validatedBody,
      createdBy: userSnap,
      updatedBy: userSnap,
    });
    await recordActivity({
      action: 'CREATE_COURSE',
      entityType: 'Course',
      entityId: course._id,
      summary: `Created course ${course.title.en || course.title.bn}`,
      dataSnapshot: course.toObject(),
      user: req.user,
    });
    return sendSuccess(res, course, 'Course created.', 201);
  } catch (err) {
    return next(err);
  }
}

export async function updateCourse(req, res, next) {
  try {
    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.validatedBody, updatedBy: buildUserSnapshot(req.user) },
      { new: true }
    );
    if (!updated) return sendError(res, 'Course not found.', 404);

    await recordActivity({
      action: 'UPDATE_COURSE',
      entityType: 'Course',
      entityId: updated._id,
      summary: `Updated course ${updated.title.en || updated.title.bn}`,
      dataSnapshot: updated.toObject(),
      user: req.user,
    });
    return sendSuccess(res, updated, 'Course updated.');
  } catch (err) {
    return next(err);
  }
}

export async function deleteCourse(req, res, next) {
  try {
    const deleted = await Course.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Course not found.', 404);

    await recordActivity({
      action: 'DELETE_COURSE',
      entityType: 'Course',
      entityId: deleted._id,
      summary: `Deleted course ${deleted.title.en || deleted.title.bn}`,
      dataSnapshot: deleted.toObject(),
      user: req.user,
    });
    return sendSuccess(res, { id: deleted._id }, 'Course deleted.');
  } catch (err) {
    return next(err);
  }
}

// ---------- STUDENTS ----------
export async function listStudents(req, res, next) {
  try {
    const { search = '' } = req.query;
    const filter = {};
    if (search && String(search).trim()) {
      const q = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { name: regex },
        { phone: regex },
        { email: regex },
        { 'courseTitleSnapshot.en': regex },
        { 'courseTitleSnapshot.bn': regex },
      ];
    }
    const students = await Student.find(filter).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, students);
  } catch (err) {
    return next(err);
  }
}

export async function createStudent(req, res, next) {
  try {
    const { name, phone, email, address, courseId, enrolledAt, initialPayment = 0 } = req.validatedBody;
    const course = await Course.findById(courseId).lean();
    if (!course) return sendError(res, 'Selected course was not found.', 404);

    const paid = Number(initialPayment || 0);
    if (paid > course.totalFee) {
      return sendError(
        res,
        `Initial payment (${paid} BDT) cannot exceed total course fee (${course.totalFee} BDT).`,
        400
      );
    }

    const userSnap = buildUserSnapshot(req.user);
    const dueFee = Math.max(0, Number((course.totalFee - paid).toFixed(2)));

    const student = await Student.create({
      name,
      phone,
      email,
      address,
      courseId: course._id,
      courseTitleSnapshot: course.title,
      totalFee: course.totalFee,
      totalPaid: paid,
      dueFee,
      enrolledAt: enrolledAt ? new Date(enrolledAt) : new Date(),
      createdBy: userSnap,
      updatedBy: userSnap,
    });

    let initialIncome = null;
    if (paid > 0) {
      const invoiceNumber = await generateNextInvoiceNumber();
      initialIncome = await Income.create({
        invoiceNumber,
        type: 'course_fee',
        itemId: course._id,
        itemTitle: course.title,
        studentId: student._id,
        customerName: student.name,
        details: 'Initial admission payment',
        quantity: 1,
        priceType: 'course',
        unitPrice: paid,
        calculatedTotal: paid,
        isDiscounted: false,
        discountedPrice: null,
        finalAmount: paid,
        enteredBy: userSnap,
        transactionDate: new Date(),
      });
    }

    await recordActivity({
      action: 'CREATE_STUDENT',
      entityType: 'Student',
      entityId: student._id,
      summary: `Enrolled student ${student.name} in ${course.title.en || course.title.bn} (Initial paid: ${paid} BDT)`,
      dataSnapshot: { student: student.toObject(), initialIncome },
      user: req.user,
    });

    return sendSuccess(res, { student, initialIncome }, 'Student enrolled successfully.', 201);
  } catch (err) {
    return next(err);
  }
}

export async function updateStudent(req, res, next) {
  try {
    const { name, phone, email, address, courseId, enrolledAt, dueFee } = req.validatedBody;
    const existing = await Student.findById(req.params.id);
    if (!existing) return sendError(res, 'Student not found.', 404);

    if (courseId && String(courseId) !== String(existing.courseId)) {
      const course = await Course.findById(courseId).lean();
      if (!course) return sendError(res, 'Selected course was not found.', 404);
      existing.courseId = course._id;
      existing.courseTitleSnapshot = course.title;
      existing.totalFee = course.totalFee;
      if (dueFee === undefined) {
        existing.dueFee = Math.max(0, course.totalFee - existing.totalPaid);
      }
    }

    existing.name = name;
    existing.phone = phone;
    existing.email = email;
    existing.address = address;
    if (enrolledAt) existing.enrolledAt = new Date(enrolledAt);
    if (dueFee !== undefined) existing.dueFee = Math.max(0, Number(dueFee));
    existing.updatedBy = buildUserSnapshot(req.user);

    await existing.save();

    await recordActivity({
      action: 'UPDATE_STUDENT',
      entityType: 'Student',
      entityId: existing._id,
      summary: `Updated student ${existing.name}`,
      dataSnapshot: existing.toObject(),
      user: req.user,
    });

    return sendSuccess(res, existing, 'Student updated.');
  } catch (err) {
    return next(err);
  }
}

export async function deleteStudent(req, res, next) {
  try {
    const deleted = await Student.findByIdAndDelete(req.params.id);
    if (!deleted) return sendError(res, 'Student not found.', 404);

    await recordActivity({
      action: 'DELETE_STUDENT',
      entityType: 'Student',
      entityId: deleted._id,
      summary: `Deleted student ${deleted.name}`,
      dataSnapshot: deleted.toObject(),
      user: req.user,
    });
    return sendSuccess(res, { id: deleted._id }, 'Student deleted.');
  } catch (err) {
    return next(err);
  }
}
