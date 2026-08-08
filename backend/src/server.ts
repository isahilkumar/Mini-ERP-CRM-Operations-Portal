import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import productRoutes from './routes/productRoutes';
import challanRoutes from './routes/challanRoutes';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Mini ERP API is running...' });
});

// Serve frontend static build in single-service production mode
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
const altFrontendDistPath = path.join(__dirname, '../frontend/dist');

const activeFrontendPath = fs.existsSync(frontendDistPath) 
  ? frontendDistPath 
  : fs.existsSync(altFrontendDistPath) 
    ? altFrontendDistPath 
    : null;

if (activeFrontendPath) {
  app.use(express.static(activeFrontendPath));
  
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(activeFrontendPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Mini ERP API is running...');
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
