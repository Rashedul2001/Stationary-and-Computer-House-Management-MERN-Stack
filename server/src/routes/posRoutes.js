import { Router } from 'express';
import { verifyAuth } from '../middlewares/authMiddleware.js';
import { validateBody } from '../middlewares/validateBody.js';
import {
  expenseRecordSchema,
  productSaleSchema,
  serviceSaleSchema,
  studentFeeSchema,
} from '../validators/schemas.js';
import {
  collectStudentFee,
  createExpenseRecord,
  createProductSale,
  createServiceSale,
  getPosStudents,
  getRecentIncomesForInvoice,
} from '../controllers/posController.js';

const router = Router();

router.use(verifyAuth);

router.get('/students', getPosStudents);
router.get('/incomes', getRecentIncomesForInvoice);
router.post('/incomes/product', validateBody(productSaleSchema), createProductSale);
router.post('/incomes/service', validateBody(serviceSaleSchema), createServiceSale);
router.post('/incomes/student-fee', validateBody(studentFeeSchema), collectStudentFee);
router.post('/expenses', validateBody(expenseRecordSchema), createExpenseRecord);

export default router;
