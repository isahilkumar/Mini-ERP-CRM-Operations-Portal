import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getProducts, createProduct, updateProduct, getStockLogs } from '../controllers/productController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

import { s3, isS3Configured } from '../utils/s3';
import multerS3 from 'multer-s3';

let storage: multer.StorageEngine;

if (isS3Configured && s3) {
  storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME || '',
    metadata(req: any, file: any, cb: any) {
      cb(null, { fieldName: file.fieldname });
    },
    key(req: any, file: any, cb: any) {
      cb(null, `products/${Date.now()}-${file.originalname}`);
    },
  });
  console.log('Using AWS S3 storage for product uploads.');
} else {
  const uploadDir = path.join(__dirname, '../../uploads/products');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, uploadDir);
    },
    filename(req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  console.log('Using local disk storage for product uploads.');
}

const upload = multer({ storage });

router.use(protect);

router.get('/stock-logs', authorize('ADMIN', 'WAREHOUSE'), getStockLogs);

router.route('/')
  .get(authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProducts)
  .post(authorize('ADMIN', 'WAREHOUSE'), upload.single('image'), createProduct);

router.route('/:id')
  .put(authorize('ADMIN', 'WAREHOUSE'), upload.single('image'), updateProduct);

export default router;
