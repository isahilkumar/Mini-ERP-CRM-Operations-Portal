import express from 'express';
import { getChallans, createChallan, confirmChallan, cancelChallan } from '../controllers/challanController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('ADMIN', 'SALES', 'ACCOUNTS'), getChallans)
  .post(authorize('ADMIN', 'SALES'), createChallan);

router.route('/:id/confirm')
  .put(authorize('ADMIN', 'SALES'), confirmChallan);

router.route('/:id/cancel')
  .put(authorize('ADMIN', 'SALES'), cancelChallan);

export default router;
