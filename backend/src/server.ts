import express from 'express';
import cors from 'cors';
import compression from 'compression';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import productRoutes from './routes/productRoutes';
import challanRoutes from './routes/challanRoutes';
import userRoutes from './routes/userRoutes';
import path from 'path';
import fs from 'fs';
import prisma from './utils/db';

dotenv.config();

// Log env status on startup
console.log('ENV CHECK - DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('ENV CHECK - JWT_SECRET set:', !!process.env.JWT_SECRET);
console.log('ENV CHECK - NODE_ENV:', process.env.NODE_ENV);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable HTTP Gzip/Deflate compression for fast static asset transmission
app.use(compression());

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files with caching
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath, { maxAge: '1d' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/users', userRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Mini ERP API is running...' });
});

// Health check with DB test
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok', 
      db: 'connected',
      env: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        JWT_SECRET: !!process.env.JWT_SECRET,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  } catch (err: any) {
    res.status(500).json({ 
      status: 'error', 
      db: 'disconnected',
      error: err?.message,
      env: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        JWT_SECRET: !!process.env.JWT_SECRET,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  }
});

// Serve frontend static build in single-service production mode
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  // Cache static frontend assets for 1 day to reduce load latency
  app.use(express.static(frontendDistPath, { maxAge: '1d' }));

  // SPA fallback - regex check
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
} else {
  app.get('/', (req, res) => {
    res.send('Mini ERP API is running...');
  });
}

// Asynchronous non-blocking seed function (runs after server port binding)
const ensureDefaultAdmin = async () => {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount === 0) {
      const password = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'Admin User',
          password,
          role: 'ADMIN',
        },
      });
      console.log('Default admin created: admin@example.com / password123');
    }
  } catch (err) {
    console.error('Non-blocking seed check error:', err);
  }
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  ensureDefaultAdmin();
});
