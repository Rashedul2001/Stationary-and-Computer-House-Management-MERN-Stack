import { Router } from 'express';
import { verifyAdmin, verifyAuth } from '../middlewares/authMiddleware.js';
import { validateBody } from '../middlewares/validateBody.js';
import { uploadImageMiddleware } from '../middlewares/uploadMiddleware.js';
import {
  categoryItemSchema,
  courseSchema,
  productSchema,
  productUpdateSchema,
  serviceSchema,
  studentCreateSchema,
  studentUpdateSchema,
} from '../validators/schemas.js';
import { getDashboardLogs, getDashboardSummary } from '../controllers/dashboardController.js';
import {
  createCourse,
  createProduct,
  createService,
  createStudent,
  deleteCourse,
  deleteProduct,
  deleteService,
  deleteStudent,
  listStudents,
  updateCourse,
  updateProduct,
  updateService,
  updateStudent,
} from '../controllers/adminCrudController.js';
import { createUser, deleteUser, listUsers, updateUser } from '../controllers/userController.js';
import {
  addCategory,
  deleteCategory,
  updateCategory,
  updateSiteSettings,
  uploadHeroImage,
} from '../controllers/settingsController.js';

const router = Router();

router.use(verifyAuth, verifyAdmin);

// Dashboard
router.get('/dashboard/summary', getDashboardSummary);
router.get('/dashboard/logs', getDashboardLogs);

// Products
router.post('/products', validateBody(productSchema), createProduct);
router.put('/products/:id', validateBody(productUpdateSchema), updateProduct);
router.delete('/products/:id', deleteProduct);

// Services
router.post('/services', validateBody(serviceSchema), createService);
router.put('/services/:id', validateBody(serviceSchema), updateService);
router.delete('/services/:id', deleteService);

// Courses
router.post('/courses', validateBody(courseSchema), createCourse);
router.put('/courses/:id', validateBody(courseSchema), updateCourse);
router.delete('/courses/:id', deleteCourse);

// Students
router.get('/students', listStudents);
router.post('/students', validateBody(studentCreateSchema), createStudent);
router.put('/students/:id', validateBody(studentUpdateSchema), updateStudent);
router.delete('/students/:id', deleteStudent);

// Users (with Cloudinary avatar upload)
router.get('/users', listUsers);
router.post('/users', uploadImageMiddleware.single('image'), createUser);
router.put('/users/:id', uploadImageMiddleware.single('image'), updateUser);
router.delete('/users/:id', deleteUser);

// Site Settings & Categories
router.put('/settings', updateSiteSettings);
router.post('/settings/hero-image', uploadImageMiddleware.single('image'), uploadHeroImage);
router.post('/settings/categories/:type', validateBody(categoryItemSchema), addCategory);
router.put('/settings/categories/:type/:catId', validateBody(categoryItemSchema), updateCategory);
router.delete('/settings/categories/:type/:catId', deleteCategory);

export default router;
