import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getProducts, createProduct, updateProduct, getStockLogs } from '../controllers/productController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.use(protect);

router.get('/stock-logs', authorize('ADMIN', 'WAREHOUSE'), getStockLogs);

router.route('/')
  .get(authorize('ADMIN', 'SALES', 'WAREHOUSE'), getProducts)
  .post(authorize('ADMIN', 'WAREHOUSE'), upload.single('image'), createProduct);

router.route('/:id')
  .put(authorize('ADMIN', 'WAREHOUSE'), upload.single('image'), updateProduct);

export default router;
