import { getAuth } from '../config/auth.js';
import { getDatabaseName, getMongoDb } from '../config/db.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { Product } from '../models/Product.js';
import { Service } from '../models/Service.js';
import { Course } from '../models/Course.js';
import { Student } from '../models/Student.js';
import { Income } from '../models/Income.js';
import { Expense } from '../models/Expense.js';
import {
  SEED_SITE_SETTINGS,
  SEED_PRODUCTS,
  SEED_SERVICES,
  SEED_COURSES,
  buildSeedTransactions,
} from '../MockDataSeeds/seedData.js';
import { shiftYMD, toDhakaYMD } from '../utils/dhakaTime.js';

async function ensureUser({ name, email, password, role }) {
  const db = getMongoDb();
  const existing = await db.collection('user').findOne({ email: email.toLowerCase() });
  if (existing) {
    return {
      userId: String(existing.id || existing._id),
      name: existing.name,
      email: existing.email,
      role: existing.role || role,
    };
  }

  const auth = getAuth();
  const created = await auth.api.createUser({
    body: {
      email: email.toLowerCase(),
      password,
      name,
      role,
    },
  });

  const user = created?.user;
  return {
    userId: String(user?.id || ''),
    name: user?.name || name,
    email: user?.email || email,
    role: user?.role || role,
  };
}

export async function runInitialSeedIfEmpty() {
  const adminEmail = process.env.ADMIN_EMAIL || 'rashedulprogrammer@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Pass@123';
  const adminName = process.env.ADMIN_NAME || 'MD Rashedul Hasan';

  const assistantEmail = process.env.ASSISTANT_EMAIL || 'rashedul2001cse@gmail.com';
  const assistantPassword = process.env.ASSISTANT_PASSWORD || 'Pass@123';
  const assistantName = process.env.ASSISTANT_NAME || 'Assist Rashedul';

  const adminUser = await ensureUser({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
  });

  const assistantUser = await ensureUser({
    name: assistantName,
    email: assistantEmail,
    password: assistantPassword,
    role: 'assistant',
  });

  const existingSettings = await SiteSettings.findOne({ singletonKey: 'main' });
  if (!existingSettings) {
    await SiteSettings.create(SEED_SITE_SETTINGS);
    console.log('[Seed] SiteSettings seeded.');
  }

  const productCount = await Product.countDocuments();
  const serviceCount = await Service.countDocuments();
  const courseCount = await Course.countDocuments();

  if (productCount === 0 && serviceCount === 0 && courseCount === 0) {
    const products = await Product.insertMany(
      SEED_PRODUCTS.map((p) => ({ ...p, createdBy: adminUser, updatedBy: adminUser }))
    );
    const services = await Service.insertMany(
      SEED_SERVICES.map((s) => ({ ...s, createdBy: adminUser, updatedBy: adminUser }))
    );
    const courses = await Course.insertMany(
      SEED_COURSES.map((c) => ({ ...c, createdBy: adminUser, updatedBy: adminUser }))
    );

    const todayYMD = toDhakaYMD(new Date());
    const students = await Student.insertMany([
      {
        name: 'Mahmudul Hasan',
        phone: '01812345678',
        email: 'mahmud@example.com',
        address: 'Bypass Road, Laksam, Cumilla',
        courseId: courses[0]._id,
        courseTitleSnapshot: courses[0].title,
        totalFee: courses[0].totalFee,
        totalPaid: 2000,
        dueFee: courses[0].totalFee - 2000,
        enrolledAt: new Date(`${shiftYMD(todayYMD, -2)}T10:00:00.000+06:00`),
        createdBy: adminUser,
        updatedBy: adminUser,
      },
      {
        name: 'Nusrat Jahan',
        phone: '01798765432',
        email: 'nusrat@example.com',
        address: 'Dakshin Bazar, Laksam, Cumilla',
        courseId: courses[1]._id,
        courseTitleSnapshot: courses[1].title,
        totalFee: courses[1].totalFee,
        totalPaid: 2500,
        dueFee: courses[1].totalFee - 2500,
        enrolledAt: new Date(`${shiftYMD(todayYMD, -3)}T11:00:00.000+06:00`),
        createdBy: adminUser,
        updatedBy: adminUser,
      },
      {
        name: 'Sabbir Ahmed',
        phone: '01911223344',
        email: '',
        address: 'Chauddagram Road, Laksam',
        courseId: courses[2]._id,
        courseTitleSnapshot: courses[2].title,
        totalFee: courses[2].totalFee,
        totalPaid: 0,
        dueFee: courses[2].totalFee,
        enrolledAt: new Date(`${shiftYMD(todayYMD, -1)}T09:30:00.000+06:00`),
        createdBy: adminUser,
        updatedBy: adminUser,
      },
    ]);

    const { incomes, expenses } = buildSeedTransactions({
      products,
      services,
      courses,
      students,
      adminUser,
      assistantUser,
    });

    await Income.insertMany(incomes);
    await Expense.insertMany(expenses);
    console.log(`[Seed] Products, services, courses, students, incomes & expenses seeded into ${getDatabaseName()}.`);
  }
}
