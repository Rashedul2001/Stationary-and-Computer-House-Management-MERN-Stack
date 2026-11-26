import { Router } from 'express';
import {
  getPublicCourses,
  getPublicProducts,
  getPublicServices,
  getPublicSettings,
} from '../controllers/publicController.js';

const router = Router();

router.get('/settings', getPublicSettings);
router.get('/products', getPublicProducts);
router.get('/services', getPublicServices);
router.get('/courses', getPublicCourses);

export default router;
