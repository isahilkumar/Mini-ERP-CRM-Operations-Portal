import express from 'express';
import { getCustomers, createCustomer, updateCustomer, getCustomerById } from '../controllers/customerController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('ADMIN', 'SALES', 'ACCOUNTS'), getCustomers)
  .post(authorize('ADMIN', 'SALES'), createCustomer);

router.route('/:id')
  .get(authorize('ADMIN', 'SALES', 'ACCOUNTS'), getCustomerById)
  .put(authorize('ADMIN', 'SALES'), updateCustomer);

export default router;
