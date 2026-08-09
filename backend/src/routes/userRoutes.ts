import express from 'express';
import { getUsers, createUser, updateUser, deleteUser, impersonateUser } from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.post('/:id/impersonate', impersonateUser);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

export default router;
